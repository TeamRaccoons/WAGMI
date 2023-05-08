use crate::*;

/// Accounts for [govern::set_voter].
#[derive(Accounts)]
pub struct SetVote<'info> {
    /// The [Governor].
    pub governor: Account<'info, Governor>,
    /// The [Proposal].
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    /// The [Vote].
    #[account(mut)]
    pub vote: Account<'info, Vote>,
    /// The [Governor::locker].
    pub locker: Signer<'info>,
}

impl<'info> SetVote<'info> {
    /// Queues a Transaction into the Smart Wallet.
    pub fn set_vote(&mut self, side: u8, weight: u64) -> Result<()> {
        let vote = &self.vote;

        let proposal = &mut self.proposal;
        proposal.subtract_vote_weight(vote.side.try_into()?, vote.weight)?;
        proposal.add_vote_weight(side.try_into()?, weight)?;

        let vote = &mut self.vote;
        vote.side = side;
        vote.weight = weight;

        emit!(VoteSetEvent {
            governor: proposal.governor,
            proposal: proposal.key(),
            voter: vote.voter,
            vote: vote.key(),
            side,
            weight,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for SetVote<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.governor.locker, self.locker);
        assert_keys_eq!(
            self.governor,
            self.proposal.governor,
            "proposal should be under the governor"
        );
        assert_keys_eq!(
            self.vote.proposal,
            self.proposal,
            "vote proposal should match"
        );
        invariant!(
            self.proposal.get_state()? == ProposalState::Active,
            ProposalNotActive
        );
        Ok(())
    }
}

/// Event called in [govern::set_vote].
#[event]
pub struct VoteSetEvent {
    /// The governor.
    #[index]
    pub governor: Pubkey,
    /// The proposal being voted on.
    #[index]
    pub proposal: Pubkey,
    /// The voter.
    #[index]
    pub voter: Pubkey,
    /// The vote.
    #[index]
    pub vote: Pubkey,
    /// The vote side.
    #[index]
    pub side: u8,
    /// The vote's weight.
    pub weight: u64,
}
