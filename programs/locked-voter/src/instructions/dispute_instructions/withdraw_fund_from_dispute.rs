use crate::*;
use anchor_spl::token;

/// Accounts for [voter::withdraw_fund_from_dispute].
#[derive(Accounts)]
pub struct WithdrawFundFromDispute<'info> {
    /// The [Locker]
    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    /// The [Escrow].
    /// Dont close escrow, so owner can't recreate that escrow again
    #[account(mut, has_one = locker, constraint = escrow.dispute.approved_dispute_request == approved_dispute_request.key())]
    pub escrow: Box<Account<'info, Escrow>>,

    #[account(mut, has_one = new_owner, has_one = escrow)]
    pub approved_dispute_request: Box<Account<'info, DisputeRequest>>,

    pub new_owner: Signer<'info>,

    #[account(mut, constraint = escrow.tokens == escrow_tokens.key())]
    pub escrow_tokens: Account<'info, TokenAccount>,

    /// Destination for the tokens to unlock.
    #[account(mut)]
    pub destination_tokens: Account<'info, TokenAccount>,

    /// Token program.
    pub token_program: Program<'info, Token>,
}

impl<'info> WithdrawFundFromDispute<'info> {
    pub fn withdraw_fund_from_dispute(&mut self) -> Result<()> {
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

        self.escrow.dispute.go_to_withdraw_phase();

        emit!(WithdrawFundFromDisputeEvent {
            escrow: self.escrow.key(),
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for WithdrawFundFromDispute<'info> {
    fn validate(&self) -> Result<()> {
        require!(
            self.escrow.dispute.phase == DisputePhase::Resolve as u8,
            crate::ErrorCode::NotPermitInThisPhase
        );
        let current_ts = Clock::get()?.unix_timestamp;
        let resolve_expiration = unwrap_int!(self
            .escrow
            .dispute
            .phase_resolve_timestamp
            .checked_add(self.locker.params.max_stake_duration as i64));
        require!(
            resolve_expiration < current_ts,
            crate::ErrorCode::NotPermitInThisPhase
        );

        assert_keys_neq!(self.escrow_tokens, self.destination_tokens);

        invariant!(
            self.escrow.partial_unstaking_amount == 0,
            PartialUnstakingAmountIsNotZero
        );

        Ok(())
    }
}

#[event]
/// Event called in [voter::withdraw_fund_from_dispute].
pub struct WithdrawFundFromDisputeEvent {
    /// escrow
    #[index]
    pub escrow: Pubkey,
}
