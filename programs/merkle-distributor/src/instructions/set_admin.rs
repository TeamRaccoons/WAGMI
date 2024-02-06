use crate::error::ErrorCode;
use crate::*;
/// [merkle_distributor::set_admin] accounts.
#[derive(Accounts)]
pub struct SetAdmin<'info> {
    /// The [MerkleDistributor].
    #[account(mut)]
    pub distributor: Account<'info, MerkleDistributor>,

    /// Admin signer
    #[account(mut, address = distributor.admin @ ErrorCode::Unauthorized)]
    pub admin: Signer<'info>,

    /// New admin account
    /// CHECK: this can be any new account
    #[account(mut)]
    pub new_admin: AccountInfo<'info>,
}

/// Sets new admin account
pub fn handle_set_admin(ctx: Context<SetAdmin>) -> Result<()> {
    let distributor = &mut ctx.accounts.distributor;

    require!(
        ctx.accounts.admin.key != &ctx.accounts.new_admin.key(),
        ErrorCode::SameAdmin
    );

    distributor.admin = ctx.accounts.new_admin.key();

    // Note: might get truncated, do not rely on
    msg!("set new admin to {}", ctx.accounts.new_admin.key());

    Ok(())
}
