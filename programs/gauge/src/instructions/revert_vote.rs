//! Reverts a vote.

use crate::*;

/// Accounts for [gauge::revert_vote].
#[derive(Accounts)]
pub struct RevertVote<'info> {
    pub gauge_factory: Box<Account<'info, GaugeFactory>>,

    #[account(mut, has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,
    #[account(mut, has_one = gauge_factory, has_one = escrow)]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,
    #[account(mut, has_one = gauge_voter, has_one = gauge)]
    pub gauge_vote: AccountLoader<'info, GaugeVote>,

    /// The escrow.
    #[account(has_one = vote_delegate @ crate::ErrorCode::UnauthorizedNotDelegate)]
    pub escrow: Box<Account<'info, voter::Escrow>>,
    /// The vote delegate.
    /// #[account(mut)]
    pub vote_delegate: Signer<'info>,
}

pub fn handler(ctx: Context<RevertVote>) -> Result<()> {
    let gauge_factory = &ctx.accounts.gauge_factory;
    let mut gauge = ctx.accounts.gauge.load_mut()?;
    let mut gauge_voter = ctx.accounts.gauge_voter.load_mut()?;
    let mut gauge_vote = ctx.accounts.gauge_vote.load_mut()?;

    let current_epoch_gauge_vote_index =
        gauge_vote.get_index_for_voting_epoch(gauge_factory.current_voting_epoch)?;

    let gauge_vote_item = &mut gauge_vote.vote_epochs[current_epoch_gauge_vote_index];

    let power_subtract = gauge_vote_item.allocated_power;

    let current_epoch_gauge_voter_vote_index =
        gauge_voter.get_index_for_voting_epoch(gauge_factory.current_voting_epoch)?;
    let epoch_gauge_voter_item = &mut gauge_voter.vote_epochs[current_epoch_gauge_voter_vote_index];

    epoch_gauge_voter_item.allocated_power = unwrap_int!(epoch_gauge_voter_item
        .allocated_power
        .checked_sub(power_subtract));

    let index = gauge.get_index_for_voting_epoch(gauge_factory.current_voting_epoch)?;
    let vote_epoch = &mut gauge.vote_epochs[index];
    vote_epoch.total_power = unwrap_int!(vote_epoch.total_power.checked_sub(power_subtract));

    gauge_vote.reset_voting_epoch(current_epoch_gauge_vote_index);

    emit!(RevertVoteEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        gauge: ctx.accounts.gauge.key(),
        gauge_voter_owner: ctx.accounts.escrow.owner,
        subtracted_power: power_subtract,
        voting_epoch: gauge_factory.current_voting_epoch,
        updated_allocated_power: epoch_gauge_voter_item.allocated_power,
        updated_total_power: vote_epoch.total_power,
    });

    Ok(())
}

impl<'info> Validate<'info> for RevertVote<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [gauge::revert_vote].
#[event]
pub struct RevertVoteEvent {
    #[index]
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    #[index]
    /// The [Gauge].
    pub gauge: Pubkey,
    #[index]
    /// Owner of the Escrow of the [GaugeVoter].
    pub gauge_voter_owner: Pubkey,
    /// The epoch that the [GaugeVoter] is voting for.
    pub voting_epoch: u32,
    /// Allocated power subtracted
    pub subtracted_power: u64,
    /// The total amount of gauge voting power that has been allocated for the epoch voter.
    pub updated_allocated_power: u64,
    /// The total number of power to be applied to the latest voted epoch gauge.
    pub updated_total_power: u64,
}
