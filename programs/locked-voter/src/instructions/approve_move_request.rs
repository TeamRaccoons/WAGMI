use crate::*;
/// Accounts for [voter::approve_move_request].
#[derive(Accounts)]
pub struct ApproveMoveRequest<'info> {
    /// [Request].
    #[account(
        has_one = escrow,
        has_one = recovery_key,
    )]
    pub request: Box<Account<'info, MoveRequest>>,
    /// [Old_Escrow].
    #[account(mut, has_one = locker)]
    pub escrow: Box<Account<'info, Escrow>>,

    /// CHECK: checked by request account
    pub recovery_key: UncheckedAccount<'info>,

    // (old) => Locker => Governor => Smart Wallet (Sends this IX)
    #[account(has_one = governor)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(has_one = smart_wallet)]
    pub governor: Box<Account<'info, Governor>>,

    pub smart_wallet: Signer<'info>,
}

impl<'info> ApproveMoveRequest<'info> {
    pub fn approve_move_request(&mut self) -> Result<()> {
        self.escrow.recovery_key = self.recovery_key.key();
        self.escrow.freeze_timestamp = Clock::get()?.unix_timestamp;
        emit!(ApproveMoveRequestEvent {
            old_escrow: self.escrow.key(),
            old_owner: self.escrow.owner,
            recovery_key: self.recovery_key.key(),
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for ApproveMoveRequest<'info> {
    fn validate(&self) -> Result<()> {
        // TODO validate
        invariant!(
            self.escrow.freeze_timestamp + (self.locker.params.max_stake_duration as i64)
                > Clock::get()?.unix_timestamp,
            "Escrow must be frozen first"
        );
        Ok(())
    }
}

#[event]
/// Event called in [voter::move_escrow].
pub struct ApproveMoveRequestEvent {
    /// The old [Escrow].
    #[index]
    pub old_escrow: Pubkey,
    /// The new [Escrow].
    #[index]
    pub recovery_key: Pubkey,
    /// The old owner of the [Escrow].
    pub old_owner: Pubkey,
}
