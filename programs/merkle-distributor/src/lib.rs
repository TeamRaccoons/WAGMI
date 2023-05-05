//! A program for distributing tokens efficiently via uploading a [Merkle root](https://en.wikipedia.org/wiki/Merkle_tree).
//!
//! This program is largely based off of [Uniswap's Merkle Distributor](https://github.com/Uniswap/merkle-distributor).
//!
//! # Rationale
//!
//! Although Solana has low fees for executing transactions, it requires staking tokens to pay for storage costs, also known as "rent". These rent costs can add up when sending tokens to thousands or tens of thousands of wallets, making it economically unreasonable to distribute tokens to everyone.
//!
//! The Merkle distributor, pioneered by [Uniswap](https://github.com/Uniswap/merkle-distributor), solves this issue by deriving a 256-bit "root hash" from a tree of balances. This puts the gas cost on the claimer. Solana has the additional advantage of being able to reclaim rent from closed token accounts, so the net cost to the user should be around `0.000010 SOL` (at the time of writing).
//!
//! The Merkle distributor is also significantly easier to manage from an operations perspective, since one does not need to send a transaction to each individual address that may be redeeming tokens.
//!
//! # License
//!
//! The Merkle distributor program and SDK is distributed under the GPL v3.0 license.

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use vipers::prelude::*;

pub mod merkle_proof;

declare_id!("MRKgRBL5XCCT5rwUGnim4yioq9wR4c6rj2EZkw8KdyZ");

/// The [merkle_distributor] program.
#[program]
pub mod merkle_distributor {
    use super::*;

    /// Creates a new [MerkleDistributor].
    /// After creating this [MerkleDistributor], the account should be seeded with tokens via its ATA.
    pub fn new_distributor(
        ctx: Context<NewDistributor>,
        _bump: u8,
        locker: Pubkey,
        root: [u8; 32],
        max_total_claim: u64,
        max_num_nodes: u64,
    ) -> Result<()> {
        let distributor = &mut ctx.accounts.distributor;

        distributor.base = ctx.accounts.base.key();
        distributor.bump = unwrap_bump!(ctx, "distributor");

        distributor.root = root;
        distributor.mint = ctx.accounts.mint.key();

        distributor.max_total_claim = max_total_claim;
        distributor.max_num_nodes = max_num_nodes;
        distributor.total_amount_claimed = 0;
        distributor.num_nodes_claimed = 0;

        distributor.admin = ctx.accounts.payer.key();
        distributor.locker = locker;

        Ok(())
    }

    /// Claims tokens from the [MerkleDistributor].
    pub fn claim(
        ctx: Context<Claim>,
        _bump: u8,
        index: u64,
        amount: u64,
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        assert_keys_neq!(ctx.accounts.from, ctx.accounts.to);

        let claim_status = &mut ctx.accounts.claim_status;
        invariant!(
            // This check is redundant, we should not be able to initialize a claim status account at the same key.
            !claim_status.is_claimed && claim_status.claimed_at == 0,
            DropAlreadyClaimed
        );
        let claimant_account = &ctx.accounts.claimant;
        let distributor = &ctx.accounts.distributor;
        // Verify the merkle proof.
        let node = anchor_lang::solana_program::keccak::hashv(&[
            &index.to_le_bytes(),
            &claimant_account.key().as_ref(),
            &amount.to_le_bytes(),
        ]);
        invariant!(
            merkle_proof::verify(proof, distributor.root, node.0),
            InvalidProof
        );
        // Mark it claimed and send the tokens.
        claim_status.amount = amount;
        claim_status.is_claimed = true;
        let clock = Clock::get()?;
        claim_status.claimed_at = clock.unix_timestamp;
        claim_status.claimant = claimant_account.key();

        let seeds = [
            b"MerkleDistributor".as_ref(),
            &distributor.base.as_ref(),
            &[ctx.accounts.distributor.bump],
        ];
        let seeds = &[&seeds[..]];

        assert_keys_eq!(ctx.accounts.to.owner, claimant_account.key(), OwnerMismatch);

        // CPI to voter
        let cpi_ctx = CpiContext::new(
            ctx.accounts.voter_program.to_account_info(),
            voter::cpi::accounts::IncreaseLockedAmount {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
                payer: ctx.accounts.distributor.to_account_info(),
                source_tokens: ctx.accounts.from.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        )
        .with_signer(seeds);

        voter::cpi::increase_locked_amount(cpi_ctx, amount)?;

        let distributor = &mut ctx.accounts.distributor;
        distributor.total_amount_claimed =
            unwrap_int!(distributor.total_amount_claimed.checked_add(amount));
        invariant!(
            distributor.total_amount_claimed <= distributor.max_total_claim,
            ExceededMaxClaim
        );
        distributor.num_nodes_claimed = unwrap_int!(distributor.num_nodes_claimed.checked_add(1));
        invariant!(
            distributor.num_nodes_claimed <= distributor.max_num_nodes,
            ExceededMaxNumNodes
        );

        emit!(ClaimedEvent {
            index,
            claimant: claimant_account.key(),
            amount
        });
        Ok(())
    }
}

/// Accounts for [merkle_distributor::new_distributor].
#[derive(Accounts)]
pub struct NewDistributor<'info> {
    /// Base key of the distributor.
    pub base: Signer<'info>,

