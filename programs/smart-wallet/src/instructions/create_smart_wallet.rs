use crate::*;

/// Accounts for [smart_wallet::create_smart_wallet].
#[derive(Accounts)]
#[instruction(bump: u8, max_owners: u8)]
pub struct CreateSmartWallet<'info> {
    /// Base key of the SmartWallet.
    pub base: Signer<'info>,

    /// The [SmartWallet] to create.
    #[account(
        init,
        seeds = [
            b"SmartWallet".as_ref(),
            base.key().to_bytes().as_ref()
        ],
        bump,
        payer = payer,
        space = SmartWallet::space(max_owners),
    )]
    pub smart_wallet: Account<'info, SmartWallet>,

    /// Payer to create the smart_wallet.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The [System] program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateSmartWallet<'info> {
    pub fn create_smart_wallet(
        &mut self,
        bump: u8,
        max_owners: u8,
        owners: Vec<Pubkey>,
        threshold: u64,
        minimum_delay: i64,
    ) -> Result<()> {
        invariant!(minimum_delay >= 0, "delay must be positive");

        invariant!(minimum_delay < MAX_DELAY_SECONDS, DelayTooHigh);

        invariant!((max_owners as usize) >= owners.len(), "max_owners");

        let smart_wallet = &mut self.smart_wallet;
        smart_wallet.base = self.base.key();
        smart_wallet.bump = bump;

        smart_wallet.threshold = threshold;
        smart_wallet.minimum_delay = minimum_delay;
        smart_wallet.grace_period = DEFAULT_GRACE_PERIOD;

        smart_wallet.owner_set_seqno = 0;
        smart_wallet.num_transactions = 0;

        smart_wallet.owners = owners.clone();

        emit!(WalletCreateEvent {
            smart_wallet: self.smart_wallet.key(),
            owners,
            threshold,
            minimum_delay,
            timestamp: Clock::get()?.unix_timestamp
        });
        Ok(())
    }
}

impl<'info> Validate<'info> for CreateSmartWallet<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}

/// Emitted when a [SmartWallet] is created.
#[event]
pub struct WalletCreateEvent {
    /// The [SmartWallet].
    #[index]
    pub smart_wallet: Pubkey,
    /// The owners of the created [SmartWallet].
    pub owners: Vec<Pubkey>,
    /// The [SmartWallet::threshold] at the time of creation.
    pub threshold: u64,
    /// The [SmartWallet::minimum_delay] at the time of creation.
    pub minimum_delay: i64,
    /// The Unix timestamp when the event was emitted.
    pub timestamp: i64,
}
