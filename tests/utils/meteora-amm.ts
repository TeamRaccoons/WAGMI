import { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Vault } from "../deps/types/vault";
import { Amm } from "../deps/types/amm";
import vaultIdl from "../deps/idl/vault.json";
import ammIdl from "../deps/idl/amm.json";
import { MintLayout, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ConstantProduct, Stable } from "./curve";
import { Gauge } from "../../target/types/gauge";
import { Quarry } from "../../target/types/quarry";
import { Voter } from "../../target/types/voter";
import { encodeU32, getOrCreateATA } from "./helper";

const { PublicKey } = anchor.web3;
export const PUBLIC_KEY = 0;

export const vaultProgram = new Program(
    // @ts-ignore
    vaultIdl,
    new anchor.web3.PublicKey("24Uqj9JCLxUeoC3hGfh5W3s9FM9uCHDS2SG3LYwBpyTi"),
    anchor.getProvider()
) as Program<Vault>;

export const meteoraAmmProgram = new Program(
    // @ts-ignore
    ammIdl,
    new anchor.web3.PublicKey("Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"),
    anchor.getProvider()
) as Program<Amm>;

export const FEE_OWNER = new PublicKey(
    "6WaLrrRfReGKBYUSkmx2K6AuT21ida4j8at2SUiZdXu8"
);
export const CONSTANT_PRODUCT_ALLOWED_TRADE_BPS = [25, 30, 100, 400, 600];
export const CONSTANT_PRODUCT_DEFAULT_TRADE_BPS = 25;
export const STABLE_SWAP_DEFAULT_TRADE_BPS = 1;

interface IInitializePermissionlessPoolParams {
    aVault: anchor.web3.PublicKey;
    bVault: anchor.web3.PublicKey;
    aDepositAmount: anchor.BN;
    bDepositAmount: anchor.BN;
    curve: ConstantProduct | Stable;
    userKeypair: anchor.web3.Keypair;
    ammProgram: Program<Amm>;
    vaultProgram: Program<Vault>;
    adminLpMint?: anchor.web3.PublicKey;
}

interface ISetupVaultParams {
    tokenMint: anchor.web3.PublicKey;
    vaultProgram: Program<Vault>;
    adminKeypair: anchor.web3.Keypair;
}

export const getVaultBase = (allowedRebalance: boolean) => {
    return allowedRebalance
        ? new anchor.web3.PublicKey("HWzXGcGHy4tcpYfaRDCyLNzXqBTv3E6BttpCH2vJxArv")
        : anchor.web3.PublicKey.default;
};


export const getVaultPdas = async (
    tokenMint: anchor.web3.PublicKey,
    base: anchor.web3.PublicKey,
    vaultProgram: Program<Vault>
) => {
    const vaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), tokenMint.toBuffer(), base.toBuffer()],
        vaultProgram.programId
    );

    const tokenVaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), vaultPda[PUBLIC_KEY].toBuffer()],
        vaultProgram.programId
    );

    const lpMintPda = PublicKey.findProgramAddressSync(
        [Buffer.from("lp_mint"), vaultPda[0].toBuffer()],
        vaultProgram.programId
    );

    return {
        vaultPda,
        tokenVaultPda,
        lpMintPda,
    };
};

