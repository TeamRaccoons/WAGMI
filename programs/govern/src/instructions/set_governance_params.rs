use crate::*;
/// Accounts for [govern::set_governance_params] and [govern::set_voter].
#[derive(Accounts)]
pub struct SetGovernanceParams<'info> {
    /// The [Governor]
    #[account(mut)]
    pub governor: Account<'info, Governor>,
    /// The Smart Wallet.
    pub smart_wallet: Signer<'info>,
}

impl<'info> SetGovernanceParams<'info> {
    pub fn set_governance_params(&mut self, params: GovernanceParameters) -> Result<()> {
        let prev_params = self.governor.params;
        self.governor.params = params;

        emit!(GovernorSetParamsEvent {
            governor: self.governor.key(),
            prev_params,
            params,
        });

        Ok(())
    }

    pub fn set_voter(&mut self, voter: Pubkey) -> Result<()> {
        let prev_voter = self.governor.voter;
        self.governor.voter = voter;

        emit!(GovernorSetVoterEvent {
            governor: self.governor.key(),
            prev_voter,
            new_voter: voter,
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for SetGovernanceParams<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(
            self.smart_wallet,
            self.governor.smart_wallet,
            "smart wallet should match"
        );
        Ok(())
    }
}

/// Event called in [govern::set_governance_params].
#[event]
pub struct GovernorSetParamsEvent {
    /// The governor being created.
    #[index]
    pub governor: Pubkey,
    /// Previous [GovernanceParameters].
    pub prev_params: GovernanceParameters,
    /// New [GovernanceParameters].
    pub params: GovernanceParameters,
}

/// Event called in [govern::set_voter].
#[event]
pub struct GovernorSetVoterEvent {
    /// The governor being created.
    #[index]
    pub governor: Pubkey,
    /// Previous [Governor::voter].
    pub prev_voter: Pubkey,
    /// New [Governor::voter].
    pub new_voter: Pubkey,
}
