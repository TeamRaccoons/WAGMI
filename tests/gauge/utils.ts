
import * as anchor from "@coral-xyz/anchor";
import { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, createMint, mintTo } from "@solana/spl-token";

import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Gauge } from "../../target/types/gauge";
import { Quarry } from "../../target/types/quarry";
import { Voter } from "../../target/types/voter";
import { expect } from "chai";

import {
    encodeU32,
    createMocAmm,
    getOrCreateATA
} from "../utils";
import { MocAmm } from "../../target/types/moc_amm";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const BN = anchor.BN;

export type GaugeVoter = IdlAccounts<Gauge>["gaugeVoter"];
export type GaugeState = IdlAccounts<Gauge>["gauge"];

export const DEFAULT_DECIMALS = 9;


export async function setVote(gauge: PublicKey,
    weight: number,
    owner: Keypair,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>) {
    let gaugeState =
        await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);

    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), gaugeFactoryState.locker.toBytes(), owner.publicKey.toBytes()],
        programVoter.programId
    );
    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeState.gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );

    const [gaugeVote, gaugeVoteBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVote"), gaugeVoter.toBuffer(), gauge.toBuffer()],
            programGauge.programId
        );

    await programGauge.methods
        .setVote(weight)
        .accounts({
            gaugeFactory: gaugeState.gaugeFactory,
            gauge,
            gaugeVoter,
            gaugeVote: gaugeVote,
            escrow,
            voteDelegate: owner.publicKey,
        }).signers([owner])
        .rpc();
}

export async function createQuarry(rewarder: PublicKey, adminKP: Keypair, programQuarry: Program<Quarry>): Promise<{
    quarry: PublicKey;
    ammPool: PublicKey;
    farmTokenMint: PublicKey;
}> {

    let farmTokenMint = await createMint(
        provider.connection,
        adminKP,
        adminKP.publicKey,
        null,
        DEFAULT_DECIMALS
    );

    let ammPool = await createMocAmm(30, farmTokenMint, adminKP);

    const [quarry, qBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("Quarry"), rewarder.toBuffer(), ammPool.toBuffer()],
            programQuarry.programId
        );
    await programQuarry.methods.createQuarry(0).accounts({
        quarry,
        auth: {
            admin: adminKP.publicKey,
            rewarder,
        },
        ammPool,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
    }).signers([adminKP]).rpc();
    return { quarry, farmTokenMint, ammPool }
}


export async function createQuarryFromAmm(ammPool: PublicKey, ammType: number, rewarder: PublicKey, adminKP: Keypair, programQuarry: Program<Quarry>): Promise<{
    quarry: PublicKey;
}> {
    const [quarry, qBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("Quarry"), rewarder.toBuffer(), ammPool.toBuffer()],
            programQuarry.programId
        );
    await programQuarry.methods.createQuarry(ammType).accounts({
        quarry,
        auth: {
            admin: adminKP.publicKey,
            rewarder,
        },
        ammPool,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
    }).signers([adminKP]).rpc();
    return { quarry }
}

export async function getEpochGaugeVoter(
    gauge: web3.PublicKey,
    owner: web3.PublicKey,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>,
): Promise<PublicKey> {
    let gaugeState =
        await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);

    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), gaugeFactoryState.locker.toBytes(), owner.toBytes()],
        programVoter.programId
    );
    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeState.gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );

    const [epochGaugeVoter, gaugeVoteBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("EpochGaugeVoter"), gaugeVoter.toBuffer()],
            programGauge.programId
        );

    return epochGaugeVoter;
}

export async function pumpEpochGauge(gauge: web3.PublicKey, programGauge: Program<Gauge>,) {
    let gaugeState =
        await programGauge.account.gauge.fetch(gauge);
    // pump epoch gauge
    await programGauge.methods.pumpGaugeEpoch().accounts({
        gaugeFactory: gaugeState.gaugeFactory,
        gauge,
        ammPool: gaugeState.ammPool,
        tokenAFee: gaugeState.tokenAFeeKey,
        tokenBFee: gaugeState.tokenBFeeKey,
    }).rpc();
}


export async function resetVote(
    gaugeFactory: web3.PublicKey,
    voterKP: web3.Keypair,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>,
) {

    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeFactory);

    let locker = gaugeFactoryState.locker;
    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );

    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );


    await programGauge.methods
        .resetVote()
        .accounts({
            gaugeFactory: gaugeFactory,
            locker,
            escrow,
            gaugeVoter,
        })
        .rpc();
}

