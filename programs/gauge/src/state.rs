//! Struct definitions for accounts that hold state.

use quarry::math::safe_math::SafeMath;

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
#[account(zero_copy)]
#[derive(Debug, InitSpace)]
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

    /// Total fee of token a in all epochs so far
    pub cummulative_token_a_fee: u128,
    /// Total fee of token b in all epochs so far
    pub cummulative_token_b_fee: u128,

    /// Total claimed fee of token a in all epochs so far
    /// invariant: token_a_fee.amount + cummulative_claimed_token_a_fee = cummulative_token_a_fee
    pub cummulative_claimed_token_a_fee: u128,
    /// Total claimed fee of token b in all epochs so far
    pub cummulative_claimed_token_b_fee: u128,

    /// token_a_mint of amm pool, only used for tracking
    pub token_a_mint: Pubkey,
    /// token_b_fee_mint of amm pool, only used for tracking
    pub token_b_mint: Pubkey,

    /// ring buffer to store vote for all epochs
    pub current_index: u64,
    /// If true, this Gauge cannot receive any more votes
    /// and rewards shares cannot be synchronized from it.
    pub is_disabled: u32,
    /// Gauge type
    pub amm_type: u32,
    pub vote_epochs: [EpochGauge; MAX_EPOCH_PER_GAUGE],
}

/// A [GaugeVoter] represents an [voter::Escrow] that can vote on gauges.
#[account(zero_copy)]
#[derive(Debug, InitSpace)]
pub struct GaugeVoter {
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    /// The Escrow of the [GaugeVoter].
    pub escrow: Pubkey,

    /// Owner of the Escrow of the [GaugeVoter].
    pub owner: Pubkey,

    /// This number gets incremented whenever weights are changed.
    /// Use this to determine if votes must be re-committed.
    ///
    /// This is primarily used when provisioning an [EpochGaugeVoter]:
    /// 1. When one wants to commit their votes, they call [gauge::prepare_epoch_gauge_voter]
    /// 2. The [Self::weight_change_seqno] gets written to [EpochGaugeVoter::weight_change_seqno].
    /// 3. In [gauge::gauge_commit_vote], if the [Self::weight_change_seqno] has changed, the transaction is blocked with a [crate::ErrorCode::WeightSeqnoChanged] error.
    pub weight_change_seqno: u64,

    /// Total number of parts that the voter has distributed.
    pub total_weight: u32,

    /// ring buffer to store epochgaugeVoter
    pub current_index: u32,
    pub _padding: u64,
    pub vote_epochs: [EpochGaugeVoter; MAX_EPOCH_PER_GAUGE],
}

/// A [GaugeVote] is a user's vote for a given [Gauge].
#[account(zero_copy)]
#[derive(Debug, InitSpace)]
pub struct GaugeVote {
    /// The [GaugeVoter].
    pub gauge_voter: Pubkey,
    /// The [Gauge] being voted on.
    pub gauge: Pubkey,

    /// Proportion of votes that the voter is applying to this gauge.
    pub weight: u32,
    pub _padding_1: [u8; 12],

    /// stats to track how many fee user has claimed
    pub claimed_token_a_fee: u128,
    /// stats to track how many fee user has claimed
    pub claimed_token_b_fee: u128,

    /// ring buffer to store vote for all epochs
    pub current_index: u64,
    pub last_claim_a_fee_epoch: u32,
    pub last_claim_b_fee_epoch: u32,
    pub vote_epochs: [GaugeVoteItem; MAX_EPOCH_PER_GAUGE],
}

impl GaugeVote {
    // pub fn update_vote(&mut self, weight: u32) {
    //     self.weight = weight;
    // }
    pub fn init(&mut self, gauge_voter: Pubkey, gauge: Pubkey) {
        self.gauge_voter = gauge_voter;
        self.gauge = gauge;
        self.last_claim_a_fee_epoch = 1;
        self.last_claim_b_fee_epoch = 1;
        self.vote_epochs = [GaugeVoteItem::default(); MAX_EPOCH_PER_GAUGE];
    }

    pub fn weightx(&self) -> u32 {
        self.weight
    }

    #[allow(clippy::unwrap_used)]
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

    pub fn reset_voting_epoch(&mut self, current_vote_index: usize) -> Result<()> {
        self.vote_epochs[current_vote_index] = GaugeVoteItem::default();
        let current_index = unwrap_int!(current_vote_index.checked_add(MAX_EPOCH_PER_GAUGE));
        let current_index = unwrap_int!(current_index.checked_sub(1)) % MAX_EPOCH_PER_GAUGE;

        self.current_index =
            u64::try_from(current_index).map_err(|_e| VipersError::IntegerOverflow)?;
        Ok(())
    }

