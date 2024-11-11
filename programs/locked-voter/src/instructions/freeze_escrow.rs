use crate::*;
/// Accounts for [voter::move_lock].
#[derive(Accounts)]
pub struct FreezeEscrow<'info> {
    /// [Escrow].
    #[account(mut)]
    pub escrow: Box<Account<'info, Escrow>>,
}

impl<'info> FreezeEscrow<'info> {
    pub fn freeze_escrow(&mut self, freeze_until: i64) -> Result<()> {
        invariant!(
            freeze_until > Clock::get()?.unix_timestamp,
            "Freeze until time must be more than current timestamp"
        );
        invariant!(
            freeze_until > self.escrow.frozen_until,
            "Account is already frozen until"
        );
        self.escrow.frozen_until = freeze_until;

        emit!(FreezeEscrowEvent {
            escrow: self.escrow.key(),
            freeze_until
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for FreezeEscrow<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[event]
/// Event called in [voter::lock].
pub struct FreezeEscrowEvent {
    /// The old [Escrow].
    #[index]
    pub escrow: Pubkey,

    /// Freeze time
    #[index]
    pub freeze_until: i64,
}
