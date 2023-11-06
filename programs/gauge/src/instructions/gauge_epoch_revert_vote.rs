//! Reverts a vote.

use crate::*;

/// Accounts for [gauge::gauge_epoch_revert_vote].
#[derive(Accounts)]
pub struct GaugeEpochRevertVote<'info> {
    pub gauge_factory: Box<Account<'info, GaugeFactory>>,
    pub gauge: Box<Account<'info, Gauge>>,
    pub gauge_voter: Box<Account<'info, GaugeVoter>>,
    #[account(mut, has_one = gauge_voter, has_one = gauge)]
    pub gauge_vote: AccountLoader<'info, GaugeVote>,

    #[account(mut)]
    pub epoch_gauge: Box<Account<'info, EpochGauge>>,
    #[account(mut)]
    pub epoch_gauge_voter: Box<Account<'info, EpochGaugeVoter>>,

    /// The escrow.
    #[account(has_one = vote_delegate @ crate::ErrorCode::UnauthorizedNotDelegate)]
    pub escrow: Box<Account<'info, voter::Escrow>>,
    /// The vote delegate.
    pub vote_delegate: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

pub fn handler(ctx: Context<GaugeEpochRevertVote>) -> Result<()> {
    let gauge_factory = &ctx.accounts.gauge_factory;
    let epoch_gauge = &mut ctx.accounts.epoch_gauge;
    let epoch_gauge_voter = &mut ctx.accounts.epoch_gauge_voter;
    let mut gauge_vote = ctx.accounts.gauge_vote.load_mut()?;

    let current_vote_index =
        gauge_vote.get_index_for_voting_epoch(gauge_factory.current_voting_epoch)?;

    let vote_epoch = &mut gauge_vote.vote_epochs[current_vote_index];

    let power_subtract = vote_epoch.allocated_power;
    epoch_gauge_voter.allocated_power = unwrap_int!(epoch_gauge_voter
        .allocated_power
        .checked_sub(power_subtract));
    epoch_gauge.total_power = unwrap_int!(epoch_gauge.total_power.checked_sub(power_subtract));

    gauge_vote.reset_voting_epoch(current_vote_index);

    emit!(GaugeEpochRevertVoteEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        gauge: ctx.accounts.gauge.key(),
        gauge_voter_owner: ctx.accounts.gauge_voter.owner,
        subtracted_power: power_subtract,
        voting_epoch: epoch_gauge_voter.voting_epoch,
        updated_allocated_power: epoch_gauge_voter.allocated_power,
        updated_total_power: epoch_gauge.total_power,
    });

    Ok(())
}

impl<'info> Validate<'info> for GaugeEpochRevertVote<'info> {
    fn validate(&self) -> Result<()> {
        let voting_epoch = self.gauge_factory.current_voting_epoch;
        invariant!(
            self.epoch_gauge.voting_epoch == voting_epoch,
            EpochGaugeNotVoting
        );
        invariant!(
            self.epoch_gauge_voter.voting_epoch == voting_epoch,
            EpochGaugeNotVoting
        );

        assert_keys_eq!(self.epoch_gauge.gauge, self.gauge);
        assert_keys_eq!(self.epoch_gauge_voter.gauge_voter, self.gauge_voter);

        assert_keys_eq!(self.escrow, self.gauge_voter.escrow);
        assert_keys_eq!(self.vote_delegate, self.escrow.vote_delegate);

        Ok(())
    }
}

/// Event called in [gauge::gauge_epoch_revert_vote].
#[event]
pub struct GaugeEpochRevertVoteEvent {
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
