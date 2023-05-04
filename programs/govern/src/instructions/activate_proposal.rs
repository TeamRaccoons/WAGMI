use crate::*;

/// Accounts for [govern::activate_proposal].
#[derive(Accounts)]
pub struct ActivateProposal<'info> {
    /// The [Governor].
    pub governor: Account<'info, Governor>,
    /// The [Proposal] to activate.
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    /// The electorate of the [Governor] that may activate the proposal.
    pub electorate: Signer<'info>,
}

impl<'info> ActivateProposal<'info> {
    pub fn activate_proposal(&mut self) -> Result<()> {
        let proposal = &mut self.proposal;
        let now = Clock::get()?.unix_timestamp;
        proposal.activated_at = now;
        proposal.voting_ends_at = unwrap_int!(self
            .governor
            .params
            .voting_period
            .to_i64()
            .and_then(|v: i64| now.checked_add(v)));

        emit!(ProposalActivateEvent {
            governor: proposal.governor,
            proposal: proposal.key(),
            voting_ends_at: proposal.voting_ends_at,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for ActivateProposal<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.governor, self.proposal.governor);
        assert_keys_eq!(self.electorate, self.governor.electorate);
        invariant!(
            self.proposal.get_state()? == ProposalState::Draft,
            ProposalNotDraft
        );

        let earliest_activation_time = unwrap_int!(self
            .governor
            .params
            .voting_delay
            .checked_add(self.proposal.created_at as u64));
        let now = Clock::get()?.unix_timestamp as u64;
        if earliest_activation_time > now {
            msg!(
                "Earliest activation time {}; now: {}",
                earliest_activation_time,
                now
            );
            invariant!(now >= earliest_activation_time, VotingDelayNotMet);
        }

        Ok(())
    }
}

/// Event called in [govern::cancel_proposal].
#[event]
pub struct ProposalActivateEvent {
    /// The governor.
    #[index]
    pub governor: Pubkey,
    /// The proposal being activated.
    #[index]
    pub proposal: Pubkey,
    /// When voting ends for the [Proposal].
    pub voting_ends_at: i64,
}
