use crate::*;
use num_traits::ToPrimitive;

/// Accounts for [voter::extend_lock_duration].
#[derive(Accounts)]
pub struct ExtendLockDuration<'info> {
    /// [Locker].
    pub locker: Box<Account<'info, Locker>>,

    /// [Escrow].
    #[account(mut, has_one = locker)]
    pub escrow: Box<Account<'info, Escrow>>,

    /// Authority of the [Escrow] and
    pub escrow_owner: Signer<'info>,
}

impl<'info> ExtendLockDuration<'info> {
    pub fn extend_lock_duration(&mut self, duration: i64) -> Result<()> {
        invariant!(
            unwrap_int!(duration.to_u64()) >= self.locker.params.min_stake_duration,
            LockupDurationTooShort
        );
        invariant!(
            unwrap_int!(duration.to_u64()) <= self.locker.params.max_stake_duration,
            LockupDurationTooLong
        );
        // check that the escrow refresh is valid
        let escrow = &self.escrow;
        let prev_escrow_ends_at = escrow.escrow_ends_at;
        let next_escrow_started_at = Clock::get()?.unix_timestamp;
        let next_escrow_ends_at = unwrap_int!(next_escrow_started_at.checked_add(duration));
        if prev_escrow_ends_at > next_escrow_ends_at {
            msg!(
                "next_escrow_ends_at: {}; prev_escrow_ends_at: {}",
                next_escrow_ends_at,
                prev_escrow_ends_at
            );
            invariant!(
                next_escrow_ends_at >= prev_escrow_ends_at,
                RefreshCannotShorten
            );
        }

        // update the escrow and locker

        let locker = &self.locker;
        let escrow = &mut self.escrow;
        escrow.record_extend_lock_duration_event(next_escrow_started_at, next_escrow_ends_at)?;

        emit!(ExtendLockDurationEvent {
            locker: locker.key(),
            locker_supply: locker.locked_supply,
            escrow_owner: escrow.owner,
            token_mint: locker.token_mint,
            duration,
            prev_escrow_ends_at,
            next_escrow_ends_at,
            next_escrow_started_at,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for ExtendLockDuration<'info> {
    fn validate(&self) -> Result<()> {
        // Only allow in TokenLaunchPhase
        let phase = self.locker.get_current_phase()?;

        invariant!(
            phase == Phase::TokenLaunchPhase,
            "must be token launch phase"
        );
        // Only allow is is_max_lock is false
        invariant!(!self.escrow.is_max_lock, MaxLockIsSet);

        assert_keys_eq!(self.locker, self.escrow.locker);
        assert_keys_eq!(self.escrow.owner, self.escrow_owner);

        Ok(())
    }
}

#[event]
/// Event called in [voter::lock].
pub struct ExtendLockDurationEvent {
    /// The locker of the [Escrow]
    #[index]
    pub locker: Pubkey,
    /// The owner of the [Escrow].
    #[index]
    pub escrow_owner: Pubkey,
    /// Mint of the token that for the [Locker].
    pub token_mint: Pubkey,
    /// Amount of tokens locked inside the [Locker].
    pub locker_supply: u64,
    /// Duration of lock time.
    pub duration: i64,
    /// The previous timestamp that the [Escrow] ended at.
    pub prev_escrow_ends_at: i64,
    /// The new [Escrow] end time.
    pub next_escrow_ends_at: i64,
    /// The new [Escrow] start time.
    pub next_escrow_started_at: i64,
}
