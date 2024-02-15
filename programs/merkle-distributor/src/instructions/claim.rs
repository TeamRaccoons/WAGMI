use crate::error::ErrorCode;
use crate::*;
use met_voter as voter;
use met_voter::program::MetVoter as Voter;

/// [merkle_distributor::claim] accounts.
#[derive(Accounts)]
#[instruction(index: u64)]
pub struct Claim<'info> {
    /// The [MerkleDistributor].
    #[account(
        mut,
        has_one = locker,
        has_one = token_vault,
    )]
    pub distributor: Account<'info, MerkleDistributor>,

    /// Status of the claim.
    #[account(
        init,
        seeds = [
            b"ClaimStatus".as_ref(),
            index.to_le_bytes().as_ref(),
            distributor.key().as_ref()
        ],
        bump,
        space = 8 + std::mem::size_of::<ClaimStatus>(),
        payer = claimant
    )]
    pub claim_status: Account<'info, ClaimStatus>,

    /// Distributor ATA containing the tokens to distribute.
    #[account(mut)]
    pub token_vault: Account<'info, TokenAccount>,

    /// Who is claiming the tokens.
    #[account(mut)]
    pub claimant: Signer<'info>,

    /// The [System] program.
    pub system_program: Program<'info, System>,

    /// SPL [Token] program.
    pub token_program: Program<'info, Token>,

    /// Voter program
    pub voter_program: Program<'info, Voter>,

    /// CHECK: Locker
    #[account(mut)]
    pub locker: UncheckedAccount<'info>,

    /// CHECK: escrow
    #[account(mut,
        seeds = [
            b"Escrow".as_ref(),
            locker.key().as_ref(),
            claimant.key().as_ref()
        ],
        seeds::program = voter_program.key(),
        bump
    )]
    pub escrow: AccountInfo<'info>,

    /// CHECK: escrow_tokens
    #[account(mut)]
    pub escrow_tokens: UncheckedAccount<'info>,
}

/// Claims tokens from the [MerkleDistributor].
pub fn handle_claim(
    ctx: Context<Claim>,
    index: u64,
    amount: u64,
    proof: Vec<[u8; 32]>,
) -> Result<()> {
    let distributor = &ctx.accounts.distributor;

    invariant!(!distributor.clawed_back, ErrorCode::ClaimExpired);

    let claim_status = &mut ctx.accounts.claim_status;
    invariant!(
        // This check is redundant, we should not be able to initialize a claim status account at the same key.
        !claim_status.is_claimed && claim_status.claimed_at == 0,
        ErrorCode::DropAlreadyClaimed
    );
    let claimant_account = &ctx.accounts.claimant;

    // Verify the merkle proof.
    let node = hashv(&[
        &index.to_le_bytes(),
        &claimant_account.key().as_ref(),
        &amount.to_le_bytes(),
    ]);

    let node = hashv(&[LEAF_PREFIX, &node.to_bytes()]);

    require!(
        merkle_proof::verify(proof, distributor.root, node.to_bytes()),
        ErrorCode::InvalidProof
    );

    // Mark it claimed and send the tokens.
    claim_status.amount = amount;
    claim_status.is_claimed = true;
    let clock = Clock::get()?;
    claim_status.claimed_at = clock.unix_timestamp;
    claim_status.claimant = claimant_account.key();

    let seeds = [
        b"MerkleDistributor".as_ref(),
        &distributor.base.as_ref(),
        &[ctx.accounts.distributor.bump],
    ];
    let seeds = &[&seeds[..]];

    // assert_keys_eq!(ctx.accounts.to.owner, claimant_account.key(), OwnerMismatch);

    // CPI to voter
    let cpi_ctx = CpiContext::new(
        ctx.accounts.voter_program.to_account_info(),
        voter::cpi::accounts::IncreaseLockedAmount {
            locker: ctx.accounts.locker.to_account_info(),
            escrow: ctx.accounts.escrow.to_account_info(),
            escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
            payer: ctx.accounts.distributor.to_account_info(),
            source_tokens: ctx.accounts.token_vault.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    )
    .with_signer(seeds);

    voter::cpi::increase_locked_amount(cpi_ctx, amount)?;

    let distributor = &mut ctx.accounts.distributor;
    distributor.total_amount_claimed =
        unwrap_int!(distributor.total_amount_claimed.checked_add(amount));
    invariant!(
        distributor.total_amount_claimed <= distributor.max_total_claim,
        ErrorCode::ExceededMaxClaim
    );
    distributor.num_nodes_claimed = unwrap_int!(distributor.num_nodes_claimed.checked_add(1));
    invariant!(
        distributor.num_nodes_claimed <= distributor.max_num_nodes,
        ErrorCode::ExceededMaxNumNodes
    );

    emit!(ClaimedEvent {
        index,
        claimant: claimant_account.key(),
        amount
    });
    Ok(())
}
