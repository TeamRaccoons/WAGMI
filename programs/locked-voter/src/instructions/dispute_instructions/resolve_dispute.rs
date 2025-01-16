use crate::*;
/// Accounts for [voter::resolve_dispute].
#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    /// [Request].
    #[account(
        has_one = escrow,
    )]
    pub dispute_request: Box<Account<'info, DisputeRequest>>,
    /// [Old_Escrow].
    #[account(mut, has_one = locker)]
    pub escrow: Box<Account<'info, Escrow>>,

    // (old) => Locker => Governor => Smart Wallet (Sends this IX)
    #[account(has_one = governor)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(has_one = smart_wallet)]
    pub governor: Box<Account<'info, Governor>>,

    pub smart_wallet: Signer<'info>,
}

impl<'info> ResolveDispute<'info> {
    pub fn resolve_dispute(&mut self) -> Result<()> {
        self.escrow
            .dispute
            .go_to_resolve_phase(Clock::get()?.unix_timestamp, self.dispute_request.key());
        emit!(ResolveDisputeEvent {
            escrow: self.escrow.key(),
            dispute_request: self.dispute_request.key(),
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for ResolveDispute<'info> {
    fn validate(&self) -> Result<()> {
        require!(
            self.escrow.dispute.phase == DisputePhase::Dispute as u8,
            crate::ErrorCode::NotPermitInThisPhase
        );
        require!(
            self.dispute_request.phase_index == self.escrow.dispute.phase_index,
            crate::ErrorCode::UnmatchPhaseIndex
        );
        Ok(())
    }
}

#[event]
/// Event called in [voter::resolve_dispute].
pub struct ResolveDisputeEvent {
    /// The old [Escrow].
    #[index]
    pub escrow: Pubkey,
    /// Dispute request
    pub dispute_request: Pubkey,
}
