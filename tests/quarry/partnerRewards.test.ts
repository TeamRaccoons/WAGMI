import * as anchor from "@coral-xyz/anchor";
import { Program, web3, Wallet, BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, createMint, setAuthority, AuthorityType, getMint, mintTo } from "@solana/spl-token";

import {
    PublicKey,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect } from "chai";
import {
    createAndFundWallet,
    createMocAmm,
    getOrCreateATA,
    sleep,
    setupTokenMintAndMinter,
    encodeU64,
} from "../utils";

import { Quarry } from "../../target/types/quarry";
import { Minter } from "../../target/types/minter";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.Quarry as Program<Quarry>;
const programMinter = anchor.workspace.Minter as Program<Minter>;

export const DEFAULT_DECIMALS = 9;
export const DEFAULT_HARD_CAP = 1_000_000_000_000_000;

describe("Partner Rewards", () => {
    const dailyRewardsRate = new BN(1_000 * LAMPORTS_PER_SOL);
    const annualRewardsRate = dailyRewardsRate.mul(new BN(365));

    const stakeAmount = 1_000_000000;

    let adminKP: web3.Keypair;
    let wallet: Wallet;
    let stakeTokenMint: PublicKey;
    let ammPool: PublicKey;
    let stakedMintAuthority: anchor.web3.Keypair;
    let rewardIndex = 1;
    let rewardDuration = new BN(5);
    let funder = web3.Keypair.generate();
    let rewardMint: PublicKey;
    let rewardVault: PublicKey;

    before(async () => {
        const result = await createAndFundWallet(provider.connection);
        adminKP = result.keypair;
        wallet = result.wallet;
        // create mint
        stakedMintAuthority = web3.Keypair.generate();
        stakeTokenMint = await createMint(
            provider.connection,
            adminKP,
            stakedMintAuthority.publicKey,
            null,
            DEFAULT_DECIMALS
        );
        ammPool = await createMocAmm(10, stakeTokenMint, adminKP);
    });

    let rewardsMint: PublicKey;
    let mintWrapperKey: PublicKey;
    let minterBase: web3.Keypair;

    beforeEach("Initialize minter", async () => {
        minterBase = new anchor.web3.Keypair();

        let minterResult = await setupTokenMintAndMinter(minterBase, adminKP, DEFAULT_DECIMALS, DEFAULT_HARD_CAP);
        rewardsMint = minterResult.rewardsMint;
        mintWrapperKey = minterResult.mintWrapper;
    });

    let rewarderKey: PublicKey;
    beforeEach("Set up rewarder", async () => {
        let rewarderBaseKP = new anchor.web3.Keypair();
        let rewarderBase = rewarderBaseKP.publicKey;
        const [rewarder, sBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [Buffer.from("Rewarder"), rewarderBase.toBuffer()],
                program.programId
            );
        await program.methods.newRewarder().accounts({
            base: rewarderBase,
            rewarder,
            admin: adminKP.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
            mintWrapper: mintWrapperKey,
            rewardsTokenMint: rewardsMint,
        }).signers([rewarderBaseKP, adminKP]).rpc();
        rewarderKey = rewarder;

        const rewarderState = await program.account.rewarder.fetch(rewarderKey);
        expect(rewarderState.rewardsTokenMint).to.deep.equal(rewardsMint);

        await program.methods.setAnnualRewards(annualRewardsRate).accounts({
            auth: {
                admin: adminKP.publicKey,
                rewarder: rewarderKey,
            }
        }).signers([adminKP]).rpc();

        // whitelist rewarder
        const [minter, mBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [Buffer.from("MintWrapperMinter"), mintWrapperKey.toBuffer(), rewarderKey.toBuffer()],
                programMinter.programId
            );
        await programMinter.methods
            .newMinter()
            .accounts({
                auth: {
                    mintWrapper: mintWrapperKey,
                    admin: adminKP.publicKey,
                },
                minterAuthority: rewarderKey,
                minter,
                payer: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            }).signers([adminKP])
            .rpc();
        // set allowance
        const allowance = 100_000_000_000_000;
        await programMinter.methods
            .minterUpdate(new BN(allowance))
            .accounts({
                auth: {
                    mintWrapper: mintWrapperKey,
                    admin: adminKP.publicKey,
                },
                minter,
            }).signers([adminKP])
            .rpc();
    });

    let quarryKey: PublicKey;
    let minerKey: PublicKey;

    beforeEach("Set up quarry and miner", async () => {
        const [quarry, sBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPool.toBuffer()],
                program.programId
            );
        quarryKey = quarry;
        await program.methods.createQuarry(new BN(0)).accounts({
            quarry,
            auth: {
                admin: adminKP.publicKey,
                rewarder: rewarderKey,
            },
            ammPool,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).signers([adminKP]).rpc();
        // mint test tokens
        let userStakeTokenAccount = await getOrCreateATA(
            stakeTokenMint,
            provider.wallet.publicKey,
            adminKP,
            provider.connection
        );

        await mintTo(
            provider.connection,
            adminKP,
            stakeTokenMint,
            userStakeTokenAccount,
            stakedMintAuthority,
            stakeAmount
        );
        await program.methods.setRewardsShare(new BN(100)).accounts({
            quarry,
            authority: adminKP.publicKey,
            rewarder: rewarderKey,
        }).signers([adminKP]).rpc();

        const [miner, mbump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [Buffer.from("Miner"), quarry.toBuffer(), provider.wallet.publicKey.toBuffer()],
                program.programId
            );
        minerKey = miner;

        const [minerVault, bump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [Buffer.from("MinerVault"), minerKey.toBuffer()],
                program.programId
            );

        await program.methods.createMiner().accounts({
            authority: provider.wallet.publicKey,
            miner,
            quarry,
            rewarder: rewarderKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
            tokenMint: stakeTokenMint,
            minerVault,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc();
    });


    beforeEach("Init new reward", async () => {
        const [rewardVaultAddr, rewardVaultBump] =
            anchor.web3.PublicKey.findProgramAddressSync(
                [quarryKey.toBuffer(), encodeU64(rewardIndex)],
                program.programId
            );
        rewardVault = rewardVaultAddr
        // init reward
        let rewardMintAddr = await createMint(
            provider.connection,
            adminKP,
            wallet.publicKey,
            null,
            DEFAULT_DECIMALS,
            web3.Keypair.generate(),
            null,
            TOKEN_PROGRAM_ID
        );

        rewardMint = rewardMintAddr;

        await program.methods.initializeNewReward(new BN(rewardIndex), rewardDuration, funder.publicKey).accounts({
            quarry: quarryKey,
            rewardVault,
            rewardMint,
            auth: {
                admin: adminKP.publicKey,
                rewarder: rewarderKey,
            },
            payer: adminKP.publicKey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([adminKP]).rpc();

        // admin fund reward
        let fundingAmount = 10000;
        // mint to admin
        let funderTokenAccount = await getOrCreateATA(
            rewardMint,
            adminKP.publicKey,
            adminKP,
            provider.connection
        );
        await mintTo(
            provider.connection,
            adminKP,
            rewardMint,
            funderTokenAccount,
            adminKP,
            fundingAmount
        );

        await program.methods.fundReward(new BN(rewardIndex), new BN(fundingAmount)).accounts({
            quarry: quarryKey,
            rewardVault,
            funderTokenAccount,
            funder: adminKP.publicKey,
            rewarder: rewarderKey,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([adminKP]).rpc();

        let quarryState = await program.account.quarry.fetch(quarryKey);
        const rewardInfo = quarryState.rewardInfos[rewardIndex];
        expect(rewardInfo.rewardDurationEnd.toNumber()).to.be.greaterThan(0);
        expect(rewardInfo.rewardRate.toString()).not.to.equal("0");
        expect(rewardInfo.lastUpdateTime.toNumber()).to.be.greaterThan(0);
    })
    describe("Happy path", () => {
        it("Correct state", async () => {
            let quarryState = await program.account.quarry.fetch(quarryKey);
            const rewardInfo = quarryState.rewardInfos[rewardIndex];
            expect(rewardInfo.rewardDuration.toNumber()).to.deep.equal(rewardDuration.toNumber());
            expect(rewardInfo.funder.toString()).to.deep.equal(funder.publicKey.toString());
            expect(rewardInfo.mint.toString()).to.deep.equal(rewardMint.toString());
        })

        it("Funder fund reward", async () => {
            let fundingAmount = 10000;
            // mint to funder
            let funderTokenAccount = await getOrCreateATA(
                rewardMint,
                funder.publicKey,
                adminKP,
                provider.connection
            );
            await mintTo(
                provider.connection,
                adminKP,
                rewardMint,
                funderTokenAccount,
                adminKP,
                fundingAmount
            );

            await program.methods.fundReward(new BN(rewardIndex), new BN(fundingAmount)).accounts({
                quarry: quarryKey,
                rewardVault,
                funderTokenAccount,
                funder: funder.publicKey,
                rewarder: rewarderKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            }).signers([funder]).rpc();

            let quarryState = await program.account.quarry.fetch(quarryKey);
            const rewardInfo = quarryState.rewardInfos[rewardIndex];
            expect(rewardInfo.rewardDurationEnd.toNumber()).to.be.greaterThan(0);
            expect(rewardInfo.rewardRate.toString()).not.to.equal("0");
            expect(rewardInfo.lastUpdateTime.toNumber()).to.be.greaterThan(0);
        })
        it("User claim", async () => {
            // stake
            let userStakeTokenAccount = await getOrCreateATA(
                stakeTokenMint,
                provider.wallet.publicKey,
                adminKP,
                provider.connection
            );
            const [minerVault, bump] =
                await anchor.web3.PublicKey.findProgramAddress(
                    [Buffer.from("MinerVault"), minerKey.toBuffer()],
                    program.programId
                );
            await program.methods.stakeTokens(new BN(stakeAmount)).accounts({
                authority: provider.wallet.publicKey,
                miner: minerKey,
                quarry: quarryKey,
                minerVault,
                tokenAccount: userStakeTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                rewarder: rewarderKey,
            }).rpc();
            // wait some time so we can earn some tokens
            await sleep(3_000);

            let rewardsTokenAccount = await getOrCreateATA(
                rewardMint,
                provider.wallet.publicKey,
                adminKP,
                provider.connection
            );
            let balanceBefore = await program.provider.connection
                .getTokenAccountBalance(rewardsTokenAccount)
                .then((e) => new BN(e.value.amount));
            // claim
            await program.methods.claimPartnerRewards(new BN(rewardIndex)).accounts({
                quarry: quarryKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                rewardVault,
                miner: minerKey,
                rewardsTokenAccount,
                rewarder: rewarderKey,
                authority: provider.wallet.publicKey,
            }).rpc();

            let balanceAfter = await program.provider.connection
                .getTokenAccountBalance(rewardsTokenAccount)
                .then((e) => new BN(e.value.amount));

            expect(balanceAfter.gt(balanceBefore)).to.be.true;

            // reward pending must be zero
            let minerState = await program.account.miner.fetch(minerKey);
            expect(minerState.rewardInfos[rewardIndex].rewardPending.toNumber()).to.be.equal(0);

        })

        it("Update reward funder", async () => {
            let newFunder = web3.Keypair.generate();
            await program.methods.updateRewardFunder(new BN(rewardIndex), newFunder.publicKey).accounts({
                quarry: quarryKey,
                auth: {
                    rewarder: rewarderKey,
                    admin: adminKP.publicKey,
                }
            }).signers([adminKP]).rpc();
            let quarryState = await program.account.quarry.fetch(quarryKey);
            const rewardInfo = quarryState.rewardInfos[rewardIndex];
            expect(rewardInfo.funder.toString()).to.be.equal(newFunder.publicKey.toString());
        })
        it("Update reward duration", async () => {
            // wait until farming is end
            await sleep((rewardDuration.toNumber() + 1) * 1000);
            let newDuration = new BN(3);
            await program.methods.updateRewardDuration(new BN(rewardIndex), newDuration).accounts({
                quarry: quarryKey,
                auth: {
                    rewarder: rewarderKey,
                    admin: adminKP.publicKey,
                }
            }).signers([adminKP]).rpc();

            let quarryState = await program.account.quarry.fetch(quarryKey);
            const rewardInfo = quarryState.rewardInfos[rewardIndex];
            expect(rewardInfo.rewardDuration.toNumber()).to.be.equal(newDuration.toNumber());
        })
    })
});
