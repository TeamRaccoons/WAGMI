//! Creates a [GaugeVote].

use vipers::assert_keys_eq;

use crate::*;

/// Accounts for [gauge::create_gauge_vote].
#[derive(Accounts)]
pub struct CreateGaugeVote<'info> {
    /// The [GaugeVote] to be created.
    #[account(
        init,
        seeds = [
            b"GaugeVote".as_ref(),
            gauge_voter.key().as_ref(),
            gauge.key().as_ref(),
        ],
        bump,
        space = 8 + GaugeVote::INIT_SPACE,
        payer = payer
    )]
    pub gauge_vote: AccountLoader<'info, GaugeVote>,

    /// Gauge voter.
    #[account(has_one = gauge_factory)]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,

    /// The [GaugeFactory].
    pub gauge_factory: Account<'info, GaugeFactory>,
    /// The [Gauge].
    #[account(mut, has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,

    /// Payer.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// System program.
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateGaugeVote>) -> Result<()> {
    let mut gauge_vote = ctx.accounts.gauge_vote.load_init()?;

    gauge_vote.init(ctx.accounts.gauge_voter.key(), ctx.accounts.gauge.key());

    let gauge_voter = ctx.accounts.gauge_voter.load()?;

    emit!(CreateGaugeVoteEvent {
        gauge_factory: ctx.accounts.gauge_factory.key(),
        gauge: gauge_vote.gauge,
        gauge_voter_owner: gauge_voter.owner,
    });

    Ok(())
}

impl<'info> Validate<'info> for CreateGaugeVote<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [gauge::create_gauge_vote].
#[event]
pub struct CreateGaugeVoteEvent {
    #[index]
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    #[index]
    /// The [Gauge].
    pub gauge: Pubkey,
    #[index]
    /// Owner of the Escrow of the [GaugeVoter].
    pub gauge_voter_owner: Pubkey,
}
