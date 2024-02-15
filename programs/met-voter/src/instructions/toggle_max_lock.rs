use crate::*;

/// Accounts for [voter::toggle_max_lock].
#[derive(Accounts)]
pub struct ToggleMaxLock<'info> {
    /// [Locker].
    pub locker: Box<Account<'info, Locker>>,

    /// [Escrow].
    #[account(mut, has_one = locker)]
    pub escrow: Box<Account<'info, Escrow>>,

    /// Authority of the [Escrow] and
    pub escrow_owner: Signer<'info>,
}

impl<'info> ToggleMaxLock<'info> {
    pub fn toggle_max_lock(&mut self, is_max_lock: bool) -> Result<()> {
        let escrow: &mut Account<'_, Escrow> = &mut self.escrow;

        // if is max lock is still the same, then we do nothing
        if escrow.is_max_lock == is_max_lock {
            return Ok(());
        }
        // if is max lock is set to false, we reset escrow start time and end time
        if !is_max_lock {
            let locker = &self.locker;
            let next_escrow_started_at = Clock::get()?.unix_timestamp;
            let next_escrow_ends_at = unwrap_int!(next_escrow_started_at
                .checked_add(locker.params.max_stake_duration.try_into().unwrap()));
            escrow
                .record_extend_lock_duration_event(next_escrow_started_at, next_escrow_ends_at)?;
        }

        escrow.is_max_lock = is_max_lock;
        Ok(())
    }
}

impl<'info> Validate<'info> for ToggleMaxLock<'info> {
    fn validate(&self) -> Result<()> {
        // Only allow in TokenLaunchPhase
        let phase = self.locker.get_current_phase()?;

        invariant!(
            phase == Phase::TokenLaunchPhase,
            "must be token launch phase"
        );

        assert_keys_eq!(self.locker, self.escrow.locker);
        assert_keys_eq!(self.escrow.owner, self.escrow_owner);

        Ok(())
    }
}
