use crate::*;

/// Accounts for [govern::create_option_proposal].
#[derive(Accounts)]
#[instruction(max_option: u8, instructions: Vec<ProposalInstruction>)]
pub struct CreateOptionProposal<'info> {
    /// The [Governor].
    #[account(mut)]
    pub governor: Box<Account<'info, Governor>>,
    /// The [Proposal].
    #[account(
        init,
        seeds = [
            b"Proposal".as_ref(),
            governor.key().as_ref(),
            governor.proposal_count.to_le_bytes().as_ref()
        ],
        bump,
        payer = payer,
        space = Proposal::space(max_option + 1, instructions), // plus 1 for abstain vote
    )]
    pub proposal: Box<Account<'info, Proposal>>,
    /// Proposer of the proposal.
    pub proposer: Signer<'info>,
    /// Payer of the proposal.
    #[account(mut)]
    pub payer: Signer<'info>,
    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateOptionProposal<'info> {
    pub fn create_option_proposal(
        &mut self,
        bump: u8,
        max_option: u8,
        instructions: Vec<ProposalInstruction>,
    ) -> Result<()> {
        invariant!(
            max_option >= 2 && max_option <= MAX_OPTION,
            InvalidMaxOption
        );

        let governor = &mut self.governor;

        let proposal = &mut self.proposal;
        proposal.governor = governor.key();
        proposal.index = governor.proposal_count;
        proposal.bump = bump;

        proposal.proposer = self.proposer.key();

        proposal.quorum_votes = governor.params.quorum_votes;
        proposal.created_at = Clock::get()?.unix_timestamp;
        proposal.canceled_at = 0;
        proposal.activated_at = 0;
        proposal.voting_ends_at = 0;

        proposal.queued_at = 0;
        proposal.queued_transaction = Pubkey::default();

        proposal.voting_reward = governor.voting_reward;

        proposal.instructions = instructions.clone();

        proposal.proposal_type = ProposalType::Option.into();
        proposal.max_option = max_option;
        proposal.option_votes = vec![0; (max_option + 1) as usize]; // plus 1 for abstain vote

        governor.proposal_count += 1;

        emit!(OptionProposalCreateEvent {
            governor: governor.key(),
            proposal: proposal.key(),
            index: proposal.index,
            max_option,
            instructions,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for CreateOptionProposal<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [govern::create_proposal].
#[event]
pub struct OptionProposalCreateEvent {
    /// The governor.
    #[index]
    pub governor: Pubkey,
    /// The proposal being created.
    #[index]
    pub proposal: Pubkey,
    /// The index of the [Proposal].
    pub index: u64,
    /// Max option of proposal.
    pub max_option: u8,
    /// Instructions in the proposal.
    pub instructions: Vec<ProposalInstruction>,
}