export async function prepare(
    gaugeFactory: web3.PublicKey,
    voterKP: web3.Keypair,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>,
) {

    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeFactory);

    let locker = gaugeFactoryState.locker;
    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );

    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );


    await programGauge.methods
        .prepareVote()
        .accounts({
            gaugeFactory: gaugeFactory,
            locker,
            escrow,
            gaugeVoter,
            voteDelegate: voterKP.publicKey,
        })
        .signers([voterKP])
        .rpc();
}


export async function commit(
    gauge: web3.PublicKey,
    voterKP: web3.Keypair,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>,
) {
    let gaugeState =
        await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);
    const votingEpoch = gaugeFactoryState.currentVotingEpoch;

    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), gaugeFactoryState.locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );
    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeState.gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );
    const [gaugeVote, xBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVote"), gaugeVoter.toBuffer(), gauge.toBuffer()],
            programGauge.programId
        );

    await programGauge.methods
        .commitVote()
        .accounts({
            gaugeFactory: gaugeState.gaugeFactory,
            gauge,
            gaugeVoter,
            gaugeVote,
            escrow,
            voteDelegate: voterKP.publicKey,
        })
        .signers([voterKP])
        .rpc();
}

export async function getEpochGauge(
    gauge: web3.PublicKey,
    programGauge: Program<Gauge>,
): Promise<PublicKey> {
    const [epochGauge, gaugeVoteBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("EpochGauge"), gauge.toBuffer()],
            programGauge.programId
        );
    return epochGauge;
}

export async function syncGauge(
    gauge: web3.PublicKey,
    programGauge: Program<Gauge>,
    programQuarry: Program<Quarry>
) {
    let gaugeState =
        await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);

    if (gaugeState.isDisabled) {
        programGauge.methods.syncDisabledGauge().accounts({
            gauge,
            gaugeFactory: gaugeState.gaugeFactory,
            quarry: gaugeState.quarry,
            rewarder: gaugeFactoryState.rewarder,
            quarryProgram: programQuarry.programId,
        }).rpc();
        return;
    }

    await programGauge.methods
        .syncGauge()
        .accounts({
            gaugeFactory: gaugeState.gaugeFactory,
            gauge,
            quarry: gaugeState.quarry,
            rewarder: gaugeFactoryState.rewarder,
            quarryProgram: programQuarry.programId,
        })
        .rpc();
    return
}


export async function claimAFeeInVotingEpoch(
    gauge: web3.PublicKey,
    voterKP: Keypair,
    toEpoch: number,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>,
    programMocAmm: Program<MocAmm>,
) {
    let gaugeState =
        await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);
    let ammState = await programMocAmm.account.mocAmm.fetch(gaugeState.ammPool);

    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), gaugeFactoryState.locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );
    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeState.gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );

    const destTokenAccount = await getOrCreateATA(
        ammState.tokenAMint,
        voterKP.publicKey,
        voterKP,
        provider.connection
    );

    const [gaugeVote, xBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVote"), gaugeVoter.toBuffer(), gauge.toBuffer()],
            programGauge.programId
        );

    await programGauge.methods
        .claimGaugeFee(toEpoch)
        .accounts({
            gaugeFactory: gaugeState.gaugeFactory,
            gauge,
            gaugeVoter,
            gaugeVote,
            escrow,
            tokenAccount: ammState.tokenAFee,
            destTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            ammPool: gaugeState.ammPool,
            ammProgram: programMocAmm.programId,
            voteDelegate: voterKP.publicKey,
        }).signers([voterKP])
        .rpc();
}


export async function claimBFeeInVotingEpoch(
    gauge: web3.PublicKey,
    voterKP: Keypair,
    toEpoch: number,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>,
    programMocAmm: Program<MocAmm>,
) {
    let gaugeState =
        await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);
    let ammState = await programMocAmm.account.mocAmm.fetch(gaugeState.ammPool);

    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), gaugeFactoryState.locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );
    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeState.gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );

    const destTokenAccount = await getOrCreateATA(
        ammState.tokenBMint,
        voterKP.publicKey,
        voterKP,
        provider.connection
    );


    const [gaugeVote, xBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVote"), gaugeVoter.toBuffer(), gauge.toBuffer()],
            programGauge.programId
        );

    await programGauge.methods
        .claimGaugeFee(toEpoch)
        .accounts({
            gaugeFactory: gaugeState.gaugeFactory,
            gauge,
            gaugeVoter,
            gaugeVote,
            escrow,
            tokenAccount: ammState.tokenBFee,
            destTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            ammPool: gaugeState.ammPool,
            ammProgram: programMocAmm.programId,
            voteDelegate: voterKP.publicKey,
        }).signers([voterKP])
        .rpc();
}



