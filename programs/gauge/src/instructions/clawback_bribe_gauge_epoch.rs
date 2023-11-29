//! ClaimBribe
use crate::*;

/// Accounts for [gauge::clawback_bribe_gauge_epoch].
#[derive(Accounts)]
#[instruction(voting_epoch: u32)]
pub struct ClawbackBribeGaugeEpoch<'info> {
    /// The [Bribe]
    #[account(has_one = gauge, has_one = token_account_vault, has_one = briber)]
    pub bribe: Account<'info, Bribe>,

    /// The [GaugeFactory].
    pub gauge_factory: Box<Account<'info, GaugeFactory>>,

    /// The [Gauge].
    #[account(has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,

    #[account(mut)]
    pub token_account_vault: Box<Account<'info, TokenAccount>>,

    // token account to claim to
    #[account(mut)]
    pub token_account: Box<Account<'info, TokenAccount>>,

    pub briber: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClawbackBribeGaugeEpoch>, voting_epoch: u32) -> Result<()> {
    let bribe = &ctx.accounts.bribe;
    // cannot clawback voting_epoch that is not finished
    invariant!(
        voting_epoch < ctx.accounts.gauge_factory.current_voting_epoch,
        ClawbackEpochIsNotCorrect
    );
    invariant!(
        voting_epoch >= bribe.bribe_rewards_epoch_start,
        ClawbackEpochIsNotCorrect
    );
    invariant!(
        voting_epoch <= bribe.bribe_rewards_epoch_end,
        ClawbackEpochIsNotCorrect
    );

    let gauge = ctx.accounts.gauge.load()?;

    invariant!(!gauge.is_epoch_voted(voting_epoch), EpochGaugeIsVoted);

    let signer_seeds: &[&[&[u8]]] = gauge_factory_seeds!(ctx.accounts.gauge_factory);
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().clone(),
            Transfer {
                from: ctx.accounts.token_account_vault.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.gauge_factory.to_account_info(),
            },
            signer_seeds,
        ),
        bribe.reward_each_epoch,
    )?;

    emit!(ClawbackBribeGaugeEpochEvent {
        bribe: ctx.accounts.bribe.key(),
        gauge: ctx.accounts.gauge.key(),
        voting_epoch,
    });

    Ok(())
}

impl<'info> Validate<'info> for ClawbackBribeGaugeEpoch<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [gauge::clawback_bribe_gauge_epoch].
#[event]
pub struct ClawbackBribeGaugeEpochEvent {
    #[index]
    /// The [Gauge].
    pub gauge: Pubkey,
    #[index]
    /// The Bribe.
    pub bribe: Pubkey,
    #[index]
    /// The distribute rewards epoch.
    pub voting_epoch: u32,
}
