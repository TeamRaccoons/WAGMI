import * as anchor from "@coral-xyz/anchor";
import { Wallet, web3 } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, createMint, mintTo } from "@solana/spl-token";
import { BN } from "bn.js";
import { expect } from "chai";
import { ONE_DAY } from "../govern/constants";
import {
  BalanceTree,
  GOVERN_PROGRAM_ID,
  MERKLE_DISTRIBUTOR_PROGRAM_ID,
  SMART_WALLET_PROGRAM_ID,
  VOTER_PROGRAM_ID,
  createAndFundWallet,
  createGovernProgram,
  createGovernor,
  createLocker,
  createMerkleDistributorProgram,
  createSmartWallet,
  createSmartWalletProgram,
  createVoterProgram,
  deriveClaimStatus,
  deriveDistributor,
  deriveEscrow,
  deriveGovern,
  deriveLocker,
  deriveSmartWallet,
  getOrCreateATA,
  invokeAndAssertError,
} from "../utils";

const provider = anchor.AnchorProvider.env();

// Maximum number of claims
const maxNodesClaimed = new BN(3);
// Claimable amount
const claimAmount = new BN(100);

describe("merkle-distributor", () => {
  let wallet: Wallet;
  let keypair: web3.Keypair;
  let rewardMint: web3.PublicKey;

  let smartWallet: web3.PublicKey;
  let governor: web3.PublicKey;
  let locker: web3.PublicKey;
  let distributor: web3.PublicKey;

  let mdATA: web3.PublicKey;

  const claimerKeypairs: web3.Keypair[] = [];

  let tree: BalanceTree;
  // Maximum amount can be claimed from the merkle distributor
  let maxTotalClaim = claimAmount.mul(maxNodesClaimed);

  async function setupSmartWallet() {
    const owners = [governor, wallet.publicKey];
    const maxOwners = owners.length + 2;
    const delay = new BN(0);
    const threshold = new BN(1);

    return createSmartWallet(
      owners,
      maxOwners,
      delay,
      threshold,
      keypair,
      createSmartWalletProgram(wallet, SMART_WALLET_PROGRAM_ID)
    );
  }

  async function setupGovernor() {
    // Delay before voting on a proposal may take place, once proposed
    const votingDelay = new BN(0);
    // Duration of voting on a proposal, in seconds
    const votingPeriod = ONE_DAY;
    // Number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
    const quorumVotes = new BN(2);
    // Timelock delay of the DAO's created proposals
    const timelockDelaySeconds = new BN(0);

    return createGovernor(
      votingDelay,
      votingPeriod,
      quorumVotes,
      timelockDelaySeconds,
      keypair,
      smartWallet,
      createGovernProgram(wallet, GOVERN_PROGRAM_ID)
    );
  }

  async function setupEscrow(wallet: Wallet) {
    const [escrow, _eBump] = deriveEscrow(locker, wallet.publicKey);

    const voterProgram = createVoterProgram(wallet, VOTER_PROGRAM_ID);

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
  }

  async function setupLocker() {
    // This is only for veMET locking. This indicate the time needed to transition to Phase 2 (normal ve locker)
    const expiration = new BN(86400 + 60);
    const maxStakeVoteMultiplier = 1;
    // 1 days to 1 weeks
    const minStakeDuration = new BN(86400);
    const maxStakeDuration = new BN(86400 * 7);
    // 1 vote can activate the proposal
    const proposalActivationMinVotes = new BN(1);

    return createLocker(
      expiration,
      maxStakeDuration,
      maxStakeVoteMultiplier,
      minStakeDuration,
      proposalActivationMinVotes,
      keypair,
      rewardMint,
      governor,
      createVoterProgram(wallet, VOTER_PROGRAM_ID)
    );
  }

  before(async () => {
    const result = await createAndFundWallet(provider.connection);
    wallet = result.wallet;
    keypair = result.keypair;

    rewardMint = await createMint(
      provider.connection,
      keypair,
      keypair.publicKey,
      null,
      9
    );

    const [distributorPda, _dBump] = deriveDistributor(keypair.publicKey);
    distributor = distributorPda;

    const [governorPda, _gBump] = deriveGovern(keypair.publicKey);
    governor = governorPda;

    const [lockerPda, _lBump] = deriveLocker(keypair.publicKey);
    locker = lockerPda;

    const [smartWalletPda, _swBump] = deriveSmartWallet(keypair.publicKey);
    smartWallet = smartWalletPda;

    smartWallet = await setupSmartWallet();
    governor = await setupGovernor();
    locker = await setupLocker();

    for (let i = 0; i < maxNodesClaimed.toNumber(); i++) {
      const result = await createAndFundWallet(provider.connection);
      claimerKeypairs.push(result.keypair);

      await setupEscrow(new Wallet(result.keypair));
    }

    tree = new BalanceTree(
      claimerKeypairs.map((kp) => {
        return { account: kp.publicKey, amount: claimAmount };
      })
    );
  });

  it("initialize merkle distributor successfully", async () => {
    const mdProgram = createMerkleDistributorProgram(
      wallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    console.log("Creating merkle distribution", distributor.toBase58());

    const tx = await mdProgram.methods
      .newDistributor(
        locker,
        Array.from(new Uint8Array(tree.getRoot())),
        maxTotalClaim,
        maxNodesClaimed
      )
      .accounts({
        base: keypair.publicKey,
        distributor,
        mint: rewardMint,
        payer: keypair.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    console.log("Create merkle distribution tx", tx);

    const md = await mdProgram.account.merkleDistributor.fetch(distributor);

    expect(md.maxNumNodes.toString()).to.equal(maxNodesClaimed.toString());
    expect(md.maxTotalClaim.toString()).to.equal(maxTotalClaim.toString());
    expect(md.base.toBase58()).to.be.equal(keypair.publicKey.toBase58());
    expect(md.mint.toBase58()).to.be.equal(rewardMint.toBase58());
    expect(md.numNodesClaimed.toString()).to.equal("0");
    expect(md.root).to.deep.equal(Array.from(new Uint8Array(tree.getRoot())));
    expect(md.totalAmountClaimed.toString()).to.equal("0");
    expect(md.admin.toBase58()).to.equal(keypair.publicKey.toBase58());
  });

  it("fund merkle distributor rewards", async () => {
    mdATA = await getOrCreateATA(
      rewardMint,
      distributor,
      keypair,
      provider.connection
    );

    await mintTo(
      provider.connection,
      keypair,
      rewardMint,
      mdATA,
      keypair.publicKey,
      maxTotalClaim.toNumber()
    );

    const mdBalance = await provider.connection.getTokenAccountBalance(mdATA);
    expect(mdBalance.value.amount).to.equal(maxTotalClaim.toString());
  });

  it("user #1 fails to claim with empty proof", async () => {
    const index = new BN(0);
    const userOneKeypair = claimerKeypairs[index.toNumber()];
    const userOneWallet = new Wallet(userOneKeypair);

    const mdProgram = createMerkleDistributorProgram(
      userOneWallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    const [claimStatus, _csBump] = deriveClaimStatus(index, distributor);

    const [escrow, _eBump] = deriveEscrow(locker, userOneWallet.publicKey);
    const escrowTokens = await getOrCreateATA(
      rewardMint,
      escrow,
      userOneKeypair,
      provider.connection
    );

    await invokeAndAssertError(
      () => {
        return mdProgram.methods
          .claim(index, claimAmount, [])
          .accounts({
            distributor,
            claimStatus,
            from: mdATA,
            claimant: userOneWallet.publicKey,
            payer: userOneWallet.publicKey,
            escrow,
            locker,
            escrowTokens,
            voterProgram: VOTER_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
      },
      "Invalid Merkle Proof",
      true
    );
  });

  it("user #1 fails to claim for user #2", async () => {
    const index = new BN(1);
    const userTwoKeypair = claimerKeypairs[index.toNumber()];
    const userTwoWallet = new Wallet(userTwoKeypair);

    const proof = tree.getProof(
      index.toNumber(),
      userTwoWallet.publicKey,
      claimAmount
    );

    const userOneKeypair = claimerKeypairs[0];
    const userOneWallet = new Wallet(userOneKeypair);

    const mdProgram = createMerkleDistributorProgram(
      userOneWallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    const [claimStatus, _csBump] = deriveClaimStatus(index, distributor);

    const [escrow, _eBump] = deriveEscrow(locker, userTwoWallet.publicKey);
    const escrowTokens = await getOrCreateATA(
      rewardMint,
      escrow,
      userTwoKeypair,
      provider.connection
    );

    await invokeAndAssertError(
      () => {
        return mdProgram.methods
          .claim(index, claimAmount, proof)
          .accounts({
            distributor,
            claimStatus,
            from: mdATA,
            claimant: userTwoWallet.publicKey,
            payer: userOneKeypair.publicKey,
            escrow,
            locker,
            escrowTokens,
            voterProgram: VOTER_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
      },
      "Payer did not match intended payer",
      true
    );
  });

  it("user #1 cannot claim using user #2 proof", async () => {
    const userTwoIndex = new BN(1);
    const userTwoKeypair = claimerKeypairs[userTwoIndex.toNumber()];
    const userTwoWallet = new Wallet(userTwoKeypair);

    const userTwoProof = tree.getProof(
      userTwoIndex.toNumber(),
      userTwoWallet.publicKey,
      claimAmount
    );

    const userOneIndex = new BN(0);
    const userOneKeypair = claimerKeypairs[userOneIndex.toNumber()];
    const userOneWallet = new Wallet(userOneKeypair);

    const mdProgram = createMerkleDistributorProgram(
      userOneWallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    const [claimStatus, _csBump] = deriveClaimStatus(userTwoIndex, distributor);

    const [escrow, _eBump] = deriveEscrow(locker, userOneWallet.publicKey);
    const escrowTokens = await getOrCreateATA(
      rewardMint,
      escrow,
      userOneKeypair,
      provider.connection
    );

    // User 2 proof + claim index. But, user one escrow
    invokeAndAssertError(
      () => {
        return mdProgram.methods
          .claim(userTwoIndex, claimAmount, userTwoProof)
          .accounts({
            distributor,
            claimStatus,
            from: mdATA,
            claimant: userOneWallet.publicKey,
            payer: userOneWallet.publicKey,
            escrow,
            locker,
            escrowTokens,
            voterProgram: VOTER_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
      },
      "Invalid Merkle Proof",
      true
    );
  });

  it("user #1 cannot claim amount more than proof", async () => {
    const index = new BN(0);
    const userOneKeypair = claimerKeypairs[index.toNumber()];
    const userOneWallet = new Wallet(userOneKeypair);

    const proof = tree.getProof(
      index.toNumber(),
      userOneWallet.publicKey,
      claimAmount
    );

    const mdProgram = createMerkleDistributorProgram(
      userOneWallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    const [claimStatus, _csBump] = deriveClaimStatus(index, distributor);

    const [escrow, _eBump] = deriveEscrow(locker, userOneWallet.publicKey);
    const escrowTokens = await getOrCreateATA(
      rewardMint,
      escrow,
      userOneKeypair,
      provider.connection
    );

    // Proof was 100, but trying to claim additional "1" amount
    const moreThanClaimAmount = claimAmount.add(new BN(1));

    await invokeAndAssertError(
      () => {
        return mdProgram.methods
          .claim(index, moreThanClaimAmount, proof)
          .accounts({
            distributor,
            claimStatus,
            from: mdATA,
            claimant: userOneWallet.publicKey,
            payer: userOneWallet.publicKey,
            escrow,
            locker,
            escrowTokens,
            voterProgram: VOTER_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
      },
      "Invalid Merkle proof",
      true
    );
  });

  it("user #1 claim successfully", async () => {
    const userOneIndex = new BN(0);
    const userOneKeypair = claimerKeypairs[userOneIndex.toNumber()];
    const userOneWallet = new Wallet(userOneKeypair);

    const proof = tree.getProof(
      userOneIndex.toNumber(),
      userOneWallet.publicKey,
      claimAmount
    );

    const mdProgram = createMerkleDistributorProgram(
      userOneWallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    const voterProgram = createVoterProgram(userOneWallet, VOTER_PROGRAM_ID);

    const [claimStatus, _csBump] = deriveClaimStatus(userOneIndex, distributor);

    const [escrow, _eBump] = deriveEscrow(locker, userOneWallet.publicKey);
    const escrowTokens = await getOrCreateATA(
      rewardMint,
      escrow,
      userOneKeypair,
      provider.connection
    );

    const [
      beforeDistributor,
      beforeDistributorBalance,
      beforeEscrow,
      beforeEscrowATA,
      beforeLocker,
    ] = await Promise.all([
      mdProgram.account.merkleDistributor.fetch(distributor),
      provider.connection
        .getTokenAccountBalance(mdATA)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.escrow.fetch(escrow),
      provider.connection
        .getTokenAccountBalance(escrowTokens)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.locker.fetch(locker),
    ]);

    await mdProgram.methods
      .claim(userOneIndex, claimAmount, proof)
      .accounts({
        distributor,
        claimStatus,
        from: mdATA,
        claimant: userOneWallet.publicKey,
        payer: userOneWallet.publicKey,
        escrow,
        locker,
        escrowTokens,
        voterProgram: VOTER_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const [
      afterDistributor,
      afterDistributorBalance,
      afterEscrow,
      afterEscrowATA,
      afterLocker,
    ] = await Promise.all([
      mdProgram.account.merkleDistributor.fetch(distributor),
      provider.connection
        .getTokenAccountBalance(mdATA)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.escrow.fetch(escrow),
      provider.connection
        .getTokenAccountBalance(escrowTokens)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.locker.fetch(locker),
    ]);

    const claimStatusState = await mdProgram.account.claimStatus.fetch(
      claimStatus
    );

    expect(claimStatusState.isClaimed).to.be.true;
    expect(claimStatusState.claimedAt.toString()).not.equal("0");
    expect(claimStatusState.amount.toString()).to.be.equal(
      claimAmount.toString()
    );
    expect(claimStatusState.claimant.toBase58()).to.be.equal(
      userOneWallet.publicKey.toBase58()
    );

    const totalAmountClaimedDelta = afterDistributor.totalAmountClaimed.sub(
      beforeDistributor.totalAmountClaimed
    );
    const numNodesClaimedDelta = afterDistributor.numNodesClaimed.sub(
      beforeDistributor.numNodesClaimed
    );
    const distributorBalanceDelta = afterDistributorBalance.sub(
      beforeDistributorBalance
    );

    expect(totalAmountClaimedDelta.toString()).to.be.equal(
      claimAmount.toString()
    );
    expect(numNodesClaimedDelta.toString()).to.be.equal("1");

    expect(distributorBalanceDelta.toString()).to.be.equal(
      claimAmount.neg().toString()
    );

    // After claim, the MET will be locked in Escrow
    const escrowAmountDelta = afterEscrow.amount.sub(beforeEscrow.amount);
    const escrowATADelta = afterEscrowATA.sub(beforeEscrowATA);
    const lockerSupplyDelta = afterLocker.lockedSupply.sub(
      beforeLocker.lockedSupply
    );

    expect(escrowAmountDelta.toString()).to.be.equal(claimAmount.toString());
    expect(escrowATADelta.toString()).to.be.equal(claimAmount.toString());
    expect(lockerSupplyDelta.toString()).to.be.equal(claimAmount.toString());
  });

  it("user #1 cannot claim anymore", async () => {
    const userOneIndex = new BN(0);
    const userOneKeypair = claimerKeypairs[userOneIndex.toNumber()];
    const userOneWallet = new Wallet(userOneKeypair);

    const proof = tree.getProof(
      userOneIndex.toNumber(),
      userOneWallet.publicKey,
      claimAmount
    );

    const mdProgram = createMerkleDistributorProgram(
      userOneWallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    const [claimStatus, _csBump] = deriveClaimStatus(userOneIndex, distributor);

    const [escrow, _eBump] = deriveEscrow(locker, userOneWallet.publicKey);
    const escrowTokens = await getOrCreateATA(
      rewardMint,
      escrow,
      userOneKeypair,
      provider.connection
    );

    invokeAndAssertError(
      () => {
        return mdProgram.methods
          .claim(userOneIndex, claimAmount, proof)
          .accounts({
            distributor,
            claimStatus,
            from: mdATA,
            claimant: userOneWallet.publicKey,
            payer: userOneWallet.publicKey,
            escrow,
            locker,
            escrowTokens,
            voterProgram: VOTER_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
      },
      `Allocate: account Address { address: ${claimStatus}, base: None } already in use`, // ClaimStatus cannot initiate 2 times
      false
    );
  });

  it("admin help user #2 to claim", async () => {
    const userTwoIndex = new BN(1);
    const userTwoKeypair = claimerKeypairs[userTwoIndex.toNumber()];
    const userTwoWallet = new Wallet(userTwoKeypair);

    const proof = tree.getProof(
      userTwoIndex.toNumber(),
      userTwoWallet.publicKey,
      claimAmount
    );

    const adminWallet = wallet;

    const mdProgram = createMerkleDistributorProgram(
      adminWallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    const voterProgram = createVoterProgram(userTwoWallet, VOTER_PROGRAM_ID);

    const [claimStatus, _csBump] = deriveClaimStatus(userTwoIndex, distributor);

    const [escrow, _eBump] = deriveEscrow(locker, userTwoWallet.publicKey);
    const escrowTokens = await getOrCreateATA(
      rewardMint,
      escrow,
      userTwoKeypair,
      provider.connection
    );

    const [
      beforeDistributor,
      beforeDistributorBalance,
      beforeEscrow,
      beforeEscrowATA,
      beforeLocker,
    ] = await Promise.all([
      mdProgram.account.merkleDistributor.fetch(distributor),
      provider.connection
        .getTokenAccountBalance(mdATA)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.escrow.fetch(escrow),
      provider.connection
        .getTokenAccountBalance(escrowTokens)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.locker.fetch(locker),
    ]);

    await mdProgram.methods
      .claim(userTwoIndex, claimAmount, proof)
      .accounts({
        distributor,
        claimStatus,
        from: mdATA,
        claimant: userTwoWallet.publicKey,
        payer: adminWallet.publicKey,
        escrow,
        locker,
        escrowTokens,
        voterProgram: VOTER_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const [
      afterDistributor,
      afterDistributorBalance,
      afterEscrow,
      afterEscrowATA,
      afterLocker,
    ] = await Promise.all([
      mdProgram.account.merkleDistributor.fetch(distributor),
      provider.connection
        .getTokenAccountBalance(mdATA)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.escrow.fetch(escrow),
      provider.connection
        .getTokenAccountBalance(escrowTokens)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.locker.fetch(locker),
    ]);

    const claimStatusState = await mdProgram.account.claimStatus.fetch(
      claimStatus
    );

    expect(claimStatusState.isClaimed).to.be.true;
    expect(claimStatusState.claimedAt.toString()).not.equal("0");
    expect(claimStatusState.amount.toString()).to.be.equal(
      claimAmount.toString()
    );
    expect(claimStatusState.claimant.toBase58()).to.be.equal(
      userTwoWallet.publicKey.toBase58()
    );

    const totalAmountClaimedDelta = afterDistributor.totalAmountClaimed.sub(
      beforeDistributor.totalAmountClaimed
    );
    const numNodesClaimedDelta = afterDistributor.numNodesClaimed.sub(
      beforeDistributor.numNodesClaimed
    );
    const distributorBalanceDelta = afterDistributorBalance.sub(
      beforeDistributorBalance
    );

    expect(totalAmountClaimedDelta.toString()).to.be.equal(
      claimAmount.toString()
    );
    expect(numNodesClaimedDelta.toString()).to.be.equal("1");

    expect(distributorBalanceDelta.toString()).to.be.equal(
      claimAmount.neg().toString()
    );

    // After claim, the MET will be locked in Escrow
    const escrowAmountDelta = afterEscrow.amount.sub(beforeEscrow.amount);
    const escrowATADelta = afterEscrowATA.sub(beforeEscrowATA);
    const lockerSupplyDelta = afterLocker.lockedSupply.sub(
      beforeLocker.lockedSupply
    );

    expect(escrowAmountDelta.toString()).to.be.equal(claimAmount.toString());
    expect(escrowATADelta.toString()).to.be.equal(claimAmount.toString());
    expect(lockerSupplyDelta.toString()).to.be.equal(claimAmount.toString());
  });

  it("all drops claimed", async () => {
    // user #3 claims the drop
    const userThreeIndex = new BN(2);
    const userThreeKeypair = claimerKeypairs[userThreeIndex.toNumber()];
    const userThreeWallet = new Wallet(userThreeKeypair);

    const proof = tree.getProof(
      userThreeIndex.toNumber(),
      userThreeWallet.publicKey,
      claimAmount
    );

    const mdProgram = createMerkleDistributorProgram(
      userThreeWallet,
      MERKLE_DISTRIBUTOR_PROGRAM_ID
    );

    const voterProgram = createVoterProgram(userThreeWallet, VOTER_PROGRAM_ID);

    const [claimStatus, _csBump] = deriveClaimStatus(
      userThreeIndex,
      distributor
    );

    const [escrow, _eBump] = deriveEscrow(locker, userThreeWallet.publicKey);
    const escrowTokens = await getOrCreateATA(
      rewardMint,
      escrow,
      userThreeKeypair,
      provider.connection
    );

    const [
      beforeDistributor,
      beforeDistributorBalance,
      beforeEscrow,
      beforeEscrowATA,
      beforeLocker,
    ] = await Promise.all([
      mdProgram.account.merkleDistributor.fetch(distributor),
      provider.connection
        .getTokenAccountBalance(mdATA)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.escrow.fetch(escrow),
      provider.connection
        .getTokenAccountBalance(escrowTokens)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.locker.fetch(locker),
    ]);

    await mdProgram.methods
      .claim(userThreeIndex, claimAmount, proof)
      .accounts({
        distributor,
        claimStatus,
        from: mdATA,
        claimant: userThreeWallet.publicKey,
        payer: userThreeWallet.publicKey,
        escrow,
        locker,
        escrowTokens,
        voterProgram: VOTER_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const [
      afterDistributor,
      afterDistributorBalance,
      afterEscrow,
      afterEscrowATA,
      afterLocker,
    ] = await Promise.all([
      mdProgram.account.merkleDistributor.fetch(distributor),
      provider.connection
        .getTokenAccountBalance(mdATA)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.escrow.fetch(escrow),
      provider.connection
        .getTokenAccountBalance(escrowTokens)
        .then((b) => new BN(b.value.amount)),
      voterProgram.account.locker.fetch(locker),
    ]);

    const claimStatusState = await mdProgram.account.claimStatus.fetch(
      claimStatus
    );

    expect(claimStatusState.isClaimed).to.be.true;
    expect(claimStatusState.claimedAt.toString()).not.equal("0");
    expect(claimStatusState.amount.toString()).to.be.equal(
      claimAmount.toString()
    );
    expect(claimStatusState.claimant.toBase58()).to.be.equal(
      userThreeWallet.publicKey.toBase58()
    );

    const totalAmountClaimedDelta = afterDistributor.totalAmountClaimed.sub(
      beforeDistributor.totalAmountClaimed
    );
    const numNodesClaimedDelta = afterDistributor.numNodesClaimed.sub(
      beforeDistributor.numNodesClaimed
    );
    const distributorBalanceDelta = afterDistributorBalance.sub(
      beforeDistributorBalance
    );

    expect(totalAmountClaimedDelta.toString()).to.be.equal(
      claimAmount.toString()
    );
    expect(numNodesClaimedDelta.toString()).to.be.equal("1");

    expect(distributorBalanceDelta.toString()).to.be.equal(
      claimAmount.neg().toString()
    );

    // After claim, the MET will be locked in Escrow
    const escrowAmountDelta = afterEscrow.amount.sub(beforeEscrow.amount);
    const escrowATADelta = afterEscrowATA.sub(beforeEscrowATA);
    const lockerSupplyDelta = afterLocker.lockedSupply.sub(
      beforeLocker.lockedSupply
    );

    expect(escrowAmountDelta.toString()).to.be.equal(claimAmount.toString());
    expect(escrowATADelta.toString()).to.be.equal(claimAmount.toString());
    expect(lockerSupplyDelta.toString()).to.be.equal(claimAmount.toString());

    // Distributor has no balance anymore
    expect(afterDistributorBalance.toString()).to.be.equal("0");
    expect(afterDistributor.numNodesClaimed.toString()).to.be.equal(
      maxNodesClaimed.toString()
    );
    expect(afterDistributor.totalAmountClaimed.toString()).to.be.equal(
      claimAmount.mul(maxNodesClaimed).toString()
    );
  });
});
