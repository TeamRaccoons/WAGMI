import * as anchor from "@project-serum/anchor";
import { BN, Wallet, web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID, createMint, mintTo } from "@solana/spl-token";
import {
  GOVERN_PROGRAM_ID,
  IProposalInstruction,
  SMART_WALLET_PROGRAM_ID,
  VOTER_PROGRAM_ID,
  createAndFundWallet,
  createGovernProgram,
  createGovernor,
  createProposal,
  createProposalMeta,
  createSmartWallet,
  createSmartWalletProgram,
  createVoterProgram,
  deriveEscrow,
  deriveGovern,
  deriveLocker,
  deriveSmartWallet,
  getOnChainTime,
  getOrCreateATA,
  invokeAndAssertError,
  sleep,
} from "../utils";
import { expect } from "chai";

const provider = anchor.AnchorProvider.env();

const userCount = 3;
const lockAmount = new BN(100);

describe("Locked voter", () => {
  let locker: web3.PublicKey;
  let govern: web3.PublicKey;
  let smartWallet: web3.PublicKey;
  let proposal: web3.PublicKey;

  let wallet: Wallet;
  let keypair: web3.Keypair;

  let rewardMint: web3.PublicKey;
  let userKeypairs: web3.Keypair[] = [];

  // Smart wallet config
  let smartWalletOwners: web3.PublicKey[] = [];
  let smartWalletThreshold: BN = new BN(1);

  // Govern config
  const votingPeriod: BN = new BN(10); // 10 seconds duration of voting on proposal
  const quorumVotes: BN = new BN(2); // 2 vote to pass

  // Voter config
  const expiration: BN = new BN(10); // 10 seconds to 2nd phase
  const maxStakeDuration: BN = new BN(60); // 60 seconds
  const minStakeDuration: BN = new BN(10); // 10 seconds
  const maxStakeVoteMultiplier: number = 1;
  const proposalActivationMinVotes: BN = new BN(2); // min 2 vote to activate proposal

  async function createSetLockerParamsProposal() {
    const governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);
    const voterProgram = createVoterProgram(wallet, VOTER_PROGRAM_ID);
    const ixData = voterProgram.coder.instruction.encode("set_locker_params", {
      params: {
        maxStakeVoteMultiplier,
        minStakeDuration,
        maxStakeDuration,
        proposalActivationMinVotes,
      },
    });
    const ix: IProposalInstruction = {
      data: ixData,
      programId: VOTER_PROGRAM_ID,
      keys: [
        {
          isSigner: false,
          isWritable: true,
          pubkey: locker,
        },
        {
          isSigner: false,
          isWritable: false,
          pubkey: govern,
        },
        {
          isSigner: true,
          isWritable: false,
          pubkey: smartWallet,
        },
      ],
    };
    const proposal = await createProposal(govern, [ix], governProgram);
    await createProposalMeta(
      proposal,
      "Update locker params",
      "Update locker params proposal test",
      governProgram
    );

    return proposal;
  }

  async function initializeLockerAndWaitForPhase2() {
    const onchainTimestamp = await getOnChainTime(provider.connection);
    const expireTimestamp = new BN(onchainTimestamp).add(expiration);

    const voterProgram = createVoterProgram(wallet, VOTER_PROGRAM_ID);

    await voterProgram.methods
      .newLocker(expireTimestamp, {
        maxStakeDuration,
        maxStakeVoteMultiplier,
        minStakeDuration,
        proposalActivationMinVotes,
      })
      .accounts({
        locker,
        tokenMint: rewardMint,
        governor: govern,
        payer: voterProgram.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    while (true) {
      const [lockerState, onchainTimestamp] = await Promise.all([
        voterProgram.account.locker.fetch(locker),
        getOnChainTime(provider.connection),
      ]);

      if (lockerState.expiration.toNumber() > onchainTimestamp) {
        console.log(
          `${
            lockerState.expiration.toNumber() - onchainTimestamp
          } seconds until phase 1 expire`
        );
        await sleep(1000);
      } else {
        break;
      }
    }
  }

  before(async () => {
    const result = await createAndFundWallet(provider.connection);
    keypair = result.keypair;
    wallet = result.wallet;

    const [lockerPda, lBump] = deriveLocker(keypair.publicKey);
    locker = lockerPda;

    const [governPda, gBump] = deriveGovern(keypair.publicKey);
    govern = governPda;

    const [smartWalletPda, sBump] = deriveSmartWallet(keypair.publicKey);
    smartWallet = smartWalletPda;

    smartWalletOwners.push(governPda);
    smartWalletOwners.push(wallet.publicKey);

    await createSmartWallet(
      smartWalletOwners,
      smartWalletOwners.length,
      new BN(0),
      smartWalletThreshold,
      keypair,
      createSmartWalletProgram(wallet, SMART_WALLET_PROGRAM_ID)
    );

    await createGovernor(
      new BN(0),
      votingPeriod,
      quorumVotes,
      new BN(0),
      keypair,
      smartWallet,
      createGovernProgram(wallet, GOVERN_PROGRAM_ID)
    );

    rewardMint = await createMint(
      provider.connection,
      keypair,
      keypair.publicKey,
      null,
      9
    );

    for (let i = 0; i < userCount; i++) {
      const result = await createAndFundWallet(provider.connection);
      userKeypairs.push(result.keypair);

      const userATA = await getOrCreateATA(
        rewardMint,
        result.keypair.publicKey,
        result.keypair,
        provider.connection
      );

      await mintTo(
        provider.connection,
        keypair,
        rewardMint,
        userATA,
        keypair.publicKey,
        lockAmount.toNumber()
      );
    }

    proposal = await createSetLockerParamsProposal();

    await initializeLockerAndWaitForPhase2();
  });

  it("users initialize new escrow", async () => {
    for (const keypair of userKeypairs) {
      const wallet = new Wallet(keypair);
      const voterProgram = createVoterProgram(wallet, VOTER_PROGRAM_ID);
      const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey);

      await voterProgram.methods
        .newEscrow()
        .accounts({
          escrow,
          escrowOwner: wallet.publicKey,
          locker,
          payer: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      const escrowATA = await getOrCreateATA(
        rewardMint,
        escrow,
        keypair,
        voterProgram.provider.connection
      );
      const escrowState = await voterProgram.account.escrow.fetch(escrow);
      expect(escrowState.locker.toBase58()).to.be.equal(locker.toBase58());
      expect(escrowState.owner.toBase58()).to.be.equal(
        wallet.publicKey.toBase58()
      );
      expect(escrowState.tokens.toBase58()).to.be.equal(escrowATA.toBase58());
      expect(escrowState.amount.toString()).to.be.equal("0");
      expect(escrowState.escrowStartedAt.toString()).to.be.equal("0");
      expect(escrowState.escrowEndsAt.toString()).to.be.equal("0");
      expect(escrowState.voteDelegate.toBase58()).to.be.equal(
        wallet.publicKey.toBase58()
      );
    }
  });

  it("users lock token", async () => {
    for (const keypair of userKeypairs) {
      const wallet = new Wallet(keypair);

      const voterProgram = createVoterProgram(wallet, VOTER_PROGRAM_ID);
      const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey);

      const escrowATA = await getOrCreateATA(
        rewardMint,
        escrow,
        keypair,
        provider.connection
      );

      const rewardATA = await getOrCreateATA(
        rewardMint,
        wallet.publicKey,
        keypair,
        provider.connection
      );

      await voterProgram.methods
        .increaseLockedAmount(lockAmount)
        .accounts({
          escrow,
          escrowTokens: escrowATA,
          locker,
          payer: voterProgram.provider.publicKey,
          sourceTokens: rewardATA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      const escrowState = await voterProgram.account.escrow.fetch(escrow);
      const escrowATABalance = await provider.connection
        .getTokenAccountBalance(escrowATA)
        .then((b) => b.value.amount);

      expect(escrowState.amount.toString()).to.be.equal(lockAmount.toString());
      expect(escrowATABalance).to.be.equal(lockAmount.toString());
    }
  });

  it("able to withdraw if doesn't extend lock duration", async () => {
    const newWallet = await createAndFundWallet(provider.connection);
    const userWallet = new Wallet(newWallet.keypair);

    const userATA = await getOrCreateATA(
      rewardMint,
      userWallet.publicKey,
      newWallet.keypair,
      provider.connection
    );

    await mintTo(
      provider.connection,
      keypair,
      rewardMint,
      userATA,
      keypair.publicKey,
      lockAmount.toNumber()
    );

    const voterProgram = createVoterProgram(userWallet, VOTER_PROGRAM_ID);
    const [escrow, _bump] = deriveEscrow(locker, userWallet.publicKey);

    await voterProgram.methods
      .newEscrow()
      .accounts({
        escrow,
        escrowOwner: userWallet.publicKey,
        locker,
        payer: userWallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    const escrowATA = await getOrCreateATA(
      rewardMint,
      escrow,
      newWallet.keypair,
      provider.connection
    );

    await voterProgram.methods
      .increaseLockedAmount(lockAmount)
      .accounts({
        escrow,
        escrowTokens: escrowATA,
        locker,
        payer: voterProgram.provider.publicKey,
        sourceTokens: userATA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    await voterProgram.methods
      .withdraw()
      .accounts({
        destinationTokens: userATA,
        escrow,
        escrowOwner: voterProgram.provider.publicKey,
        escrowTokens: escrowATA,
        locker,
        payer: voterProgram.provider.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  });
});
