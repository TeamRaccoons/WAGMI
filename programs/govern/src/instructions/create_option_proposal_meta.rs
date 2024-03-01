use crate::*;

/// Accounts for [govern::create_proposal_meta].
#[derive(Accounts)]
#[instruction(_bump: u8, option_descriptions: Vec<String>)]
pub struct CreateOptionProposalMeta<'info> {
    /// The [Proposal].
    pub proposal: Box<Account<'info, Proposal>>,
    /// Proposer of the proposal.
    pub proposer: Signer<'info>,
    /// The [ProposalMeta].
    #[account(
        init,
        seeds = [
            b"OptionProposalMeta".as_ref(),
            proposal.key().as_ref()
        ],
        bump,
        payer = payer,
        space = 8 + OptionProposalMeta::space(&option_descriptions)
    )]
    pub option_proposal_meta: Box<Account<'info, OptionProposalMeta>>,
    /// Payer of the [ProposalMeta].
    #[account(mut)]
    pub payer: Signer<'info>,
    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateOptionProposalMeta<'info> {
    pub fn create_proposal_meta(&mut self, option_descriptions: Vec<String>) -> Result<()> {
        invariant!(
            option_descriptions.len() == self.proposal.max_option as usize,
            InvalidOptionDescriptions
        );
        let option_proposal_meta = &mut self.option_proposal_meta;
        option_proposal_meta.proposal = self.proposal.key();
        option_proposal_meta.option_descriptions = option_descriptions.clone();

        emit!(OptionProposalMetaCreateEvent {
            governor: self.proposal.governor,
            proposal: self.proposal.key(),
            option_descriptions,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for CreateOptionProposalMeta<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.proposer, self.proposal.proposer);
        invariant!(
            self.proposal.proposal_type == u8::from(ProposalType::Option),
            NotOptionProposal
        );
        Ok(())
    }
}

/// Event called in [govern::create_option_proposal_meta].
#[event]
pub struct OptionProposalMetaCreateEvent {
    /// The governor.
    #[index]
    pub governor: Pubkey,
    /// The proposal being voted on.
    #[index]
    pub proposal: Pubkey,
    /// The title.
    pub option_descriptions: Vec<String>,
}
