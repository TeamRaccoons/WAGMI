//! Creates an [EpochGaugeVoter].

use crate::*;
use num_traits::ToPrimitive;

/// Accounts for [gauge::prepare_epoch_gauge_voter].
#[derive(Accounts)]
pub struct PrepareVote<'info> {
    #[account(has_one = locker)]
    pub gauge_factory: Account<'info, GaugeFactory>,
    pub locker: Account<'info, voter::Locker>,
    #[account(has_one = locker, has_one = vote_delegate)]
    pub escrow: Account<'info, voter::Escrow>,

    /// [GaugeVoter].
    #[account(mut, has_one = gauge_factory, has_one = escrow)]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,

    /// The vote delegate.
    pub vote_delegate: Signer<'info>,
}

impl<'info> PrepareVote<'info> {
    /// Calculates the voting power.
    fn power(&self) -> Option<u64> {
        self.escrow.voting_power_at_time(
            &self.locker,
            self.gauge_factory.next_epoch_starts_at.to_i64()?,
        )
    }
}

pub fn handler(ctx: Context<PrepareVote>) -> Result<()> {
    let voting_epoch = ctx.accounts.gauge_factory.current_voting_epoch;
    let voting_power = unwrap_int!(ctx.accounts.power());

    let mut gauge_voter = ctx.accounts.gauge_voter.load_mut()?;
    let weight_change_seqno = gauge_voter.weight_change_seqno;
    let index = gauge_voter.pump_and_get_index_for_lastest_voting_epoch(voting_epoch);
    let vote_epoch = &mut gauge_voter.vote_epochs[index];

    require!(
        vote_epoch.voting_epoch != voting_epoch,
        crate::ErrorCode::RecreatedVotingEpoch
    );

    vote_epoch.voting_epoch = voting_epoch;
    vote_epoch.weight_change_seqno = weight_change_seqno;
    vote_epoch.voting_power = voting_power;

    emit!(PrepareVoteEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        rewarder: ctx.accounts.gauge_factory.rewarder,
        locker: ctx.accounts.locker.key(),
        gauge_voter_owner: ctx.accounts.escrow.owner,
        voting_epoch,
        voting_power,
        weight_change_seqno: vote_epoch.weight_change_seqno,
    });

    Ok(())
}

impl<'info> Validate<'info> for PrepareVote<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [gauge::prepare_vote].
#[event]
pub struct PrepareVoteEvent {
    #[index]
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    #[index]
    /// The [Rewarder]
    pub rewarder: Pubkey,
    #[index]
    /// The assocated [voter::Locker].
    pub locker: Pubkey,
    #[index]
    /// The owner of the [GaugeVoter].
    pub gauge_voter_owner: Pubkey,
    /// The epoch that the [GaugeVoter] is voting for.
    pub voting_epoch: u32,
    /// The total amount of voting power.
    pub voting_power: u64,
    /// The [GaugeVoter::weight_change_seqno] at the time of creating the [EpochGaugeVoter].
    pub weight_change_seqno: u64,
}
