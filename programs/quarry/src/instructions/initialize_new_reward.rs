use crate::ErrorCode::*;
use crate::*;

/// Accounts for [quarry::initialize_new_reward].
#[derive(Accounts)]
#[instruction(index: u64)]
pub struct InitializeNewReward<'info> {
    #[account(mut)]
    pub quarry: Box<Account<'info, Quarry>>,

    #[account(
        init,
        seeds = [
            quarry.key().as_ref(),
            index.to_le_bytes().as_ref()
        ],
        bump,
        payer = payer,
        token::mint = reward_mint,
        token::authority = auth.rewarder,
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub reward_mint: Box<Account<'info, Mint>>,

    /// [Rewarder] authority.
    pub auth: MutableRewarderWithAuthority<'info>,

    // /// [Mint] of the token to create a [Quarry] for.
    // pub token_mint: Account<'info, Mint>,
    /// Payer of [Quarry] creation.
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<InitializeNewReward>,
    index: u64,
    reward_duration: u64,
    funder: Pubkey,
) -> Result<()> {
    let reward_index: usize = index.try_into().map_err(|_| TypeCastFailed)?;

    require!(
        reward_index < MAX_REWARD,
        crate::ErrorCode::InvalidRewardIndex
    );
    require!(
        reward_duration >= MIN_REWARD_DURATION && reward_duration <= MAX_REWARD_DURATION,
        crate::ErrorCode::InvalidRewardDuration
    );

    let reward_info = &mut ctx.accounts.quarry.reward_infos[reward_index];

    reward_info.init_reward(
        ctx.accounts.reward_mint.key(),
        ctx.accounts.reward_vault.key(),
        funder,
        reward_duration,
    );

    emit!(InitializeNewRewardEvent {
        reward_mint: ctx.accounts.reward_mint.key(),
        funder,
        reward_duration,
        reward_index: index,
    });

    Ok(())
}

impl<'info> Validate<'info> for InitializeNewReward<'info> {
    fn validate(&self) -> Result<()> {
        // only allow to initalize new reward for lp pool, for clmm, admin will need to initalize directly in program
        invariant!(self.quarry.is_lp_pool());
        assert_keys_eq!(self.quarry.rewarder, self.auth.rewarder);
        self.auth.rewarder.assert_not_paused()?;
        Ok(())
    }
}

#[event]
pub struct InitializeNewRewardEvent {
    // reward_mint
    pub reward_mint: Pubkey,
    // Address funder
    pub funder: Pubkey,
    // reward_index
    pub reward_index: u64,
    // funding reward_duration
    pub reward_duration: u64,
}
