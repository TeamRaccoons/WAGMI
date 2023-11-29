//! Resets an [EpochGaugeVoter] to the latest power.

use crate::*;
use num_traits::ToPrimitive;
use vipers::{invariant, unwrap_int};

/// Accounts for [gauge::reset_vote].
#[derive(Accounts)]
pub struct ResetVote<'info> {
    #[account(has_one = locker)]
    pub gauge_factory: Account<'info, GaugeFactory>,

    /// The [GaugeFactory::locker].
    pub locker: Account<'info, voter::Locker>,

    /// The [GaugeVoter::escrow].
    #[account(has_one = locker)]
    pub escrow: Account<'info, voter::Escrow>,

    /// The [EpochGaugeVoter::gauge_voter].
    #[account(mut, has_one = gauge_factory, has_one = escrow)]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,
}

impl<'info> ResetVote<'info> {
    /// Calculates the voting power.
    fn power(&self) -> Option<u64> {
        self.escrow.voting_power_at_time(
            &self.locker,
            self.gauge_factory.next_epoch_starts_at.to_i64()?,
        )
    }
}

pub fn handler(ctx: Context<ResetVote>) -> Result<()> {
    let voting_power = unwrap_int!(ctx.accounts.power());

    let mut gauge_voter = ctx.accounts.gauge_voter.load_mut()?;
    let weight_change_seqno = gauge_voter.weight_change_seqno;
    let index =
        gauge_voter.get_index_for_voting_epoch(ctx.accounts.gauge_factory.current_voting_epoch)?;
    let vote_epoch = &mut gauge_voter.vote_epochs[index];

    invariant!(vote_epoch.allocated_power == 0, AllocatedPowerMustBeZero);

    let prev_weight_change_seqno = vote_epoch.weight_change_seqno;
    let prev_voting_power = vote_epoch.voting_power;

    vote_epoch.voting_power = voting_power;
    vote_epoch.weight_change_seqno = weight_change_seqno;

    emit!(ResetVoteEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        gauge_voter_owner: ctx.accounts.escrow.owner,
        prev_voting_power,
        voting_power: vote_epoch.voting_power,
        prev_weight_change_seqno,
        weight_change_seqno: vote_epoch.weight_change_seqno
    });

    Ok(())
}

impl<'info> Validate<'info> for ResetVote<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [gauge::reset_vote].
#[event]
pub struct ResetVoteEvent {
    #[index]
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    #[index]
    /// Owner of the Escrow of the [GaugeVoter].
    pub gauge_voter_owner: Pubkey,
    pub prev_voting_power: u64,
    pub voting_power: u64,
    pub prev_weight_change_seqno: u64,
    pub weight_change_seqno: u64,
}
