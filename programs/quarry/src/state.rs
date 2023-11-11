//! State structs.

use crate::math::safe_math::SafeMath;
use crate::math::u128x128_math::{Rounding, SCALE_OFFSET};
use crate::math::utils_math::{safe_mul_div_cast, safe_mul_shr_cast, safe_shl_div_cast};
use crate::*;
pub const MAX_REWARD: usize = 3;

/// Controls token rewards distribution to all [Quarry]s.
/// The [Rewarder] is also the [minter::Minter] registered to the [minter::MintWrapper].
#[account]
#[derive(Copy, Default, Debug)]
pub struct Rewarder {
    /// Random pubkey used for generating the program address.
    pub base: Pubkey,
    /// Bump seed for program address.
    pub bump: u8,

    /// Admin who controls the rewarder
    pub admin: Pubkey,
    /// Pending admin which must accept the admin
    pub pending_admin: Pubkey,

    /// Number of [Quarry]s the [Rewarder] manages.
    /// If more than this many [Quarry]s are desired, one can create
    /// a second rewarder.
    pub num_quarries: u16,
    /// Amount of reward tokens distributed per day
    pub annual_rewards_rate: u64,
    /// Total amount of rewards shares allocated to [Quarry]s
    pub total_rewards_shares: u64,
    /// Mint wrapper.
    pub mint_wrapper: Pubkey,
    /// Mint of the rewards token for this [Rewarder].
    pub rewards_token_mint: Pubkey,

    /// Authority allowed to pause a [Rewarder].
    pub pause_authority: Pubkey,
    /// If true, all instructions on the [Rewarder] are paused other than [quarry::unpause].
    pub is_paused: bool,

    // operator can set rewards share, normally it is gauge factory
    pub mint_authority: Pubkey,
}

impl Rewarder {
    /// Asserts that this [Rewarder] is not paused.
    pub fn assert_not_paused(&self) -> Result<()> {
        invariant!(!self.is_paused, Paused);
        Ok(())
    }
}

/// A pool which distributes tokens to its [Miner]s.
#[account]
#[derive(Copy, Default)]
pub struct Quarry {
    /// Rewarder which manages this quarry
    pub rewarder: Pubkey,
    /// Amm pool this quarry is designated to
    pub amm_pool: Pubkey,
    /// Amm type, can be Meteora or LbClmm
    pub amm_type: u32,
    /// LP token this quarry is designated to
    pub token_mint_key: Pubkey,
    /// Bump.
    pub bump: u8,

    /// Index of the [Quarry].
    pub index: u16,
    /// Decimals on the token [Mint].
    // pub token_mint_decimals: u8, // This field is never used.
    /// Timestamp when quarry rewards cease
    pub famine_ts: i64,
    /// Timestamp of last checkpoint
    pub last_update_ts: i64,
    /// Rewards per token stored in the quarry
    pub rewards_per_token_stored: u128,
    /// Amount of rewards distributed to the quarry per year.
    pub annual_rewards_rate: u64,
    /// Rewards shared allocated to this quarry
    pub rewards_share: u64,
    /// Total number of tokens deposited into the quarry.
    pub total_tokens_deposited: u64,
    /// Number of [Miner]s.
    pub num_miners: u64,
    /// Other reward info, possibly from partners
    pub reward_infos: [RewardInfo; 3],
}

/// Other rewards beside main token
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct RewardInfo {
    /// Reward token mint.
    pub mint: Pubkey,
    /// Reward vault token account.
    pub vault: Pubkey,
    /// Authority account that allows to fund rewards
    pub funder: Pubkey,
    /// Reward duration
    pub reward_duration: u64, // 8
    /// Reward duration end
    pub reward_duration_end: u64, // 8
    /// Reward rate
    pub reward_rate: u128, // 8
    /// The last time reward states were updated.
    pub last_update_time: u64, // 8
    /// reward per token stored
    pub reward_per_token_stored: u128,
}

impl RewardInfo {
    /// Returns true if this reward is initialized.
    /// Once initialized, a reward cannot transition back to uninitialized.
    pub fn initialized(&self) -> bool {
        self.mint.ne(&Pubkey::default())
    }

    pub fn init_reward(
        &mut self,
        mint: Pubkey,
        vault: Pubkey,
        funder: Pubkey,
        reward_duration: u64,
    ) {
        self.mint = mint;
        self.vault = vault;
        self.funder = funder;
        self.reward_duration = reward_duration;
    }

