use crate::ErrorCode::*;
use crate::*;

/// Accounts for [quarry::fund_reward].
#[derive(Accounts)]
#[instruction(reward_index: u64)]
pub struct FundReward<'info> {
    #[account(mut)]
    pub quarry: AccountLoader<'info, Quarry>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub funder: Signer<'info>,

    pub rewarder: Account<'info, Rewarder>,

    pub token_program: Program<'info, Token>,
}

impl<'info> FundReward<'info> {
    fn validate(&self, reward_index: usize) -> Result<()> {
        require!(
            reward_index < MAX_REWARD,
            crate::ErrorCode::InvalidRewardIndex
        );

        let reward_info = &self.quarry.load()?.reward_infos[reward_index];

        require!(
            reward_info.initialized(),
            crate::ErrorCode::RewardUninitialized
        );
        require!(
            reward_info.vault.eq(&self.reward_vault.key()),
            crate::ErrorCode::InvalidRewardVault
        );
        require!(
            reward_info.funder == self.funder.key() || self.rewarder.admin == self.funder.key(),
            crate::ErrorCode::InvalidAdmin
        );

        Ok(())
    }

    fn transfer_from_funder_to_vault(&self, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: self.funder_token_account.to_account_info(),
            to: self.reward_vault.to_account_info(),
            authority: self.funder.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        // Transfer LP tokens to quarry vault
        token::transfer(cpi_context, amount)?;
        Ok(())
    }
}

pub fn handle(ctx: Context<FundReward>, index: u64, amount: u64) -> Result<()> {
    let reward_index: usize = index.try_into().map_err(|_| TypeCastFailed)?;
    ctx.accounts.validate(reward_index)?;

    // 2. set new farming rate
    let current_time = Clock::get()?.unix_timestamp;
    let quarry = ctx.accounts.quarry.load_mut()?;
    let mut reward_info = quarry.reward_infos[reward_index];
    reward_info.update_rate_after_funding(current_time as u64, amount)?;

    if amount > 0 {
        ctx.accounts.transfer_from_funder_to_vault(amount)?;
    }

    emit!(FundRewardEvent {
        quarry: ctx.accounts.quarry.key(),
        funder: ctx.accounts.funder.key(),
        reward_index: index,
        amount,
    });

    Ok(())
}

impl<'info> Validate<'info> for FundReward<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[event]
pub struct FundRewardEvent {
    // Address quarry
    pub quarry: Pubkey,
    // Address funder
    pub funder: Pubkey,
    // reward_index
    pub reward_index: u64,
    // funding amount
    pub amount: u64,
}
