import * as anchor from "@coral-xyz/anchor";
import { BN, Wallet, web3 } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, createMint, mintTo } from "@solana/spl-token";
import {
    GOVERN_PROGRAM_ID,
    IProposalInstruction,
    SMART_WALLET_PROGRAM_ID,
    LOCKED_VOTER_PROGRAM_ID,
    VoteSide,
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
    deriveVote,
    getOnChainTime,
    getOrCreateATA,
    getOrCreateVote,
    invokeAndAssertError,
    sleep,
    deriveTransaction,
} from "../utils";
import { assert, expect } from "chai";

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

    let votingRewardMint: web3.PublicKey;

    // Smart wallet config
    let smartWalletOwners: web3.PublicKey[] = [];
    let smartWalletThreshold: BN = new BN(1);

    // Govern config
    const votingPeriod: BN = new BN(5); // 10 seconds duration of voting on proposal
    const quorumVotes: BN = new BN(2); // 2 vote to pass

    // Voter config
    const maxStakeDuration: BN = new BN(20); // 20 seconds
    const minStakeDuration: BN = new BN(10); // 10 seconds
    const maxStakeVoteMultiplier: number = 1;
    const proposalActivationMinVotes: BN = new BN(2); // min 2 vote to activate proposal

    const rewardPerProposal = new BN(100000);

    async function createSetLockerParamsProposal() {
        const governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);
        const voterProgram = createLockedVoterProgram(wallet, LOCKED_VOTER_PROGRAM_ID);
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
        const voterProgram = createLockedVoterProgram(wallet, LOCKED_VOTER_PROGRAM_ID);
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

        const [lockerPda, lBump] = deriveLocker(keypair.publicKey, LOCKED_VOTER_PROGRAM_ID);
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
            LOCKED_VOTER_PROGRAM_ID,
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



        console.log("Set voting reward");
        // create reward mint
        votingRewardMint = await createMint(
            provider.connection,
            keypair,
            keypair.publicKey,
            null,
            9
        );

        // set voting reward
        const governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);

        const ixData = governProgram.coder.instruction.encode(
            "set_voting_reward",
            {
                rewardPerProposal: rewardPerProposal,
            }
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

        const setVotingRewardIx = {
            programId: GOVERN_PROGRAM_ID,
            data: ixData,
            keys: [
                {
                    isSigner: false,
                    isWritable: true,
                    pubkey: govern,
                },
                {
                    isSigner: false,
                    isWritable: false,
                    pubkey: votingRewardMint,
                },
                {
                    isSigner: true,
                    isWritable: false,
                    pubkey: smartWallet,
                },
            ],
        };

        await smartWalletProgram.methods
            .createTransaction(txBump, [setVotingRewardIx])
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
                    pubkey: GOVERN_PROGRAM_ID,
                },
                ...setVotingRewardIx.keys.map((x) => {
                    return {
                        ...x,
                        isSigner: false, // Need to override to false as these are signed by the smart wallet
                    };
                }),
            ])
            .rpc();


        const governorState = await governProgram.account.governor.fetch(govern);
        const votingReward = governorState.votingReward;
        expect(votingReward.rewardMint.toString()).to.be.equal(votingRewardMint.toString());
        expect(votingReward.rewardPerProposal.toNumber()).to.be.equal(rewardPerProposal.toNumber());

        // transfer to reward vault
        const rewardVault = await getOrCreateATA(
            votingRewardMint,
            govern,
            keypair,
            provider.connection
        );

        await mintTo(
            provider.connection,
            keypair,
            votingRewardMint,
            rewardVault,
            keypair.publicKey,
            rewardPerProposal.toNumber()
        );

        proposal = await createSetLockerParamsProposal();
        await initializeLocker();
    })

    it("users initialize new escrow and lock token", async () => {
        for (const keypair of userKeypairs) {
            const wallet = new Wallet(keypair);
            const voterProgram = createLockedVoterProgram(wallet, LOCKED_VOTER_PROGRAM_ID);
            const [escrow, _bump] = deriveEscrow(locker, wallet.publicKey, LOCKED_VOTER_PROGRAM_ID);

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

            await voterProgram.methods
                .extendLockDuration(maxStakeDuration)
                .accounts({
                    escrow,
                    escrowOwner: wallet.publicKey,
                    locker,
                })
                .rpc();
        }
    });


    it("protocol team activates proposal", async () => {
        const voterProgram = createLockedVoterProgram(wallet, LOCKED_VOTER_PROGRAM_ID);

        const ixData = voterProgram.coder.instruction.encode(
            "activate_proposal",
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
            programId: LOCKED_VOTER_PROGRAM_ID,
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
                    pubkey: LOCKED_VOTER_PROGRAM_ID,
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


    it("users cast for proposal and claim reward", async () => {
        console.log("cast vote");
        for (const keypair of userKeypairs) {
            const wallet = new Wallet(keypair);
            const voterProgram = createLockedVoterProgram(wallet, LOCKED_VOTER_PROGRAM_ID);
            const governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);
            const [escrow, _eBump] = deriveEscrow(locker, wallet.publicKey, LOCKED_VOTER_PROGRAM_ID);
            const vote = await getOrCreateVote(proposal, governProgram);
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
        }
        console.log("wait until proposal passed");
        let governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);
        while (true) {
            const [proposalState, onchainTimestamp] = await Promise.all([
                governProgram.account.proposal.fetch(proposal),
                getOnChainTime(provider.connection),
            ]);

            if (proposalState.votingEndsAt.toNumber() > onchainTimestamp) {
                console.log(
                    `${proposalState.votingEndsAt.toNumber() - onchainTimestamp
                    } seconds until proposal pass`
                );
                await sleep(1000);
            } else {
                break;
            }
        }
        console.log("Claim reward");
        for (const keypair of userKeypairs) {
            const wallet = new Wallet(keypair);
            const governProgram = createGovernProgram(wallet, GOVERN_PROGRAM_ID);
            const vote = await getOrCreateVote(proposal, governProgram);
            const governorState = await governProgram.account.governor.fetch(govern);
            const votingReward = governorState.votingReward;
            const voterTokenAccount = await getOrCreateATA(
                votingReward.rewardMint,
                keypair.publicKey,
                keypair,
                provider.connection
            );

            const voterBeforeBalance = await provider.connection
                .getTokenAccountBalance(voterTokenAccount)
                .then((b) => b.value.amount);


            await governProgram.methods
                .claimReward()
                .accounts({
                    governor: govern,
                    rewardVault: votingReward.rewardVault,
                    proposal,
                    vote,
                    voter: wallet.publicKey,
                    voterTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            const voterAfterBalance = await provider.connection
                .getTokenAccountBalance(voterTokenAccount)
                .then((b) => b.value.amount);

            expect(+voterAfterBalance).to.be.greaterThan(+voterBeforeBalance);
        }

        const proposalState = await governProgram.account.proposal.fetch(proposal);
        expect(proposalState.totalClaimedReward.toNumber() + 2).to.be.equal(rewardPerProposal.toNumber()); // precision loss
    });
});
