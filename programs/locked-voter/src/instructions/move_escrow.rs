use crate::*;
use anchor_spl::token;
/// Accounts for [voter::move_lock].
#[derive(Accounts)]
pub struct MoveLock<'info> {
    /// [Request].
    #[account(
        has_one = old_escrow,
        has_one = new_escrow,
    )]
    pub request: Box<Account<'info, Request>>,
    /// [New_Escrow].
    #[account(mut, has_one = locker)]
    pub old_escrow: Box<Account<'info, Escrow>>,

    /// [New_Escrow].
    #[account(mut, has_one = locker)]
    pub new_escrow: Box<Account<'info, Escrow>>,

    /// Token account held by the [Escrow].
    #[account(
        mut,
        constraint = old_escrow.tokens == escrow_tokens1.key()
    )]
    pub escrow_tokens1: Account<'info, TokenAccount>,

    /// Token account held by the [Escrow].
    #[account(
        mut,
        constraint = new_escrow.tokens == escrow_tokens2.key()
    )]
    pub escrow_tokens2: Account<'info, TokenAccount>,

    // (old = new escrow) => Locker => Governor => Smart Wallet (Sends this IX)
    #[account(mut, has_one = governor)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(mut, has_one = smart_wallet)]
    pub governor: Account<'info, Governor>,

    #[account(mut)]
    pub smart_wallet: Signer<'info>,

    /// Token program.
    pub token_program: Program<'info, Token>,
}

impl<'info> MoveLock<'info> {
    pub fn move_lock(&mut self) -> Result<()> {
        let seeds: &[&[&[u8]]] = escrow_seeds!(self.old_escrow);

        // transfer tokens from escrow1 to escrow2
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token::Transfer {
                    from: self.escrow_tokens1.to_account_info(),
                    to: self.escrow_tokens2.to_account_info(),
                    authority: self.old_escrow.to_account_info(),
                },
                seeds,
            ),
            self.escrow_tokens1.amount,
        )?;

        // TODO: do some lock mathematics

        // migrate data over
        self.new_escrow.amount = self.old_escrow.amount;
        self.new_escrow.escrow_started_at = self.old_escrow.escrow_started_at;
        self.new_escrow.escrow_ends_at = self.old_escrow.escrow_ends_at;
        self.new_escrow.vote_delegate = self.old_escrow.vote_delegate;
        self.new_escrow.is_max_lock = self.old_escrow.is_max_lock;
        self.new_escrow.partial_unstaking_amount = self.old_escrow.partial_unstaking_amount;

        emit!(MoveLockEvent {
            escrow1: self.old_escrow.key(),
            escrow2: self.new_escrow.key(),
            old_owner: self.old_escrow.owner,
            new_owner: self.new_escrow.owner,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for MoveLock<'info> {
    fn validate(&self) -> Result<()> {
        // TODO validate

        // TODO add signature check for old owner

        Ok(())
    }
}

#[event]
/// Event called in [voter::lock].
pub struct MoveLockEvent {
    /// The old [Escrow].
    #[index]
    pub escrow1: Pubkey,
    /// The new [Escrow].
    #[index]
    pub escrow2: Pubkey,
    /// The old owner of the [Escrow].
    pub old_owner: Pubkey,
    /// The new owner of the [Escrow].
    pub new_owner: Pubkey,
}
