//! ClaimBribe
use crate::*;

/// Accounts for [gauge::create_epoch_bribe_voter].
#[derive(Accounts)]
pub struct CreateEpochBribeVoter<'info> {
    /// The [Bribe]
    #[account( has_one = gauge)]
    pub bribe: Account<'info, Bribe>,

    #[account(
        init,
        seeds = [b"EpochBribeVoter".as_ref(), bribe.key().as_ref(), gauge_voter.key().as_ref()],
        bump,
        space = 8 + std::mem::size_of::<EpochBribeVoter>(),
        payer = payer,
    )]
    pub epoch_bribe_voter: Account<'info, EpochBribeVoter>,

    /// The [GaugeFactory].
    pub gauge_factory: Box<Account<'info, GaugeFactory>>,

    /// The [GaugeVoter].
    #[account(has_one = gauge_factory)]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,

    /// The [Gauge].
    #[account(has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,

    /// The [Escrow::vote_delegate].
    #[account(mut)]
    pub payer: Signer<'info>,

    /// System program.
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateEpochBribeVoter>) -> Result<()> {
    let bribe = &ctx.accounts.bribe;
    let current_voting_epoch = ctx.accounts.gauge_factory.current_voting_epoch;
    //
    invariant!(
        current_voting_epoch <= bribe.bribe_rewards_epoch_end,
        BribeHasBeenEnded,
    );

    let epoch_bribe_voter = &mut ctx.accounts.epoch_bribe_voter;
    epoch_bribe_voter.init(
        bribe.key(),
        ctx.accounts.gauge_voter.key(),
        // current_voting_epoch,
    );

    emit!(CreateEpochBribeVoterEvent {
        gauge: ctx.accounts.gauge.key(),
        bribe: ctx.accounts.bribe.key(),
        voting_epoch: current_voting_epoch,
        gauge_voter: ctx.accounts.gauge_voter.key(),
    });

    Ok(())
}

impl<'info> Validate<'info> for CreateEpochBribeVoter<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [gauge::claim_bribe_epoch].
#[event]
pub struct CreateEpochBribeVoterEvent {
    #[index]
    /// The [Gauge].
    pub gauge: Pubkey,
    #[index]
    /// The Bribe.
    pub bribe: Pubkey,
    /// Voting epoch where epoch bribe voter is created
    pub voting_epoch: u32,
    /// The escrow.
    pub gauge_voter: Pubkey,
}
