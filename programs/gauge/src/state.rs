//! Struct definitions for accounts that hold state.

use crate::constants::MAX_EPOCH_PER_GAUGE;
use crate::ErrorCode::VotingEpochNotFound;
use crate::*;

/// Manages the rewards shares of all [Gauge]s of a [quarry::rewarder].
#[account]
#[derive(Copy, Debug, Default)]
pub struct GaugeFactory {
    /// Base.
    pub base: Pubkey,
    /// Bump seed.
    pub bump: u8,

    // /// The Rewarder.
    pub rewarder: Pubkey,

    /// The [voter::Locker].
    pub locker: Pubkey,
    /// Account which may enable/disable gauges on the [GaugeFactory].
    /// Normally this should be smartwallet
    /// May call the following instructions:
    /// - gauge_enable
    /// - gauge_disable
    pub foreman: Pubkey,
    /// Number of seconds per rewards epoch.
    /// This may be modified later.
    /// The epoch duration is not exact, as epochs must manually be incremented.
    pub epoch_duration_seconds: u32,

    /// The current voting epoch, start from 1
    pub current_voting_epoch: u32,
    /// When the next epoch starts.
    pub next_epoch_starts_at: u64,
    /// bribe index
    pub bribe_index: u32,
}

impl GaugeFactory {
    /// Fetches the current rewards epoch (for set rewards share in quarry). This is always the epoch before [Self::current_voting_epoch].
    pub fn rewards_epoch(&self) -> Result<u32> {
        let voting_epoch = unwrap_int!(self.current_voting_epoch.checked_sub(1));
        Ok(voting_epoch)
    }

    /// Fetches the current distribute rewards epoch (for claim fee and bribe). This is always the epoch after [Self::current_voting_epoch].
    pub fn distribute_rewards_epoch(&self) -> Result<u32> {
        let distribute_rewards_epoch = unwrap_int!(self.current_voting_epoch.checked_add(1));
        Ok(distribute_rewards_epoch)
    }

    pub fn inc_bribe_index(&mut self) -> Result<()> {
        self.bribe_index = unwrap_int!(self.bribe_index.checked_add(1));
        Ok(())
    }
}

/// A [Gauge] determines the rewards shares to give to a [quarry::Quarry].
#[account]
#[derive(Copy, Debug, Default)]
pub struct Gauge {
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    /// The [quarry::Quarry] being voted on.
    pub quarry: Pubkey,
    /// The [amm::Amm] being voted on.
    /// Can be meteora pool or Lbclmm
    pub amm_pool: Pubkey,
    /// token_a_fee_key of amm pool
    pub token_a_fee_key: Pubkey,
    /// token_b_fee_key of amm pool
    pub token_b_fee_key: Pubkey,
    /// If true, this Gauge cannot receive any more votes
    /// and rewards shares cannot be synchronized from it.
    pub is_disabled: bool,
    /// Total fee of token a in all epochs so far
    pub cummulative_token_a_fee: u128,
    /// Total fee of token b in all epochs so far
    pub cummulative_token_b_fee: u128,

    /// Total claimed fee of token a in all epochs so far
    /// invariant: token_a_fee.amount + cummulative_claimed_token_a_fee = cummulative_token_a_fee
    pub cummulative_claimed_token_a_fee: u128,
    /// Total claimed fee of token b in all epochs so far
    pub cummulative_claimed_token_b_fee: u128,
    /// Gauge type
    pub amm_type: u64,
    /// token_a_mint of amm pool, only used for tracking
    pub token_a_mint: Pubkey,
    /// token_b_fee_mint of amm pool, only used for tracking
    pub token_b_mint: Pubkey,
}

/// A [GaugeVoter] represents an [voter::Escrow] that can vote on gauges.
#[account]
#[derive(Copy, Debug, Default)]
pub struct GaugeVoter {
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    /// The Escrow of the [GaugeVoter].
    pub escrow: Pubkey,

    /// Owner of the Escrow of the [GaugeVoter].
    pub owner: Pubkey,
    /// Total number of parts that the voter has distributed.
    pub total_weight: u32,
    /// This number gets incremented whenever weights are changed.
    /// Use this to determine if votes must be re-committed.
    ///
    /// This is primarily used when provisioning an [EpochGaugeVoter]:
    /// 1. When one wants to commit their votes, they call [gauge::prepare_epoch_gauge_voter]
    /// 2. The [Self::weight_change_seqno] gets written to [EpochGaugeVoter::weight_change_seqno].
    /// 3. In [gauge::gauge_commit_vote], if the [Self::weight_change_seqno] has changed, the transaction is blocked with a [crate::ErrorCode::WeightSeqnoChanged] error.
    pub weight_change_seqno: u64,
}

