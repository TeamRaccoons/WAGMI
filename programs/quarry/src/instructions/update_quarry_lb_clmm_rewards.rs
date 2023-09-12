use crate::*;

/// Accounts for [quarry::update_quarry_lb_clmm_rewards].
#[derive(Accounts)]
pub struct UpdateQuarryLbClmmRewards<'info> {
    /// [Quarry].
    #[account(mut, has_one = rewarder)]
    pub quarry: Account<'info, Quarry>,

    /// [Rewarder].
    pub rewarder: Account<'info, Rewarder>,
}

pub fn handler(ctx: Context<UpdateQuarryLbClmmRewards>) -> Result<()> {
    let current_ts = Clock::get()?.unix_timestamp;
    let rewarder = &ctx.accounts.rewarder;
    let payroll: Payroll = (*ctx.accounts.quarry).into();
    let quarry = &mut ctx.accounts.quarry;
    let emission =
        quarry.get_and_update_lb_clmm_rewards_internal(current_ts, rewarder, &payroll)?;

    // TODO fund for lb clmm

    emit!(QuarryLbClmmRewardsUpdateEvent {
        amm_pool: quarry.amm_pool,
        emission: emission,
        annual_rewards_rate: quarry.annual_rewards_rate,
        rewards_share: quarry.rewards_share,
        timestamp: current_ts,
    });

    Ok(())
}
impl<'info> Validate<'info> for UpdateQuarryLbClmmRewards<'info> {
    fn validate(&self) -> Result<()> {
        invariant!(self.quarry.is_lb_clmm_pool());
        self.rewarder.assert_not_paused()?;
        Ok(())
    }
}
/// Emitted when a quarry's reward rate is updated.
#[event]
pub struct QuarryLbClmmRewardsUpdateEvent {
    /// Amm pool of quarry
    pub amm_pool: Pubkey,
    /// Emission
    pub emission: u64,
    /// New annual rewards rate
    pub annual_rewards_rate: u64,
    /// New rewards share.
    pub rewards_share: u64,
    /// When the event took place.
    pub timestamp: i64,
}