    /// Farming rate after funding
    pub fn update_rate_after_funding(
        &mut self,
        current_time: u64,
        funding_amount: u64,
    ) -> Result<()> {
        let reward_duration_end = self.reward_duration_end;
        let total_amount: u64;

        if current_time >= reward_duration_end {
            total_amount = funding_amount
        } else {
            let remaining_seconds = reward_duration_end.safe_sub(current_time)?;
            let leftover: u64 = safe_mul_shr_cast(
                self.reward_rate,
                remaining_seconds.into(),
                SCALE_OFFSET,
                Rounding::Down,
            )?;

            total_amount = leftover.safe_add(funding_amount)?;
        }

        self.reward_rate = safe_shl_div_cast(
            total_amount.into(),
            self.reward_duration.into(),
            SCALE_OFFSET,
            Rounding::Down,
        )?;
        self.last_update_time = current_time;
        self.reward_duration_end = current_time.safe_add(self.reward_duration)?;

        Ok(())
    }

    // pub fn update_last_update_time(&mut self, current_time: u64) {
    //     self.last_update_time = std::cmp::min(current_time, self.reward_duration_end);
    // }

    fn calculate_reward_per_token_stored_since_last_update(
        &self,
        current_time: u64,
        liquidity_supply: u64,
    ) -> Result<u128> {
        if liquidity_supply == 0 {
            return Ok(0);
        }
        let last_time_reward_applicable = std::cmp::min(current_time, self.reward_duration_end);
        let time_period = last_time_reward_applicable
            .safe_sub(self.last_update_time.into())?
            .into();

        safe_mul_div_cast(
            time_period,
            self.reward_rate,
            liquidity_supply.into(),
            Rounding::Down,
        )
    }

    pub fn updated_rewards_per_token_stored(
        &mut self,
        current_time: u64,
        liquidity_supply: u64,
    ) -> Result<()> {
        let reward_per_token_stored_delta = self
            .calculate_reward_per_token_stored_since_last_update(current_time, liquidity_supply)?;

        self.reward_per_token_stored = self
            .reward_per_token_stored
            .safe_add(reward_per_token_stored_delta)?;

        self.last_update_time = std::cmp::min(current_time, self.reward_duration_end);
        Ok(())
    }
}

/// An account that has staked tokens into a [Quarry].
#[account]
#[derive(Copy, Default, Debug)]
pub struct Miner {
    /// Key of the [Quarry] this [Miner] works on.
    pub quarry: Pubkey,
    /// Authority who manages this [Miner].
    /// All withdrawals of tokens must accrue to [TokenAccount]s owned by this account.
    pub authority: Pubkey,

    /// Bump.
    pub bump: u8,

    /// [TokenAccount] to hold the [Miner]'s staked LP tokens.
    pub token_vault_key: Pubkey,

    /// Stores the amount of tokens that the [Miner] may claim.
    /// Whenever the [Miner] claims tokens, this is reset to 0.
    pub rewards_earned: u64,

    /// A checkpoint of the [Quarry]'s reward tokens paid per staked token.
    ///
    /// When the [Miner] is initialized, this number starts at 0.
    /// On the first [quarry::stake_tokens], the [Quarry]#update_rewards_and_miner
    /// method is called, which updates this checkpoint to the current quarry value.
    ///
    /// On a [quarry::claim_rewards], the difference in checkpoints is used to calculate
    /// the amount of tokens owed.
    pub rewards_per_token_paid: u128,

    /// Number of tokens the [Miner] holds.
    pub balance: u64,

    /// Index of the [Miner].
    pub index: u64,

    /// Other reward info, possibly from partners
    pub reward_infos: [UserRewardInfo; 3],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct UserRewardInfo {
    pub reward_per_token_complete: u128,
    pub reward_pending: u64,
}

impl UserRewardInfo {
    pub fn update_reward_per_token_stored(
        &mut self,
        balance: u64,
        reward_info: &RewardInfo,
    ) -> Result<()> {
        let reward_per_token_stored = reward_info.reward_per_token_stored;

        let new_reward: u64 = safe_mul_shr_cast(
            balance.into(),
            reward_per_token_stored.safe_sub(self.reward_per_token_complete)?,
            SCALE_OFFSET,
            Rounding::Down,
        )?;

        self.reward_pending = new_reward.safe_add(self.reward_pending)?;
        self.reward_per_token_complete = reward_per_token_stored;

        Ok(())
    }
}