    pub fn claim_a_fee(&mut self, to_epoch: u32, gauge: &Gauge) -> Result<u64> {
        let mut total_fee_amount = 0u64;
        for i in self.last_claim_a_fee_epoch..=to_epoch {
            match self.get_index_for_voting_epoch(i) {
                Ok(index) => {
                    let fee_amount = unwrap_opt!(
                        gauge.get_allocated_fee_a(self.vote_epochs[index].allocated_power, i)
                    );

                    total_fee_amount = total_fee_amount.safe_add(fee_amount)?;
                }
                Err(_err) => continue,
            }
        }
        self.claimed_token_a_fee = self.claimed_token_a_fee.safe_add(total_fee_amount.into())?;
        self.last_claim_a_fee_epoch = to_epoch;
        Ok(total_fee_amount)
    }

    pub fn claim_b_fee(&mut self, to_epoch: u32, gauge: &Gauge) -> Result<u64> {
        let mut total_fee_amount = 0u64;
        for i in self.last_claim_b_fee_epoch..=to_epoch {
            match self.get_index_for_voting_epoch(i) {
                Ok(index) => {
                    let fee_amount = unwrap_opt!(
                        gauge.get_allocated_fee_b(self.vote_epochs[index].allocated_power, i)
                    );

                    total_fee_amount = total_fee_amount.safe_add(fee_amount)?;
                }
                Err(_err) => continue,
            }
        }
        self.claimed_token_b_fee = self.claimed_token_b_fee.safe_add(total_fee_amount.into())?;
        self.last_claim_b_fee_epoch = to_epoch;
        Ok(total_fee_amount)
    }

    pub fn get_allocated_power(&self, epoch: u32) -> u64 {
        for vote_epoch in self.vote_epochs.iter() {
            if vote_epoch.voting_epoch == epoch {
                return vote_epoch.allocated_power;
            }
        }
        return 0;
    }
}

impl Default for GaugeVote {
    fn default() -> Self {
        GaugeVote {
            gauge_voter: Pubkey::default(),
            gauge: Pubkey::default(),
            weight: 0,
            _padding_1: [0u8; 12],
            claimed_token_a_fee: 0,
            claimed_token_b_fee: 0,
            current_index: 0,
            last_claim_a_fee_epoch: 0,
            last_claim_b_fee_epoch: 0,
            // _padding_2: 0u,
            vote_epochs: [GaugeVoteItem::default(); MAX_EPOCH_PER_GAUGE],
        }
    }
}

#[zero_copy]
#[derive(Default, Debug, InitSpace)]
#[repr(C)]
pub struct GaugeVoteItem {
    pub voting_epoch: u32,
    pub _padding: u32,
    // pub is_fee_a_claimed: u16,
    // pub is_fee_b_claimed: u16,
    pub allocated_power: u64,
}

// impl GaugeVoteItem {
//     pub fn is_fee_a_claimed(&self) -> bool {
//         self.is_fee_a_claimed == 1
//     }
//     pub fn is_fee_b_claimed(&self) -> bool {
//         self.is_fee_b_claimed == 1
//     }
//     pub fn set_fee_a_claimed(&mut self) {
//         self.is_fee_a_claimed = 1
//     }
//     pub fn set_fee_b_claimed(&mut self) {
//         self.is_fee_b_claimed = 1
//     }
// }

#[zero_copy]
#[derive(Default, Debug, InitSpace)]
#[repr(C)]
pub struct EpochGauge {
    pub voting_epoch: u32,
    pub _padding: u32,
    pub total_power: u64,
    /// Token a fee in this epoch
    pub token_a_fee: u128,
    /// Token b fee in this epoch
    pub token_b_fee: u128,
}

impl Gauge {
    pub fn is_epoch_voted(&self, voting_epoch: u32) -> bool {
        for vote_epoch in self.vote_epochs.iter() {
            if vote_epoch.voting_epoch == voting_epoch && vote_epoch.total_power != 0 {
                return true;
            }
        }
        return false;
    }

    pub fn get_index_for_voting_epoch(&self, voting_epoch: u32) -> Result<usize> {
        for (i, vote_epoch) in self.vote_epochs.iter().enumerate() {
            if vote_epoch.voting_epoch == voting_epoch {
                return Ok(i);
            }
        }
        return Err(VotingEpochNotFound.into());
    }

