//! Commits the votes for a [Gauge].

use crate::*;

/// Accounts for [gauge::commit_vote].
#[derive(Accounts)]
pub struct CommitVote<'info> {
    /// The [GaugeFactory].
    pub gauge_factory: Account<'info, GaugeFactory>,
    /// The [Gauge].
    #[account(mut, has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,
    /// The [GaugeVoter].
    #[account(mut, has_one = gauge_factory, has_one = escrow)]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,
    /// The [GaugeVote] containing the vote weights.
    #[account(mut, has_one = gauge_voter, has_one = gauge)]
    pub gauge_vote: AccountLoader<'info, GaugeVote>,

    // TODO check the make sure that only vote_delegate can call this
    /// The escrow.
    #[account(has_one = vote_delegate @ crate::ErrorCode::UnauthorizedNotDelegate)]
    pub escrow: Account<'info, voter::Escrow>,

    /// The vote delegate.
    pub vote_delegate: Signer<'info>,
}

fn mul_div_u64(x: u64, y: u64, z: u64) -> Option<u64> {
    let x: u128 = x.into();
    let y: u128 = y.into();
    let z: u128 = z.into();
    u64::try_from(x.checked_mul(y)?.checked_div(z)?).ok()
}
impl<'info> CommitVote<'info> {
    fn vote_shares_for_next_epoch(
        &self,
        weight: u32,
        total_weight: u32,
        power: u64,
    ) -> Option<u64> {
        if weight == 0 {
            return Some(0);
        }
        // let power: u64 = self.epoch_gauge_voter.voting_power;
        let total_shares = mul_div_u64(power, weight.into(), total_weight.into())?;
        msg!("power: {}, shares: {}", power, total_shares);
        Some(total_shares)
    }
}

pub fn handler(ctx: Context<CommitVote>) -> Result<()> {
    let mut gauge_vote = ctx.accounts.gauge_vote.load_mut()?;
    let weight = gauge_vote.weight;

    let gauge_factory = &ctx.accounts.gauge_factory;
    let voting_epoch = gauge_factory.current_voting_epoch;

    let mut gauge = ctx.accounts.gauge.load_mut()?;

    invariant!(gauge.is_disabled == 0, CannotCommitGaugeDisabled);

    let mut gauge_voter = ctx.accounts.gauge_voter.load_mut()?;
    let weight_change_seqno = gauge_voter.weight_change_seqno;
    let total_weight = gauge_voter.total_weight;

    let current_vote_index =
        gauge_vote.pump_and_get_index_for_lastest_voting_epoch(voting_epoch)?;

    let gauge_vote_item = &mut gauge_vote.vote_epochs[current_vote_index];

    let current_epoch_gauge_voter_index = gauge_voter.get_index_for_voting_epoch(voting_epoch)?;
    let epoch_gauge_voter_item = &mut gauge_voter.vote_epochs[current_epoch_gauge_voter_index];

    invariant!(
        epoch_gauge_voter_item.weight_change_seqno == weight_change_seqno,
        WeightSeqnoChanged
    );

    let next_vote_shares: u64 = unwrap_int!(ctx.accounts.vote_shares_for_next_epoch(
        weight,
        total_weight,
        epoch_gauge_voter_item.voting_power
    ));

    // if zero vote shares, don't do anything
    if next_vote_shares == 0 {
        return Ok(());
    }

    epoch_gauge_voter_item.allocated_power = unwrap_int!(epoch_gauge_voter_item
        .allocated_power
        .checked_add(next_vote_shares));

    gauge_vote_item.allocated_power = next_vote_shares;

    let index = gauge.get_index_for_voting_epoch(gauge_factory.current_voting_epoch)?;
    let vote_epoch = &mut gauge.vote_epochs[index];

    vote_epoch.total_power = unwrap_int!(vote_epoch.total_power.checked_add(next_vote_shares));

    msg!("allocated_power {}", epoch_gauge_voter_item.allocated_power);

    emit!(CommitVoteEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        gauge: ctx.accounts.gauge.key(),
        gauge_voter_owner: ctx.accounts.escrow.owner,
        vote_shares_for_next_epoch: next_vote_shares,
        voting_epoch,
        updated_allocated_power: epoch_gauge_voter_item.allocated_power,
        updated_total_power: vote_epoch.total_power,
    });

    Ok(())
}

impl<'info> Validate<'info> for CommitVote<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [gauge::commit_vote].
#[event]
pub struct CommitVoteEvent {
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
    /// Vote shares for next epoch
    pub vote_shares_for_next_epoch: u64,
    /// The total amount of gauge voting power that has been allocated for the epoch voter.
    pub updated_allocated_power: u64,
    /// The total number of power to be applied to the latest voted epoch gauge.
    pub updated_total_power: u64,
}
