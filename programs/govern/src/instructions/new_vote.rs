use crate::*;

/// Accounts for [govern::new_vote].
#[derive(Accounts)]
#[instruction(_bump: u8, voter: Pubkey)]
pub struct NewVote<'info> {
    /// Proposal being voted on.
    pub proposal: Account<'info, Proposal>,

    /// The vote.
    #[account(
        init,
        seeds = [
            b"MeteoraVote".as_ref(),
            proposal.key().as_ref(),
            voter.as_ref()
        ],
        bump,
        payer = payer,
        space = 8 +  std::mem::size_of::<Vote>()
    )]
    pub vote: Account<'info, Vote>,

    /// Payer of the [Vote].
    #[account(mut)]
    pub payer: Signer<'info>,

    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> NewVote<'info> {
    pub fn new_vote(&mut self, bump: u8, voter: Pubkey) -> Result<()> {
        let vote = &mut self.vote;
        vote.proposal = self.proposal.key();
        vote.voter = voter;
        vote.bump = bump;

        vote.side = VoteSide::Pending.into();
        vote.weight = 0;

        Ok(())
    }
}

impl<'info> Validate<'info> for NewVote<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}
