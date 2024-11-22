import * as anchor from "@coral-xyz/anchor";
import { BN, Wallet, web3 } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getAccount,
} from "@solana/spl-token";

import {
  Connection,
  SystemProgram,
  Transaction,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  GOVERN_PROGRAM_ID,
  IProposalInstruction,
  SMART_WALLET_PROGRAM_ID,
  LOCKED_VOTER_PROGRAM_ID,
  createAndFundWallet,
  createGovernProgram,
  createGovernor,
  createProposal,
  createProposalMeta,
  createSmartWallet,
  createSmartWalletProgram,
  createLockedVoterProgram,
  deriveEscrow,
  deriveGovern,
  deriveLocker,
  deriveSmartWallet,
  getOnChainTime,
  getOrCreateATA,
  sleep,
  deriveRequest,
  deriveTransaction,
} from "../utils";
import { assert, expect } from "chai";

const provider = anchor.AnchorProvider.env();

const lockAmount = new BN(1000);

describe("Move Lock", () => {
  let locker: web3.PublicKey;
  let govern: web3.PublicKey;
  let smartWallet: web3.PublicKey;
  let proposal: web3.PublicKey;

  let wallet: Wallet;
  let keypair: web3.Keypair;

  let rewardMint: web3.PublicKey;
  let userKeypair: web3.Keypair;
  let newUserKeypair: web3.Keypair;

  // Smart wallet config
  let smartWalletOwners: web3.PublicKey[] = [];
  let smartWalletThreshold: BN = new BN(1);

  // Govern config
  const votingPeriod: BN = new BN(10); // 10 seconds duration of voting on proposal
  const quorumVotes: BN = new BN(2); // 2 vote to pass

  // Voter config
  const maxStakeDuration: BN = new BN(20); // 20 seconds
  const minStakeDuration: BN = new BN(10); // 10 seconds
  const maxStakeVoteMultiplier: number = 1;
  const proposalActivationMinVotes: BN = new BN(2); // min 2 vote to activate proposal

  async function createSetLockerParamsProposal() {
    const governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);
    const voterProgram = createLockedVoterProgram(
      wallet,
      LOCKED_VOTER_PROGRAM_ID
    );
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
      programId: LOCKED_VOTER_PROGRAM_ID,
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

  async function initializeLocker() {
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
        base: keypair.publicKey,
        locker,
        tokenMint: rewardMint,
        governor: govern,
        payer: voterProgram.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  }

  before(async () => {
    const result = await createAndFundWallet(provider.connection);
    keypair = result.keypair;
    wallet = result.wallet;

    const [lockerPda, lBump] = deriveLocker(
      keypair.publicKey,
      LOCKED_VOTER_PROGRAM_ID
    );
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
      LOCKED_VOTER_PROGRAM_ID
    );

    rewardMint = await createMint(
      provider.connection,
      keypair,
      keypair.publicKey,
      null,
      9
    );

    {
      const result = await createAndFundWallet(provider.connection);
      userKeypair = result.keypair;

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

    await initializeLocker();
  });

  before(async () => {
    const wallet = new Wallet(userKeypair);
    const voterProgram = createLockedVoterProgram(
      wallet,
      LOCKED_VOTER_PROGRAM_ID
    );
    const [escrow, _bump] = deriveEscrow(
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
  });

  it("user opens dispute, gets it approved, and wait for cooldown to claim tokens", async () => {
    const userWallet = new Wallet(userKeypair);
    let voterProgram = createLockedVoterProgram(
      userWallet,
      LOCKED_VOTER_PROGRAM_ID
    );
    const [escrow, _bump] = deriveEscrow(
      locker,
      userWallet.publicKey,
      LOCKED_VOTER_PROGRAM_ID
    );

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

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    /*
      1. User lost funds 
      2. User creates new wallet (NewUser) with Sol
      3. NewUser(feepayer) and User(authority) signs OpenDispute which also freezes escrow for 7 days
      4. A transaction is created for smart wallet to execute with the move request
      5. Smart wallet executes the move request transaction 
      6. Wait for cooldown period
      7. NewUser will recover the tokens 
    */

    const SIGNATURE_FEES = 5000;
    let lostFundsIX = SystemProgram.transfer({
      fromPubkey: userKeypair.publicKey,
      toPubkey: keypair.publicKey,
      lamports:
        (await provider.connection.getBalance(userKeypair.publicKey)) -
        SIGNATURE_FEES,
    });

    let blockhash = await provider.connection.getLatestBlockhash();
    let tx = new Transaction(blockhash).add(lostFundsIX);
    tx.feePayer = userKeypair.publicKey;

    let lostFundsTX = new VersionedTransaction(tx.compileMessage());
    lostFundsTX.sign([userKeypair]);
    await provider.connection.sendTransaction(lostFundsTX);

    const escrow_funds_to_be_rescued = (
      await getAccount(provider.connection, escrowATA)
    ).amount;

    // Wait for RPC to catch up
    await sleep(1000);
    expect(await provider.connection.getBalance(userKeypair.publicKey)).equal(
      0
    );
    console.log("1. user lost funds");
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const result = await createAndFundWallet(provider.connection);
    newUserKeypair = result.keypair;
    const newUserWallet = result.wallet;

    let newUserATA = await getOrCreateATA(
      rewardMint,
      newUserKeypair.publicKey,
      newUserKeypair,
      provider.connection
    );

    // Wait for RPC to catch up
    await sleep(1000);
    expect(
      await provider.connection.getBalance(newUserKeypair.publicKey)
    ).greaterThanOrEqual(100_000_000);

    console.log("fund new wallet");

    console.log("2. new wallet is created");
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    const chain_time = await getOnChainTime(provider.connection);
    console.log(
      `Chain time now: ${chain_time}, Escrow freeze_time: ${chain_time}`
    );
    voterProgram = createLockedVoterProgram(
      newUserWallet,
      LOCKED_VOTER_PROGRAM_ID
    );
    const [request, rbump] = deriveRequest(
      escrow,
      newUserKeypair.publicKey,
      voterProgram.programId
    );
    voterProgram.provider.publicKey;

    await voterProgram.methods
      .openDispute()
      .accounts({
        locker: locker,
        escrow,
        owner: userKeypair.publicKey,
        request,
        recoveryKey: newUserKeypair.publicKey,
        feepayer: newUserKeypair.publicKey,
      })
      .signers([newUserKeypair, userKeypair])
      .rpc();

    console.log("escrow frozen and move request created");
    console.log("3. new request is created");
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const approve_move_request = await voterProgram.methods
      .approveMoveRequest()
      .accounts({
        locker,
        governor: govern,
        smartWallet,
        request,
        escrow: escrow,
        recoveryKey: newUserKeypair.publicKey,
      })
      .instruction();

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

    await smartWalletProgram.methods
      .createTransaction(txBump, [approve_move_request])
      .accounts({
        payer: smartWalletProgram.provider.publicKey,
        proposer: smartWalletProgram.provider.publicKey,
        smartWallet,
        systemProgram: web3.SystemProgram.programId,
        transaction,
      })
      .rpc();

    console.log("transaction created");
    console.log(
      "4. a proposal is created for smart wallet to execute with the approve the request"
    );
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    const txAccount = await smartWalletProgram.account.transaction.fetch(
      transaction
    );

    await smartWalletProgram.methods
      .executeTransaction()
      .accounts({
        smartWallet,
        transaction: transaction,
        owner: wallet.publicKey,
      })
      .remainingAccounts(
        txAccount.instructions.flatMap((ix) => [
          {
            pubkey: ix.programId,
            isSigner: false,
            isWritable: false,
          },
          ...ix.keys.map((k) => {
            return {
              ...k,
              isSigner: false,
            };
          }),
        ])
      )
      .signers([keypair])
      .rpc();

    console.log("5. transaction proposal is executed");

    ///////////////////////////////////////////////////////////////////////////////////////////////////

    while (true) {
      await sleep(1000);
      const [escrowState, onchainTimestamp] = await Promise.all([
        voterProgram.account.escrow.fetch(escrow),
        getOnChainTime(provider.connection),
      ]);
      if (
        escrowState.freezeTimestamp.toNumber() +
          maxStakeDuration.toNumber() +
          2 >
        onchainTimestamp
      ) {
        console.log(
          `${
            escrowState.freezeTimestamp.toNumber() +
            maxStakeDuration.toNumber() -
            onchainTimestamp
          } seconds until escrow un-freezes`
        );
      } else {
        break;
      }
    }

    console.log("6. wait for cooldown period");
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    await voterProgram.methods
      .recoverFunds()
      .accounts({
        payer: newUserKeypair.publicKey,
        locker,
        escrow,
        escrowTokens: escrowATA,
        destinationTokens: newUserATA,
        recoveryKey: newUserKeypair.publicKey,
      })
      .signers([newUserKeypair])
      .rpc();

    await sleep(1000);
    const rescued_amount = (await getAccount(provider.connection, newUserATA))
      .amount;
    expect(rescued_amount).equal(escrow_funds_to_be_rescued);
    console.log("7. Finally recover the tokens and check.");
  });
});
