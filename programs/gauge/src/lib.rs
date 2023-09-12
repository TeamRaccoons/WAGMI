//! Gauge
//!

#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![deny(clippy::unwrap_used)]

use anchor_lang::prelude::*;
use vipers::prelude::*;

use anchor_spl::token::Token;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer};

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

    /// Creates an [EpochGauge]. Permissionless.
    /// Only allow create epoch for current epoch, that ensure we can accumulate fee
    #[access_control(ctx.accounts.validate())]
    pub fn create_epoch_gauge(ctx: Context<CreateEpochGauge>) -> Result<()> {
        create_epoch_gauge::handler(ctx)
    }

    /// Creates an [EpochGaugeVoter]. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn prepare_epoch_gauge_voter(ctx: Context<PrepareEpochGaugeVoter>) -> Result<()> {
        prepare_epoch_gauge_voter::handler(ctx)
    }

    /// Resets an [EpochGaugeVoter]; that is, syncs the [EpochGaugeVoter]
    /// with the latest power amount only if the votes have yet to be
    /// committed. Permissionless.
    #[access_control(ctx.accounts.validate())]
    pub fn reset_epoch_gauge_voter(ctx: Context<ResetEpochGaugeVoter>) -> Result<()> {
        reset_epoch_gauge_voter::handler(ctx)
    }

    /// Sets the vote of a [Gauge].
    #[access_control(ctx.accounts.validate())]
    pub fn gauge_set_vote(ctx: Context<GaugeSetVote>, weight: u32) -> Result<()> {
        gauge_set_vote::handler(ctx, weight)
    }

    /// Commits the vote of a [Gauge].
    /// Anyone can call this on any voter's gauge votes.
    #[access_control(ctx.accounts.validate())]
    pub fn gauge_epoch_commit_vote(ctx: Context<GaugeEpochCommitVote>) -> Result<()> {
        gauge_epoch_commit_vote::handler(ctx)
    }

    /// Reverts a vote commitment of a [Gauge].
    /// Only the voter can call this.
    #[access_control(ctx.accounts.validate())]
    pub fn gauge_epoch_revert_vote(ctx: Context<GaugeEpochRevertVote>) -> Result<()> {
        gauge_epoch_revert_vote::handler(ctx)
    }

    /// Enables a [Gauge].
    #[access_control(ctx.accounts.validate())]
    pub fn gauge_enable(ctx: Context<GaugeEnable>) -> Result<()> {
        gauge_enable::handler(ctx)
    }

    /// Disables a [Gauge].
    #[access_control(ctx.accounts.validate())]
    pub fn gauge_disable(ctx: Context<GaugeDisable>) -> Result<()> {
        gauge_disable::handler(ctx)
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
    pub fn claim_fee_gauge_epoch(
        ctx: Context<ClaimFeeGaugeEpoch>,
        voting_epoch: u32,
    ) -> Result<()> {
        claim_fee_gauge_epoch::handler(ctx, voting_epoch)
    }

    /// Closes an [EpochGaugeVote], sending lamports to a user-specified address.
    ///
    /// Only the [voter::Escrow::vote_delegate] may call this.
    #[access_control(ctx.accounts.validate())]
    pub fn close_epoch_gauge_vote(
        ctx: Context<CloseEpochGaugeVote>,
        voting_epoch: u32,
    ) -> Result<()> {
        close_epoch_gauge_vote::handler(ctx, voting_epoch)
    }

    /// Create an [Bribe]
    ///
    /// Permissionless, anyone can crate bribe
    #[access_control(ctx.accounts.validate())]
    pub fn create_bribe(
        ctx: Context<CreateBribeGauge>,
        reward_each_epoch: u64,
        bribe_epoch_end: u32,
    ) -> Result<()> {
        create_bribe_gauge::handler(ctx, reward_each_epoch, bribe_epoch_end)
    }
    /// Claim an [Bribe] for voting epoch
    ///
    /// Permissionless, anyone can crate bribe
    #[access_control(ctx.accounts.validate())]
    pub fn claim_bribe_gauge_epoch(
        ctx: Context<ClaimBribeGaugeEpoch>,
        voting_epoch: u32,
    ) -> Result<()> {
        claim_bribe_gauge_epoch::handler(ctx, voting_epoch)
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
}