export const setupNonRebalanceVault = async (
    setupVaultParams: ISetupVaultParams
): Promise<anchor.web3.PublicKey> => {
    const { SYSVAR_RENT_PUBKEY, SystemProgram } = anchor.web3;

    const { tokenMint, vaultProgram, adminKeypair } = setupVaultParams;

    const vaultBase = getVaultBase(false);

    const admin = adminKeypair.publicKey;

    const { vaultPda, tokenVaultPda, lpMintPda } = await getVaultPdas(
        tokenMint,
        vaultBase,
        vaultProgram
    );

    await vaultProgram.methods
        .initializeIdleVault()
        .accounts({
            vault: vaultPda[PUBLIC_KEY],
            tokenVault: tokenVaultPda[PUBLIC_KEY],
            tokenMint,
            payer: admin,
            lpMint: lpMintPda[PUBLIC_KEY],
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([adminKeypair])
        .rpc();

    return vaultPda[PUBLIC_KEY];
};

export const setupVault = async (
    setupVaultParams: ISetupVaultParams
): Promise<anchor.web3.PublicKey> => {
    const { SYSVAR_RENT_PUBKEY, SystemProgram } = anchor.web3;

    const { tokenMint, vaultProgram, adminKeypair } = setupVaultParams;

    const vaultBase = getVaultBase(true);

    const admin = adminKeypair.publicKey;

    const { vaultPda, tokenVaultPda, lpMintPda } = await getVaultPdas(
        tokenMint,
        vaultBase,
        vaultProgram
    );

    await vaultProgram.methods
        .initialize()
        .accounts({
            vault: vaultPda[PUBLIC_KEY],
            tokenVault: tokenVaultPda[PUBLIC_KEY],
            tokenMint,
            payer: admin,
            lpMint: lpMintPda[PUBLIC_KEY],
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([adminKeypair])
        .rpc();

    return vaultPda[PUBLIC_KEY];
};




function encodeCurveType(curve: Stable | ConstantProduct) {
    if (curve["constantProduct"]) {
        return 0;
    } else if (curve["stable"]) {
        return 1;
    } else {
        throw new Error("Unknown curve type");
    }
}
function getSecondKey(
    key1: anchor.web3.PublicKey,
    key2: anchor.web3.PublicKey
) {
    const buf1 = key1.toBuffer();
    const buf2 = key2.toBuffer();
    // Buf1 > buf2
    if (Buffer.compare(buf1, buf2) == 1) {
        return buf2;
    }
    return buf1;
}

function getFirstKey(key1: anchor.web3.PublicKey, key2: anchor.web3.PublicKey) {
    const buf1 = key1.toBuffer();
    const buf2 = key2.toBuffer();
    // Buf1 > buf2
    if (Buffer.compare(buf1, buf2) == 1) {
        return buf1;
    }
    return buf2;
}

export const getPoolPdas = (
    poolPubkey: anchor.web3.PublicKey,
    aVault: anchor.web3.PublicKey,
    bVault: anchor.web3.PublicKey,
    ammProgram: Program<Amm>
) => {
    const aVaultLpPda = PublicKey.findProgramAddressSync(
        [aVault.toBuffer(), poolPubkey.toBuffer()],
        ammProgram.programId
    );
    const bVaultLpPda = PublicKey.findProgramAddressSync(
        [bVault.toBuffer(), poolPubkey.toBuffer()],
        ammProgram.programId
    );

    return {
        aVaultLpPda,
        bVaultLpPda,
    };
};

export const getOrCreateAssociatedTokenAccount = async (
    tokenMint: anchor.web3.PublicKey,
    owner: anchor.web3.PublicKey,
    payer: anchor.web3.Keypair,
    program: Program<Amm>
) => {
    const toAccount = await getAssociatedTokenAddress(
        tokenMint,
        owner,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const account = await program.provider.connection.getAccountInfo(toAccount);
    if (!account) {
        const tx = new anchor.web3.Transaction().add(
            createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                tokenMint,
                toAccount,
                owner,
                payer.publicKey
            )
        );

        const signature = await program.provider.connection.sendTransaction(tx, [
            payer,
        ]);
        await program.provider.connection.confirmTransaction(signature);

        return getAssociatedTokenAddress(
            tokenMint,
            owner,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );
    }
    return toAccount;
};


export const getAdminFeeTokenPDA = (
    tokenA: anchor.web3.PublicKey,
    tokenB: anchor.web3.PublicKey,
    poolPubkey: anchor.web3.PublicKey,
    ammProgram: Program<Amm>
) => {
    const feeTokenA = PublicKey.findProgramAddressSync(
        [Buffer.from("fee"), tokenA.toBuffer(), poolPubkey.toBuffer()],
        ammProgram.programId
    )[0];

    const feeTokenB = PublicKey.findProgramAddressSync(
        [Buffer.from("fee"), tokenB.toBuffer(), poolPubkey.toBuffer()],
        ammProgram.programId
    )[0];

    return [feeTokenA, feeTokenB];
};

export const initializePermissionlessPool = async (
    initializePoolParam: IInitializePermissionlessPoolParams
): Promise<anchor.web3.PublicKey> => {
    const {
        aVault,
        bVault,
        ammProgram,
        vaultProgram,
        userKeypair,
        curve,
        aDepositAmount,
        bDepositAmount,
    } = initializePoolParam;

    const [aVaultAccount, bVaultAccount] = await Promise.all([
        vaultProgram.account.vault.fetch(aVault),
        vaultProgram.account.vault.fetch(bVault),
    ]);

    const [poolPubkey, _poolPubkeyBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from([encodeCurveType(curve)]),
                getFirstKey(aVaultAccount.tokenMint, bVaultAccount.tokenMint),
                getSecondKey(aVaultAccount.tokenMint, bVaultAccount.tokenMint),
            ],
            ammProgram.programId
        );

    const [poolLpMint, _poolLpMintBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("lp_mint"), poolPubkey.toBuffer()],
            ammProgram.programId
        );

    const { aVaultLpPda, bVaultLpPda } = getPoolPdas(
        poolPubkey,
        aVault,
        bVault,
        ammProgram
    );

    const payerPoolLp = await getAssociatedTokenAddress(
        poolLpMint,
        userKeypair.publicKey,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const [userTokenA, userTokenB] = await Promise.all([
        getOrCreateAssociatedTokenAccount(
            aVaultAccount.tokenMint,
            userKeypair.publicKey,
            userKeypair,
            ammProgram
        ),
        getOrCreateAssociatedTokenAccount(
            bVaultAccount.tokenMint,
            userKeypair.publicKey,
            userKeypair,
            ammProgram
        ),
    ]);

    const [adminTokenAFee, adminTokenBFee] = getAdminFeeTokenPDA(
        aVaultAccount.tokenMint,
        bVaultAccount.tokenMint,
        poolPubkey,
        ammProgram
    );

    const setComputeUnitLimitIx =
        anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
            units: 1_400_000,
        });

    await ammProgram.methods
        .initializePermissionlessPool(curve as any, aDepositAmount, bDepositAmount)
        .accounts({
            pool: poolPubkey,
            tokenAMint: aVaultAccount.tokenMint,
            tokenBMint: bVaultAccount.tokenMint,
            aVault,
            bVault,
            aVaultLpMint: aVaultAccount.lpMint,
            bVaultLpMint: bVaultAccount.lpMint,
            aVaultLp: aVaultLpPda[PUBLIC_KEY],
            bVaultLp: bVaultLpPda[PUBLIC_KEY],
            lpMint: poolLpMint,
            payerTokenA: userTokenA,
            payerTokenB: userTokenB,
            adminTokenAFee,
            adminTokenBFee,
            payerPoolLp: payerPoolLp,
            aTokenVault: aVaultAccount.tokenVault,
            bTokenVault: bVaultAccount.tokenVault,
            feeOwner: FEE_OWNER,
            payer: userKeypair.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            vaultProgram: vaultProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .preInstructions([setComputeUnitLimitIx])
        .signers([userKeypair])
        .rpc();

    return poolPubkey;
};

interface IInitializePermissionlessPoolParamsWithFeeTier
    extends IInitializePermissionlessPoolParams {
    tradeFeeBps: anchor.BN;
}

function getTradeFeeBpsBuffer(
    curveType: ConstantProduct | Stable,
    tradeFeeBps: anchor.BN
) {
    let defaultFeeBps: anchor.BN;
    if (curveType["stable"]) {
        defaultFeeBps = new anchor.BN(STABLE_SWAP_DEFAULT_TRADE_BPS);
    } else {
        defaultFeeBps = new anchor.BN(CONSTANT_PRODUCT_DEFAULT_TRADE_BPS);
    }

    if (tradeFeeBps.eq(defaultFeeBps)) {
        return new Uint8Array();
    }

    return new Uint8Array(tradeFeeBps.toBuffer("le", 8));
}

export const initializePermissionlessPoolWithFeeTier = async (
    initializePoolParam: IInitializePermissionlessPoolParamsWithFeeTier
): Promise<anchor.web3.PublicKey> => {
    const {
        aVault,
        bVault,
        ammProgram,
        vaultProgram,
        userKeypair,
        curve,
        aDepositAmount,
        bDepositAmount,
        tradeFeeBps,
    } = initializePoolParam;

    const [aVaultAccount, bVaultAccount] = await Promise.all([
        vaultProgram.account.vault.fetch(aVault),
        vaultProgram.account.vault.fetch(bVault),
    ]);

    const [poolPubkey, _poolPubkeyBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from([encodeCurveType(curve)]),
                getFirstKey(aVaultAccount.tokenMint, bVaultAccount.tokenMint),
                getSecondKey(aVaultAccount.tokenMint, bVaultAccount.tokenMint),
                getTradeFeeBpsBuffer(curve, tradeFeeBps),
            ],
            ammProgram.programId
        );

    const [poolLpMint, _poolLpMintBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("lp_mint"), poolPubkey.toBuffer()],
            ammProgram.programId
        );

    const { aVaultLpPda, bVaultLpPda } = getPoolPdas(
        poolPubkey,
        aVault,
        bVault,
        ammProgram
    );

    const payerPoolLp = await getAssociatedTokenAddress(
        poolLpMint,
        userKeypair.publicKey,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const [userTokenA, userTokenB] = await Promise.all([
        getOrCreateAssociatedTokenAccount(
            aVaultAccount.tokenMint,
            userKeypair.publicKey,
            userKeypair,
            ammProgram
        ),
        getOrCreateAssociatedTokenAccount(
            bVaultAccount.tokenMint,
            userKeypair.publicKey,
            userKeypair,
            ammProgram
        ),
    ]);

    const [adminTokenAFee, adminTokenBFee] = getAdminFeeTokenPDA(
        aVaultAccount.tokenMint,
        bVaultAccount.tokenMint,
        poolPubkey,
        ammProgram
    );

    const setComputeUnitLimitIx =
        anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
            units: 1_400_000,
        });

    await ammProgram.methods
        .initializePermissionlessPoolWithFeeTier(
            curve as any,
            tradeFeeBps,
            aDepositAmount,
            bDepositAmount
        )
        .accounts({
            pool: poolPubkey,
            tokenAMint: aVaultAccount.tokenMint,
            tokenBMint: bVaultAccount.tokenMint,
            aVault,
            bVault,
            aVaultLpMint: aVaultAccount.lpMint,
            bVaultLpMint: bVaultAccount.lpMint,
            aVaultLp: aVaultLpPda[PUBLIC_KEY],
            bVaultLp: bVaultLpPda[PUBLIC_KEY],
            lpMint: poolLpMint,
            payerTokenA: userTokenA,
            payerTokenB: userTokenB,
            adminTokenAFee,
            adminTokenBFee,
            payerPoolLp: payerPoolLp,
            aTokenVault: aVaultAccount.tokenVault,
            bTokenVault: bVaultAccount.tokenVault,
            feeOwner: FEE_OWNER,
            payer: userKeypair.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            vaultProgram: vaultProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .preInstructions([setComputeUnitLimitIx])
        .signers([userKeypair])
        .rpc();

    return poolPubkey;
};

interface IPoolFees {
    tradeFeeNumerator: anchor.BN;
    tradeFeeDenominator: anchor.BN;
    ownerTradeFeeNumerator: anchor.BN;
    ownerTradeFeeDenominator: anchor.BN;
}

interface ISetPoolFeesParams {
    pool: anchor.web3.PublicKey;
    ammProgram: Program<Amm>;
    poolFees: IPoolFees;
    adminKeypair: anchor.web3.Keypair;
}

export const setPoolFees = async (setPoolFeesParams: ISetPoolFeesParams) => {
    const { adminKeypair, ammProgram, pool, poolFees } = setPoolFeesParams;
    await ammProgram.methods
        .setPoolFees({
            tradeFeeDenominator: poolFees.tradeFeeDenominator,
            tradeFeeNumerator: poolFees.tradeFeeNumerator,
            ownerTradeFeeDenominator: poolFees.ownerTradeFeeDenominator,
            ownerTradeFeeNumerator: poolFees.ownerTradeFeeNumerator,
        })
        .accounts({
            pool,
            admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();
};


interface ISetPoolFeeClaimer {
    pool: anchor.web3.PublicKey;
    ammProgram: Program<Amm>;
    feeClaimer: anchor.web3.PublicKey;
    adminKeypair: anchor.web3.Keypair;
}
export const setFeeClaimer = async (setPoolFeeClaimerParams: ISetPoolFeeClaimer) => {
    const { feeClaimer, ammProgram, pool, adminKeypair } = setPoolFeeClaimerParams;
    await ammProgram.methods
        .setFeeClaimer(feeClaimer)
        .accounts({
            pool,
            admin: adminKeypair.publicKey,
        })
        .signers([adminKeypair])
        .rpc();
};

interface ISwapParams {
    pool: anchor.web3.PublicKey;
    inAmount: anchor.BN;
    minOutAmount: anchor.BN;
    inTokenMint: anchor.web3.PublicKey;
    userKeypair: anchor.web3.Keypair;
    ammProgram: Program<Amm>;
    vaultProgram: Program<Vault>;
    overrideParams: ISwapParamsOverride;
}
interface ISwapParamsOverride {
    userSourceToken?: anchor.web3.PublicKey;
    userDestinationToken?: anchor.web3.PublicKey;
    adminTokenFee?: anchor.web3.PublicKey;
}
export const swap = async (swapParams: ISwapParams) => {
    const {
        ammProgram,
        vaultProgram,
        inAmount,
        minOutAmount,
        inTokenMint,
        pool,
        userKeypair,
        overrideParams,
    } = swapParams;
    const {
        adminTokenFee: overrideAdminTokenFee,
        userDestinationToken: overrideUserDestinationToken,
        userSourceToken: overrideUserSourceToken,
    } = overrideParams;

    const poolAccount = await ammProgram.account.pool.fetch(pool);

    const [aVault, bVault] = await Promise.all([
        vaultProgram.account.vault.fetch(poolAccount.aVault),
        vaultProgram.account.vault.fetch(poolAccount.bVault),
    ]);

    let [sourceToken, destinationToken] = poolAccount.tokenAMint.equals(
        inTokenMint
    )
        ? [poolAccount.tokenAMint, poolAccount.tokenBMint]
        : [poolAccount.tokenBMint, poolAccount.tokenAMint];

    const [userSourceToken, userDestinationToken] = await Promise.all([
        getOrCreateAssociatedTokenAccount(
            sourceToken,
            userKeypair.publicKey,
            userKeypair,
            ammProgram
        ),
        getOrCreateAssociatedTokenAccount(
            destinationToken,
            userKeypair.publicKey,
            userKeypair,
            ammProgram
        ),
    ]);

    const adminTokenFee = inTokenMint.equals(poolAccount.tokenAMint)
        ? poolAccount.adminTokenAFee
        : poolAccount.adminTokenBFee;

    await ammProgram.methods
        .swap(inAmount, minOutAmount)
        .accounts({
            aTokenVault: aVault.tokenVault,
            bTokenVault: bVault.tokenVault,
            aVault: poolAccount.aVault,
            bVault: poolAccount.bVault,
            aVaultLp: poolAccount.aVaultLp,
            bVaultLp: poolAccount.bVaultLp,
            aVaultLpMint: aVault.lpMint,
            bVaultLpMint: bVault.lpMint,
            userSourceToken: overrideUserSourceToken
                ? overrideUserSourceToken
                : userSourceToken,
            userDestinationToken: overrideUserDestinationToken
                ? overrideUserDestinationToken
                : userDestinationToken,
            user: userKeypair.publicKey,
            adminTokenFee: overrideAdminTokenFee
                ? overrideAdminTokenFee
                : adminTokenFee,
            pool,
            tokenProgram: TOKEN_PROGRAM_ID,
            vaultProgram: vaultProgram.programId,
        })
        .signers([userKeypair])
        .rpc();
};



interface IClaimFeeParams {
    gauge: anchor.web3.PublicKey,
    isAFee: boolean,
    voterKP: anchor.web3.Keypair,
    votingEpoch: number,
    programGauge: Program<Gauge>,
    programVoter: Program<Voter>,
    programAmm: Program<Amm>,
}
export async function claimFeeInVotingEpoch(
    claimFeeParams: IClaimFeeParams
) {
    const {
        gauge,
        isAFee,
        voterKP,
        votingEpoch,
        programGauge,
        programVoter,
        programAmm,
    } = claimFeeParams;

    let gaugeState =
        await programGauge.account.gauge.fetch(gauge);
    let gaugeFactoryState =
        await programGauge.account.gaugeFactory.fetch(gaugeState.gaugeFactory);
    let ammState = await programAmm.account.pool.fetch(gaugeState.ammPool);

    let [escrow, eBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Escrow"), gaugeFactoryState.locker.toBytes(), voterKP.publicKey.toBytes()],
        programVoter.programId
    );
    const [gaugeVoter, gaugeVoterBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVoter"), gaugeState.gaugeFactory.toBuffer(), escrow.toBuffer()],
            programGauge.programId
        );

    const [epochGaugeVoter, gaugeVoteBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("EpochGaugeVoter"), gaugeVoter.toBuffer(), encodeU32(votingEpoch)],
            programGauge.programId
        );
    const [epochGauge, epochGaugeBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("EpochGauge"), gauge.toBuffer(), encodeU32(votingEpoch)],
            programGauge.programId
        );

    let sourceTokenAccount;
    let destTokenAccount;
    if (isAFee) {
        sourceTokenAccount = ammState.adminTokenAFee;
        destTokenAccount = await getOrCreateATA(
            ammState.tokenAMint,
            voterKP.publicKey,
            voterKP,
            programGauge.provider.connection,
        );
    } else {
        sourceTokenAccount = ammState.adminTokenBFee;
        destTokenAccount = await getOrCreateATA(
            ammState.tokenBMint,
            voterKP.publicKey,
            voterKP,
            programGauge.provider.connection,
        );
    }

    const [gaugeVote, xBump] =
        await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("GaugeVote"), gaugeVoter.toBuffer(), gauge.toBuffer()],
            programGauge.programId
        );

    await programGauge.methods
        .claimFeeGaugeEpoch(votingEpoch)
        .accounts({
            epochGaugeVoter,
            epochGauge,
            gaugeFactory: gaugeState.gaugeFactory,
            gauge,
            gaugeVoter,
            gaugeVote,
            escrow,
            tokenAccount: sourceTokenAccount,
            destTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            ammPool: gaugeState.ammPool,
            ammProgram: programAmm.programId,
            voteDelegate: voterKP.publicKey,
        }).remainingAccounts([
            {
                pubkey: ammState.aVaultLp,
                isSigner: false,
                isWritable: false,
            }
        ])
        .signers([voterKP])
        .rpc();
}