    #[allow(clippy::unwrap_used)]
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
        self.current_index.try_into().unwrap()
    }

    pub fn total_power(&self, voting_epoch: u32) -> u64 {
        for (i, vote_epoch) in self.vote_epochs.iter().enumerate() {
            if vote_epoch.voting_epoch == voting_epoch {
                return vote_epoch.total_power;
            }
        }
        return 0;
    }
    pub fn get_allocated_fee_a(&self, allocated_power: u64, voting_epoch: u32) -> Option<u64> {
        for (i, vote_epoch) in self.vote_epochs.iter().enumerate() {
            if vote_epoch.voting_epoch == voting_epoch {
                let token_fee = vote_epoch.token_a_fee;
                let allocated_power = allocated_power.into();
                let total_power = vote_epoch.total_power as u128;

                return u64::try_from(
                    token_fee
                        .checked_mul(allocated_power)?
                        .checked_div(total_power)?,
                )
                .ok();
            }
        }
        return Some(0);
    }
    pub fn get_allocated_fee_b(&self, allocated_power: u64, voting_epoch: u32) -> Option<u64> {
        for (i, vote_epoch) in self.vote_epochs.iter().enumerate() {
            if vote_epoch.voting_epoch == voting_epoch {
                let token_fee = vote_epoch.token_b_fee;
                let allocated_power = allocated_power.into();
                let total_power = vote_epoch.total_power as u128;

                return u64::try_from(
                    token_fee
                        .checked_mul(allocated_power)?
                        .checked_div(total_power)?,
                )
                .ok();
            }
        }
        return Some(0);
    }
}

impl GaugeVoter {
    pub fn get_index_for_voting_epoch(&self, voting_epoch: u32) -> Result<usize> {
        for (i, vote_epoch) in self.vote_epochs.iter().enumerate() {
            if vote_epoch.voting_epoch == voting_epoch {
                return Ok(i);
            }
        }
        return Err(VotingEpochNotFound.into());
    }

    #[allow(clippy::unwrap_used)]
    // should return if it not pump
    pub fn pump_and_get_index_for_lastest_voting_epoch(
        &mut self,
        latest_voting_epoch: u32,
    ) -> usize {
        let current_index: usize = self.current_index.try_into().unwrap();
        if self.vote_epochs[current_index].voting_epoch == latest_voting_epoch {
            return current_index;
        }
        let current_index = current_index.checked_add(1).unwrap() % MAX_EPOCH_PER_GAUGE;
        self.current_index = u32::try_from(current_index).unwrap();
        // self.vote_epochs[current_index].voting_epoch = latest_voting_epoch;
        self.current_index.try_into().unwrap()
    }

    pub fn get_allocated_power(&self, voting_epoch: u32) -> u64 {
        for (i, vote_epoch) in self.vote_epochs.iter().enumerate() {
            if vote_epoch.voting_epoch == voting_epoch {
                return vote_epoch.allocated_power;
            }
        }
        return 0;
    }
}

#[zero_copy]
#[derive(Default, Debug, InitSpace)]
#[repr(C)]
pub struct EpochGaugeVoter {
    pub voting_epoch: u32,
    pub _padding: u32,
    pub weight_change_seqno: u64,
    /// The total amount of voting power.
    pub voting_power: u64,
    /// The total amount of gauge voting power that has been allocated.
    /// If this number is non-zero, vote weights cannot be changed until they are all withdrawn.
    pub allocated_power: u64,
}

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
    /// gauge voter
    pub gauge_voter: Pubkey,

    /// last claimed epoch
    pub last_claimed_epoch: u32,

    /// claimed amount
    pub claimed_amount: u128,
}

impl EpochBribeVoter {
    pub fn init(&mut self, bribe: Pubkey, gauge_voter: Pubkey) {
        self.bribe = bribe;
        self.gauge_voter = gauge_voter;
        // self.last_claimed_epoch = current_voting_epoch;
    }

    pub fn claim_rewards(
        &mut self,
        from_epoch: u32,
        last_epoch: u32,
        rewards_epoch_epoch: u64,
        gauge_voter: &GaugeVote,
        gauge: &Gauge,
    ) -> Result<u64> {
        let mut rewards = 0u64;
        for i in from_epoch..=last_epoch {
            let allocated_power = gauge_voter.get_allocated_power(i);
            let total_power = gauge.total_power(i);

            rewards = rewards.safe_add(
                allocated_power
                    .safe_mul(rewards_epoch_epoch)?
                    .safe_div(total_power)?,
            )?;
        }

        self.last_claimed_epoch = last_epoch;
        self.claimed_amount = self.claimed_amount.safe_add(rewards.into())?;

        Ok(rewards)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_size() {
        let size = Gauge::INIT_SPACE;
        let fee = 3480 * 2 * size;
        println!("Gauge {} {}", size, fee as f64 / 1000_000_000.0);

        let size = GaugeVote::INIT_SPACE;
        let fee = 3480 * 2 * size;
        println!("GaugeVote {} {}", size, fee as f64 / 1000_000_000.0);

        let size: usize = GaugeVoter::INIT_SPACE;
        let fee = 3480 * 2 * size;
        println!("GaugeVoter {} {}", size, fee as f64 / 1000_000_000.0);
    }
}
