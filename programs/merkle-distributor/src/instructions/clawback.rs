use crate::error::ErrorCode;
use crate::*;

/// [merkle_distributor::clawback] accounts.
#[derive(Accounts)]
pub struct Clawback<'info> {
    /// The [MerkleDistributor].
    #[account(mut, has_one = token_vault, has_one = clawback_receiver)]
    pub distributor: Account<'info, MerkleDistributor>,

    /// Distributor ATA containing the tokens to distribute.
    #[account(mut)]
    pub token_vault: Account<'info, TokenAccount>,

    /// The Clawback token account.
    #[account(mut)]
    pub clawback_receiver: Account<'info, TokenAccount>,

    /// Claimant account
    /// Anyone can claw back the funds
    pub payer: Signer<'info>,

    /// The [System] program.
    pub system_program: Program<'info, System>,

    /// SPL [Token] program.
    pub token_program: Program<'info, Token>,
}

/// Claws back unclaimed tokens by:
/// 1. Checking that the lockup has expired
/// 2. Transferring remaining funds from the vault to the clawback receiver
/// 3. Marking the distributor as clawed back
/// CHECK:
///     1. The distributor has not already been clawed back
pub fn handle_clawback(ctx: Context<Clawback>) -> Result<()> {
    let distributor = &ctx.accounts.distributor;

    require!(!distributor.clawed_back, ErrorCode::ClawbackAlreadyClaimed);

    let curr_ts = Clock::get()?.unix_timestamp;

    if curr_ts < distributor.clawback_start_ts {
        return Err(ErrorCode::ClawbackBeforeStart.into());
    }

    let seeds = [
        b"MerkleDistributor".as_ref(),
        &distributor.base.as_ref(),
        &[ctx.accounts.distributor.bump],
    ];

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.token_vault.to_account_info(),
                to: ctx.accounts.clawback_receiver.to_account_info(),
                authority: ctx.accounts.distributor.to_account_info(),
            },
        )
        .with_signer(&[&seeds[..]]),
        ctx.accounts.token_vault.amount,
    )?;

    let distributor = &mut ctx.accounts.distributor;

    distributor.clawed_back = true;

    Ok(())
}
