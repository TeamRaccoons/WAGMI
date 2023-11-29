//! Quarry-related math and helpers.

use anchor_lang::prelude::*;
use vipers::prelude::*;

use crate::MAX_REWARD;
use crate::{payroll::Payroll, Miner, Quarry, Rewarder};
use amm::AmmType;
use math::errors::ErrorCode::TypeCastFailed;
use num_traits::cast::ToPrimitive;
use std::cmp;
/// An action for a user to take on the staking pool.
pub enum StakeAction {
    /// Stake into a [Quarry].
    Stake,
    /// Withdraw from the [Quarry].
    Withdraw,
}

impl Quarry {
    /// Check whether the quarry is for lp_stake pool or lbclmm
    pub fn is_lp_pool(&self) -> bool {
        self.amm_type != AmmType::LbClmm.decode()
    }

    pub fn is_lb_clmm_pool(&self) -> bool {
        self.amm_type == AmmType::LbClmm.decode()
    }

    // /// Updates the quarry by synchronizing its rewards rate with the rewarder.
    pub fn update_rewards_internal(&mut self, current_ts: i64, rewarder: &Rewarder) -> Result<()> {
        let payroll: Payroll = (*self).into();
        let updated_rewards_per_token_stored = payroll.calculate_reward_per_token(current_ts)?;
        // Update quarry struct
        self.rewards_per_token_stored = updated_rewards_per_token_stored;
        self.annual_rewards_rate =
            rewarder.compute_quarry_annual_rewards_rate(self.rewards_share)?;

        for i in 0..MAX_REWARD {
            let mut reward_info = self.reward_infos[i];
            if reward_info.initialized() {
                reward_info.updated_rewards_per_token_stored(
                    u64::try_from(current_ts).ok().ok_or(TypeCastFailed)?,
                    self.total_tokens_deposited,
                )?;
            }
        }

        self.last_update_ts = payroll.last_time_reward_applicable(current_ts);

        Ok(())
    }

    /// Updates the quarry by synchronizing its rewards rate with the rewarder.
    pub fn get_and_update_lb_clmm_rewards_internal(
        &mut self,
        current_ts: i64,
        rewarder: &Rewarder,
        payroll: &Payroll,
    ) -> Result<u64> {
        let reward_emission = payroll.calculate_reward_emission(current_ts)?;
        self.annual_rewards_rate =
            rewarder.compute_quarry_annual_rewards_rate(self.rewards_share)?;
        self.last_update_ts = payroll.last_time_reward_applicable(current_ts);

        Ok(reward_emission.try_into().map_err(|_| TypeCastFailed)?)
    }

    /// Updates the quarry and miner with the latest info.
    /// <https://github.com/Synthetixio/synthetix/blob/aeee6b2c82588681e1f99202663346098d1866ac/contracts/StakingRewards.sol#L158>
    pub fn update_rewards_and_miner(
        &mut self,
        miner: &mut Miner,
        rewarder: &Rewarder,
        current_ts: i64,
    ) -> Result<()> {
        self.update_main_reward(miner, rewarder, current_ts)?;
        self.update_partner_rewards(miner, current_ts)?;

        self.last_update_ts = cmp::min(current_ts, self.famine_ts);
        Ok(())
    }

    /// Updates main reward
    fn update_main_reward(
        &mut self,
        miner: &mut Miner,
        rewarder: &Rewarder,
        current_ts: i64,
    ) -> Result<()> {
        let payroll: Payroll = (*self).into();

        let updated_rewards_per_token_stored = payroll.calculate_reward_per_token(current_ts)?;
        // Update quarry struct
        self.rewards_per_token_stored = updated_rewards_per_token_stored;
        self.annual_rewards_rate =
            rewarder.compute_quarry_annual_rewards_rate(self.rewards_share)?;

        let updated_rewards_earned = unwrap_int!(payroll
            .calculate_rewards_earned(
                current_ts,
                miner.balance,
                miner.rewards_per_token_paid,
                miner.rewards_earned,
            )?
            .to_u64());

        payroll.sanity_check(current_ts, updated_rewards_earned, miner)?;
        // Update miner struct
        miner.rewards_earned = updated_rewards_earned;
        miner.rewards_per_token_paid = self.rewards_per_token_stored;

        Ok(())
    }

    /// Updates partner rewards
    fn update_partner_rewards(&mut self, miner: &mut Miner, current_ts: i64) -> Result<()> {
        let current_time = u64::try_from(current_ts).ok().ok_or(TypeCastFailed)?;

        // update all rewards
        for i in 0..MAX_REWARD {
            let reward_info = &mut self.reward_infos[i];
            if reward_info.initialized() {
                reward_info
                    .updated_rewards_per_token_stored(current_time, self.total_tokens_deposited)?;
                let user_reward_info = &mut miner.reward_infos[i];
                user_reward_info.update_reward_per_token_stored(miner.balance, &reward_info)?;
            }
        }
        Ok(())
    }

    /// Processes a [StakeAction] for a [Miner],
    pub fn process_stake_action_internal(
        &mut self,
        action: StakeAction,
        current_ts: i64,
        rewarder: &Rewarder,
        miner: &mut Miner,
        amount: u64,
    ) -> Result<()> {
        self.update_rewards_and_miner(miner, rewarder, current_ts)?;

        match action {
            StakeAction::Stake => {
                miner.balance = unwrap_int!(miner.balance.checked_add(amount));
                self.total_tokens_deposited =
                    unwrap_int!(self.total_tokens_deposited.checked_add(amount));
            }
            StakeAction::Withdraw => {
                miner.balance = unwrap_int!(miner.balance.checked_sub(amount));
                self.total_tokens_deposited =
                    unwrap_int!(self.total_tokens_deposited.checked_sub(amount));
            }
        }

        Ok(())
    }
}
