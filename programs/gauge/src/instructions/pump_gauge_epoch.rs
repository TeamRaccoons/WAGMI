//! Pump an [EpochGauge].

use crate::*;
use math::safe_math::SafeMath;

/// Accounts for [gauge::pump_gauge_epoch].
#[derive(Accounts)]
pub struct PumpGaugeEpoch<'info> {
    /// The [GaugeFactory].
    pub gauge_factory: Account<'info, GaugeFactory>,
    /// The [Gauge] to create an [EpochGauge] of.
    #[account(mut, has_one = amm_pool, has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,

    /// CHECK:
    pub amm_pool: UncheckedAccount<'info>,

    pub token_a_fee: Box<Account<'info, TokenAccount>>,

    pub token_b_fee: Box<Account<'info, TokenAccount>>,
}

pub fn handler(ctx: Context<PumpGaugeEpoch>) -> Result<()> {
    let voting_epoch = ctx.accounts.gauge_factory.current_voting_epoch;

    let mut gauge = ctx.accounts.gauge.load_mut()?;

    assert_keys_eq!(ctx.accounts.token_a_fee.key(), gauge.token_a_fee_key);
    assert_keys_eq!(ctx.accounts.token_b_fee.key(), gauge.token_b_fee_key);

    let current_a_fee = ctx.accounts.token_a_fee.amount as u128;
    let current_b_fee = ctx.accounts.token_b_fee.amount as u128;

    // TODO handle the case the previous epoch is not voted
    let cummulative_unclaimed_token_a_fee = gauge
        .cummulative_token_a_fee
        .safe_sub(gauge.cummulative_claimed_token_a_fee)?;
    let token_a_fee = current_a_fee.safe_sub(cummulative_unclaimed_token_a_fee)?;

    let cummulative_unclaimed_token_b_fee = gauge
        .cummulative_token_b_fee
        .safe_sub(gauge.cummulative_claimed_token_b_fee)?;
    let token_b_fee = current_b_fee.safe_sub(cummulative_unclaimed_token_b_fee)?;

    gauge.cummulative_token_a_fee = gauge.cummulative_token_a_fee.safe_add(token_a_fee)?;
    gauge.cummulative_token_b_fee = gauge.cummulative_token_b_fee.safe_add(token_b_fee)?;

    // update vote epoch

    let index = gauge.pump_and_get_index_for_lastest_voting_epoch(voting_epoch)?;
    let vote_epoch = &mut gauge.vote_epochs[index];

    // require!(
    //     vote_epoch.voting_epoch != voting_epoch,
    //     crate::ErrorCode::RecreatedVotingEpoch
    // );

    vote_epoch.voting_epoch = voting_epoch;
    vote_epoch.token_a_fee = token_a_fee;
    vote_epoch.token_b_fee = token_b_fee;

    emit!(PumpGaugeEpochEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        gauge: ctx.accounts.gauge.key(),
        token_a_fee: vote_epoch.token_a_fee,
        token_b_fee: vote_epoch.token_b_fee,
        voting_epoch,
    });

    Ok(())
}

impl<'info> Validate<'info> for PumpGaugeEpoch<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[event]
/// Event called in called in [gauge::pump_gauge_epoch].
pub struct PumpGaugeEpochEvent {
    #[index]
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    #[index]
    /// The [Gauge].
    pub gauge: Pubkey,
    #[index]
    /// The epoch associated with this [EpochGauge].
    pub voting_epoch: u32,
    /// Token a fee for this epoch
    pub token_a_fee: u128,
    /// Token b fee for this epoch
    pub token_b_fee: u128,
}
