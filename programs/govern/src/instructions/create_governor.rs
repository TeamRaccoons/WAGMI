use crate::*;

/// Accounts for [govern::create_governor].
#[derive(Accounts)]
pub struct CreateGovernor<'info> {
    /// Base of the [Governor] key.
    pub base: Signer<'info>,
    /// Governor.
    #[account(
        init,
        seeds = [
            b"Governor".as_ref(),
            base.key().as_ref()
        ],
        bump,
        payer = payer,
        space = 8 + Governor::LEN
    )]
    pub governor: Account<'info, Governor>,
    /// The Smart Wallet.
    pub smart_wallet: Account<'info, SmartWallet>,
    /// Payer.
    #[account(mut)]
    pub payer: Signer<'info>,
    /// System program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateGovernor<'info> {
    pub fn create_governor(
        &mut self,
        bump: u8,
        locker: Pubkey,
        params: GovernanceParameters,
    ) -> Result<()> {
        invariant!(
            params.timelock_delay_seconds >= 0,
            "timelock delay must be at least 0 seconds"
        );

        let governor = &mut self.governor;
        governor.base = self.base.key();
        governor.bump = bump;

        governor.proposal_count = 0;
        governor.locker = locker;
        governor.smart_wallet = self.smart_wallet.key();

        governor.params = params;

        emit!(GovernorCreateEvent {
            governor: governor.key(),
            locker,
            smart_wallet: self.smart_wallet.key(),
            parameters: params,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for CreateGovernor<'info> {
    fn validate(&self) -> Result<()> {
        invariant!(
            self.smart_wallet.owners.contains(&self.governor.key()),
            GovernorNotFound
        );

        Ok(())
    }
}

/// Event called in [govern::create_governor].
#[event]
pub struct GovernorCreateEvent {
    /// The governor being created.
    #[index]
    pub governor: Pubkey,
    /// The locker of the created [Governor].
    pub locker: Pubkey,
    /// The [SmartWallet].
    pub smart_wallet: Pubkey,
    /// Governance parameters.
    pub parameters: GovernanceParameters,
}
