use crate::*;

/// Accounts for [quarry::update_quarry_rewards].
#[derive(Accounts)]
pub struct UpdateQuarryRewards<'info> {
    /// [Quarry].
    #[account(mut, has_one = rewarder)]
    pub quarry: AccountLoader<'info, Quarry>,

    /// [Rewarder].
    pub rewarder: Account<'info, Rewarder>,
}

pub fn handler(ctx: Context<UpdateQuarryRewards>) -> Result<()> {
    let current_ts = Clock::get()?.unix_timestamp;
    let rewarder = &ctx.accounts.rewarder;
    // let payroll: Payroll = (*ctx.accounts.quarry).into();
    let mut quarry = ctx.accounts.quarry.load_mut()?;
    quarry.update_rewards_internal(current_ts, rewarder)?;

    emit!(QuarryRewardsUpdateEvent {
        amm_pool: quarry.amm_pool,
        annual_rewards_rate: quarry.annual_rewards_rate,
        rewards_share: quarry.rewards_share,
        timestamp: current_ts,
    });

    Ok(())
}
impl<'info> Validate<'info> for UpdateQuarryRewards<'info> {
    fn validate(&self) -> Result<()> {
        invariant!(self.quarry.load()?.is_lp_pool());
        self.rewarder.assert_not_paused()?;
        Ok(())
    }
}
/// Emitted when a quarry's reward rate is updated.
#[event]
pub struct QuarryRewardsUpdateEvent {
    /// Amm pool of quarry
    pub amm_pool: Pubkey,
    /// New annual rewards rate
    pub annual_rewards_rate: u64,
    /// New rewards share.
    pub rewards_share: u64,
    /// When the event took place.
    pub timestamp: i64,
}