/// A [GaugeVote] is a user's vote for a given [Gauge].
#[account(zero_copy)]
#[derive(Debug)]
pub struct GaugeVote {
    /// The [GaugeVoter].
    pub gauge_voter: Pubkey,
    /// The [Gauge] being voted on.
    pub gauge: Pubkey,

    /// Proportion of votes that the voter is applying to this gauge.
    pub weight: u32,

    /// stats to track how many fee user has claimed
    pub claimed_token_a_fee: u128,
    /// stats to track how many fee user has claimed
    pub claimed_token_b_fee: u128,

    /// ring buffer to store vote for all epochs
    pub current_index: u64,
    pub vote_epochs: [GaugeVoteEpoch; MAX_EPOCH_PER_GAUGE],
}

impl GaugeVote {
    pub fn pump_and_get_index_for_lastest_voting_epoch(
        &mut self,
        latest_voting_epoch: u32,
    ) -> usize {
        let current_index: usize = self.current_index.try_into().unwrap();
        if self.vote_epochs[current_index].voting_epoch == latest_voting_epoch {
            return current_index;
        }
        let current_index = current_index.checked_add(1).unwrap() % MAX_EPOCH_PER_GAUGE;
        self.current_index = u64::try_from(current_index).unwrap();
        self.vote_epochs[current_index].voting_epoch = latest_voting_epoch;
        self.current_index.try_into().unwrap()
    }

    pub fn get_index_for_voting_epoch(&self, voting_epoch: u32) -> Result<usize> {
        for (i, vote_epoch) in self.vote_epochs.iter().enumerate() {
            if vote_epoch.voting_epoch == voting_epoch {
                return Ok(i);
            }
        }
        return Err(VotingEpochNotFound.into());
    }
}

