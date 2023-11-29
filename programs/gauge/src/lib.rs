//! Gauge
//!

#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![deny(clippy::unwrap_used)]

use anchor_lang::prelude::*;
use vipers::prelude::*;

use anchor_spl::token::Token;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer};

pub mod constants;
mod instructions;
mod macros;
mod state;

pub use instructions::*;
pub use state::*;

pub use amm::*;

declare_id!("gauKNF863wSNX1arJ1bAzc8Q2twYd99AaiDd2cpMoE3");

#[program]
/// Smart wallet program.
pub mod gauge {
    use super::*;

    /// Creates a [GaugeFactory].    
    #[access_control(ctx.accounts.validate())]
    pub fn create_gauge_factory(
        ctx: Context<CreateGaugeFactory>,
        foreman: Pubkey,
        epoch_duration_seconds: u32,
        first_epoch_starts_at: u64,
    ) -> Result<()> {
        create_gauge_factory::handler(ctx, foreman, epoch_duration_seconds, first_epoch_starts_at)
    }

    /// Creates a [Gauge]. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn create_gauge(ctx: Context<CreateGauge>) -> Result<()> {
        create_gauge::handler(ctx)
    }

    /// Creates a [GaugeVoter]. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn create_gauge_voter(ctx: Context<CreateGaugeVoter>) -> Result<()> {
        create_gauge_voter::handler(ctx)
    }

    /// Creates a [GaugeVote]. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn create_gauge_vote(ctx: Context<CreateGaugeVote>) -> Result<()> {
        create_gauge_vote::handler(ctx)
    }

    /// pump gauge epoch
    #[access_control(ctx.accounts.validate())]
    pub fn pump_gauge_epoch(ctx: Context<PumpGaugeEpoch>) -> Result<()> {
        pump_gauge_epoch::handler(ctx)
    }

    /// Prepare vote Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn prepare_vote(ctx: Context<PrepareVote>) -> Result<()> {
        prepare_vote::handler(ctx)
    }

    /// Resets an [EpochGaugeVoter]; that is, syncs the [EpochGaugeVoter]
    /// with the latest power amount only if the votes have yet to be
    /// committed. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn reset_vote(ctx: Context<ResetVote>) -> Result<()> {
        reset_vote::handler(ctx)
    }

    /// Sets the vote of a [Gauge].
    #[access_control(ctx.accounts.validate())]
    pub fn set_vote(ctx: Context<SetVote>, weight: u32) -> Result<()> {
        set_vote::handler(ctx, weight)
    }

    /// Commits the vote of a [Gauge].
    /// Anyone can call this on any voter's gauge votes.
    #[access_control(ctx.accounts.validate())]
    pub fn commit_vote(ctx: Context<CommitVote>) -> Result<()> {
        commit_vote::handler(ctx)
    }

    /// Reverts a vote commitment of a [Gauge].
    /// Only the voter can call this.
    #[access_control(ctx.accounts.validate())]
    pub fn revert_vote(ctx: Context<RevertVote>) -> Result<()> {
        revert_vote::handler(ctx)
    }

    /// Enables a [Gauge].
    #[access_control(ctx.accounts.validate())]
    pub fn enable_gauge(ctx: Context<EnableGauge>) -> Result<()> {
        enable_gauge::handler(ctx)
    }

    /// Disables a [Gauge].
    #[access_control(ctx.accounts.validate())]
    pub fn disable_gauge(ctx: Context<DisableGauge>) -> Result<()> {
        disable_gauge::handler(ctx)
    }

    /// Triggers the next epoch. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn trigger_next_epoch(ctx: Context<TriggerNextEpoch>) -> Result<()> {
        trigger_next_epoch::handler(ctx)
    }

    /// Synchronizes the [quarry::Quarry] with the relevant [EpochGauge]. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn sync_gauge(ctx: Context<SyncGauge>) -> Result<()> {
        sync_gauge::handler(ctx)
    }

    /// Sets the [quarry::Quarry] rewards to zero if the gauge is disabled. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn sync_disabled_gauge(ctx: Context<SyncDisabledGauge>) -> Result<()> {
        sync_disabled_gauge::handler(ctx)
    }

    /// Holder claim fee from amm
    ///
    /// Only the [voter::Escrow::vote_delegate] may call this.
    #[access_control(ctx.accounts.validate())]
    pub fn claim_gauge_fee<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ClaimGaugeFee<'info>>,
        to_epoch: u32,
    ) -> Result<()> {
        ctx.accounts
            .claim_gauge_fee(to_epoch, ctx.remaining_accounts)
        // claim_fee_gauge_epoch::handler(&ctx, voting_epoch, &ctx.remaining_accounts)
    }

    /// Create an [Bribe]
    ///
    /// Permissionless, anyone can crate bribe
    #[access_control(ctx.accounts.validate())]
    pub fn create_gauge_bribe(
        ctx: Context<CreateGaugeBribe>,
        reward_each_epoch: u64,
        bribe_epoch_end: u32,
    ) -> Result<()> {
        create_gauge_bribe::handler(ctx, reward_each_epoch, bribe_epoch_end)
    }

    pub fn create_epoch_bribe_voter(ctx: Context<CreateEpochBribeVoter>) -> Result<()> {
        create_epoch_bribe_voter::handler(ctx)
    }
    /// Claim an [Bribe] for voting epoch
    ///
    /// Permissionless, anyone can crate bribe
    #[access_control(ctx.accounts.validate())]
    pub fn claim_gauge_bribe(ctx: Context<ClaimGaugeBribe>) -> Result<()> {
        claim_gauge_bribe::handler(ctx)
    }
    /// Rescue an [Bribe] for voting epoch
    ///
    /// Briber claim rewards back in case onbody vote for a gauge in this epoch
    #[access_control(ctx.accounts.validate())]
    pub fn clawback_bribe_gauge_epoch(
        ctx: Context<ClawbackBribeGaugeEpoch>,
        voting_epoch: u32,
    ) -> Result<()> {
        clawback_bribe_gauge_epoch::handler(ctx, voting_epoch)
    }
}

