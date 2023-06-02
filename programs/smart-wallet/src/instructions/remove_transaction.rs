use crate::*;

/// Accounts for [smart_wallet::remove_transaction].
#[derive(Accounts)]
pub struct RemoveTransaction<'info> {
    /// The [SmartWallet].
    #[account(mut)]
    pub smart_wallet: Account<'info, SmartWallet>,
    /// The [Transaction].
    #[account(
        mut,
        has_one = smart_wallet,
        has_one = proposer,
        close = proposer,
    )]
    pub transaction: Account<'info, Transaction>,
    /// Must be proposer of the transaction
    #[account(mut)]
    pub proposer: Signer<'info>,
}

impl<'info> RemoveTransaction<'info> {
    pub fn remove_transaction(&mut self) -> Result<()> {
        emit!(TransactionRemoveEvent {
            smart_wallet: self.smart_wallet.key(),
            transaction: self.transaction.key(),
            proposer: self.proposer.key(),
            timestamp: Clock::get()?.unix_timestamp
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for RemoveTransaction<'info> {
    fn validate(&self) -> Result<()> {
        // make sure all signers are false (no one already signed)
        let sig_count = self.transaction.num_signers();
        invariant!(sig_count == 0, NumSignerIsNotZero);
        Ok(())
    }
}

/// Emitted when a [Transaction] is proposed.
#[event]
pub struct TransactionRemoveEvent {
    /// The [SmartWallet].
    #[index]
    pub smart_wallet: Pubkey,
    /// The [Transaction].
    #[index]
    pub transaction: Pubkey,
    /// The owner which proposed the transaction.
    pub proposer: Pubkey,
    /// The Unix timestamp when the event was emitted.
    pub timestamp: i64,
}
