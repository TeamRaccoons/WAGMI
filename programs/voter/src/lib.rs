//! Voter which locks up governance tokens for a user-provided duration in exchange for increased voting power.
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![deny(clippy::unwrap_used)]

pub mod macros;

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use govern::{Governor, Proposal, Vote};
use vipers::prelude::*;

mod instructions;
pub mod locker;
mod state;

pub use instructions::*;
pub use state::*;

declare_id!("voteXZxajNhmCGpqzBhVArCANMKra5nwqtaaLA6v9CX");

/// Locked voter program.
#[deny(missing_docs)]
#[program]
pub mod voter {
    use super::*;

    /// Creates a new [Locker].
    #[access_control(ctx.accounts.validate())]
    pub fn new_locker(
        ctx: Context<NewLocker>,
        expiration: i64,
        params: LockerParams,
    ) -> Result<()> {
        ctx.accounts
            .new_locker(unwrap_bump!(ctx, "locker"), expiration, params)
    }

    /// change locker expiration [Locker].
    #[access_control(ctx.accounts.validate())]
    pub fn change_locker_expiration(
        ctx: Context<ChangeLockerExpiration>,
        expiration: i64,
    ) -> Result<()> {
        ctx.accounts.change_locker_expiration(expiration)
    }

    /// Creates a new [Escrow] for an account.
    ///
    /// A Vote Escrow, or [Escrow] for short, is an agreement between an account (known as the `authority`) and the DAO to
    /// lock up tokens for a specific period of time, in exchange for voting rights
    /// linearly proportional to the amount of votes given.
    #[access_control(ctx.accounts.validate())]
    pub fn new_escrow(ctx: Context<NewEscrow>) -> Result<()> {
        ctx.accounts.new_escrow(unwrap_bump!(ctx, "escrow"))
    }

    /// increase locked amount [Escrow].
    #[access_control(ctx.accounts.validate())]
    pub fn increase_locked_amount<'info>(
        ctx: Context<'_, '_, '_, 'info, IncreaseLockedAmount<'info>>,
        amount: u64,
    ) -> Result<()> {
        ctx.accounts.increase_locked_amount(amount)
    }

    /// extend locked duration [Escrow].
    #[access_control(ctx.accounts.validate())]
    pub fn extend_lock_duration<'info>(
        ctx: Context<'_, '_, '_, 'info, ExtendLockDuration<'info>>,
        duration: i64,
    ) -> Result<()> {
        ctx.accounts.extend_lock_duration(duration)
    }

    /// toogle max lock [Escrow].
    #[access_control(ctx.accounts.validate())]
    pub fn toggle_max_lock<'info>(
        ctx: Context<'_, '_, '_, 'info, ToggleMaxLock<'info>>,
        is_max_lock: bool,
    ) -> Result<()> {
        ctx.accounts.toggle_max_lock(is_max_lock)
    }

    /// Exits the DAO; i.e., withdraws all staked tokens in an [Escrow] if the [Escrow] is unlocked.
    #[access_control(ctx.accounts.validate())]
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        ctx.accounts.withdraw()
    }

    /// Activates a proposal in token launch phase
    #[access_control(ctx.accounts.validate())]
    pub fn activate_proposal(ctx: Context<ActivateProposal>) -> Result<()> {
        ctx.accounts.activate_proposal()
    }

    /// Activates a proposal in inital phase
    #[access_control(ctx.accounts.validate())]
    pub fn activate_proposal_initial_phase(
        ctx: Context<ActivateProposalInitialPhase>,
    ) -> Result<()> {
        ctx.accounts.activate_proposal()
    }

    /// Casts a vote.
    #[access_control(ctx.accounts.validate())]
    pub fn cast_vote(ctx: Context<CastVote>, side: u8) -> Result<()> {
        ctx.accounts.cast_vote(side)
    }

    /// Delegate escrow vote.
    #[access_control(ctx.accounts.validate())]
    pub fn set_vote_delegate(ctx: Context<SetVoteDelegate>, new_delegate: Pubkey) -> Result<()> {
        ctx.accounts.set_vote_delegate(new_delegate)
    }

    /// Set locker params.
    #[access_control(ctx.accounts.validate())]
    pub fn set_locker_params(ctx: Context<SetLockerParams>, params: LockerParams) -> Result<()> {
        ctx.accounts.set_locker_params(params)
    }
}

/// [voter] errors.
#[error_code]
pub enum ErrorCode {
    #[msg("Lockup duration must at least be the min stake duration")]
    LockupDurationTooShort,
    #[msg("Lockup duration must at most be the max stake duration")]
    LockupDurationTooLong,
    #[msg("A voting escrow refresh cannot shorten the escrow time remaining")]
    RefreshCannotShorten,
    #[msg("Escrow has not ended")]
    EscrowNotEnded,
    #[msg("Maxlock is set")]
    MaxLockIsSet,
    #[msg("Cannot set expiration less than the current time")]
    ExpirationIsLessThanCurrentTime,
    #[msg("Locker is expired")]
    LockerIsExpired,
    #[msg("Expiration is not zero")]
    ExpirationIsNotZero,
    #[msg("Amount is zero")]
    AmountIsZero,
}
