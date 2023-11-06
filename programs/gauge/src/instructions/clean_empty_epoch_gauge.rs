//! Creates an [EpochGauge].

use crate::*;

/// Accounts for [gauge::clean_empty_epoch_gauge].
#[derive(Accounts)]
#[instruction(voting_epoch: u32)]

pub struct CleanEmptyEpochGauge<'info> {
    /// The [GaugeFactory].
    #[account(mut, constraint = voting_epoch < gauge_factory.current_voting_epoch)]
    pub gauge_factory: Account<'info, GaugeFactory>,
    /// The [Gauge] to create an [EpochGauge] of.
    #[account(mut, has_one = gauge_factory)]
    pub gauge: Account<'info, Gauge>,

    /// The [EpochGauge] to be created.
    #[account(
        mut,
        seeds = [
            b"EpochGauge".as_ref(),
            gauge.key().as_ref(),
            voting_epoch.to_le_bytes().as_ref()
        ],
        bump,
        constraint = epoch_gauge.total_power == 0,
        close = rent_receiver,
    )]
    pub epoch_gauge: Account<'info, EpochGauge>,

    /// CHECK: Account to receive closed account rental SOL
    #[account(mut)]
    pub rent_receiver: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<CleanEmptyEpochGauge>, voting_epoch: u32) -> Result<()> {
    let epoch_gauge = &mut ctx.accounts.epoch_gauge;
    let gauge = &mut ctx.accounts.gauge;

    gauge.cummulative_token_a_fee = gauge
        .cummulative_token_a_fee
        .checked_sub(epoch_gauge.token_a_fee)
        .unwrap();
    gauge.cummulative_token_b_fee = gauge
        .cummulative_token_b_fee
        .checked_sub(epoch_gauge.token_b_fee)
        .unwrap();
    epoch_gauge.token_a_fee = 0;
    epoch_gauge.token_b_fee = 0;

    emit!(CleanEmptyEpochGaugeEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        gauge: gauge.key(),
        voting_epoch,
    });

    Ok(())
}

impl<'info> Validate<'info> for CleanEmptyEpochGauge<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[event]
/// Event called in called in [gauge::clean_empty_epoch_gauge].
pub struct CleanEmptyEpochGaugeEvent {
    #[index]
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    #[index]
    /// The epoch associated with this [EpochGauge].
    pub voting_epoch: u32,
    /// Token a fee for this epoch
    pub gauge: Pubkey,
}
