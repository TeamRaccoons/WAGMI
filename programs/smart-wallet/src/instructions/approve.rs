use crate::*;

/// Accounts for [smart_wallet::approve].
#[derive(Accounts)]
pub struct Approve<'info> {
    /// The [SmartWallet].
    pub smart_wallet: Account<'info, SmartWallet>,
    /// The [Transaction].
    #[account(mut)]
    pub transaction: Account<'info, Transaction>,
    /// One of the smart_wallet owners. Checked in the handler.
    pub owner: Signer<'info>,
}

impl<'info> Approve<'info> {
    pub fn approve(&mut self) -> Result<()> {
        let owner_index = self.smart_wallet.owner_index(self.owner.key())?;
        self.transaction.signers[owner_index] = true;

        emit!(TransactionApproveEvent {
            smart_wallet: self.smart_wallet.key(),
            transaction: self.transaction.key(),
            owner: self.owner.key(),
            timestamp: Clock::get()?.unix_timestamp
        });
        Ok(())
    }

    pub fn unapprove(&mut self) -> Result<()> {
        let owner_index = self.smart_wallet.owner_index(self.owner.key())?;
        self.transaction.signers[owner_index] = false;

        emit!(TransactionUnapproveEvent {
            smart_wallet: self.smart_wallet.key(),
            transaction: self.transaction.key(),
            owner: self.owner.key(),
            timestamp: Clock::get()?.unix_timestamp
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for Approve<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(
            self.smart_wallet,
            self.transaction.smart_wallet,
            "smart_wallet"
        );
        invariant!(
            self.smart_wallet.owner_set_seqno == self.transaction.owner_set_seqno,
            OwnerSetChanged
        );
        Ok(())
    }
}

/// Emitted when a [Transaction] is approved.
#[event]
pub struct TransactionApproveEvent {
    /// The [SmartWallet].
    #[index]
    pub smart_wallet: Pubkey,
    /// The [Transaction].
    #[index]
    pub transaction: Pubkey,
    /// The owner which approved the transaction.
    pub owner: Pubkey,
    /// The Unix timestamp when the event was emitted.
    pub timestamp: i64,
}

/// Emitted when a [Transaction] is unapproved.
#[event]
pub struct TransactionUnapproveEvent {
    /// The [SmartWallet].
    #[index]
    pub smart_wallet: Pubkey,
    /// The [Transaction].
    #[index]
    pub transaction: Pubkey,
    /// The owner that unapproved the transaction.
    pub owner: Pubkey,
    /// The Unix timestamp when the event was emitted.
    pub timestamp: i64,
}
