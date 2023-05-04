use crate::*;
use num_traits::ToPrimitive;

/// Accounts for [voter::extend_lock_duration].
#[derive(Accounts)]
pub struct ExtendLockDuration<'info> {
    /// [Locker].
    #[account(mut)]
    pub locker: Account<'info, Locker>,

    /// [Escrow].
    #[account(mut, has_one = locker)]
    pub escrow: Account<'info, Escrow>,

    /// Token account held by the [Escrow].
    #[account(
        mut,
        constraint = escrow.tokens == escrow_tokens.key()
    )]
    pub escrow_tokens: Account<'info, TokenAccount>,

    /// Authority of the [Escrow] and [Self::source_tokens].
    pub escrow_owner: Signer<'info>,

    /// The source of deposited tokens.
    #[account(mut)]
    pub source_tokens: Account<'info, TokenAccount>,

    /// Token program.
    pub token_program: Program<'info, Token>,
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

        let locker = &mut self.locker;
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
        assert_eq!(self.locker.phase, Phase::TokenLaunchPhase);
        assert_keys_eq!(self.locker, self.escrow.locker);
        assert_keys_eq!(self.escrow.tokens, self.escrow_tokens);
        assert_keys_eq!(self.escrow.owner, self.escrow_owner);
        assert_keys_eq!(self.escrow_owner, self.source_tokens.owner);

        assert_keys_eq!(self.source_tokens.mint, self.locker.token_mint);
        assert_keys_neq!(self.escrow_tokens, self.source_tokens);

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
