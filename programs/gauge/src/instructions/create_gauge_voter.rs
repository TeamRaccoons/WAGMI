//! Creates a [GaugeVoter].

use vipers::assert_keys_eq;

use crate::{constants::MAX_EPOCH_PER_GAUGE, *};

/// Accounts for [gauge::create_gauge_voter].
#[derive(Accounts)]
pub struct CreateGaugeVoter<'info> {
    /// [GaugeFactory].
    pub gauge_factory: Account<'info, GaugeFactory>,

    /// [voter::Escrow].
    pub escrow: Account<'info, voter::Escrow>,

    /// The [GaugeVoter] to be created.
    #[account(
        init,
        seeds = [
            b"GaugeVoter".as_ref(),
            gauge_factory.key().as_ref(),
            escrow.key().as_ref(),
        ],
        bump,
        space = 8 + GaugeVoter::INIT_SPACE,
        payer = payer
    )]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,

    /// Payer.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// System program.
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateGaugeVoter>) -> Result<()> {
    let mut gauge_voter = ctx.accounts.gauge_voter.load_init()?;
    gauge_voter.gauge_factory = ctx.accounts.gauge_factory.key();
    gauge_voter.escrow = ctx.accounts.escrow.key();

    gauge_voter.owner = ctx.accounts.escrow.owner;
    gauge_voter.total_weight = 0;
    gauge_voter.weight_change_seqno = 0;
    gauge_voter.vote_epochs = [EpochGaugeVoter::default(); MAX_EPOCH_PER_GAUGE];

    emit!(CreateGaugeVoterEvent {
        gauge_factory: gauge_voter.gauge_factory,
        rewarder: ctx.accounts.gauge_factory.rewarder,
        gauge_voter_owner: gauge_voter.owner,
    });

    Ok(())
}

impl<'info> Validate<'info> for CreateGaugeVoter<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.escrow.locker, self.gauge_factory.locker);
        Ok(())
    }
}

/// Event called in [gauge::create_gauge_voter].
#[event]
pub struct CreateGaugeVoterEvent {
    #[index]
    /// The [GaugeFactory].
    pub gauge_factory: Pubkey,
    #[index]
    /// The Rewarder.
    pub rewarder: Pubkey,
    #[index]
    /// Owner of the Escrow of the [GaugeVoter].
    pub gauge_voter_owner: Pubkey,
}
