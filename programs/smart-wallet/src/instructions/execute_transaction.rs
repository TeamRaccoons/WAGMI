use crate::*;

/// Accounts for [smart_wallet::execute_transaction].
#[derive(Accounts)]
pub struct ExecuteTransaction<'info> {
    /// The [SmartWallet].
    pub smart_wallet: Account<'info, SmartWallet>,
    /// The [Transaction] to execute.
    #[account(mut)]
    pub transaction: Account<'info, Transaction>,
    /// An owner of the [SmartWallet].
    pub owner: Signer<'info>,
}

impl<'info> ExecuteTransaction<'info> {
    pub fn execute_transaction(&mut self, remaining_accounts: &[AccountInfo<'info>]) -> Result<()> {
        let smart_wallet = &self.smart_wallet;
        let smart_wallet_base = smart_wallet.base;
        let wallet_seeds: &[&[&[u8]]] = &[&[
            b"SmartWallet" as &[u8],
            &smart_wallet_base.as_ref(),
            &[smart_wallet.bump],
        ]];
        self.do_execute_transaction(wallet_seeds, remaining_accounts)
    }

    pub fn do_execute_transaction(
        &mut self,
        seeds: &[&[&[u8]]],
        remaining_accounts: &[AccountInfo<'info>],
    ) -> Result<()> {
        for ix in self.transaction.instructions.iter() {
            solana_program::program::invoke_signed(&(ix).into(), remaining_accounts, seeds)?;
        }

        // Burn the transaction to ensure one time use.
        let tx = &mut self.transaction;
        tx.executor = self.owner.key();
        tx.executed_at = Clock::get()?.unix_timestamp;

        emit!(TransactionExecuteEvent {
            smart_wallet: self.smart_wallet.key(),
            transaction: self.transaction.key(),
            executor: self.owner.key(),
            timestamp: Clock::get()?.unix_timestamp
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for ExecuteTransaction<'info> {
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

        // Has this been executed already?
        invariant!(self.transaction.executed_at == -1, AlreadyExecuted);

        let eta = self.transaction.eta;
        let clock = Clock::get()?;
        let current_ts = clock.unix_timestamp;
        msg!("current_ts: {}; eta: {}", current_ts, eta);
        // Has transaction surpassed timelock?
        invariant!(current_ts >= eta, TransactionNotReady);
        if eta != NO_ETA {
            // Has grace period passed?
            invariant!(
                current_ts <= unwrap_int!(eta.checked_add(self.smart_wallet.grace_period)),
                TransactionIsStale
            );
        }

        // Do we have enough signers to execute the TX?
        let sig_count = self.transaction.num_signers();
        invariant!(
            (sig_count as u64) >= self.smart_wallet.threshold,
            NotEnoughSigners
        );

        // ensure that the owner is a signer
        // this prevents common frontrunning/flash loan attacks
        self.smart_wallet.owner_index(self.owner.key())?;

        Ok(())
    }
}

/// Emitted when a [Transaction] is executed.
#[event]
pub struct TransactionExecuteEvent {
    /// The [SmartWallet].
    #[index]
    pub smart_wallet: Pubkey,
    /// The [Transaction] executed.
    #[index]
    pub transaction: Pubkey,
    /// The owner that executed the transaction.
    pub executor: Pubkey,
    /// The Unix timestamp when the event was emitted.
    pub timestamp: i64,
}
