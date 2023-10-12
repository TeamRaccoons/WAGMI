//! Liquidity mining rewards distribution program.
//!
//! The program consists of three types of accounts:
//!
//! - [Rewarder], which controls token rewards distribution
//! - [Quarry], which receive rewards, and
//! - [Miner], which stake tokens into [Quarry]s to receive rewards.
//!
//! This program is modeled after [Synthetix's StakingRewards.sol](https://github.com/Synthetixio/synthetix/blob/4b9b2ee09b38638de6fe1c38dbe4255a11ebed86/contracts/StakingRewards.sol).
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![allow(deprecated)]

#[macro_use]
mod macros;
mod state;

use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer};
use payroll::Payroll;
pub use state::*;
use vipers::prelude::*;

mod instructions;
pub mod math;
pub mod payroll;
pub mod quarry_state;
pub mod rewarder;
pub mod tests;
pub use instructions::*;

use crate::quarry_state::StakeAction;

declare_id!("quaJeeoTrxSszHnpzNQrtFoF1kcnfMiSWuYpk8ddobB");

/// Maximum number of tokens that can be rewarded by a [Rewarder] per year.
pub const MAX_ANNUAL_REWARDS_RATE: u64 = u64::MAX >> 3;

/// Program for [quarry].
#[program]
pub mod quarry {
    use super::*;

    // --------------------------------
    // Rewarder Functions
    // --------------------------------

    /// Creates a new [Rewarder].
    #[access_control(ctx.accounts.validate())]
    pub fn new_rewarder(ctx: Context<NewRewarder>) -> Result<()> {
        new_rewarder::handler(ctx)
    }

    /// Set operator [Rewarder].
    #[access_control(ctx.accounts.validate())]
    pub fn set_mint_authority(
        ctx: Context<MutableRewarderWithAuthority>,
        mint_authority: Pubkey,
    ) -> Result<()> {
        mutable_rewarder_with_authority::handler_set_mint_authority(ctx, mint_authority)
    }

    /// Sets the pause authority.
    #[access_control(ctx.accounts.validate())]
    pub fn set_pause_authority(ctx: Context<SetPauseAuthority>) -> Result<()> {
        set_pause_authority::handler(ctx)
    }

    /// Pauses the [Rewarder].
    #[access_control(ctx.accounts.validate())]
    pub fn pause(ctx: Context<MutableRewarderWithPauseAuthority>) -> Result<()> {
        mutable_rewarder_with_pause_authority::handler(ctx, true)
    }

    /// Unpauses the [Rewarder].
    #[access_control(ctx.accounts.validate())]
    pub fn unpause(ctx: Context<MutableRewarderWithPauseAuthority>) -> Result<()> {
        mutable_rewarder_with_pause_authority::handler(ctx, false)
    }

    /// Transfers the [Rewarder] admin to a different account.
    #[access_control(ctx.accounts.validate())]
    pub fn transfer_admin(ctx: Context<TransferAdmin>, new_admin: Pubkey) -> Result<()> {
        transfer_admin::handler(ctx, new_admin)
    }

    /// Accepts the admin to become the new rewarder.
    #[access_control(ctx.accounts.validate())]
    pub fn accept_admin(ctx: Context<AcceptAdmin>) -> Result<()> {
        accept_admin::handler(ctx)
    }

    /// Sets the amount of reward tokens distributed to all [Quarry]s per day.
    #[access_control(ctx.accounts.validate())]
    pub fn set_annual_rewards(ctx: Context<SetAnnualRewards>, new_rate: u64) -> Result<()> {
        set_annual_rewards::handler(ctx, new_rate)
    }

    // --------------------------------
    // Quarry functions
    // --------------------------------

    /// Creates a new [Quarry].
    /// This may only be called by the [Rewarder]::admin.    
    #[access_control(ctx.accounts.validate())]
    pub fn create_quarry(ctx: Context<CreateQuarry>, amm_type: u64) -> Result<()> {
        create_quarry::handler(ctx, amm_type)
    }

    /// Sets the rewards share of a quarry.
    #[access_control(ctx.accounts.validate())]
    pub fn set_rewards_share(ctx: Context<SetRewardsShare>, new_share: u64) -> Result<()> {
        set_rewards_share::handler(ctx, new_share)
    }

    /// Sets the famine, which stops rewards.
    #[access_control(ctx.accounts.validate())]
    pub fn set_famine(ctx: Context<SetFamine>, famine_ts: i64) -> Result<()> {
        set_famine::handler(ctx, famine_ts)
    }

