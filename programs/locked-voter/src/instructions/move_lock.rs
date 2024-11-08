use crate::*;
use anchor_spl::token;
use smart_wallet::SmartWallet;
/// Accounts for [voter::move_lock].
#[derive(Accounts)]
pub struct MoveLock<'info> {
    /// [Locker1].
    #[account(mut)]
    pub locker1: Box<Account<'info, Locker>>,

    /// [Locker2].
    #[account(mut)]
    pub locker2: Box<Account<'info, Locker>>,

    /// [Escrow1].
    #[account(mut, constraint = escrow1.locker == locker1.key())]
    pub escrow1: Box<Account<'info, Escrow>>,

    /// [Escrow2].
    #[account(mut, constraint = escrow2.locker == locker2.key())]
    pub escrow2: Box<Account<'info, Escrow>>,

    /// Token account held by the [Escrow].
    #[account(
        mut,
        constraint = escrow1.tokens == escrow_tokens1.key()
    )]
    pub escrow_tokens1: Account<'info, TokenAccount>,

    /// Token account held by the [Escrow].
    #[account(
        mut,
        constraint = escrow2.tokens == escrow_tokens2.key()
    )]
    pub escrow_tokens2: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = locker1.governor == governor.key(),
        constraint = governor.smart_wallet == smart_wallet.key()
    )]
    pub smart_wallet: Account<'info, SmartWallet>,

    #[account(mut)]
    pub governor: Account<'info, Governor>,

    /// Token program.
    pub token_program: Program<'info, Token>,
}

impl<'info> MoveLock<'info> {
    pub fn move_lock(&mut self) -> Result<()> {
        let seeds: &[&[&[u8]]] = escrow_seeds!(self.escrow1);

        // transfer tokens from escrow1 to escrow2
        token::transfer(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token::Transfer {
                    from: self.escrow_tokens1.to_account_info(),
                    to: self.escrow_tokens2.to_account_info(),
                    authority: self.escrow1.to_account_info(),
                },
                seeds,
            ),
            self.escrow_tokens1.amount,
        )?;

        // migrate data over
        self.escrow2.amount = self.escrow1.amount;

        // TODO: do some lock mathematics
        self.escrow2.escrow_started_at = self.escrow1.escrow_started_at;
        self.escrow2.escrow_ends_at = self.escrow1.escrow_ends_at;
        self.escrow2.vote_delegate = self.escrow1.vote_delegate;
        self.escrow2.is_max_lock = self.escrow1.is_max_lock;
        self.escrow2.partial_unstaking_amount = self.escrow1.partial_unstaking_amount;

        emit!(MoveLockEvent {
            escrow1: self.escrow1.key(),
            escrow2: self.escrow2.key(),
            old_owner: self.escrow1.owner,
            new_owner: self.escrow2.owner,
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
