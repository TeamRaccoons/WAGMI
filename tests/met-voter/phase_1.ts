import { web3, Wallet, BN } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import {
  BalanceTree,
  GOVERN_PROGRAM_ID,
  IProposalInstruction,
  MERKLE_DISTRIBUTOR_PROGRAM_ID,
  SMART_WALLET_PROGRAM_ID,
  MET_VOTER_PROGRAM_ID,
  VoteSide,
  createAndFundWallet,
  createDistributor,
  createGovernProgram,
  createGovernor,
  createMerkleDistributorProgram,
  createProposal,
  createProposalMeta,
  createSmartWallet,
  createSmartWalletProgram,
  createMetVoterProgram,
  deriveClaimStatus,
  deriveDistributor,
  deriveEscrow,
  deriveGovern,
  deriveLocker,
  deriveSmartWallet,
  deriveTransaction,
  deriveVote,
  getOnChainTime,
  getOrCreateATA,
  invokeAndAssertError,
  sleep,
} from "../utils";
import { TOKEN_PROGRAM_ID, createMint, mintTo, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { expect } from "chai";

const provider = anchor.AnchorProvider.env();

// Maximum number of claims
const maxNodesClaimed = new BN(3);
// Claimable amount
const claimAmount = new BN(100);

describe("Locked voter", () => {
  let locker: web3.PublicKey;
  let govern: web3.PublicKey;
  let smartWallet: web3.PublicKey;
  let distributor: web3.PublicKey;
  let mdATA: web3.PublicKey;
  let proposal: web3.PublicKey;

  let wallet: Wallet;
  let keypair: web3.Keypair;

  let rewardMint: web3.PublicKey;
  // Airdrop MET from merkle distributor
  const claimerKeypairs: web3.Keypair[] = [];
  // Non airdrop MET user
  let nonClaimerKeypair: web3.Keypair;

  let tree: BalanceTree;
  // Maximum amount can be claimed from the merkle distributor
  let maxTotalClaim = claimAmount.mul(maxNodesClaimed);

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
    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);
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
      programId: MET_VOTER_PROGRAM_ID,
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

  before(async () => {
    const result = await createAndFundWallet(provider.connection);
    keypair = result.keypair;
    wallet = result.wallet;

    const [lockerPda, lBump] = deriveLocker(keypair.publicKey, MET_VOTER_PROGRAM_ID);
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
      createGovernProgram(wallet, GOVERN_PROGRAM_ID),
      MET_VOTER_PROGRAM_ID
    );

    rewardMint = await createMint(
      provider.connection,
      keypair,
      keypair.publicKey,
      null,
      9
    );

    for (let i = 0; i < maxNodesClaimed.toNumber(); i++) {
      const result = await createAndFundWallet(provider.connection);
      claimerKeypairs.push(result.keypair);
    }

    tree = new BalanceTree(
      claimerKeypairs.map((kp) => {
        return { account: kp.publicKey, amount: claimAmount };
      })
    );

    const [mdPda, _mdBump] = deriveDistributor(keypair.publicKey);
    distributor = mdPda;

    mdATA = getAssociatedTokenAddressSync(rewardMint, distributor, true);

    await createDistributor(
      keypair,
      locker,
      maxTotalClaim,
      maxNodesClaimed,
      tree.getRoot(),
      rewardMint,
      createMerkleDistributorProgram(wallet, MERKLE_DISTRIBUTOR_PROGRAM_ID)
    );

    await mintTo(
      provider.connection,
      keypair,
      rewardMint,
      mdATA,
      keypair.publicKey,
      maxTotalClaim.toNumber()
    );

    const nonClaimer = await createAndFundWallet(provider.connection);
    nonClaimerKeypair = nonClaimer.keypair;

    const nonClaimerRewardATA = await getOrCreateATA(
      rewardMint,
      nonClaimerKeypair.publicKey,
      nonClaimerKeypair,
      provider.connection
    );

    await mintTo(
      provider.connection,
      keypair,
      rewardMint,
      nonClaimerRewardATA,
      keypair.publicKey,
      claimAmount.toNumber()
    );

    proposal = await createSetLockerParamsProposal();
  });

  it("initialize new locker", async () => {
    const onchainTimestamp = await getOnChainTime(provider.connection);
    const expireTimestamp = new BN(onchainTimestamp).add(expiration);

    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    await voterProgram.methods
      .newLocker(expireTimestamp, {
        maxStakeDuration,
        maxStakeVoteMultiplier,
        minStakeDuration,
        proposalActivationMinVotes,
      })
      .accounts({
        base: keypair.publicKey,
        locker,
        tokenMint: rewardMint,
        governor: govern,
        payer: voterProgram.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    const lockerState = await voterProgram.account.locker.fetch(locker);
    expect(lockerState.tokenMint.toBase58()).to.be.equal(rewardMint.toBase58());
    expect(lockerState.governor.toBase58()).to.be.equal(govern.toBase58());
    expect(lockerState.expiration.toString()).to.be.equal(
      expireTimestamp.toString()
    );
    expect(lockerState.base.toBase58()).to.be.equal(
      keypair.publicKey.toBase58()
    );
    expect(lockerState.params.maxStakeDuration.toString()).to.be.equal(
      maxStakeDuration.toString()
    );
    expect(lockerState.params.minStakeDuration.toString()).to.be.equal(
      minStakeDuration.toString()
    );
    expect(lockerState.params.maxStakeVoteMultiplier).to.be.equal(
      maxStakeVoteMultiplier
    );
    expect(
      lockerState.params.proposalActivationMinVotes.toString()
    ).to.be.equal(proposalActivationMinVotes.toString());
  });

  it("user cannot update phase 1 expiration", async () => {
    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    const onchainTimestamp = await getOnChainTime(provider.connection);
    const expireTimestamp = new BN(onchainTimestamp).add(expiration);

    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .changeLockerExpiration(expireTimestamp)
          .accounts({
            governor: govern,
            locker,
            smartWallet: voterProgram.provider.publicKey,
          })
          .rpc();
      },
      "self.smart_wallet != self.governor.smart_wallet",
      false
    );
  });

  it("protocol team update phase 1 expiration", async () => {
    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    let lockerState = await voterProgram.account.locker.fetch(locker);

    const oldExpiration = lockerState.expiration;
    // Extend another 10 seconds
    const extendedExpireTimestamp = oldExpiration.add(expiration);

    const ixData = voterProgram.coder.instruction.encode(
      "change_locker_expiration",
      { expiration: extendedExpireTimestamp }
    );

    const smartWalletProgram = createSmartWalletProgram(
      wallet,
      SMART_WALLET_PROGRAM_ID
    );

    const smartWalletState = await smartWalletProgram.account.smartWallet.fetch(
      smartWallet
    );

    const [transaction, txBump] = deriveTransaction(
      smartWallet,
      smartWalletState.numTransactions
    );

    const changeLockerExpirationIx = {
      programId: MET_VOTER_PROGRAM_ID,
      data: ixData,
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

    await smartWalletProgram.methods
      .createTransaction(txBump, [changeLockerExpirationIx])
      .accounts({
        payer: smartWalletProgram.provider.publicKey,
        proposer: smartWalletProgram.provider.publicKey,
        smartWallet,
        systemProgram: web3.SystemProgram.programId,
        transaction,
      })
      .rpc();

    // Smart wallet execute change locker expiration transaction
    await smartWalletProgram.methods
      .executeTransaction()
      .accounts({
        owner: smartWalletProgram.provider.publicKey,
        smartWallet,
        transaction,
      })
      .remainingAccounts([
        {
          isSigner: false,
          isWritable: false,
          pubkey: MET_VOTER_PROGRAM_ID,
        },
        ...changeLockerExpirationIx.keys.map((x) => {
          return {
            ...x,
            isSigner: false, // Need to override to false as these are signed by the smart wallet
          };
        }),
      ])
      .rpc();

    lockerState = await voterProgram.account.locker.fetch(locker);

    expect(lockerState.expiration.toString()).to.be.equal(
      extendedExpireTimestamp.toString()
    );
    expect(lockerState.expiration.toString()).to.not.equal(
      oldExpiration.toString()
    );
  });

  it("user cannot update locker parameter", async () => {
    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .setLockerParams({
            maxStakeVoteMultiplier,
            maxStakeDuration,
            minStakeDuration,
            proposalActivationMinVotes,
          })
          .accounts({
            governor: govern,
            locker,
            smartWallet: voterProgram.provider.publicKey,
          })
          .rpc();
      },
      "self.smart_wallet != self.governor.smart_wallet",
      false
    );
  });

  it("protocol team update locker parameter", async () => {
    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    const ixData = voterProgram.coder.instruction.encode("set_locker_params", {
      params: {
        maxStakeVoteMultiplier,
        minStakeDuration,
        maxStakeDuration,
        proposalActivationMinVotes,
      },
    });

    const smartWalletProgram = createSmartWalletProgram(
      wallet,
      SMART_WALLET_PROGRAM_ID
    );

    const smartWalletState = await smartWalletProgram.account.smartWallet.fetch(
      smartWallet
    );

    const [transaction, txBump] = deriveTransaction(
      smartWallet,
      smartWalletState.numTransactions
    );

    const setLockerParamsIx = {
      programId: MET_VOTER_PROGRAM_ID,
      data: ixData,
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

    await smartWalletProgram.methods
      .createTransaction(txBump, [setLockerParamsIx])
      .accounts({
        payer: smartWalletProgram.provider.publicKey,
        proposer: smartWalletProgram.provider.publicKey,
        smartWallet,
        systemProgram: web3.SystemProgram.programId,
        transaction,
      })
      .rpc();

    // Smart wallet execute change locker expiration transaction
    await smartWalletProgram.methods
      .executeTransaction()
      .accounts({
        owner: smartWalletProgram.provider.publicKey,
        smartWallet,
        transaction,
      })
      .remainingAccounts([
        {
          isSigner: false,
          isWritable: false,
          pubkey: MET_VOTER_PROGRAM_ID,
        },
        ...setLockerParamsIx.keys.map((x) => {
          return {
            ...x,
            isSigner: false, // Need to override to false as these are signed by the smart wallet
          };
        }),
      ])
      .rpc();

    const lockerState = await voterProgram.account.locker.fetch(locker);
    expect(lockerState.params.maxStakeDuration.toString()).to.be.equal(
      maxStakeDuration.toString()
    );
    expect(lockerState.params.minStakeDuration.toString()).to.be.equal(
      minStakeDuration.toString()
    );
    expect(lockerState.params.maxStakeVoteMultiplier).to.be.equal(
      maxStakeVoteMultiplier
    );
    expect(
      lockerState.params.proposalActivationMinVotes.toString()
    ).to.be.equal(proposalActivationMinVotes.toString());
  });

  it("users initialize new escrow", async () => {
    for (const keypair of claimerKeypairs) {
      const wallet = new Wallet(keypair);
      const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);
      const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);

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

  it("users claim MET drop and lock token", async () => {
    for (const [idx, keypair] of claimerKeypairs.entries()) {
      const wallet = new Wallet(keypair);

      const claimIndex = new BN(idx);
      const proof = tree.getProof(
        claimIndex.toNumber(),
        wallet.publicKey,
        claimAmount
      );

      const [escrow, _eBump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);
      const escrowATA = await getOrCreateATA(
        rewardMint,
        escrow,
        keypair,
        provider.connection
      );
      const [claimStatus, _csBump] = deriveClaimStatus(claimIndex, distributor);

      const mdProgram = createMerkleDistributorProgram(
        wallet,
        MERKLE_DISTRIBUTOR_PROGRAM_ID
      );

      await mdProgram.methods
        .claim(claimIndex, claimAmount, proof)
        .accounts({
          claimant: mdProgram.provider.publicKey,
          claimStatus,
          distributor,
          escrow,
          escrowTokens: escrowATA,
          tokenVault: mdATA,
          locker,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          voterProgram: MET_VOTER_PROGRAM_ID,
        })
        .rpc();

      const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

      const escrowState = await voterProgram.account.escrow.fetch(escrow);
      const escrowATABalance = await provider.connection
        .getTokenAccountBalance(escrowATA)
        .then((b) => b.value.amount);

      expect(escrowState.amount.toString()).to.be.equal(claimAmount.toString());
      expect(escrowATABalance).to.be.equal(claimAmount.toString());
    }
  });

  it("user lock MET", async () => {
    const wallet = new Wallet(nonClaimerKeypair);

    const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);

    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    await voterProgram.methods
      .newEscrow()
      .accounts({
        escrow,
        escrowOwner: voterProgram.provider.publicKey,
        locker,
        payer: voterProgram.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    const escrowATA = await getOrCreateATA(
      rewardMint,
      escrow,
      nonClaimerKeypair,
      provider.connection
    );

    const rewardATA = await getOrCreateATA(
      rewardMint,
      wallet.publicKey,
      nonClaimerKeypair,
      provider.connection
    );

    await voterProgram.methods
      .increaseLockedAmount(claimAmount)
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

    expect(escrowState.amount.toString()).to.be.equal(claimAmount.toString());
    expect(escrowATABalance).to.be.equal(claimAmount.toString());
  });

  it("user cannot withdraw before lock end period", async () => {
    const wallet = new Wallet(nonClaimerKeypair);

    const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);
    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    const userATA = await getOrCreateATA(
      rewardMint,
      wallet.publicKey,
      nonClaimerKeypair,
      provider.connection
    );

    const escrowATA = await getOrCreateATA(
      rewardMint,
      escrow,
      nonClaimerKeypair,
      provider.connection
    );

    invokeAndAssertError(
      () => {
        return voterProgram.methods
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
      },
      "Escrow has not ended",
      true
    );
  });

  it("phase 1 cannot extend lock duration (constant voting power)", async () => {
    const wallet = new Wallet(nonClaimerKeypair);

    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);
    const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);

    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .extendLockDuration(maxStakeDuration)
          .accounts({
            escrow,
            escrowOwner: wallet.publicKey,
            locker,
          })
          .rpc();
      },
      "Invariant failed: must be token launch phase",
      false
    );
  });

  it("phase 1 cannot toggle max lock", async () => {
    const wallet = new Wallet(nonClaimerKeypair);

    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);
    const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);

    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .toggleMaxLock(true)
          .accounts({
            escrow,
            escrowOwner: wallet.publicKey,
            locker,
          })
          .rpc();
      },
      "Invariant failed: must be token launch phase",
      false
    );
  });

  it("user cannot activate proposal in phase 1", async () => {
    const wallet = new Wallet(nonClaimerKeypair);
    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .activateProposalInitialPhase()
          .accounts({
            governor: govern,
            governProgram: GOVERN_PROGRAM_ID,
            locker,
            proposal,
            smartWallet: wallet.publicKey,
          })
          .rpc();
      },
      "self.smart_wallet != self.governor.smart_wallet",
      false
    );

    const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);

    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .activateProposal()
          .accounts({
            governor: govern,
            governProgram: GOVERN_PROGRAM_ID,
            escrow,
            escrowOwner: wallet.publicKey,
            locker,
            proposal,
          })
          .rpc();
      },
      "must be token release phase",
      false
    );
  });

  it("only protocol team able to activate proposal in phase 1", async () => {
    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);

    const ixData = voterProgram.coder.instruction.encode(
      "activate_proposal_initial_phase",
      {}
    );

    const smartWalletProgram = createSmartWalletProgram(
      wallet,
      SMART_WALLET_PROGRAM_ID
    );

    const smartWalletState = await smartWalletProgram.account.smartWallet.fetch(
      smartWallet
    );

    const [transaction, txBump] = deriveTransaction(
      smartWallet,
      smartWalletState.numTransactions
    );

    const activateProposalIx = {
      programId: MET_VOTER_PROGRAM_ID,
      data: ixData,
      keys: [
        {
          isSigner: false,
          isWritable: false,
          pubkey: locker,
        },
        {
          isSigner: false,
          isWritable: true,
          pubkey: govern,
        },
        {
          isSigner: false,
          isWritable: true,
          pubkey: proposal,
        },
        {
          isSigner: false,
          isWritable: false,
          pubkey: GOVERN_PROGRAM_ID,
        },
        {
          isSigner: true,
          isWritable: false,
          pubkey: smartWallet,
        },
      ],
    };

    await smartWalletProgram.methods
      .createTransaction(txBump, [activateProposalIx])
      .accounts({
        payer: smartWalletProgram.provider.publicKey,
        proposer: smartWalletProgram.provider.publicKey,
        smartWallet,
        systemProgram: web3.SystemProgram.programId,
        transaction,
      })
      .rpc();

    // Smart wallet execute activate proposal transaction
    await smartWalletProgram.methods
      .executeTransaction()
      .accounts({
        owner: smartWalletProgram.provider.publicKey,
        smartWallet,
        transaction,
      })
      .remainingAccounts([
        {
          isSigner: false,
          isWritable: false,
          pubkey: MET_VOTER_PROGRAM_ID,
        },
        ...activateProposalIx.keys.map((x) => {
          return {
            ...x,
            isSigner: false, // Need to override to false as these are signed by the smart wallet
          };
        }),
      ])
      .rpc();

    const governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);

    const proposalState = await governProgram.account.proposal.fetch(proposal);
    expect(proposalState.activatedAt.toString()).not.equal("0");
    expect(proposalState.votingEndsAt.toString()).not.equal("0");
  });

  it("delegate voting power to others and vote for proposal", async () => {
    const wallet = new Wallet(nonClaimerKeypair);

    const { keypair: delegateKeypair } = await createAndFundWallet(
      provider.connection
    );
    const delegateWallet = new Wallet(delegateKeypair);

    let voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);
    const [escrow, _eBump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);

    // Delegate voting power
    await voterProgram.methods
      .setVoteDelegate(delegateWallet.publicKey)
      .accounts({
        escrow,
        escrowOwner: wallet.publicKey,
      })
      .rpc();

    const escrowState = await voterProgram.account.escrow.fetch(escrow);

    expect(escrowState.voteDelegate.toBase58()).to.be.equal(
      delegateWallet.publicKey.toBase58()
    );

    // Create vote
    const governProgram = createGovernProgram(
      delegateWallet,
      GOVERN_PROGRAM_ID
    );

    const [vote, _vBump] = deriveVote(wallet.publicKey, proposal);

    await governProgram.methods
      .newVote(wallet.publicKey)
      .accounts({
        payer: governProgram.provider.publicKey,
        proposal,
        systemProgram: web3.SystemProgram.programId,
        vote,
      })
      .rpc();

    // Delegate wallet cast against a proposal using delegated vote
    voterProgram = createMetVoterProgram(delegateWallet, MET_VOTER_PROGRAM_ID);

    await voterProgram.methods
      .castVote(VoteSide.Against)
      .accounts({
        escrow, // Use delegated escrow,
        governor: govern,
        governProgram: GOVERN_PROGRAM_ID,
        locker,
        proposal,
        vote, // Use delegated vote
        voteDelegate: voterProgram.provider.publicKey,
      })
      .rpc();

    const voteState = await governProgram.account.vote.fetch(vote);
    const proposalState = await governProgram.account.proposal.fetch(proposal);

    expect(voteState.side.toString()).to.be.equal(VoteSide.Against.toString());
    expect(proposalState.againstVotes.toString()).to.be.equal(
      voteState.weight.toString()
    );
  });

  it("cannot vote anymore if delegated to other user", async () => {
    const wallet = new Wallet(nonClaimerKeypair);

    const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);
    const [escrow, _eBump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);
    const [vote, _vBump] = deriveVote(wallet.publicKey, proposal);

    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .castVote(VoteSide.Against)
          .accounts({
            escrow,
            governor: govern,
            governProgram: GOVERN_PROGRAM_ID,
            locker,
            proposal,
            vote,
            voteDelegate: voterProgram.provider.publicKey,
          })
          .rpc();
      },
      "self.escrow.vote_delegate != self.vote_delegate",
      false
    );
  });

  it("users vote for proposal", async () => {
    const voterKeypairs = [...claimerKeypairs];

    for (const keypair of voterKeypairs) {
      const wallet = new Wallet(keypair);

      const voterProgram = createMetVoterProgram(wallet, MET_VOTER_PROGRAM_ID);
      const governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);

      const [vote, _vBump] = deriveVote(wallet.publicKey, proposal);
      const [escrow, _eBump] = deriveEscrow(locker, wallet.publicKey, MET_VOTER_PROGRAM_ID);

      const beforeProposalState = await governProgram.account.proposal.fetch(
        proposal
      );

      await governProgram.methods
        .newVote(wallet.publicKey)
        .accounts({
          payer: governProgram.provider.publicKey,
          proposal,
          systemProgram: web3.SystemProgram.programId,
          vote,
        })
        .rpc();

      await voterProgram.methods
        .castVote(VoteSide.For)
        .accounts({
          escrow,
          governor: govern,
          governProgram: GOVERN_PROGRAM_ID,
          locker,
          proposal,
          vote,
          voteDelegate: voterProgram.provider.publicKey,
        })
        .rpc();

      const voteState = await governProgram.account.vote.fetch(vote);
      const afterProposalState = await governProgram.account.proposal.fetch(
        proposal
      );

      const proposalForVoteDelta = afterProposalState.forVotes
        .sub(beforeProposalState.forVotes)
        .toString();

      expect(voteState.side.toString()).to.be.equal(VoteSide.For.toString());
      expect(proposalForVoteDelta).to.be.equal(voteState.weight.toString());
    }
  });

  it("users able to exit when phase 1 expired", async () => {
    const keypairs = [...claimerKeypairs, nonClaimerKeypair];

    for (const keypair of keypairs) {
      const userWallet = new Wallet(keypair);
      const voterProgram = createMetVoterProgram(userWallet, MET_VOTER_PROGRAM_ID);

      while (true) {
        const [lockerState, onchainTimestamp] = await Promise.all([
          voterProgram.account.locker.fetch(locker),
          getOnChainTime(provider.connection),
        ]);

        if (lockerState.expiration.toNumber() > onchainTimestamp) {
          console.log(
            `${lockerState.expiration.toNumber() - onchainTimestamp
            } seconds until phase 1 expire`
          );
          await sleep(1000);
        } else {
          break;
        }
      }

      const [escrow, _eBump] = deriveEscrow(locker, userWallet.publicKey, MET_VOTER_PROGRAM_ID);

      const userATA = await getOrCreateATA(
        rewardMint,
        userWallet.publicKey,
        keypair,
        provider.connection
      );

      const escrowATA = await getOrCreateATA(
        rewardMint,
        escrow,
        keypair,
        provider.connection
      );

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

      // Escrow account closed
    }
  });
});