export async function setupVoterAndLockAmount(
    locker: web3.PublicKey,
    voterKP: Keypair,
    lockAmount: number,
    programVoter: Program<Voter>,
): Promise<PublicKey> {
    let lockerState = await programVoter.account.locker.fetch(locker);

    // create voter escrow
    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );
    await programVoter.methods
        .newEscrow()
        .accounts({
            escrow,
            escrowOwner: voterKP.publicKey,
            locker,
            payer: provider.wallet.publicKey,
            systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

    const escrowTokens = await getOrCreateATA(
        lockerState.tokenMint,
        escrow,
        voterKP,
        provider.connection
    );

    let sourceTokens = await getOrCreateATA(
        lockerState.tokenMint,
        voterKP.publicKey,
        voterKP,
        provider.connection
    );

    await programVoter.methods.increaseLockedAmount(new BN(lockAmount)).accounts({
        locker,
        escrow,
        escrowTokens,
        sourceTokens,
        payer: voterKP.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([voterKP]).rpc();

    // for 10 days
    await programVoter.methods.extendLockDuration(new BN(10 * 24 * 60 * 60)).accounts({
        locker,
        escrow,
        escrowOwner: voterKP.publicKey,
    }).signers([voterKP]).rpc();



    return escrow;
}

export async function getOrCreateVoterGauge(gauge: PublicKey, voterKP: Keypair, programGauge: Program<Gauge>, programVoter: Program<Voter>): Promise<{
    gaugeVoter: PublicKey,
    gaugeVote: PublicKey,
}> {
    let gaugeState = await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState = await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);
    let [escrow, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), gaugeFactoryState.locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );
    // create gauge voter
    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeState.gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );
    let gaugeVoterState = await programGauge.account.gaugeVoter.fetchNullable(gaugeVoter);
    if (!gaugeVoterState) {
        await programGauge.methods
            .createGaugeVoter()
            .accounts({
                gaugeVoter,
                gaugeFactory: gaugeState.gaugeFactory,
                escrow: escrow,
                payer: provider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();
    }

    // create gauge vote
    const [gaugeVote, gaugeVoteBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVote"), gaugeVoter.toBuffer(), gauge.toBuffer()],
            programGauge.programId
        );
    let gaugeVoteState = await programGauge.account.gaugeVote.fetchNullable(gaugeVote);
    if (!gaugeVoteState) {
        await programGauge.methods
            .createGaugeVote()
            .accounts({
                gaugeVote,
                gaugeFactory: gaugeState.gaugeFactory,
                gaugeVoter,
                gauge,
                payer: provider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();
    }

    return {
        gaugeVoter, gaugeVote,
    }
}


export async function createBribe(
    gauge: PublicKey,
    briberKP: Keypair,
    bribeRewardsEpochEnd: number,
    rewardEachEpoch: number,
    programGauge: Program<Gauge>,
): Promise<{
    bribe: PublicKey,
    tokenMint: PublicKey,
}> {
    let gaugeState = await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState = await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);

    let [bribe, bBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Bribe"), gaugeState.gaugeFactory.toBytes(), encodeU32(gaugeFactoryState.bribeIndex)],
        programGauge.programId
    );

    let [tokenAccountVault, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("BribeVault"), bribe.toBytes()],
        programGauge.programId
    );

    let tokenMint = await createMint(
        provider.connection,
        briberKP,
        briberKP.publicKey,
        null,
        DEFAULT_DECIMALS
    );

    let tokenAccount = await getOrCreateATA(tokenMint, briberKP.publicKey, briberKP, provider.connection);
    // mint token to bribe
    await mintTo(
        provider.connection,
        briberKP,
        tokenMint,
        tokenAccount,
        briberKP.publicKey,
        rewardEachEpoch * (bribeRewardsEpochEnd + 1 - (gaugeFactoryState.currentVotingEpoch))
    );


    await programGauge.methods.createGaugeBribe(new BN(rewardEachEpoch), bribeRewardsEpochEnd).accounts({
        gaugeFactory: gaugeState.gaugeFactory,
        gauge,
        tokenMint,
        tokenAccountVault,
        tokenAccount,
        bribe,
        payer: briberKP.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([briberKP]).rpc();

    return {
        bribe,
        tokenMint
    };
}



export async function claimBribe(
    bribe: PublicKey,
    voterKP: Keypair,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>,
) {
    let bribeState = await programGauge.account.bribe.fetch(bribe);
    let gauge = bribeState.gauge;
    let gaugeState = await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState = await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);

    let [tokenAccountVault, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("BribeVault"), bribe.toBytes()],
        programGauge.programId
    );



    // let { gaugeVoter, gaugeVote } = await getOrCreateVoterGauge(gauge, voterKP, programGauge, programVoter);

    let tokenAccount = await getOrCreateATA(bribeState.tokenMint, voterKP.publicKey, voterKP, provider.connection);

    let [escrow, xBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), gaugeFactoryState.locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );


    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeState.gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );

    let [epochBribeVoter, bBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("EpochBribeVoter"), bribe.toBytes(), gaugeVoter.toBytes()],
        programGauge.programId
    );


    const [gaugeVote, gaugeVoteBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVote"), gaugeVoter.toBuffer(), gauge.toBuffer()],
            programGauge.programId
        );

    // TODO get or create epochBribeVoter

    let epochBribeVoterState = await programGauge.account.epochBribeVoter.fetchNullable(epochBribeVoter);

    if (!epochBribeVoterState) {
        await programGauge.methods.createEpochBribeVoter().accounts({
            bribe,
            epochBribeVoter,
            gaugeVoter,
            gaugeFactory: gaugeState.gaugeFactory,
            gauge,
            payer: programGauge.provider.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();
    }

    await programGauge.methods.claimGaugeBribe().accounts({
        bribe,
        epochBribeVoter,
        gaugeVoter,
        gaugeVote,
        escrow,
        gaugeFactory: gaugeState.gaugeFactory,
        gauge,
        tokenAccountVault,
        tokenAccount,
        voteDelegate: voterKP.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,

    }).signers([voterKP]).rpc();

    return;
}


export async function clawbackBribe(
    bribe: PublicKey,
    briberKP: Keypair,
    votingEpoch: number,
    programGauge: Program<Gauge>,
) {
    let bribeState = await programGauge.account.bribe.fetch(bribe);
    let gauge = bribeState.gauge;
    let gaugeState = await programGauge.account.gauge.fetch(gauge);

    let [tokenAccountVault, eBump] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("BribeVault"), bribe.toBytes()],
        programGauge.programId
    );

    let tokenAccount = await getOrCreateATA(bribeState.tokenMint, briberKP.publicKey, briberKP, provider.connection);

    await programGauge.methods.clawbackBribeGaugeEpoch(votingEpoch).accounts({
        bribe,
        gaugeFactory: gaugeState.gaugeFactory,
        gauge,
        briber: briberKP.publicKey,
        tokenAccountVault,
        tokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,

    }).signers([briberKP]).rpc();

    return;
}