/// Program errors.
#[error_code]
pub enum ErrorCode {
    #[msg("The give account is not correct.")]
    WrongAccount,
    #[msg("You must be the foreman to perform this action.")]
    UnauthorizedNotForeman,
    #[msg("Cannot sync gauges at the 0th epoch.")]
    GaugeEpochCannotBeZero,
    #[msg("The gauge is not set to the current epoch.")]
    GaugeWrongEpoch,
    #[msg("The start time for the next epoch has not yet been reached.")]
    NextEpochNotReached,
    #[msg("Must set all votes to 0 before changing votes.")]
    CannotVoteMustReset,
    #[msg("Cannot vote since gauge is disabled; all you may do is set weight to 0.")]
    CannotVoteGaugeDisabled,
    #[msg("You have already committed your vote to this gauge.")]
    VoteAlreadyCommitted,
    #[msg("Cannot commit votes since gauge is disabled; all you may do is set weight to 0.")]
    CannotCommitGaugeDisabled,
    #[msg("Voting on this epoch gauge is closed.")]
    EpochGaugeNotVoting,
    #[msg("Gauge voter voting weights have been modified since you started committing your votes. Please withdraw your votes and try again.")]
    WeightSeqnoChanged,
    #[msg("You may no longer modify votes for this epoch.")]
    EpochClosed,
    #[msg("You must have zero allocated power in order to reset the epoch gauge.")]
    AllocatedPowerMustBeZero,
    #[msg("The epoch in which you are closing an account for has not yet elapsed.")]
    CloseEpochNotElapsed,
    #[msg("You must be the vote delegate of the escrow to perform this action.")]
    UnauthorizedNotDelegate,
    #[msg("You must claimed fee firstly to perform this action.")]
    FeeIsNotClaimed,
    #[msg("Fee has been claimed already.")]
    FeeHasBeenClaimed,
    #[msg("Token account is not correct.")]
    TokenAccountIsNotCorrect,
    #[msg("VotingEpoch is not correct.")]
    VotingEpochIsNotCorrect,
    #[msg("ClawbackEpoch is not correct.")]
    ClawbackEpochIsNotCorrect,
    #[msg("EpochGauge is voted.")]
    EpochGaugeIsVoted,
    #[msg("Bribe Epoch End must be greater than voting epoch.")]
    BribeEpochEndError,
    #[msg("Bribe rewards are zero.")]
    BribeRewardsIsZero,
    #[msg("Math overflow.")]
    MathOverflow,
    #[msg("type cast faled")]
    TypeCastFailed,
    #[msg("Voting epoch is not found")]
    VotingEpochNotFound,

    #[msg("Recreate voting epoch")]
    RecreatedVotingEpoch,

    #[msg("Invalid epoch")]
    InvalidEpoch,

    #[msg("Bribe has been ended.")]
    BribeHasBeenEnded,

    #[msg("No more bribe rewards.")]
    NoMoreBribeReward,
}
