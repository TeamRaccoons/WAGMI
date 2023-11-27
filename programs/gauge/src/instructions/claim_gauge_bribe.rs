//! ClaimGaugeBribe
use crate::ErrorCode::MathOverflow;
use crate::*;

/// Accounts for [gauge::claim_gauge_bribe].
#[derive(Accounts)]
pub struct ClaimGaugeBribe<'info> {
    /// The [Bribe]
    #[account(mut, has_one = gauge, has_one = token_account_vault)]
    pub bribe: Account<'info, Bribe>,

    // ensure that gauge voter cannot claim again for an epoch with a bribe
    #[account(
       mut, has_one = bribe, has_one = gauge_voter
    )]
    pub epoch_bribe_voter: Account<'info, EpochBribeVoter>,

    /// The [GaugeFactory].
    pub gauge_factory: Box<Account<'info, GaugeFactory>>,

    /// The [GaugeVoter].
    #[account(has_one = gauge_factory, has_one = escrow)]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,

    /// The [GaugeVoter].
    #[account(has_one = gauge_voter, has_one = gauge)]
    pub gauge_vote: AccountLoader<'info, GaugeVote>,

    /// The [Gauge].
    #[account(has_one = gauge_factory)]
    pub gauge: AccountLoader<'info, Gauge>,

    #[account(mut)]
    pub token_account_vault: Box<Account<'info, TokenAccount>>,

    // token account to claim to
    #[account(mut)]
    pub token_account: Box<Account<'info, TokenAccount>>,

    /// The [Escrow] which owns this [EpochGaugeVote].
    #[account(has_one = vote_delegate @ crate::ErrorCode::UnauthorizedNotDelegate)]
    pub escrow: Box<Account<'info, voter::Escrow>>,

    /// The [Escrow::vote_delegate].
    #[account(mut)]
    pub vote_delegate: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimGaugeBribe>) -> Result<()> {
    let bribe = &mut ctx.accounts.bribe;
    let epoch_bribe_voter = &mut ctx.accounts.epoch_bribe_voter;
    let gauge_factory = &ctx.accounts.gauge_factory;
    msg!("bribe {:#?}", bribe);

    let gauge_vote = ctx.accounts.gauge_vote.load()?;
    let gauge = ctx.accounts.gauge.load()?;

    let last_can_claim_epoch = bribe
        .bribe_rewards_epoch_end
        .min(gauge_factory.rewards_epoch()?);

    invariant!(
        epoch_bribe_voter.last_claimed_epoch < last_can_claim_epoch,
        NoMoreBribeReward
    );

    let from_epoch = bribe
        .bribe_rewards_epoch_start
        .max(epoch_bribe_voter.last_claimed_epoch);

    let rewards = epoch_bribe_voter.claim_rewards(
        from_epoch,
        last_can_claim_epoch,
        bribe.reward_each_epoch,
        &gauge_vote,
        &gauge,
    )?;

    msg!("reward {}", rewards);

    if rewards > 0 {
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
            rewards,
        )?;
        bribe.claimed_amount = bribe
            .claimed_amount
            .checked_add(rewards)
            .ok_or(MathOverflow)?;

        emit!(ClaimGaugeBribeEvent {
            gauge: ctx.accounts.gauge.key(),
            bribe: ctx.accounts.bribe.key(),
            // voting_epoch,
            rewards,
            token_account: ctx.accounts.token_account.key(),
            escrow: ctx.accounts.escrow.key(),
        });
    }

    Ok(())
}

impl<'info> Validate<'info> for ClaimGaugeBribe<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [gauge::claim_gauge_bribe].
#[event]
pub struct ClaimGaugeBribeEvent {
    #[index]
    /// The [Gauge].
    pub gauge: Pubkey,
    #[index]
    /// The Bribe.
    pub bribe: Pubkey,
    /// The Bribe epoch start.
    pub rewards: u64,
    /// The Bribe epoch end.
    pub token_account: Pubkey,
    /// The escrow.
    pub escrow: Pubkey,
}
