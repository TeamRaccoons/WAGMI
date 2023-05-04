use crate::*;

/// Accounts for [smart_wallet::set_owners] and [smart_wallet::change_threshold].
#[derive(Accounts)]
pub struct Auth<'info> {
    /// The [SmartWallet].
    #[account(mut, signer)]
    pub smart_wallet: Account<'info, SmartWallet>,
}

impl<'info> Auth<'info> {
    pub fn set_owners(&mut self, owners: Vec<Pubkey>) -> Result<()> {
        let smart_wallet = &mut self.smart_wallet;
        if (owners.len() as u64) < smart_wallet.threshold {
            smart_wallet.threshold = owners.len() as u64;
        }

        smart_wallet.owners = owners.clone();
        smart_wallet.owner_set_seqno = unwrap_int!(smart_wallet.owner_set_seqno.checked_add(1));

        emit!(WalletSetOwnersEvent {
            smart_wallet: self.smart_wallet.key(),
            owners,
            timestamp: Clock::get()?.unix_timestamp
        });
        Ok(())
    }

    pub fn change_threshold(&mut self, threshold: u64) -> Result<()> {
        invariant!(
            threshold <= self.smart_wallet.owners.len() as u64,
            InvalidThreshold
        );
        let smart_wallet = &mut self.smart_wallet;
        smart_wallet.threshold = threshold;

        emit!(WalletChangeThresholdEvent {
            smart_wallet: self.smart_wallet.key(),
            threshold,
            timestamp: Clock::get()?.unix_timestamp
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for Auth<'info> {
    fn validate(&self) -> Result<()> {
        invariant!(
            self.smart_wallet.to_account_info().is_signer,
            "smart_wallet.is_signer"
        );
        Ok(())
    }
}

/// Emitted when the owners of a [SmartWallet] are changed.
#[event]
pub struct WalletSetOwnersEvent {
    /// The [SmartWallet].
    #[index]
    pub smart_wallet: Pubkey,
    /// The new owners of the [SmartWallet].
    pub owners: Vec<Pubkey>,
    /// The Unix timestamp when the event was emitted.
    pub timestamp: i64,
}

/// Emitted when the threshold of a [SmartWallet] is changed.
#[event]
pub struct WalletChangeThresholdEvent {
    /// The [SmartWallet].
    #[index]
    pub smart_wallet: Pubkey,
    /// The new [SmartWallet::threshold].
    pub threshold: u64,
    /// The Unix timestamp when the event was emitted.
    pub timestamp: i64,
}
