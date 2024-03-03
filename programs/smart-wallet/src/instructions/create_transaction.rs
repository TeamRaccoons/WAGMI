use crate::*;

/// Accounts for [smart_wallet::create_transaction].
#[derive(Accounts)]
#[instruction(bump: u8, instructions: Vec<TXInstruction>)]
pub struct CreateTransaction<'info> {
    /// The [SmartWallet].
    #[account(mut)]
    pub smart_wallet: Account<'info, SmartWallet>,
    /// The [Transaction].
    #[account(
        init,
        seeds = [
            b"Transaction".as_ref(),
            smart_wallet.key().as_ref(),
            smart_wallet.num_transactions.to_le_bytes().as_ref()
        ],
        bump,
        payer = payer,
        space = 8 + Transaction::space(instructions, smart_wallet.max_owners as usize),
    )]
    pub transaction: Account<'info, Transaction>,
    /// One of the owners. Checked in the handler via [SmartWallet::owner_index].
    pub proposer: Signer<'info>,
    /// Payer to create the [Transaction].
    #[account(mut)]
    pub payer: Signer<'info>,
    /// The [System] program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateTransaction<'info> {
    pub fn create_transaction(&mut self, bump: u8, instructions: Vec<TXInstruction>) -> Result<()> {
        self.create_transaction_with_timelock(bump, instructions, NO_ETA)
    }
    pub fn create_transaction_with_timelock(
        &mut self,
        bump: u8,
        instructions: Vec<TXInstruction>,
        eta: i64,
    ) -> Result<()> {
        let smart_wallet = &self.smart_wallet;
        let owner_index = smart_wallet.owner_index(self.proposer.key())?;

        let clock = Clock::get()?;
        let current_ts = clock.unix_timestamp;
        if smart_wallet.minimum_delay != 0 {
            invariant!(
                eta >= unwrap_int!(current_ts.checked_add(smart_wallet.minimum_delay as i64)),
                InvalidETA
            );
        }
        if eta != NO_ETA {
            invariant!(eta >= 0, "ETA must be positive");
            let delay = unwrap_int!(eta.checked_sub(current_ts));
            invariant!(delay >= 0, "ETA must be in the future");
            invariant!(delay <= MAX_DELAY_SECONDS, DelayTooHigh);
        }

        // generate the signers boolean list
        let owners = &smart_wallet.owners;
        let mut signers = Vec::new();
        signers.resize(owners.len(), false);
        signers[owner_index] = true;

        let index = smart_wallet.num_transactions;
        let smart_wallet = &mut self.smart_wallet;
        smart_wallet.num_transactions = unwrap_int!(smart_wallet.num_transactions.checked_add(1));

        // init the TX
        let tx = &mut self.transaction;
        tx.smart_wallet = smart_wallet.key();
        tx.index = index;
        tx.bump = bump;

        tx.proposer = self.proposer.key();
        tx.instructions = instructions.clone();
        tx.signers = signers;
        tx.owner_set_seqno = smart_wallet.owner_set_seqno;
        tx.eta = eta;

        tx.executor = Pubkey::default();
        tx.executed_at = -1;
        tx.created_at = current_ts;

        emit!(TransactionCreateEvent {
            smart_wallet: self.smart_wallet.key(),
            transaction: self.transaction.key(),
            proposer: self.proposer.key(),
            instructions,
            eta,
            timestamp: Clock::get()?.unix_timestamp
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for CreateTransaction<'info> {
    fn validate(&self) -> Result<()> {
        // owner_index check happens later
        Ok(())
    }
}

/// Emitted when a [Transaction] is proposed.
#[event]
pub struct TransactionCreateEvent {
    /// The [SmartWallet].
    #[index]
    pub smart_wallet: Pubkey,
    /// The [Transaction].
    #[index]
    pub transaction: Pubkey,
    /// The owner which proposed the transaction.
    pub proposer: Pubkey,
    /// Instructions associated with the [Transaction].
    pub instructions: Vec<TXInstruction>,
    /// The [Transaction::eta].
    pub eta: i64,
    /// The Unix timestamp when the event was emitted.
    pub timestamp: i64,
}
