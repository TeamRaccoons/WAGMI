//! Enables a [Gauge].

use vipers::assert_keys_eq;

use crate::*;

/// Accounts for [gauge::enable_gauge].
#[derive(Accounts)]
pub struct EnableGauge<'info> {
    /// The [GaugeFactory].
    #[account(has_one = foreman)]
    pub gauge_factory: Account<'info, GaugeFactory>,
    /// The [Gauge] to enable.
    #[account(mut, has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,
    /// The [GaugeFactorty::foreman].
    pub foreman: Signer<'info>,
}

/// Emitted on [gauge::enable_gauge].
#[event]
pub struct EnableGaugeEvent {
    /// The [Gauge].
    #[index]
    pub gauge: Pubkey,
    /// The [GaugeFactorty].
    #[index]
    pub gauge_factory: Pubkey,
    /// The [GaugeFactorty::foreman] that enabled the gauge.
    pub foreman: Pubkey,
}

pub fn handler(ctx: Context<EnableGauge>) -> Result<()> {
    let mut gauge = ctx.accounts.gauge.load_mut()?;
    gauge.is_disabled = 0;
    Ok(())
}

impl<'info> Validate<'info> for EnableGauge<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}
