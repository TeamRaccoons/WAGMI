use crate::*;

/// Accounts for [govern::cancel_proposal].
#[derive(Accounts)]
pub struct CancelProposal<'info> {
    /// The [Governor].
    pub governor: Box<Account<'info, Governor>>,
    /// The [Proposal] to activate.
    #[account(mut)]
    pub proposal: Box<Account<'info, Proposal>>,
    /// The [Proposal::proposer].
    pub proposer: Signer<'info>,
}

impl<'info> CancelProposal<'info> {
    pub fn cancel_proposal(&mut self) -> Result<()> {
        let proposal = &mut self.proposal;
        proposal.canceled_at = Clock::get()?.unix_timestamp;

        emit!(ProposalCancelEvent {
            governor: proposal.governor,
            proposal: proposal.key(),
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for CancelProposal<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(
            self.proposer,
            self.proposal.proposer,
            "proposer should match recorded"
        );
        assert_keys_eq!(
            self.governor,
            self.proposal.governor,
            "proposal should be under the governor"
        );
        invariant!(
            self.proposal.get_state()? == ProposalState::Draft,
            ProposalNotDraft
        );
        Ok(())
    }
}
/// Event called in [govern::cancel_proposal].
#[event]
pub struct ProposalCancelEvent {
    /// The governor.
    #[index]
    pub governor: Pubkey,
    /// The proposal being canceled.
    #[index]
    pub proposal: Pubkey,
}
