use crate::*;

/// Accounts for [govern::create_proposal_meta].
#[event_cpi]
#[derive(Accounts)]
#[instruction(_bump: u8, title: String, description_link: String)]
pub struct CreateProposalMeta<'info> {
    /// The [Proposal].
    pub proposal: Box<Account<'info, Proposal>>,
    /// Proposer of the proposal.
    pub proposer: Signer<'info>,
    /// The [ProposalMeta].
    #[account(
        init,
        seeds = [
            b"ProposalMeta".as_ref(),
            proposal.key().as_ref()
        ],
        bump,
        payer = payer,
        space = 8 + std::mem::size_of::<Pubkey>()
            + 4 + title.as_bytes().len()
            + 4 + description_link.as_bytes().len()
    )]
    pub proposal_meta: Box<Account<'info, ProposalMeta>>,
    /// Payer of the [ProposalMeta].
    #[account(mut)]
    pub payer: Signer<'info>,
    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposalMeta<'info> {
    pub fn create_proposal_meta(
        &mut self,
        title: String,
        description_link: String,
    ) -> Result<ProposalMetaCreateEvent> {
        let proposal_meta = &mut self.proposal_meta;
        proposal_meta.proposal = self.proposal.key();
        proposal_meta.title = title.clone();
        proposal_meta.description_link = description_link.clone();

        Ok(ProposalMetaCreateEvent {
            governor: self.proposal.governor,
            proposal: self.proposal.key(),
            title,
            description_link,
        })
    }
}

impl<'info> Validate<'info> for CreateProposalMeta<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.proposer, self.proposal.proposer);
        Ok(())
    }
}

/// Event called in [govern::create_proposal_meta].
#[event]
pub struct ProposalMetaCreateEvent {
    /// The governor.
    #[index]
    pub governor: Pubkey,
    /// The proposal being voted on.
    #[index]
    pub proposal: Pubkey,
    /// The title.
    pub title: String,
    /// The description.
    pub description_link: String,
}
