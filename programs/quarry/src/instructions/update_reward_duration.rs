use crate::ErrorCode::*;
use crate::*;
/// Accounts for [quarry::update_reward_duration].
#[derive(Accounts)]
#[instruction(reward_index: u64)]
pub struct UpdateRewardDuration<'info> {
    #[account(mut)]
    pub quarry: AccountLoader<'info, Quarry>,

    /// [Rewarder] authority.
    pub auth: MutableRewarderWithAuthority<'info>,
}

pub fn handle(ctx: Context<UpdateRewardDuration>, index: u64, reward_duration: u64) -> Result<()> {
    let reward_index: usize = index.try_into().map_err(|_| TypeCastFailed)?;

    require!(
        reward_index < MAX_REWARD,
        crate::ErrorCode::InvalidRewardIndex
    );
    require!(
        reward_duration >= MIN_REWARD_DURATION && reward_duration <= MAX_REWARD_DURATION,
        crate::ErrorCode::InvalidRewardDuration
    );

    let mut quarry = ctx.accounts.quarry.load_mut()?;
    let mut reward_info = quarry.reward_infos[reward_index];

    require!(
        reward_info.initialized(),
        crate::ErrorCode::RewardUninitialized
    );

    // only allow update reward duration if previous reward has been finished
    let current_time: i64 = Clock::get()?.unix_timestamp;
    require!(
        reward_info.reward_duration_end < current_time as u64,
        crate::ErrorCode::RewardCampaignInProgress,
    );

    let old_reward_duration = reward_info.reward_duration;
    reward_info.reward_duration = reward_duration;

    emit!(UpdateRewardDurationEvent {
        quarry: ctx.accounts.quarry.key(),
        old_reward_duration,
        new_reward_duration: reward_duration,
        reward_index: index,
    });

    Ok(())
}

impl<'info> Validate<'info> for UpdateRewardDuration<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.quarry.load()?.rewarder, self.auth.rewarder);
        self.auth.rewarder.assert_not_paused()?;
        Ok(())
    }
}

#[event]
pub struct UpdateRewardDurationEvent {
    // Public key
    pub quarry: Pubkey,
    // reward_index
    pub reward_index: u64,
    // old_reward_duration
    pub old_reward_duration: u64,
    // funding new_reward_duration
    pub new_reward_duration: u64,
}
