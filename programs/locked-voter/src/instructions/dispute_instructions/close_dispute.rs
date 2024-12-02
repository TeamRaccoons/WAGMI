use crate::*;
/// Accounts for [voter::close_dispute].
#[derive(Accounts)]
pub struct CloseDispute<'info> {
    /// [Escrow].
    #[account(
        mut,
        has_one = owner,
    )]
    pub escrow: Box<Account<'info, Escrow>>,

    /// Authority of the [Escrow].
    pub owner: Signer<'info>,
}

impl<'info> CloseDispute<'info> {
    pub fn close_dispute(&mut self) -> Result<()> {
        self.escrow.dispute.go_to_none_phase()?;
        emit!(CloseDisputeEvent {
            escrow: self.escrow.key(),
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for CloseDispute<'info> {
    fn validate(&self) -> Result<()> {
        require!(
            self.escrow.dispute.phase == DisputePhase::Dispute as u8,
            crate::ErrorCode::NotPermitInThisPhase
        );
        let current_ts = Clock::get()?.unix_timestamp;
        let dispute_expiration = unwrap_int!(self
            .escrow
            .dispute
            .phase_dispute_timestamp
            .checked_add(DISPUTE_EXPIRATION));

        require!(
            dispute_expiration < current_ts,
            crate::ErrorCode::NotPermitInThisPhase
        );
        Ok(())
    }
}

#[event]
/// Event called in [voter::close_dispute].
pub struct CloseDisputeEvent {
    /// The [Escrow] being created.
    pub escrow: Pubkey,
}
