import { ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export function getAssociatedTokenAddressSplToken(mint: PublicKey, owner: PublicKey) {
    return getAssociatedTokenAddressSync(
        mint,
        owner,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
}

export async function createSplMint(connection: Connection, keypair: Keypair, mintAuthority: PublicKey, decimals: number) {
    return createMint(
        connection,
        keypair,
        mintAuthority,
        null,
        decimals,
        Keypair.generate(),
        null,
        TOKEN_PROGRAM_ID
    )
}

export async function getOrCreateAssociatedSplTokenAccount(
    connection: Connection,
    keypair: Keypair,
    mint: PublicKey,
    owner: PublicKey,
) {
    let account = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        owner,
        false,
        "confirmed",
        {
            commitment: "confirmed",
        },
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return account.address
}

export async function mintToSpl(connection: Connection, authority: Keypair, mint: PublicKey, owner: PublicKey, amount: number) {
    mintTo(
        connection,
        authority,
        mint,
        owner,
        authority.publicKey,
        amount,
        [],
        {
            commitment: "confirmed",
        },
        TOKEN_PROGRAM_ID
    );
}