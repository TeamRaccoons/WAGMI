use crate::*;

/// Accounts for [voter::merge_partial_unstaking].
#[derive(Accounts)]
pub struct PartialMergePartialUnstaking<'info> {
    /// [Locker].
    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    /// [Escrow].
    #[account(mut, has_one = locker, has_one = owner)]
    pub escrow: Box<Account<'info, Escrow>>,

    /// The [PartialUnstaking] that is being merged.
    #[account(mut, has_one = escrow)]
    pub partial_unstake: Box<Account<'info, PartialUnstaking>>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

impl<'info> PartialMergePartialUnstaking<'info> {
    pub fn partial_merge_partial_unstaking(&mut self, amount: u64) -> Result<()> {
        invariant!(amount > 0, AmountIsZero);
        invariant!(amount < self.partial_unstake.amount, AmountIsTooLarge);

        let partial_unstake_pk = self.partial_unstake.key();
        let escrow_pk = self.escrow.key();

        let escrow = &mut self.escrow;
        let partial_unstake = &mut self.partial_unstake;

        unwrap_int!(escrow.merge_partial_unstaking_amount(amount));
        unwrap_int!(partial_unstake.cancel_partial_unstaking_amount(amount));

        emit!(PartialMergePartialUnstakingEvent {
            partial_unstake: partial_unstake_pk,
            escrow: escrow_pk,
            amount,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for PartialMergePartialUnstaking<'info> {
    fn validate(&self) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        let lock_duration = unwrap_int!(self
            .escrow
            .get_remaining_duration_until_expiration(current_time, &self.locker));
        require!(
            lock_duration >= self.locker.params.min_stake_duration,
            crate::ErrorCode::LockupDurationTooShort
        );

        Ok(())
    }
}

#[event]
/// Event called in [voter::merge_partial_unstaking].
pub struct PartialMergePartialUnstakingEvent {
    /// partial_unstake pk
    pub partial_unstake: Pubkey,
    /// ecsrow pk
    pub escrow: Pubkey,
    /// amount for partial unstaking
    pub amount: u64,
}
