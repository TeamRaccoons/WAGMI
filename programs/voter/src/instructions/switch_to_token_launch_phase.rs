//! Instruction handler for [voter::change_locker_expiration].

use crate::*;

/// Accounts for [voter::make_locker_permissionless].
#[derive(Accounts)]
pub struct SwitchToTokenLaunchPhase<'info> {
    /// The [Locker].
    #[account(mut)]
    pub locker: Account<'info, Locker>,
    /// The [Governor].
    pub governor: Account<'info, Governor>,
    /// The smart wallet on the [Governor].
    pub smart_wallet: Signer<'info>,
}

impl<'info> SwitchToTokenLaunchPhase<'info> {
    pub fn switch_to_token_launch_phase(&mut self) -> Result<()> {
        self.locker.phase = Phase::TokenLaunchPhase;
        Ok(())
    }
}

impl<'info> Validate<'info> for SwitchToTokenLaunchPhase<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.governor, self.locker.governor, "governor mismatch");
        assert_keys_eq!(self.smart_wallet, self.governor.smart_wallet);
        assert_eq!(self.locker.phase, Phase::InitialPhase);
        Ok(())
    }
}