export function getAllocatedPowerInEpochGaugeVoter(gaugeVoter: GaugeVoter, votingEpoch: number) {
    for (let i = 0; i < gaugeVoter.voteEpochs.length; i++) {
        if (gaugeVoter.voteEpochs[i].votingEpoch == votingEpoch) {
            return gaugeVoter.voteEpochs[i].allocatedPower;
        }
    }
    return new BN(0)
}

export function getFeeInEpochGauge(gauge: GaugeState, votingEpoch: number) {
    for (let i = 0; i < gauge.voteEpochs.length; i++) {
        if (gauge.voteEpochs[i].votingEpoch == votingEpoch) {
            return {
                tokenAFee: gauge.voteEpochs[i].tokenAFee,
                tokenBFee: gauge.voteEpochs[i].tokenBFee,
            };
        }
    }
    return {
        tokenAFee: new BN(0),
        tokenBFee: new BN(0),
    }
}

export async function assertEpochFee(gauge: PublicKey, programGauge: Program<Gauge>,) {
    // assert fee in gauge
    let gaugeState = await programGauge.account.gauge.fetch(gauge);
    let feeABalance = await provider.connection
        .getTokenAccountBalance((gaugeState).tokenAFeeKey);
    expect(gaugeState.cummulativeTokenAFee.toNumber()).equal(Number(feeABalance.value.amount) + gaugeState.cummulativeClaimedTokenAFee.toNumber());
    let feeBBalance = await provider.connection
        .getTokenAccountBalance((gaugeState).tokenBFeeKey);
    expect(gaugeState.cummulativeTokenBFee.toNumber()).equal(Number(feeBBalance.value.amount) + gaugeState.cummulativeClaimedTokenBFee.toNumber());

    // assert fee in epoch
    let gaugeFactoryState = await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);
    let votingEpoch = gaugeFactoryState.currentVotingEpoch;

    let totalEpochAFee = 0;
    let totalEpochBFee = 0;
    for (let i = 1; i <= votingEpoch; i++) {
        let gaugeFee = getFeeInEpochGauge(gaugeState, i)
        totalEpochAFee += gaugeFee.tokenAFee.toNumber();
        totalEpochBFee += gaugeFee.tokenBFee.toNumber();
    }

    expect(gaugeState.cummulativeTokenAFee.toNumber()).equal(totalEpochAFee);
    expect(gaugeState.cummulativeTokenBFee.toNumber()).equal(totalEpochBFee);

}