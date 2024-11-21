use crate::*;
/// Accounts for [voter::create_move_request].
#[derive(Accounts)]
pub struct OpenDispute<'info> {
    /// [Escrow].
    #[account(
        mut,
        has_one = owner,
        has_one = locker
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    pub locker: Box<Account<'info, Locker>>,
    /// [Recovery_Token_Account]
    pub recovery_key: Signer<'info>,

    /// [Request].
    #[account( 
        init_if_needed, 
        seeds = [
            b"Request".as_ref(),
            escrow.key().as_ref(),
            recovery_key.key().as_ref(),
        ],
        bump,
        payer = feepayer, 
        space = MoveRequest::LEN
    )]
    pub request: Box<Account<'info, MoveRequest>>,

    /// Authority of the [Old_Escrow].
    pub owner: Signer<'info>,

    /// Fee payer, and also new owner
    #[account(mut)]
    pub feepayer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> OpenDispute<'info> {
    pub fn open_dispute(&mut self) -> Result<()> {
        self.request.escrow = self.escrow.key();
        self.request.recovery_key = self.feepayer.key();


        let now = Clock::get()?.unix_timestamp;
        invariant!(
            now > self.escrow.freeze_timestamp,
            "Error, account is frozen in the future"
        );
        self.escrow.freeze_timestamp = now;

        emit!(OpenDisputeEvent {
            escrow: self.escrow.key(),
            owner: self.owner.key(),
            locker: self.locker.key(),
            timestamp: now,
            recovery_key: self.recovery_key.key(),
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for OpenDispute<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}


#[event]
/// Event called in [voter::new_escrow].
pub struct OpenDisputeEvent {
    /// The [Escrow] being created.
    pub escrow: Pubkey,
    /// The owner of the [Escrow].
    #[index]
    pub owner: Pubkey,
    /// The locker for the [Escrow].
    #[index]
    pub locker: Pubkey,
    /// Timestamp for the event.
    pub timestamp: i64,
    /// New Recovery Key
    pub recovery_key: Pubkey,
}
