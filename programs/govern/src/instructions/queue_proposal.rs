use crate::*;

/// Accounts for [govern::queue_proposal].
#[derive(Accounts)]
pub struct QueueProposal<'info> {
    /// The Governor.
    #[account(has_one = smart_wallet)]
    pub governor: Box<Account<'info, Governor>>,
    /// The Proposal to queue.
    #[account(mut)]
    pub proposal: Box<Account<'info, Proposal>>,
    /// The transaction key of the proposal.
    /// This account is passed to and validated by the Smart Wallet program to be initialized.
    #[account(mut, constraint = transaction.to_account_info().data_is_empty())]
    pub transaction: SystemAccount<'info>,
    /// The Smart Wallet.
    #[account(mut)]
    pub smart_wallet: Account<'info, SmartWallet>,
    /// Payer of the queued transaction.
    #[account(mut)]
    pub payer: Signer<'info>,
    /// The Smart Wallet program.
    pub smart_wallet_program: Program<'info, smart_wallet::program::SmartWallet>,
    /// The System program.
    pub system_program: Program<'info, System>,
}

impl<'info> QueueProposal<'info> {
    /// Queues a Transaction into the Smart Wallet.
    pub fn queue_transaction(&mut self) -> Result<()> {
        let seeds = governor_seeds!(self.governor);
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(
            self.smart_wallet_program.to_account_info(),
            smart_wallet::cpi::accounts::CreateTransaction {
                smart_wallet: self.smart_wallet.to_account_info(),
                transaction: self.transaction.to_account_info(),
                proposer: self.governor.to_account_info(),
                payer: self.payer.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
            signer_seeds,
        );

        // no delay
        if self.governor.params.timelock_delay_seconds == 0 {
            smart_wallet::cpi::create_transaction(
                cpi_ctx,
                0,
                self.proposal.to_smart_wallet_instructions(),
            )?;
        } else {
            // delay; calculate ETA
            smart_wallet::cpi::create_transaction_with_timelock(
                cpi_ctx,
                0,
                self.proposal.to_smart_wallet_instructions(),
                unwrap_int!(Clock::get()?
                    .unix_timestamp
                    .checked_add(self.governor.params.timelock_delay_seconds)),
            )?;
        }

        let proposal = &mut self.proposal;
        proposal.queued_at = Clock::get()?.unix_timestamp;
        proposal.queued_transaction = self.transaction.key();

        emit!(ProposalQueueEvent {
            governor: self.proposal.governor,
            proposal: self.proposal.key(),
            transaction: self.transaction.key(),
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for QueueProposal<'info> {
    fn validate(&self) -> Result<()> {
        assert_keys_eq!(self.governor, self.proposal.governor);
        assert_keys_eq!(self.smart_wallet, self.governor.smart_wallet);
        let now = Clock::get()?.unix_timestamp;
        let proposal_state = unwrap_opt!(self.proposal.state(now), "invalid state");
        if proposal_state != ProposalState::Succeeded {
            msg!(
                "now: {}, voting_ends_at: {}",
                now,
                self.proposal.voting_ends_at
            );
            if self.proposal.proposal_type == u8::from(ProposalType::YesNo) {
                msg!(
                    "for votes: {}, against votes: {}",
                    self.proposal.option_votes[FOR_VOTE_INDEX],
                    self.proposal.option_votes[AGAINST_VOTE_INDEX],
                );
            }
            msg!(
                "quorum req: {}, abstain votes: {}",
                self.governor.params.quorum_votes,
                self.proposal.option_votes[ABSTAIN_VOTE_INDEX],
            );
            invariant!(
                proposal_state == ProposalState::Succeeded,
                "proposal must be succeeded to be queued"
            );
        }
        Ok(())
    }
}

/// Event called in [govern::queue_proposal].
#[event]
pub struct ProposalQueueEvent {
    /// The governor.
    #[index]
    pub governor: Pubkey,
    /// The proposal being queued.
    #[index]
    pub proposal: Pubkey,
    /// The transaction key.
    #[index]
    pub transaction: Pubkey,
}
