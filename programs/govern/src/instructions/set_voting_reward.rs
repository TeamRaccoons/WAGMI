use anchor_spl::{associated_token::get_associated_token_address, token::Mint};

use crate::*;
/// Accounts for [govern::set_voting_reward].
#[derive(Accounts)]
pub struct SetVotingReward<'info> {
    /// The [Governor]
    #[account(mut, has_one=smart_wallet)]
    pub governor: Account<'info, Governor>,
    /// reward mint
    pub reward_mint: Account<'info, Mint>,
    /// The Smart Wallet.
    pub smart_wallet: Signer<'info>,
}

impl<'info> SetVotingReward<'info> {
    pub fn set_voting_reward(&mut self, reward_per_proposal: u64) -> Result<()> {
        let reward_mint = self.reward_mint.key();

        self.governor.voting_reward = VotingReward {
            reward_mint,
            reward_vault: get_associated_token_address(&self.governor.key(), &reward_mint),
            reward_per_proposal,
        };

        emit!(GovernorSetVotingReward {
            governor: self.governor.key(),
            reward_mint,
            reward_per_proposal,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for SetVotingReward<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Event called in [govern::set_voting_reward].
#[event]
pub struct GovernorSetVotingReward {
    /// The governor being created.
    #[index]
    pub governor: Pubkey,
    /// Reward mint
    pub reward_mint: Pubkey,
    /// reward per proposal
    pub reward_per_proposal: u64,
}
