use crate::error::ErrorCode;
use crate::*;
/// Accounts for [merkle_distributor::new_distributor].
#[derive(Accounts)]
pub struct NewDistributor<'info> {
    /// Base key of the distributor.
    pub base: Signer<'info>,

    /// [MerkleDistributor].
    #[account(
        init,
        seeds = [
            b"MerkleDistributor".as_ref(),
            base.key().as_ref()
        ],
        bump,
        space = 8 + MerkleDistributor::LEN,
        payer = admin
    )]
    pub distributor: Account<'info, MerkleDistributor>,

    /// Token vault
    #[account(
        init,
        associated_token::mint = mint,
        associated_token::authority=distributor,
        payer = admin,
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// The [Associated Token] program.
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// The [Token] program.
    pub token_program: Program<'info, Token>,

    /// The mint to distribute.
    pub mint: Account<'info, Mint>,

    /// Payer to create the distributor.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Clawback receiver token account
    #[account(token::mint = mint)]
    pub clawback_receiver: Account<'info, TokenAccount>,

    /// The [System] program.
    pub system_program: Program<'info, System>,
}

/// Creates a new [MerkleDistributor].
/// After creating this [MerkleDistributor], the account should be seeded with tokens via its ATA.
pub fn handle_new_distributor(
    ctx: Context<NewDistributor>,
    locker: Pubkey,
    root: [u8; 32],
    max_total_claim: u64,
    max_num_nodes: u64,
    clawback_start_ts: i64,
) -> Result<()> {
    let distributor = &mut ctx.accounts.distributor;

    distributor.base = ctx.accounts.base.key();
    distributor.bump = unwrap_bump!(ctx, "distributor");

    distributor.root = root;
    distributor.mint = ctx.accounts.mint.key();

    distributor.max_total_claim = max_total_claim;
    distributor.max_num_nodes = max_num_nodes;
    distributor.total_amount_claimed = 0;
    distributor.num_nodes_claimed = 0;

    distributor.admin = ctx.accounts.admin.key();
    distributor.locker = locker;

    distributor.token_vault = ctx.accounts.token_vault.key();
    let curr_ts = Clock::get()?.unix_timestamp;
    // Ensure clawback_start_ts is at least one day after current time
    require!(
        clawback_start_ts
            >= curr_ts
                .checked_add(SECONDS_PER_DAY)
                .ok_or(ErrorCode::ArithmeticError)?,
        ErrorCode::InsufficientClawbackDelay
    );
    distributor.clawback_start_ts = clawback_start_ts;
    distributor.clawback_receiver = ctx.accounts.clawback_receiver.key();

    // Note: might get truncated, do not rely on
    msg! {
        "New distributor created with mint={}, token_vault={}, max_total_claim={}, max_nodes: {}, clawback_start: {}, clawback_receiver: {}",
            distributor.mint,
            distributor.token_vault,
            distributor.max_total_claim,
            distributor.max_num_nodes,
            distributor.clawback_start_ts,
            distributor.clawback_receiver,
    };
    Ok(())
}
