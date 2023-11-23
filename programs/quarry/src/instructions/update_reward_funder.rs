use crate::ErrorCode::*;
use crate::*;
/// Accounts for [quarry::update_reward_funder].
#[derive(Accounts)]
#[instruction(reward_index: u64)]
pub struct UpdateRewardFunder<'info> {
    #[account(mut)]
    pub quarry: AccountLoader<'info, Quarry>,

    /// [Rewarder] authority.
    pub auth: MutableRewarderWithAuthority<'info>,
}

pub fn handle(ctx: Context<UpdateRewardFunder>, index: u64, new_funder: Pubkey) -> Result<()> {
    let reward_index: usize = index.try_into().map_err(|_| TypeCastFailed)?;
    let mut quarry = ctx.accounts.quarry.load_mut()?;
    let mut reward_info = quarry.reward_infos[reward_index];

    require!(
        reward_info.initialized(),
        crate::ErrorCode::RewardUninitialized
    );
    require!(
        new_funder != reward_info.funder,
        crate::ErrorCode::SameFunder
    );

    let old_funder = reward_info.funder;
    reward_info.funder = new_funder;

    emit!(UpdateRewardFunderEvent {
        quarry: ctx.accounts.quarry.key(),
        reward_index: index,
        old_funder,
        new_funder,
    });

    Ok(())
}

impl<'info> Validate<'info> for UpdateRewardFunder<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.quarry.load()?.rewarder, self.auth.rewarder);
        Ok(())
    }
}

#[event]
pub struct UpdateRewardFunderEvent {
    // quarry
    pub quarry: Pubkey,
    // reward_index
    pub reward_index: u64,
    // old_funder
    pub old_funder: Pubkey,
    // new_funder
    pub new_funder: Pubkey,
}
