//! Instruction handler for [voter::change_locker_expiration].

use crate::*;

/// Accounts for [voter::change_locker_expiration].
#[derive(Accounts)]
pub struct ChangeLockerExpiration<'info> {
    /// The [Locker].
    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,
    /// The [Governor].
    pub governor: Box<Account<'info, Governor>>,
    /// The smart wallet on the [Governor].
    pub smart_wallet: Signer<'info>,
}

impl<'info> ChangeLockerExpiration<'info> {
    pub fn change_locker_expiration(&mut self, expiration: i64) -> Result<()> {
        // validate expiration
        #[cfg(not(feature = "test-bpf"))]
        {
            let now = Clock::get()?.unix_timestamp;
            // buffer 1 day, so incase smart_wallet update wrongly, we can make it again
            invariant!(expiration >= now + 86400, ExpirationIsLessThanCurrentTime);
        }

        let prev_expiration = self.locker.expiration;
        self.locker.expiration = expiration;

        emit!(ChangeLockerExpirationEvent {
            locker: self.locker.key(),
            prev_expiration,
            new_expiration: expiration,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for ChangeLockerExpiration<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.governor, self.locker.governor, "governor mismatch");
        assert_keys_eq!(self.smart_wallet, self.governor.smart_wallet);
        // only allow in initial phase
        let phase = self.locker.get_current_phase()?;

        invariant!(phase == Phase::InitialPhase, "must be initial phase");

        Ok(())
    }
}

/// Event called in [voter::change_locker_expiration].
#[event]
pub struct ChangeLockerExpirationEvent {
    /// The [Locker].
    #[index]
    pub locker: Pubkey,
    /// Previous expiration.
    pub prev_expiration: i64,
    /// New expiration.
    pub new_expiration: i64,
}