impl Default for GaugeVote {
    fn default() -> Self {
        GaugeVote {
            gauge_voter: Pubkey::default(),
            gauge: Pubkey::default(),
            weight: 0,
            claimed_token_a_fee: 0,
            claimed_token_b_fee: 0,
            current_index: 0,
            vote_epochs: [GaugeVoteEpoch::default(); MAX_EPOCH_PER_GAUGE],
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct GaugeVoteEpoch {
    pub voting_epoch: u32,
    pub allocated_power: u64,
    // pub is_voted: bool,
    pub is_fee_a_claimed: bool,
    pub is_fee_b_claimed: bool,
}

/// An [EpochGauge] is a [Gauge]'s total committed votes for a given epoch.
///
/// Seeds:
/// ```text
/// [
///     b"EpochGauge".as_ref(),
///     gauge.key().as_ref(),
///     voting_epoch.to_le_bytes().as_ref()
/// ],
/// ```
#[account]
#[derive(Copy, Debug, Default)]
pub struct EpochGauge {
    /// The [Gauge].
    pub gauge: Pubkey,
    /// The epoch associated with this [EpochGauge].
    pub voting_epoch: u32,
    /// The total number of power to be applied to the latest voted epoch.
    /// If this number is non-zero, vote weights cannot be changed until they are all withdrawn.
    pub total_power: u64,
    /// Token a fee in this epoch
    pub token_a_fee: u128,
    /// Token b fee in this epoch
    pub token_b_fee: u128,
}

impl EpochGauge {
    pub fn get_allocated_fee_a(&self, epoch_gauge_voter: &EpochGaugeVoter) -> Option<u64> {
        let token_fee = self.token_a_fee;
        let allocated_power = epoch_gauge_voter.allocated_power as u128;
        let total_power = self.total_power as u128;

        u64::try_from(
            token_fee
                .checked_mul(allocated_power)?
                .checked_div(total_power)?,
        )
        .ok()
    }
    pub fn get_allocated_fee_b(&self, epoch_gauge_voter: &EpochGaugeVoter) -> Option<u64> {
        let token_fee = self.token_b_fee;
        let allocated_power = epoch_gauge_voter.allocated_power as u128;
        let total_power = self.total_power as u128;

        u64::try_from(
            token_fee
                .checked_mul(allocated_power)?
                .checked_div(total_power)?,
        )
        .ok()
    }
}

/// An [EpochGaugeVoter] is a [GaugeVoter]'s total committed votes for a
/// given [Gauge] at a given epoch.
#[account]
#[derive(Copy, Debug, Default)]
pub struct EpochGaugeVoter {
    /// The [GaugeVoter].
    pub gauge_voter: Pubkey,
    /// The epoch that the [GaugeVoter] is voting for.
    pub voting_epoch: u32,
    /// The [GaugeVoter::weight_change_seqno] at the time of creating the [EpochGaugeVoter].
    /// If this number is not equal to the [GaugeVoter::weight_change_seqno],
    /// this commitment is stale and must be reset before applying any new votes for this epoch.
    pub weight_change_seqno: u64,
    /// The total amount of voting power.
    pub voting_power: u64,
    /// The total amount of gauge voting power that has been allocated.
    /// If this number is non-zero, vote weights cannot be changed until they are all withdrawn.
    pub allocated_power: u64,
    /// whether user has claimed fee a
    pub is_fee_a_claimed: bool,
    /// whether user has claimed fee b
    pub is_fee_b_claimed: bool,
}

/// An [EpochGaugeVote] is a user's committed votes for a given [Gauge] at a given epoch.
///
/// Seeds:
/// ```text
/// [
///     b"EpochGaugeVote",
///     gauge_vote.key().as_ref(),
///     voting_epoch.to_le_bytes().as_ref(),
/// ];
/// ```
// #[account]
// #[derive(Copy, Debug, Default)]
// pub struct EpochGaugeVote {
//     /// The rewards share used to vote for the derived epoch.
//     /// This is calculated from:
//     /// ```rs
//     /// vote_power_at_expiry * (weight / total_weight)
//     /// ```
//     pub allocated_power: u64,
// }

// impl EpochGaugeVote {
//     /// Finds the address of an [EpochGaugeVote] for a given [GaugeVote] and voting epoch.
//     pub fn find_program_address(gauge_vote: &Pubkey, voting_epoch: u32) -> (Pubkey, u8) {
//         let epoch_bytes = voting_epoch.to_le_bytes();
//         Pubkey::find_program_address(
//             &[b"EpochGaugeVote", gauge_vote.as_ref(), epoch_bytes.as_ref()],
//             &crate::ID,
//         )
//     }
// }

/// Bribe with a gauge
#[account]
#[derive(Copy, Debug, Default)]
pub struct Bribe {
    /// The gauge bribe for
    pub gauge: Pubkey,
    /// token mint of the bribe
    pub token_mint: Pubkey,
    /// reward for each epoch of bribe
    pub reward_each_epoch: u64,
    /// user who give the bribe
    pub briber: Pubkey,
    /// token account store bribe
    pub token_account_vault: Pubkey,
    /// When bribe epoch end
    pub bribe_rewards_epoch_start: u32,
    /// When bribe epoch end
    pub bribe_rewards_epoch_end: u32,
    /// Claimed amount, just for display
    pub claimed_amount: u64,
    /// bribe index
    pub bribe_index: u32,
}

impl Bribe {
    /// Find rewards for an user in an epoch
    pub fn get_rewards_for_an_epoch(&self, allocated_power: u64, total_power: u64) -> Option<u64> {
        let reward_each_epoch = u128::from(self.reward_each_epoch);
        let allocated_power = u128::from(allocated_power);
        let total_power = u128::from(total_power);
        let rewards = reward_each_epoch
            .checked_mul(allocated_power)?
            .checked_div(total_power)?;
        u64::try_from(rewards).ok()
    }
}

/// An [EpochBribeVoter]
#[account]
#[derive(Copy, Debug, Default)]
pub struct EpochBribeVoter {
    /// The [Bribe].
    pub bribe: Pubkey,
    /// The rewards epoch that the [GuageVoter] claim rewards for.
    pub voting_epoch: u32,
    /// gauge voter
    pub gauge_voter: Pubkey,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gauge_vote_size() {
        let size = std::mem::size_of::<GaugeVote>();
        println!("{}", size);

        let fee = 3480 * 2 * size;
        println!("SOL {}", fee as f64 / 1000_000_000.0);
    }
}
