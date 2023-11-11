//! Disables a [Gauge].

use crate::*;

/// Accounts for [gauge::disable_gauge].
#[derive(Accounts)]
pub struct DisableGauge<'info> {
    /// The [GaugeFactory].
    #[account(has_one = foreman)]
    pub gauge_factory: Account<'info, GaugeFactory>,
    /// The [Gauge] to disable.
    #[account(mut, has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,
    /// The [GaugeFactorty::foreman].
    pub foreman: Signer<'info>,
}

pub fn handler(ctx: Context<DisableGauge>) -> Result<()> {
    let mut gauge = ctx.accounts.gauge.load_mut()?;
    gauge.is_disabled = 1;
    emit!(DisableGaugeEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        gauge: ctx.accounts.gauge.key(),
        foreman: ctx.accounts.foreman.key(),
    });
    Ok(())
}

impl<'info> Validate<'info> for DisableGauge<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}
/// Emitted on [gauge::disable_gauge].
#[event]
pub struct DisableGaugeEvent {
    /// The [Gauge].
    #[index]
    pub gauge: Pubkey,
    /// The [GaugeFactorty].
    #[index]
    pub gauge_factory: Pubkey,
    /// The [GaugeFactorty::foreman] that disabled the gauge.
    pub foreman: Pubkey,
}
