use anchor_lang::constant;

pub mod accept_admin;
pub mod claim_partner_rewards;
pub mod claim_rewards;
pub mod create_miner;
pub mod create_quarry;
pub mod fund_reward;
pub mod initialize_new_reward;
pub mod mutable_rewarder_with_authority;
pub mod mutable_rewarder_with_pause_authority;
pub mod new_rewarder;
pub mod set_annual_rewards;
pub mod set_famine;
pub mod set_pause_authority;
pub mod set_rewards_share;
pub mod transfer_admin;
pub mod update_quarry_lb_clmm_rewards;
pub mod update_quarry_rewards;
pub mod update_reward_duration;
pub mod update_reward_funder;
pub mod user_stake;

pub use accept_admin::*;
pub use claim_partner_rewards::*;
pub use claim_rewards::*;
pub use create_miner::*;
pub use create_quarry::*;
pub use fund_reward::*;
pub use initialize_new_reward::*;
pub use mutable_rewarder_with_authority::*;
pub use mutable_rewarder_with_pause_authority::*;
pub use new_rewarder::*;
pub use set_annual_rewards::*;
pub use set_famine::*;
pub use set_pause_authority::*;
pub use set_rewards_share::*;
pub use transfer_admin::*;
pub use update_quarry_lb_clmm_rewards::*;
pub use update_quarry_rewards::*;
pub use update_reward_duration::*;
pub use update_reward_funder::*;
pub use user_stake::*;

// minimum reward duration
#[constant]
pub const MIN_REWARD_DURATION: u64 = 1;

#[constant]
pub const MAX_REWARD_DURATION: u64 = 31536000; // 1 year = 365 * 24 * 3600
