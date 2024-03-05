use crate::*;

/// Accounts for [voter::new_escrow].
#[derive(Accounts)]
pub struct NewEscrow<'info> {
    /// [Locker].
    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    /// [Escrow].
    #[account(
        init,
        seeds = [
            b"Escrow".as_ref(),
            locker.key().as_ref(),
            escrow_owner.key().as_ref()
        ],
        bump,
        payer = payer,
        space = 8 + Escrow::LEN
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: Authority of the [Escrow] to be created.
    pub escrow_owner: UncheckedAccount<'info>,

    /// Payer of the initialization.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> NewEscrow<'info> {
    /// Creates a new [Escrow].
    pub fn new_escrow(&mut self, bump: u8) -> Result<()> {
        let escrow = &mut self.escrow;
        escrow.locker = self.locker.key();
        escrow.owner = self.escrow_owner.key();
        escrow.bump = bump;

        // token account of the escrow is the ATA.
        escrow.tokens = anchor_spl::associated_token::get_associated_token_address(
            &escrow.key(),
            &self.locker.token_mint,
        );
        escrow.amount = 0;
        escrow.escrow_started_at = 0;
        escrow.escrow_ends_at = 0;
        escrow.vote_delegate = self.escrow_owner.key();
        escrow.is_max_lock = false;

        let locker = &mut self.locker;
        locker.total_escrow = unwrap_int!(locker.total_escrow.checked_add(1));

        emit!(NewEscrowEvent {
            escrow: escrow.key(),
            escrow_owner: escrow.owner,
            locker: escrow.locker,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for NewEscrow<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[event]
/// Event called in [voter::new_escrow].
pub struct NewEscrowEvent {
    /// The [Escrow] being created.
    pub escrow: Pubkey,
    /// The owner of the [Escrow].
    #[index]
    pub escrow_owner: Pubkey,
    /// The locker for the [Escrow].
    #[index]
    pub locker: Pubkey,
    /// Timestamp for the event.
    pub timestamp: i64,
}
