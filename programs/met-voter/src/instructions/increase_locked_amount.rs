use crate::*;
use anchor_spl::token;

/// Accounts for [voter::increase_locked_amount].
#[derive(Accounts)]
pub struct IncreaseLockedAmount<'info> {
    /// [Locker].
    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    /// [Escrow].
    #[account(mut, has_one = locker)]
    pub escrow: Box<Account<'info, Escrow>>,

    /// Token account held by the [Escrow].
    #[account(
        mut,
        constraint = escrow.tokens == escrow_tokens.key()
    )]
    pub escrow_tokens: Account<'info, TokenAccount>,

    /// Authority [Self::source_tokens], Anyone can increase amount for user
    pub payer: Signer<'info>,

    /// The source of deposited tokens.
    #[account(mut)]
    pub source_tokens: Account<'info, TokenAccount>,

    /// Token program.
    pub token_program: Program<'info, Token>,
}

impl<'info> IncreaseLockedAmount<'info> {
    pub fn increase_locked_amount(&mut self, amount: u64) -> Result<()> {
        invariant!(amount > 0, AmountIsZero);

        // transfer tokens to the escrow
        token::transfer(
            CpiContext::new(
                self.token_program.to_account_info(),
                token::Transfer {
                    from: self.source_tokens.to_account_info(),
                    to: self.escrow_tokens.to_account_info(),
                    authority: self.payer.to_account_info(),
                },
            ),
            amount,
        )?;

        // update the escrow and locker
        let locker = &mut self.locker;
        let escrow = &mut self.escrow;
        escrow.record_increase_locked_amount_event(locker, amount)?;

        emit!(IncreaseLockedAmountEvent {
            locker: locker.key(),
            locker_supply: locker.locked_supply,
            escrow_owner: escrow.owner,
            token_mint: locker.token_mint,
            amount,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for IncreaseLockedAmount<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.locker, self.escrow.locker);
        assert_keys_eq!(self.escrow.tokens, self.escrow_tokens);
        // assert_keys_eq!(self.escrow.owner, self.escrow_owner);
        assert_keys_eq!(self.payer, self.source_tokens.owner);

        assert_keys_eq!(self.source_tokens.mint, self.locker.token_mint);
        assert_keys_neq!(self.escrow_tokens, self.source_tokens);
        Ok(())
    }
}

#[event]
/// Event called in [voter::lock].
pub struct IncreaseLockedAmountEvent {
    /// The locker of the [Escrow]
    #[index]
    pub locker: Pubkey,
    /// The owner of the [Escrow].
    #[index]
    pub escrow_owner: Pubkey,
    /// Mint of the token that for the [Locker].
    pub token_mint: Pubkey,
    /// Amount of tokens locked.
    pub amount: u64,
    /// Amount of tokens locked inside the [Locker].
    pub locker_supply: u64,
}
