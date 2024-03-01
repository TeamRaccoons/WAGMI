use crate::*;
/// Accounts for [govern::set_vote].
#[derive(Accounts)]
pub struct SetVote<'info> {
    /// The [Governor].
    pub governor: Box<Account<'info, Governor>>,
    /// The [Proposal].
    #[account(mut)]
    pub proposal: Box<Account<'info, Proposal>>,
    /// The [Vote].
    #[account(mut)]
    pub vote: Box<Account<'info, Vote>>,
    /// The [Governor::locker].
    pub locker: Signer<'info>,
}

impl<'info> SetVote<'info> {
    /// Queues a Transaction into the Smart Wallet.
    pub fn set_vote(&mut self, side: u8, voting_power: u64) -> Result<()> {
        let vote = &self.vote;

        let proposal = &mut self.proposal;
        proposal.subtract_vote_weight(vote.side, vote.voting_power)?;
        proposal.add_vote_weight(side, voting_power)?;

        let vote = &mut self.vote;
        vote.side = side;
        vote.voting_power = voting_power;

        emit!(VoteSetEvent {
            governor: proposal.governor,
            proposal: proposal.key(),
            voter: vote.voter,
            vote: vote.key(),
            side,
            voting_power,
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
    /// The vote's voting_power.
    pub voting_power: u64,
}
