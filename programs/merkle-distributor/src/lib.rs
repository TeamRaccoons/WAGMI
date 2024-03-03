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
use anchor_lang::solana_program::hash::hashv;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use vipers::prelude::*;
pub mod merkle_proof;
use anchor_spl::associated_token::AssociatedToken;

// We need to discern between leaf and intermediate nodes to prevent trivial second
// pre-image attacks.
// https://flawed.net.nz/2018/02/21/attacking-merkle-trees-with-a-second-preimage-attack
pub const LEAF_PREFIX: &[u8] = &[0];
const SECONDS_PER_HOUR: i64 = 3600; // 60 minutes * 60 seconds
const HOURS_PER_DAY: i64 = 24;
const SECONDS_PER_DAY: i64 = SECONDS_PER_HOUR * HOURS_PER_DAY; // 24 hours * 3600 seconds

pub mod error;
pub mod instructions;
use instructions::*;
declare_id!("MRKgRBL5XCCT5rwUGnim4yioq9wR4c6rj2EZkw8KdyZ");

/// The [merkle_distributor] program.
#[program]
pub mod merkle_distributor {
    use super::*;

    /// Creates a new [MerkleDistributor].
    /// After creating this [MerkleDistributor], the account should be seeded with tokens via its ATA.
    pub fn new_distributor(
        ctx: Context<NewDistributor>,
        locker: Pubkey,
        root: [u8; 32],
        max_total_claim: u64,
        max_num_nodes: u64,
        clawback_start_ts: i64,
    ) -> Result<()> {
        handle_new_distributor(
            ctx,
            locker,
            root,
            max_total_claim,
            max_num_nodes,
            clawback_start_ts,
        )
    }

    /// Sets new clawback receiver token account
    pub fn set_clawback_receiver(ctx: Context<SetClawbackReceiver>) -> Result<()> {
        handle_set_clawback_receiver(ctx)
    }

    /// Sets new admin account
    pub fn set_admin(ctx: Context<SetAdmin>) -> Result<()> {
        handle_set_admin(ctx)
    }

    /// Claws back unclaimed tokens by:
    /// 1. Checking that the lockup has expired
    /// 2. Transferring remaining funds from the vault to the clawback receiver
    /// 3. Marking the distributor as clawed back
    /// CHECK:
    ///     1. The distributor has not already been clawed back
    pub fn clawback(ctx: Context<Clawback>) -> Result<()> {
        handle_clawback(ctx)
    }

    /// Claims tokens from the [MerkleDistributor].
    pub fn claim(ctx: Context<Claim>, index: u64, amount: u64, proof: Vec<[u8; 32]>) -> Result<()> {
        handle_claim(ctx, index, amount, proof)
    }
}

/// State for the account which distributes tokens.
#[account]
#[derive(Default, Debug)]
pub struct MerkleDistributor {
    /// Base key used to generate the PDA.
    pub base: Pubkey,
    /// Bump seed.
    pub bump: u8,

    pub token_vault: Pubkey,

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

    /// Clawback start (Unix Timestamp)
    pub clawback_start_ts: i64,
    /// Clawback receiver
    pub clawback_receiver: Pubkey,
    /// Whether or not the distributor has been clawed back
    pub clawed_back: bool,

    /// Buffer 0
    pub buffer_0: [u8; 32],
    /// Buffer 1
    pub buffer_1: [u8; 32],
    /// Buffer 2
    pub buffer_2: [u8; 32],
}

impl MerkleDistributor {
    /// LEN of MerkleDistributor
    pub const LEN: usize =
        std::mem::size_of::<Pubkey>() * 6 + 1 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 32 * 3;
}

/// Holds whether or not a claimant has claimed tokens.
///
/// TODO: this is probably better stored as the node that was verified.
#[account]
#[derive(Default, Debug)]
pub struct ClaimStatus {
    /// If true, the tokens have been claimed.
    pub is_claimed: bool,
    /// Authority that claimed the tokens.
    pub claimant: Pubkey,
    /// When the tokens were claimed.
    pub claimed_at: i64,
    /// Amount of tokens claimed.
    pub amount: u64,
    /// Buffer 0
    pub buffer_0: [u8; 32],
}

impl ClaimStatus {
    /// LEN of MerkleDistributor
    pub const LEN: usize = std::mem::size_of::<Pubkey>() + 1 + 8 + 8 + 32;
}

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
