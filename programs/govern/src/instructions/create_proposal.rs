use crate::*;

/// Accounts for [govern::create_proposal].
#[event_cpi]
#[derive(Accounts)]
#[instruction(proposal_type: u8, max_option: u8, instructions: Vec<ProposalInstruction>)]
pub struct CreateProposal<'info> {
    /// The [Governor].
    #[account(mut, has_one = smart_wallet)]
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
        space = 8 + Proposal::space(max_option + 1, instructions), // yes/no proposal only has 2 options, plus 1 for abstain vote
    )]
    pub proposal: Box<Account<'info, Proposal>>,
    /// smart wallet of governor
    pub smart_wallet: Account<'info, SmartWallet>,
    /// Proposer of the proposal.
    /// One of the owners. Checked in the handler via [SmartWallet::owner_index].
    pub proposer: Signer<'info>,
    /// Payer of the proposal.
    #[account(mut)]
    pub payer: Signer<'info>,
    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposal<'info> {
    pub fn create_proposal(
        &mut self,
        bump: u8,
        proposal_type: u8,
        max_option: u8,
        instructions: Vec<ProposalInstruction>,
    ) -> Result<ProposalCreateEvent> {
        // validate proposal type
        let proposal_type_state = ProposalType::try_from(proposal_type)?;
        match proposal_type_state {
            ProposalType::YesNo => {
                invariant!(max_option == 2, InvalidMaxOption);
            }
            ProposalType::Option => {
                invariant!(
                    max_option >= 2 && max_option <= MAX_OPTION,
                    InvalidMaxOption
                );
            }
        }

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

        proposal.proposal_type = proposal_type;
        proposal.max_option = max_option;
        proposal.option_votes = vec![0; (max_option + 1) as usize]; // plus 1 for abstain vote

        governor.proposal_count += 1;

        Ok(ProposalCreateEvent {
            governor: governor.key(),
            proposal: proposal.key(),
            proposer: self.proposer.key(),
            proposal_type,
            max_option,
            index: proposal.index,
            instructions,
        })
    }
}

impl<'info> Validate<'info> for CreateProposal<'info> {
    fn validate(&self) -> Result<()> {
        // validate proposer is one of owners of smart-wallet
        self.smart_wallet.owner_index(self.proposer.key())?;
        Ok(())
    }
}

/// Event called in [govern::create_proposal].
#[event]
pub struct ProposalCreateEvent {
    /// The governor.
    #[index]
    pub governor: Pubkey,
    /// The proposal being created.
    #[index]
    pub proposal: Pubkey,
    /// proposer of proposal
    pub proposer: Pubkey,
    /// The proposal type
    pub proposal_type: u8,
    /// Max option of proposal
    pub max_option: u8,
    /// The index of the [Proposal].
    pub index: u64,
    /// Instructions in the proposal.
    pub instructions: Vec<ProposalInstruction>,
}
