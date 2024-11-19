import * as anchor from "@coral-xyz/anchor";
import { BN, Wallet, web3 } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, createMint, mintTo } from "@solana/spl-token";

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
  invokeAndAssertError,
} from "../utils";
import { expect } from "chai";
import { SystemInstructionCoder } from "@coral-xyz/anchor/dist/cjs/coder/system/instruction";

const provider = anchor.AnchorProvider.env();

const lockAmount = new BN(1000);
const partialUnstakingAmount = new BN(100);

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

  // Freeze test
  const freeze_before_failure = -10;
  const freeze_normally = 10;
  const freeze_extension_failure = 15;
  const freeze_extension = 20;

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

  it.skip("users can freeze escrow correctly", async () => {
    const userWallet = new Wallet(userKeypair);
    const voterProgram = createLockedVoterProgram(
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
    const chain_time = await getOnChainTime(provider.connection);
    console.log(
      `Chain time now: ${chain_time}, Escrow frozen request time: ${
        chain_time + freeze_before_failure
      }`
    );
    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .freezeEscrow(new BN(chain_time + freeze_before_failure))
          .accounts({
            escrow,
            owner: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();
      },
      "Freeze until time must be more than current timestamp",
      true
    );
    console.log("User cannot freeze using timestamp before current timestamp");

    console.log(
      `Chain time now: ${chain_time}, Escrow frozen request time: ${
        chain_time + freeze_normally
      }`
    );
    await voterProgram.methods
      .freezeEscrow(new BN(chain_time + freeze_normally))
      .accounts({
        escrow,
        owner: userKeypair.publicKey,
      })
      .signers([userKeypair])
      .rpc();
    console.log("User can freeze escrow normally");

    console.log(
      `Chain time now: ${chain_time}, Escrow frozen request time: ${
        chain_time + freeze_extension_failure
      }`
    );
    invokeAndAssertError(
      () => {
        return voterProgram.methods
          .freezeEscrow(new BN(chain_time + freeze_extension_failure))
          .accounts({
            escrow,
            owner: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();
      },
      "Account is already frozen",
      true
    );
    console.log(
      "User cannot freeze escrow to a time before current frozen_until time"
    );

    console.log(
      `Chain time now: ${chain_time}, Escrow frozen request time: ${
        chain_time + freeze_extension
      }`
    );
    await voterProgram.methods
      .freezeEscrow(new BN(chain_time + freeze_extension))
      .accounts({
        escrow,
        owner: userKeypair.publicKey,
      })
      .signers([userKeypair])
      .rpc();

    console.log("User can extend escrow freeze");

    // withdraw escrow
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
      "Account is Frozen",
      true
    );
    console.log("User cannot withdraw while account is frozen");

    while (true) {
      const [escrowState, onchainTimestamp] = await Promise.all([
        voterProgram.account.escrow.fetch(escrow),
        getOnChainTime(provider.connection),
      ]);

      if (escrowState.frozenUntil.toNumber() + 2 > onchainTimestamp) {
        console.log(
          `${
            escrowState.frozenUntil.toNumber() - onchainTimestamp
          } seconds until escrow un-freezes`
        );
        await sleep(1000);
      } else {
        break;
      }
    }

    await voterProgram.methods
      .withdraw()
      .accounts({
        destinationTokens: userATA,
        escrow,
        escrowOwner: voterProgram.provider.publicKey,
        escrowTokens: escrowATA,
        locker,
        payer: userKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("User can call withdraw");
  });

  it.skip("user freeze escrow, request for move, and smart wallet can move  ", async () => {
    const userWallet = new Wallet(userKeypair);
    const voterProgram = createLockedVoterProgram(
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
      1. User 'lost' funds 
      2. User creates new wallet (NewUser) with Sol
      3. NewUser(feepayer) and User(authority) signs and move request together with freeze request, NewUser also creates new escrow
      4. A transaction is created for smart wallet to execute with the move request
      5. Smart wallet executes the move request transaction 
      6. Check that NewUser now owns the funds in the lock.
    */

    const SIGNATURE_FEES = 5000;
    let lostFundsIX = SystemProgram.transfer({
      fromPubkey: userKeypair.publicKey,
      toPubkey: keypair.publicKey,
      lamports:
        (await provider.connection.getBalance(userKeypair.publicKey)) -
        SIGNATURE_FEES,
    });
    let lostFundsTX = new VersionedTransaction(
      new Transaction().add(lostFundsIX).compileMessage()
    );
    await voterProgram.provider.send(lostFundsTX, [userKeypair]);
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const result = await createAndFundWallet(provider.connection);
    newUserKeypair = result.keypair;
    const newUserWallet = result.wallet;
    console.log("fund new wallet");

    const [newEscrow, __bump] = deriveEscrow(
      locker,
      newUserWallet.publicKey,
      LOCKED_VOTER_PROGRAM_ID
    );

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    const chain_time = await getOnChainTime(provider.connection);
    console.log(
      `Chain time now: ${chain_time}, Escrow frozen request time: ${
        chain_time + freeze_normally
      }`
    );

    let freeze_ix = await voterProgram.methods
      .freezeEscrow(new BN(chain_time + freeze_normally))
      .accounts({
        escrow,
        owner: userKeypair.publicKey,
      })
      .instruction();

    let newEscrowIX = await voterProgram.methods
      .newEscrow()
      .accounts({
        escrow: newEscrow,
        escrowOwner: newUserWallet.publicKey,
        locker,
        payer: newUserWallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();
    let create_request_ix = await voterProgram.methods
      .createMoveRequest()
      .accounts({
        oldEscrow: escrow,
        newEscrow: newEscrow,
      })
      .instruction();

    let newRequestTx = new VersionedTransaction(
      new Transaction()
        .add(newEscrowIX)
        .add(freeze_ix)
        .add(create_request_ix)
        .compileMessage()
    );
    await voterProgram.provider.send(newRequestTx, [
      newUserKeypair,
      userKeypair,
    ]);

    console.log("Create new Move_Request is done");
  });
});