    /// [MerkleDistributor].
    #[account(
        init,
        seeds = [
            b"MerkleDistributor".as_ref(),
            base.key().as_ref()
        ],
        bump,
        space = 8 + std::mem::size_of::<MerkleDistributor>(),
        payer = payer
    )]
    pub distributor: Account<'info, MerkleDistributor>,

    /// The mint to distribute.
    pub mint: Account<'info, Mint>,

    /// Payer to create the distributor.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The [System] program.
    pub system_program: Program<'info, System>,
}

/// [merkle_distributor::claim] accounts.
#[derive(Accounts)]
#[instruction(_bump: u8, index: u64)]
pub struct Claim<'info> {
    /// The [MerkleDistributor].
    #[account(
        mut,
        address = from.owner,
        has_one = locker,
    )]
    pub distributor: Account<'info, MerkleDistributor>,

    /// Status of the claim.
    #[account(
        init,
        seeds = [
            b"ClaimStatus".as_ref(),
            index.to_le_bytes().as_ref(),
            distributor.key().as_ref()
        ],
        bump,
        space = 8 + std::mem::size_of::<ClaimStatus>(),
        payer = payer
    )]
    pub claim_status: Account<'info, ClaimStatus>,

    /// Distributor ATA containing the tokens to distribute.
    #[account(mut, constraint = from.mint == distributor.mint @ ErrorCode::MintMismatch)]
    pub from: Account<'info, TokenAccount>,

    /// Account to send the claimed tokens to.
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    /// CHECK: Who is claiming the tokens.
    #[account(address = to.owner @ ErrorCode::OwnerMismatch)]
    pub claimant: UncheckedAccount<'info>,

    /// Payer of the claim, must be claimant or admin
    #[account(mut, constraint = payer.key() == claimant.key() || payer.key() == distributor.admin @ ErrorCode::PayerMismatch)]
    pub payer: Signer<'info>,

    /// The [System] program.
    pub system_program: Program<'info, System>,

    /// SPL [Token] program.
    pub token_program: Program<'info, Token>,

    /// Voter program
    pub voter_program: Program<'info, voter::program::Voter>,

    /// CHECK: Locker
    pub locker: UncheckedAccount<'info>,

    /// CHECK: escrow
    #[account(
        seeds = [
            b"Escrow".as_ref(),
            locker.key().as_ref(),
            claimant.key().as_ref()
        ],
        bump,
    )]
    pub escrow: AccountInfo<'info>,

    /// CHECK: escrow_tokens
    pub escrow_tokens: UncheckedAccount<'info>,
}

/// State for the account which distributes tokens.
#[account]
#[derive(Default)]
pub struct MerkleDistributor {
    /// Base key used to generate the PDA.
    pub base: Pubkey,
    /// Bump seed.
    pub bump: u8,

    /// The 256-bit merkle root.
    pub root: [u8; 32],

    /// [Mint] of the token to be distributed.
    pub mint: Pubkey,
    /// Maximum number of tokens that can ever be claimed from this [MerkleDistributor].
    pub max_total_claim: u64,
    /// Maximum number of nodes that can ever be claimed from this [MerkleDistributor].
    pub max_num_nodes: u64,
    /// Total amount of tokens that have been claimed.
    pub total_amount_claimed: u64,
    /// Number of nodes that have been claimed.
    pub num_nodes_claimed: u64,

    /// Locker of voter
    pub locker: Pubkey,

    /// admin
    pub admin: Pubkey,
}

/// Holds whether or not a claimant has claimed tokens.
///
/// TODO: this is probably better stored as the node that was verified.
#[account]
#[derive(Default)]
pub struct ClaimStatus {
    /// If true, the tokens have been claimed.
    pub is_claimed: bool,
    /// Authority that claimed the tokens.
    pub claimant: Pubkey,
    /// When the tokens were claimed.
    pub claimed_at: i64,
    /// Amount of tokens claimed.
    pub amount: u64,
}

// impl ClaimStatus {
//     pub const LEN: usize = 1 + PUBKEY_BYTES + 8 + 8;
// }

/// Emitted when tokens are claimed.
#[event]
pub struct ClaimedEvent {
    /// Index of the claim.
    pub index: u64,
    /// User that claimed.
    pub claimant: Pubkey,
    /// Amount of tokens to distribute.
    pub amount: u64,
}

/// Error codes.
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Merkle proof.")]
    InvalidProof,
    #[msg("Drop already claimed.")]
    DropAlreadyClaimed,
    #[msg("Exceeded maximum claim amount.")]
    ExceededMaxClaim,
    #[msg("Exceeded maximum number of claimed nodes.")]
    ExceededMaxNumNodes,
    #[msg("Account is not authorized to execute this instruction")]
    Unauthorized,
    #[msg("Token mint did not match intended mint")]
    MintMismatch,
    #[msg("Token account owner did not match intended owner")]
    OwnerMismatch,
    #[msg("Payer did not match intended payer")]
    PayerMismatch,
}
