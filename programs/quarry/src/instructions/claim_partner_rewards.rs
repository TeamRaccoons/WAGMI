use crate::ErrorCode::*;
use crate::*;

/// ClaimRewards accounts
/// Accounts for [quarry::claim_partner_rewards].
#[derive(Accounts)]
pub struct ClaimPartnerRewards<'info> {
    /// Quarry to claim from.
    #[account(mut)]
    pub quarry: AccountLoader<'info, Quarry>,

    /// Token program
    pub token_program: Program<'info, Token>,

    /// Miner.
    #[account(mut)]
    pub miner: Account<'info, Miner>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    /// Account to claim rewards for.
    #[account(mut)]
    pub rewards_token_account: Box<Account<'info, TokenAccount>>,

    /// Rewarder
    pub rewarder: Account<'info, Rewarder>,

    /// Miner authority (i.e. the user).
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<ClaimPartnerRewards>, reward_index: u64) -> Result<()> {
    let reward_index: usize = reward_index.try_into().map_err(|_| TypeCastFailed)?;
    ctx.accounts.validate(reward_index)?;
    let miner = &mut ctx.accounts.miner;

    let now = Clock::get()?.unix_timestamp;
    {
        let mut quarry = ctx.accounts.quarry.load_mut()?;
        quarry.update_rewards_and_miner(miner, &ctx.accounts.rewarder, now)?;
    }

    ctx.accounts.calculate_and_claim_rewards(reward_index)?;

    Ok(())
}

impl<'info> ClaimPartnerRewards<'info> {
    pub fn validate(&self, reward_index: usize) -> Result<()> {
        let quarry = self.quarry.load()?;
        assert_keys_eq!(self.authority, self.miner.authority);
        // quarry
        assert_keys_eq!(self.miner.quarry, *self.quarry.as_key_ref());
        // rewarder
        assert_keys_eq!(quarry.rewarder, self.rewarder);

        invariant!(quarry.is_lp_pool());

        require!(
            reward_index < MAX_REWARD,
            crate::ErrorCode::InvalidRewardIndex
        );

        let reward_info = &quarry.reward_infos[reward_index];

        require!(
            reward_info.initialized(),
            crate::ErrorCode::RewardUninitialized
        );
        require!(
            reward_info.vault.eq(&self.reward_vault.key()),
            crate::ErrorCode::InvalidRewardVault
        );
        Ok(())
    }

    /// Calculates rewards and claims them.
    pub fn calculate_and_claim_rewards(&mut self, reward_index: usize) -> Result<()> {
        let quarry = self.quarry.load()?;
        // let miner: &mut Account<'_, Miner> = &mut self.miner;
        let mut reward_info = &mut self.miner.reward_infos[reward_index];
        let amount_claimable = reward_info.reward_pending;
        if amount_claimable == 0 {
            // 0 claimable -- skip all logic
            return Ok(());
        }

        // Claim all rewards.
        reward_info.reward_pending = 0;

        // claim
        let seeds = gen_rewarder_signer_seeds!(self.rewarder);
        let signer_seeds = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: self.reward_vault.to_account_info(),
            to: self.rewards_token_account.to_account_info(),
            authority: self.rewarder.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        // Transfer LP tokens to quarry vault
        token::transfer(cpi_context, amount_claimable)?;

        // emit event
        let now = Clock::get()?.unix_timestamp;
        emit!(ClaimPartnerRewardEvent {
            quarry: self.quarry.key(),
            reward_index: reward_index as u64,
            authority: self.authority.key(),
            staked_token: quarry.token_mint_key,
            timestamp: now,
            rewards_token: self.reward_vault.mint,
            amount: amount_claimable,
        });

        Ok(())
    }
}

/// Emitted when reward tokens are claimed.
#[event]
pub struct ClaimPartnerRewardEvent {
    /// quarry
    #[index]
    pub quarry: Pubkey,
    /// reward_index
    pub reward_index: u64,
    /// Authority staking.
    #[index]
    pub authority: Pubkey,
    /// Token of the pool staked into.
    #[index]
    pub staked_token: Pubkey,
    /// Token received as rewards.
    pub rewards_token: Pubkey,
    /// Amount of rewards token received.
    pub amount: u64,
    /// When the event occurred.
    pub timestamp: i64,
}
