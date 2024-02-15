use crate::*;

/// Accounts for [voter::activate_proposal].
#[derive(Accounts)]
pub struct ActivateProposalInitialPhase<'info> {
    /// The [Locker].
    pub locker: Box<Account<'info, Locker>>,
    /// The [Governor].
    pub governor: Box<Account<'info, Governor>>,
    /// The [Proposal].
    #[account(mut)]
    pub proposal: Box<Account<'info, Proposal>>,
    /// The [govern] program.
    pub govern_program: Program<'info, govern::program::Govern>,
    /// The smart wallet on the [Governor].
    pub smart_wallet: Signer<'info>,
}

impl<'info> ActivateProposalInitialPhase<'info> {
    /// Activates the proposal.
    pub fn activate_proposal(&mut self) -> Result<()> {
        let seeds: &[&[&[u8]]] = locker_seeds!(self.locker);

        govern::cpi::activate_proposal(
            CpiContext::new(
                self.govern_program.to_account_info(),
                self.to_activate_proposal_accounts(),
            )
            .with_signer(seeds),
        )?;

        Ok(())
    }

    /// Conversion.
    fn to_activate_proposal_accounts(&self) -> govern::cpi::accounts::ActivateProposal<'info> {
        govern::cpi::accounts::ActivateProposal {
            governor: self.governor.to_account_info(),
            proposal: self.proposal.to_account_info(),
            locker: self.locker.to_account_info(),
        }
    }
}

impl<'info> Validate<'info> for ActivateProposalInitialPhase<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.locker, self.governor.locker);
        assert_keys_eq!(self.governor, self.locker.governor);
        assert_keys_eq!(self.proposal.governor, self.governor);
        assert_keys_eq!(self.smart_wallet, self.governor.smart_wallet);
        let phase = self.locker.get_current_phase()?;

        // Only allow this function when we are in InitialPhase
        invariant!(phase == Phase::InitialPhase, "must be initial phase");

        Ok(())
    }
}
