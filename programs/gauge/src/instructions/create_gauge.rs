//! Creates a [Gauge].

use crate::constants::MAX_EPOCH_PER_GAUGE;
use crate::ErrorCode::TypeCastFailed;
use amm::AmmType;

use crate::*;

/// Accounts for [gauge::create_gauge].
#[derive(Accounts)]
pub struct CreateGauge<'info> {
    /// The [Gauge] to be created.
    #[account(
        init,
        seeds = [
            b"Gauge".as_ref(),
            gauge_factory.key().as_ref(),
            quarry.key().as_ref(),
        ],
        bump,
        space = 8 + Gauge::INIT_SPACE,
        payer = payer
    )]
    pub gauge: AccountLoader<'info, Gauge>,

    /// [GaugeFactory].
    pub gauge_factory: Account<'info, GaugeFactory>,

    /// [quarry::Quarry].
    #[account(has_one = amm_pool)]
    pub quarry: Account<'info, quarry::Quarry>,

    /// [amm::Amm].
    /// CHECK:
    pub amm_pool: UncheckedAccount<'info>,

    /// Payer.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// System program.
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateGauge>) -> Result<()> {
    let mut gauge = ctx.accounts.gauge.load_init()?;
    let quarry = &ctx.accounts.quarry;
    gauge.gauge_factory = ctx.accounts.gauge_factory.key();
    gauge.quarry = ctx.accounts.quarry.key();

    gauge.vote_epochs = [EpochGauge::default(); MAX_EPOCH_PER_GAUGE];

    // Since this is permissionless, gauges are disabled when they are created.
    gauge.is_disabled = 1;

    gauge.amm_pool = quarry.amm_pool;

    let amm_type = AmmType::get_amm_type(quarry.amm_type).ok_or(TypeCastFailed)?;
    let amm_pool = amm_type.get_amm(ctx.accounts.amm_pool.to_account_info())?;

    let (token_a_mint, token_b_mint, token_a_fee, token_b_fee) =
        amm_pool.get_mint_and_fee_account_pubkeyss();
    gauge.token_a_fee_key = token_a_fee;
    gauge.token_b_fee_key = token_b_fee;
    gauge.token_a_mint = token_a_mint;
    gauge.token_b_mint = token_b_mint;

    gauge.amm_type = quarry.amm_type;

    emit!(CreateGaugeEvent {
        gauge_factory: gauge.gauge_factory,
        quarry: gauge.quarry,
        amm_pool: ctx.accounts.amm_pool.key(),
        amm_type: gauge.amm_type,
    });

    Ok(())
}

impl<'info> Validate<'info> for CreateGauge<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.quarry.amm_pool, self.amm_pool);
        assert_keys_eq!(self.gauge_factory.rewarder, self.quarry.rewarder);
        Ok(())
    }
}

/// Event called in [gauge::create_gauge].
#[event]
pub struct CreateGaugeEvent {
    #[index]
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    #[index]
    /// The Amm pool.
    pub amm_pool: Pubkey,
    #[index]
    /// The [quarry::Quarry] being voted on.
    pub quarry: Pubkey,
    /// The Amm type.
    pub amm_type: u32,
}
