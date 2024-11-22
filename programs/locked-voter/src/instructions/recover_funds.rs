use crate::*;
use anchor_spl::token;

/// Accounts for [voter::recover_funds].
#[derive(Accounts)]
pub struct RecoverFunds<'info> {
    /// The [Locker] being exited from.
    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    /// The [Escrow] that is being closed.
    #[account(mut, has_one = locker, close = payer, has_one = recovery_key)]
    pub escrow: Box<Account<'info, Escrow>>,

    /// Recovery_key of the [Escrow].
    pub recovery_key: Signer<'info>,
    /// Tokens locked up in the [Escrow].
    #[account(mut, constraint = escrow.tokens == escrow_tokens.key())]
    pub escrow_tokens: Account<'info, TokenAccount>,
    /// Destination for the tokens to unlock.
    #[account(mut)]
    pub destination_tokens: Account<'info, TokenAccount>,

    /// The payer to receive the rent refund.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Token program.
    pub token_program: Program<'info, Token>,
}

impl<'info> RecoverFunds<'info> {
    pub fn recover_funds(&mut self) -> Result<()> {
        let seeds: &[&[&[u8]]] = escrow_seeds!(self.escrow);

        // transfer tokens from the escrow TA
        // if there are zero tokens in the escrow, short-circuit.
        if self.escrow_tokens.amount > 0 {
            token::transfer(
                CpiContext::new(
                    self.token_program.to_account_info(),
                    token::Transfer {
                        from: self.escrow_tokens.to_account_info(),
                        to: self.destination_tokens.to_account_info(),
                        authority: self.escrow.to_account_info(),
                    },
                )
                .with_signer(seeds),
                self.escrow.amount,
            )?;
        }

        // update the locker
        let locker = &mut self.locker;
        locker.locked_supply = unwrap_int!(locker.locked_supply.checked_sub(self.escrow.amount));

        emit!(RecoverFundsEvent {
            escrow_owner: self.escrow.owner,
            locker: locker.key(),
            locker_supply: locker.locked_supply,
            timestamp: Clock::get()?.unix_timestamp,
            released_amount: self.escrow.amount,
            recovery_address: self.recovery_key.key(),
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for RecoverFunds<'info> {
    fn validate(&self) -> Result<()> {
        invariant!(
            (self.escrow.freeze_timestamp + self.locker.params.max_stake_duration as i64)
                <= Clock::get()?.unix_timestamp,
            "Escrow is frozen"
        );
        assert_keys_eq!(self.locker, self.escrow.locker);
        assert_keys_eq!(self.escrow.recovery_key, self.recovery_key);
        assert_keys_eq!(self.escrow.tokens, self.escrow_tokens);
        assert_keys_neq!(self.escrow_tokens, self.destination_tokens);

        let cooldown_timestamp =
            self.escrow.freeze_timestamp + self.locker.params.max_stake_duration as i64;
        let now = Clock::get()?.unix_timestamp;
        msg!("now: {}; cooldown_timestamp: {}", now, cooldown_timestamp);
        invariant!(cooldown_timestamp <= now, EscrowNotEnded);

        invariant!(
            self.escrow.partial_unstaking_amount == 0,
            PartialUnstakingAmountIsNotZero
        );

        Ok(())
    }
}

#[event]
/// Event called in [voter::withdraw].
pub struct RecoverFundsEvent {
    /// The owner of the [Escrow].
    #[index]
    pub escrow_owner: Pubkey,
    /// The locker for the [Escrow].
    #[index]
    pub locker: Pubkey,
    /// Timestamp for the event.
    pub timestamp: i64,
    /// The amount of tokens locked inside the [Locker].
    pub locker_supply: u64,
    /// The amount released from the [Escrow].
    pub released_amount: u64,
    /// The recovery_address [Escrow].
    pub recovery_address: Pubkey,
}