    /// Synchronizes quarry rewards with the rewarder.
    /// Anyone can call this.
    #[access_control(ctx.accounts.validate())]
    pub fn update_quarry_rewards(ctx: Context<UpdateQuarryRewards>) -> Result<()> {
        update_quarry_rewards::handler(ctx)
    }

    /// Synchronizes quarry rewards with the rewarder.
    /// Anyone can call this.
    /// For LbClmm
    #[access_control(ctx.accounts.validate())]
    pub fn update_quarry_lb_clmm_rewards(ctx: Context<UpdateQuarryLbClmmRewards>) -> Result<()> {
        update_quarry_lb_clmm_rewards::handler(ctx)
    }

    /// Init new reward, only admin can do this
    /// Init new rewards, provided by partners, similar to bribe
    #[access_control(ctx.accounts.validate())]
    pub fn initialize_new_reward(
        ctx: Context<InitializeNewReward>,
        index: u64,
        reward_duration: u64,
        funder: Pubkey,
    ) -> Result<()> {
        initialize_new_reward::handler(ctx, index, reward_duration, funder)
    }

    /// Update reward funder, only admin can change
    #[access_control(ctx.accounts.validate())]
    pub fn update_reward_funder(
        ctx: Context<UpdateRewardFunder>,
        reward_index: u64,
        new_funder: Pubkey,
    ) -> Result<()> {
        update_reward_funder::handle(ctx, reward_index, new_funder)
    }

    /// Update reward duration, only admin can change
    #[access_control(ctx.accounts.validate())]
    pub fn update_reward_duration(
        ctx: Context<UpdateRewardDuration>,
        reward_index: u64,
        new_duration: u64,
    ) -> Result<()> {
        update_reward_duration::handle(ctx, reward_index, new_duration)
    }

    /// Fund reward, only admin or funder can fund
    #[access_control(ctx.accounts.validate())]
    pub fn fund_reward(ctx: Context<FundReward>, reward_index: u64, amount: u64) -> Result<()> {
        fund_reward::handle(ctx, reward_index, amount)
    }

    /// --------------------------------
    /// Miner functions
    /// --------------------------------

    /// Creates a [Miner] for the given authority.
    ///
    /// Anyone can call this; this is an associated account.
    #[access_control(ctx.accounts.validate())]
    pub fn create_miner(ctx: Context<CreateMiner>) -> Result<()> {
        create_miner::handler(ctx)
    }

    /// Claims rewards for the [Miner].
    #[access_control(ctx.accounts.validate())]
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        claim_rewards::handler(ctx)
    }

    /// Claims partner rewards for the [Miner].
    pub fn claim_partner_rewards(
        ctx: Context<ClaimPartnerRewards>,
        reward_index: u64,
    ) -> Result<()> {
        claim_partner_rewards::handler(ctx, reward_index)
    }

    /// Stakes tokens into the [Miner].
    #[access_control(ctx.accounts.validate())]
    pub fn stake_tokens(ctx: Context<UserStake>, amount: u64) -> Result<()> {
        user_stake::handler_stake_tokens(ctx, amount)
    }

    /// Unstake tokens from the [Miner].
    #[access_control(ctx.accounts.validate())]
    pub fn unstake_tokens(ctx: Context<UserStake>, amount: u64) -> Result<()> {
        user_stake::handler_unstake_tokens(ctx, amount)
    }
}

/// Error Codes
#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Insufficient staked balance for withdraw request.")]
    InsufficientBalance,
    #[msg("Pending authority not set")]
    PendingAuthorityNotSet,
    #[msg("Invalid quarry rewards share")]
    InvalidRewardsShare,
    #[msg("Insufficient allowance.")]
    InsufficientAllowance,
    #[msg("New vault not empty.")]
    NewVaultNotEmpty,
    #[msg("Not enough tokens.")]
    NotEnoughTokens,
    #[msg("Invalid timestamp.")]
    InvalidTimestamp,
    #[msg("Max annual rewards rate exceeded.")]
    MaxAnnualRewardsRateExceeded,
    #[msg("Rewarder is paused.")]
    Paused,
    #[msg("Rewards earned exceeded quarry's upper bound.")]
    UpperboundExceeded,
    #[msg("type cast faled")]
    TypeCastFailed,
    #[msg("Invalid reward index")]
    InvalidRewardIndex,
    #[msg("Invalid reward duration")]
    InvalidRewardDuration,
    #[msg("Reward not initialized")]
    RewardUninitialized,
    #[msg("Reward campaign in progress")]
    RewardCampaignInProgress,
    #[msg("Invalid reward vault")]
    InvalidRewardVault,
    #[msg("Invalid admin")]
    InvalidAdmin,
    #[msg("Math operation overflow")]
    MathOverflow,
    #[msg("Update same reward funder")]
    SameFunder,
}
