use crate::*;
use anchor_spl::token::{self, Token, TokenAccount};
/// Accounts for [govern::claim_reward].
#[derive(Accounts)]
pub struct ClaimReward<'info> {
    /// The [Governor]
    #[account(mut)]
    pub governor: Box<Account<'info, Governor>>,
    /// reward mint
    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,
    /// proposal
    #[account(mut, has_one = governor)]
    pub proposal: Box<Account<'info, Proposal>>,
    /// The [Vote].
    #[account(mut, has_one = proposal, has_one = voter)]
    pub vote: Box<Account<'info, Vote>>,
    /// Owner of the vault
    /// TODO: check whether vote delegrate can claim on behalf of owner?
    pub voter: Signer<'info>,
    /// Voter token account
    #[account(mut)]
    pub voter_token_account: Account<'info, TokenAccount>,
    /// Token program.
    pub token_program: Program<'info, Token>,
}

impl<'info> ClaimReward<'info> {
    pub fn claim_reward(&mut self) -> Result<()> {
        self.vote.claimed = true;

        let voting_reward = unwrap_opt!(
            self.proposal.get_voting_reward(&self.vote),
            "Math is overflow"
        );

        if voting_reward != 0 {
            // transfer tokens to the escrow
            let seeds = governor_seeds!(self.governor);
            let signer_seeds = &[&seeds[..]];
            token::transfer(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    token::Transfer {
                        from: self.reward_vault.to_account_info(),
                        to: self.voter_token_account.to_account_info(),
                        authority: self.governor.to_account_info(),
                    },
                    signer_seeds,
                ),
                voting_reward,
            )?;

            self.proposal.total_claimed_reward = unwrap_opt!(
                self.proposal
                    .total_claimed_reward
                    .checked_add(voting_reward),
                "Math is overflow"
            );
        }

        emit!(ClaimRewardEvent {
            governor: self.governor.key(),
            voter: self.voter.key(),
            proposal: self.proposal.key(),
            voting_reward,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for ClaimReward<'info> {
    fn validate(&self) -> Result<()> {
        let voting_reward = self.proposal.voting_reward;
        assert_keys_eq!(voting_reward.reward_vault, self.reward_vault);

        invariant!(
            unwrap_opt!(self.proposal.meets_quorum(), "Math is overflow"),
            "Proposal doesn't meet quorum"
        );
        let now = Clock::get()?.unix_timestamp;
        let proposal_state = unwrap_opt!(self.proposal.state(now), "invalid state");
        invariant!(
            proposal_state == ProposalState::Defeated
                || proposal_state != ProposalState::Queued
                || proposal_state != ProposalState::Succeeded,
            "Proposal must be defeated, queued or succeeded"
        );
        invariant!(!self.vote.claimed, "Voter has claimed reward");

        invariant!(
            self.voter_token_account.owner == self.voter.key(),
            "Must be withdraw to owner wallet"
        );
        Ok(())
    }
}

/// Event called in [govern::claim_reward].
#[event]
pub struct ClaimRewardEvent {
    /// The governor being created.
    #[index]
    pub governor: Pubkey,
    /// Voter
    pub voter: Pubkey,
    /// Proposal
    pub proposal: Pubkey,
    /// Voting reward
    pub voting_reward: u64,
}
