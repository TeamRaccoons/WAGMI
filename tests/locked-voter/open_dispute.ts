import * as anchor from "@coral-xyz/anchor";
import { BN, Wallet, web3 } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
} from "@solana/spl-token";

import {
  PublicKey,
} from "@solana/web3.js";
import {
  GOVERN_PROGRAM_ID,
  SMART_WALLET_PROGRAM_ID,
  LOCKED_VOTER_PROGRAM_ID,
  createAndFundWallet,
  createGovernProgram,
  createGovernor,
  createSmartWallet,
  createSmartWalletProgram,
  createLockedVoterProgram,
  deriveEscrow,
  deriveGovern,
  deriveLocker,
  deriveSmartWallet,
  getOrCreateATA,
  sleep,
} from "../utils";
import { closeDispute, openDispute, resolveDispute, withdrawFundFromDispute } from "./utils";

const provider = anchor.AnchorProvider.env();

const lockAmount = new BN(1000);

describe("Open Dispute", () => {
  let locker: web3.PublicKey;
  let govern: web3.PublicKey;
  let smartWallet: web3.PublicKey;

  let payerKeypair: web3.Keypair;

  let ownerKeypair: web3.Keypair;
  let newOwnerKeypair: web3.Keypair;
  let escrow: web3.PublicKey;


  let rewardMint: web3.PublicKey;


  // Smart wallet config
  let smartWalletOwners: web3.PublicKey[] = [];
  let smartWalletThreshold: BN = new BN(1);

  // Govern config
  const votingPeriod: BN = new BN(10); // 10 seconds duration of voting on proposal
  const quorumVotes: BN = new BN(2); // 2 vote to pass

  // Voter config
  const maxStakeDuration: BN = new BN(10); // 20 seconds
  const minStakeDuration: BN = new BN(5); // 10 seconds
  const maxStakeVoteMultiplier: number = 1;
  const proposalActivationMinVotes: BN = new BN(2); // min 2 vote to activate proposal

  async function initializeLocker() {
    let wallet = new Wallet(payerKeypair);
    const voterProgram = createLockedVoterProgram(
      wallet,
      LOCKED_VOTER_PROGRAM_ID
    );
    await voterProgram.methods
      .newLocker({
        maxStakeDuration,
        maxStakeVoteMultiplier,
        minStakeDuration,
        proposalActivationMinVotes,
      })
      .accounts({
        base: payerKeypair.publicKey,
        locker,
        tokenMint: rewardMint,
        governor: govern,
        payer: voterProgram.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  before(async () => {
    {
      const result = await createAndFundWallet(provider.connection);
      payerKeypair = result.keypair;
    }

    {
      const result = await createAndFundWallet(provider.connection);
      ownerKeypair = result.keypair;
    }
    {
      const result = await createAndFundWallet(provider.connection);
      newOwnerKeypair = result.keypair;
    }


    const [lockerPda, lBump] = deriveLocker(
      payerKeypair.publicKey,
      LOCKED_VOTER_PROGRAM_ID
    );
    locker = lockerPda;

    const [governPda, gBump] = deriveGovern(payerKeypair.publicKey);
    govern = governPda;

    const [smartWalletPda, sBump] = deriveSmartWallet(payerKeypair.publicKey);
    smartWallet = smartWalletPda;

    smartWalletOwners.push(governPda);
    smartWalletOwners.push(payerKeypair.publicKey);

    let wallet = new Wallet(payerKeypair);
    await createSmartWallet(
      smartWalletOwners,
      smartWalletOwners.length,
      new BN(0),
      smartWalletThreshold,
      payerKeypair,
      createSmartWalletProgram(wallet, SMART_WALLET_PROGRAM_ID)
    );

    await createGovernor(
      new BN(0),
      votingPeriod,
      quorumVotes,
      new BN(0),
      payerKeypair,
      smartWallet,
      createGovernProgram(wallet, GOVERN_PROGRAM_ID),
      LOCKED_VOTER_PROGRAM_ID
    );

    rewardMint = await createMint(
      provider.connection,
      payerKeypair,
      payerKeypair.publicKey,
      null,
      9
    );

    {

      const ownerATA = await getOrCreateATA(
        rewardMint,
        ownerKeypair.publicKey,
        ownerKeypair,
        provider.connection
      );

      await mintTo(
        provider.connection,
        payerKeypair,
        rewardMint,
        ownerATA,
        payerKeypair.publicKey,
        lockAmount.toNumber()
      );
    }

    await initializeLocker();
  });

  before(async () => {
    const wallet = new Wallet(ownerKeypair);
    const voterProgram = createLockedVoterProgram(
      wallet,
      LOCKED_VOTER_PROGRAM_ID
    );
    escrow = deriveEscrow(
      locker,
      wallet.publicKey,
      LOCKED_VOTER_PROGRAM_ID
    );

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

    await voterProgram.methods
      .extendLockDuration(maxStakeDuration)
      .accounts({
        escrow,
        escrowOwner: wallet.publicKey,
        locker,
      })
      .rpc();
    const escrowATA = await getOrCreateATA(
      rewardMint,
      escrow,
      ownerKeypair,
      provider.connection
    );

    const rewardATA = await getOrCreateATA(
      rewardMint,
      wallet.publicKey,
      ownerKeypair,
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
  });

  it("user opens dispute and close dispute", async () => {
    console.log("Open dispute");
    await openDispute({
      ownerKP: ownerKeypair,
      newOwner: newOwnerKeypair.publicKey,
      escrow,
      payerKP: payerKeypair,
      isAssertion: true,
    })

    console.log("Open other dispute");
    await openDispute({
      ownerKP: ownerKeypair,
      newOwner: PublicKey.unique(),
      escrow,
      payerKP: payerKeypair,
      isAssertion: true,
    })

    console.log("Wait until dispute phase is over and close dispute");
    await sleep(7000);

    console.log("Close dispute");
    await closeDispute({
      ownerKP: ownerKeypair,
      escrow,
      isAssertion: true,
    });
  });


  it("user opens dispute and get approved", async () => {
    console.log("Open dispute");
    let disputeRequest = await openDispute({
      ownerKP: ownerKeypair,
      newOwner: newOwnerKeypair.publicKey,
      escrow,
      payerKP: payerKeypair,
      isAssertion: true,
    })

    console.log("Open other dispute");
    let _unapproveDispute = await openDispute({
      ownerKP: ownerKeypair,
      newOwner: PublicKey.unique(),
      escrow,
      payerKP: payerKeypair,
      isAssertion: true,
    })

    console.log("multisg resolve a dispute");
    await resolveDispute({
      smartWallet,
      escrow,
      disputeRequest,
      multisigMember: payerKeypair,
      isAssertion: true,
    })


    console.log("Wait until stake cooldown is over and withdraw");
    await sleep((maxStakeDuration.toNumber() + 1) * 1000);

    const destinationTokens = await getOrCreateATA(
      rewardMint,
      newOwnerKeypair.publicKey,
      newOwnerKeypair,
      provider.connection
    );
    console.log("withdraw from a dispute");
    await withdrawFundFromDispute({
      newOwnerKp: newOwnerKeypair,
      escrow,
      approvedDisputeRequest: disputeRequest,
      destinationTokens,
      isAssertion: true,
    })
  });

});
