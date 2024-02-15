//! Handles proposals, voting, and queueing of transactions into a Smart Wallet
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]

pub mod macros;

use anchor_lang::prelude::*;
use num_traits::cast::ToPrimitive;
use smart_wallet::SmartWallet;
use vipers::prelude::*;

mod instructions;
pub mod proposal;
mod state;

pub use instructions::*;
pub use proposal::*;
pub use state::*;

declare_id!("GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY");

/// The [govern] program.
#[program]
pub mod govern {
    use super::*;

    /// Creates a [Governor].
    #[access_control(ctx.accounts.validate())]
    pub fn create_governor(
        ctx: Context<CreateGovernor>,
        locker: Pubkey,
        params: GovernanceParameters,
    ) -> Result<()> {
        ctx.accounts
            .create_governor(unwrap_bump!(ctx, "governor"), locker, params)
    }

    /// Creates a [Proposal].
    /// This may be called by anyone, since the [Proposal] does not do anything until
    /// it is activated in [activate_proposal].
    #[access_control(ctx.accounts.validate())]
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        _bump: u8, // weird bug from anchor
        instructions: Vec<ProposalInstruction>,
    ) -> Result<()> {
        ctx.accounts
            .create_proposal(unwrap_bump!(ctx, "proposal"), instructions)
    }

    /// Activates a proposal.
    /// Only the [Governor::voter] may call this; that program
    /// may ensure that only certain types of users can activate proposals.
    #[access_control(ctx.accounts.validate())]
    pub fn activate_proposal(ctx: Context<ActivateProposal>) -> Result<()> {
        ctx.accounts.activate_proposal()
    }

    /// Cancels a proposal.
    /// This is only callable by the creator of the proposal.
    #[access_control(ctx.accounts.validate())]
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        ctx.accounts.cancel_proposal()
    }

    /// Queues a proposal for execution by the [SmartWallet].
    #[access_control(ctx.accounts.validate())]
    pub fn queue_proposal(ctx: Context<QueueProposal>) -> Result<()> {
        ctx.accounts.queue_transaction()?;
        Ok(())
    }

    /// Creates a new [Vote]. Anyone can call this.
    #[access_control(ctx.accounts.validate())]
    pub fn new_vote(ctx: Context<NewVote>, voter: Pubkey) -> Result<()> {
        ctx.accounts.new_vote(unwrap_bump!(ctx, "vote"), voter)
    }

    /// Sets a [Vote] weight and side.
    /// This may only be called by the [Governor::voter].
    #[access_control(ctx.accounts.validate())]
    pub fn set_vote(ctx: Context<SetVote>, side: u8, weight: u64) -> Result<()> {
        ctx.accounts.set_vote(side, weight)
    }

    /// Sets the [GovernanceParameters].
    /// This may only be called by the [Governor::smart_wallet].
    #[access_control(ctx.accounts.validate())]
    pub fn set_governance_params(
        ctx: Context<SetGovernanceParams>,
        params: GovernanceParameters,
    ) -> Result<()> {
        ctx.accounts.set_governance_params(params)
    }

    /// Sets Voting Reward.
    /// This may only be called by the [Governor::smart_wallet].
    #[access_control(ctx.accounts.validate())]
    pub fn set_voting_reward(
        ctx: Context<SetVotingReward>,
        reward_per_proposal: u64,
    ) -> Result<()> {
        ctx.accounts.set_voting_reward(reward_per_proposal)
    }

    /// Claim rewards, for voter
    #[access_control(ctx.accounts.validate())]
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        ctx.accounts.claim_reward()
    }

    /// Sets the locker of the [Governor].
    #[access_control(ctx.accounts.validate())]
    pub fn set_locker(ctx: Context<SetGovernanceParams>, new_locker: Pubkey) -> Result<()> {
        ctx.accounts.set_locker(new_locker)
    }

    /// Creates a [ProposalMeta].
    #[access_control(ctx.accounts.validate())]
    pub fn create_proposal_meta(
        ctx: Context<CreateProposalMeta>,
        _bump: u8, // fix anchor weird bug
        title: String,
        description_link: String,
    ) -> Result<()> {
        ctx.accounts.create_proposal_meta(title, description_link)
    }
}

/// Errors.
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid vote side.")]
    InvalidVoteSide,
    #[msg("The owner of the smart wallet doesn't match with current.")]
    GovernorNotFound,
    #[msg("The proposal cannot be activated since it has not yet passed the voting delay.")]
    VotingDelayNotMet,
    #[msg("Only drafts can be canceled.")]
    ProposalNotDraft,
    #[msg("The proposal must be active.")]
    ProposalNotActive,
}
