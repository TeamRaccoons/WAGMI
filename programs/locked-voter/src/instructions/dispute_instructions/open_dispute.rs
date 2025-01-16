use crate::*;
/// Accounts for [voter::open_dispute].
#[derive(Accounts)]
pub struct OpenDispute<'info> {
    /// [Escrow].
    #[account(
        mut,
        has_one = owner,
    )]
    pub escrow: Box<Account<'info, Escrow>>,

    #[account(mut, constraint = escrow.tokens == escrow_tokens.key())]
    pub escrow_tokens: Account<'info, TokenAccount>,

    /// [Request].
    #[account(
        init,
        payer = payer,
        space = 8 + DisputeRequest::INIT_SPACE
    )]
    pub dispute_request: Box<Account<'info, DisputeRequest>>,

    /// Authority of the [Escrow].
    pub owner: Signer<'info>,

    /// Payer
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> OpenDispute<'info> {
    pub fn open_dispute(&mut self, new_owner: Pubkey) -> Result<()> {
        require!(
            new_owner != self.owner.key(),
            crate::ErrorCode::NewOwnerIsTheSame
        );
        self.dispute_request.escrow = self.escrow.key();
        self.dispute_request.new_owner = new_owner;
        self.dispute_request.phase_index = self.escrow.dispute.phase_index;

        self.escrow
            .dispute
            .go_to_dispute_phase(Clock::get()?.unix_timestamp);

        emit!(OpenDisputeEvent {
            escrow: self.escrow.key(),
            dispute_request: self.dispute_request.key(),
            owner: self.owner.key(),
            new_owner,
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for OpenDispute<'info> {
    fn validate(&self) -> Result<()> {
        require!(
            self.escrow.dispute.phase == DisputePhase::None as u8
                || self.escrow.dispute.phase == DisputePhase::Dispute as u8,
            crate::ErrorCode::NotPermitInThisPhase
        );
        // zero amount should short circuit.
        require!(
            self.escrow_tokens.amount > 0,
            crate::ErrorCode::AmountIsZero
        );
        Ok(())
    }
}

#[event]
/// Event called in [voter::open_dispute].
pub struct OpenDisputeEvent {
    /// The [Escrow] being created.
    pub escrow: Pubkey,
    /// The owner of the [Escrow].
    pub owner: Pubkey,
    /// Dispute request
    pub dispute_request: Pubkey,
    /// The new owner can recover fund
    pub new_owner: Pubkey,
}
