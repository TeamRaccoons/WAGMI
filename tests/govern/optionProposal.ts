import * as anchor from "@coral-xyz/anchor";
import { IdlAccounts, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { expect } from "chai";
import { Govern } from "../../target/types/govern";
import { SmartWallet } from "../../target/types/smart_wallet";
import {
  DEFAULT_GOVERNANCE_PARAMETERS,
  DEFAULT_VOTE_DELAY,
  DEFAULT_VOTE_PERIOD,
} from "./constants";

type Pubkey = anchor.web3.PublicKey;
const BN = anchor.BN;
type BN = anchor.BN;
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const smartWalletProgram = anchor.workspace.SmartWallet as Program<SmartWallet>;
const program = anchor.workspace.Govern as Program<Govern>;

type SmartWalletState = IdlAccounts<SmartWallet>["smartWallet"];
type GovernorState = IdlAccounts<Govern>["governor"];

describe("Govern", () => {
  const smartWalletBase = new anchor.web3.Keypair();
  const governBase = new anchor.web3.Keypair();
  const numOwners = 3;

  const maxOption = 8;

  const threshold = new anchor.BN(1);
  const delay = new anchor.BN(0);

  let smartWalletState: SmartWalletState;
  let smartWallet: Pubkey;
  let bump: Number;
  let governorState: GovernorState;
  let governor: Pubkey;
  let locker = anchor.web3.PublicKey.unique();
  before(async () => {
    // create smartwallet
    const [governorAddr, gBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("Governor"), governBase.publicKey.toBuffer()],
        program.programId
      );
    bump = gBump;

    const owners = [provider.wallet.publicKey, governorAddr];

    const [smartWalletAddr, sBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("SmartWallet"), smartWalletBase.publicKey.toBuffer()],
        smartWalletProgram.programId
      );
    smartWallet = smartWalletAddr;

    await smartWalletProgram.methods
      .createSmartWallet(numOwners, owners, threshold, delay)
      .accounts({
        base: smartWalletBase.publicKey,
        smartWallet,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([smartWalletBase])
      .rpc();
    smartWalletState = await smartWalletProgram.account.smartWallet.fetch(
      smartWallet
    );

    //create govern

    governor = governorAddr;
    await program.methods
      .createGovernor(locker, DEFAULT_GOVERNANCE_PARAMETERS)
      .accounts({
        base: governBase.publicKey,
        governor,
        smartWallet,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([governBase])
      .rpc();

    governorState = await program.account.governor.fetch(governor);
  });

  it("Governor was initialized", async () => {
    expect(governorState.bump).to.equal(bump);
    expect(governorState.proposalCount.toString()).to.eq("0");
    expect(governorState.params.votingDelay.toString()).eq(
      DEFAULT_VOTE_DELAY.toString()
    );
    expect(governorState.params.votingPeriod.toString()).eq(
      DEFAULT_VOTE_PERIOD.toString()
    );
  });

  describe("Option Proposal", () => {
    let proposalIndex: BN;
    let proposalKey: Pubkey;
    let proposalBump: number;

    beforeEach("create a proposal", async () => {
      governorState = await program.account.governor.fetch(governor);
      const index = governorState.proposalCount;
      const [proposal, bump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("Proposal"),
          governor.toBuffer(),
          index.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      await program.methods
        .createProposal(1, maxOption, DUMMY_INSTRUCTIONS)
        .accounts({
          governor: governor,
          proposal,
          smartWallet,
          proposer: provider.wallet.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      proposalIndex = index;
      proposalKey = proposal;
      proposalBump = bump;
    });

    it("Proposal as initialized", async () => {
      const proposalData = await program.account.proposal.fetch(proposalKey);
      expect(proposalData.bump).to.equal(proposalBump);
      expect(proposalData.index.toString()).to.equal(proposalIndex.toString());

      expect(proposalData.maxOption).to.equal(maxOption);

      expect(proposalData.canceledAt.toString()).to.equal("0");
      expect(proposalData.queuedAt.toString()).to.equal("0");
      expect(proposalData.activatedAt.toString()).to.equal("0");
      expect(proposalData.votingEndsAt.toString()).to.equal("0");
      expect(proposalData.quorumVotes.toString()).to.equal(
        governorState.params.quorumVotes.toString()
      );
      expect(proposalData.queuedTransaction.toString()).to.eq(
        anchor.web3.PublicKey.default.toString()
      );
      expect(proposalData.proposer.toString()).to.eq(
        provider.wallet.publicKey.toString()
      );
      expect(proposalData.governor.toString()).to.eq(governor.toString());
    });

    it("Cancel a proposal", async () => {
      await program.methods
        .cancelProposal()
        .accounts({
          governor,
          proposal: proposalKey,
          proposer: provider.wallet.publicKey,
        })
        .rpc();

      const proposalData = await program.account.proposal.fetch(proposalKey);
      expect(proposalData.canceledAt.toNumber()).to.greaterThan(0);
    });

    context("Proposal meta", () => {
      it("Cannot create proposal meta if not proposer", async () => {
        const fakeProposer = Keypair.generate();

        let optionDescriptions = [];
        for (let i = 0; i < maxOption; i++) {
          optionDescriptions.push("A cross-chain aggregator project");
        }

        const [proposalMetaKey, bump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("OptionProposalMeta"), proposalKey.toBuffer()],
            program.programId
          );

        const createMetaTX = program.methods
          .createOptionProposalMeta(0, optionDescriptions)
          .accounts({
            proposal: proposalKey,
            proposer: provider.wallet.publicKey,
            optionProposalMeta: proposalMetaKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([fakeProposer]);

        try {
          await createMetaTX.rpc();
        } catch (e) {
          const err = e as Error;
          console.log(err);
        }
      });

      it("Can create proposal meta", async () => {
        let optionDescriptions = [];
        for (let i = 0; i < maxOption; i++) {
          optionDescriptions.push(`A cross-chain aggregator project ${i}`);
        }

        const [proposalMetaKey, bump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("OptionProposalMeta"), proposalKey.toBuffer()],
            program.programId
          );

        const createMetaTX = await program.methods
          .createOptionProposalMeta(0, optionDescriptions)
          .accounts({
            proposal: proposalKey,
            proposer: provider.wallet.publicKey,
            optionProposalMeta: proposalMetaKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const metadata = await program.account.optionProposalMeta.fetch(
          proposalMetaKey
        );
        for (let i = 0; i < maxOption; i++) {
          expect(optionDescriptions[i]).to.be.equal(metadata.optionDescriptions[i]);
        }
        expect(metadata.proposal.toString()).to.equal(proposalKey.toString());
      });
    });
  });
});

const DUMMY_INSTRUCTIONS = [
  Keypair.generate().publicKey,
  Keypair.generate().publicKey,
  Keypair.generate().publicKey,
].map(
  (pid) =>
    new TransactionInstruction({
      programId: pid,
      keys: [],
    })
);
