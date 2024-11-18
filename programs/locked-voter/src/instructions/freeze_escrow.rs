use crate::*;
/// Accounts for [voter::freeze_escrow].
#[derive(Accounts)]
pub struct FreezeEscrow<'info> {
    /// [Escrow].
    #[account(mut,
        has_one = owner)]
    pub escrow: Box<Account<'info, Escrow>>,

    /// Authority of the [Escrow].
    pub owner: Signer<'info>,
}

impl<'info> FreezeEscrow<'info> {
    pub fn freeze_escrow(&mut self, freeze_until: i64) -> Result<()> {
        invariant!(
            freeze_until > Clock::get()?.unix_timestamp,
            "Freeze until time must be more than current timestamp"
        );
        invariant!(
            freeze_until > self.escrow.frozen_until,
            "Account is already frozen"
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

    /// Timestamp to unfreeze
    #[index]
    pub freeze_until: i64,
}
