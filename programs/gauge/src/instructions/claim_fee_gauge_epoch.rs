//! ClaimFee

use crate::ErrorCode::{MathOverflow, TypeCastFailed};

use crate::*;

/// Accounts for [gauge::claim_fee].
#[derive(Accounts)]
#[instruction(voting_epoch: u32)]
pub struct ClaimFeeGaugeEpoch<'info> {
    /// The [GaugeFactory].
    pub gauge_factory: Box<Account<'info, GaugeFactory>>,

    #[account(mut, has_one = gauge_voter, constraint = epoch_gauge_voter.voting_epoch == voting_epoch)]
    pub epoch_gauge_voter: Box<Account<'info, EpochGaugeVoter>>,

    #[account(constraint = epoch_gauge_voter.voting_epoch == voting_epoch, has_one = gauge)]
    pub epoch_gauge: Box<Account<'info, EpochGauge>>,

    /// The [Gauge].
    #[account(mut, has_one = gauge_factory, has_one = amm_pool)]
    pub gauge: Box<Account<'info, Gauge>>,

    /// The [GaugeVoter].
    #[account(has_one = gauge_factory, has_one = escrow)]
    pub gauge_voter: Box<Account<'info, GaugeVoter>>,

    /// The [GaugeVote].
    #[account(mut, has_one = gauge_voter, has_one = gauge)]
    pub gauge_vote: AccountLoader<'info, GaugeVote>,

    /// The [Escrow] which owns this [EpochGaugeVote].
    #[account(has_one = vote_delegate @ crate::ErrorCode::UnauthorizedNotDelegate)]
    pub escrow: Box<Account<'info, voter::Escrow>>,

    #[account(mut)]
    pub token_account: Box<Account<'info, TokenAccount>>,

    // only allow vote delegate claim fee to ATA of owner
    #[account(mut)]
    pub dest_token_account: Box<Account<'info, TokenAccount>>, // account to claim fee to

    pub token_program: Program<'info, Token>,
    /// CHECK:
    pub amm_pool: UncheckedAccount<'info>,
    /// CHECK:
    pub amm_program: UncheckedAccount<'info>,

    /// The [Escrow::vote_delegate].
    pub vote_delegate: Signer<'info>,
}
impl<'info> ClaimFeeGaugeEpoch<'info> {
    pub fn claim_fee_gauge_epoch(
        &mut self,
        voting_epoch: u32,
        remaining_accounts: &[AccountInfo<'info>],
    ) -> Result<()> {
        let current_voting_epoch = self.gauge_factory.current_voting_epoch;
        invariant!(voting_epoch < current_voting_epoch, CloseEpochNotElapsed);

        let gauge = &mut self.gauge;
        let mut gauge_vote = self.gauge_vote.load_mut()?;
        let voting_epoch_index = gauge_vote.get_index_for_voting_epoch(voting_epoch)?;
        let gauge_vote_epoch = &mut gauge_vote.vote_epochs[voting_epoch_index];

        let epoch_gauge = &self.epoch_gauge;
        let epoch_gauge_voter = &mut self.epoch_gauge_voter;
        // check whether it is token a for token b
        let fee_amount = if gauge.token_a_fee_key == self.token_account.key() {
            // check whether fee has been claimed
            invariant!(gauge_vote_epoch.is_fee_a_claimed == 0, FeeHasBeenClaimed);
            let fee_amount = epoch_gauge.get_allocated_fee_a(epoch_gauge_voter).unwrap();

            // update claimed fee
            gauge.cummulative_claimed_token_a_fee = gauge
                .cummulative_claimed_token_a_fee
                .checked_add(fee_amount as u128)
                .unwrap();
            gauge_vote_epoch.is_fee_a_claimed = 1;
            gauge_vote.claimed_token_a_fee = gauge_vote
                .claimed_token_a_fee
                .checked_add(fee_amount.into())
                .ok_or(MathOverflow)?;
            fee_amount
        } else {
            invariant!(gauge_vote_epoch.is_fee_b_claimed == 0, FeeHasBeenClaimed);
            let fee_amount = epoch_gauge.get_allocated_fee_b(epoch_gauge_voter).unwrap();

            // update claimed fee
            gauge.cummulative_claimed_token_b_fee = gauge
                .cummulative_claimed_token_b_fee
                .checked_add(fee_amount as u128)
                .unwrap();
            gauge_vote_epoch.is_fee_b_claimed = 1;

            gauge_vote.claimed_token_b_fee = gauge_vote
                .claimed_token_b_fee
                .checked_add(fee_amount.into())
                .ok_or(MathOverflow)?;
            fee_amount
        };

        let amm_type = AmmType::get_amm_type(gauge.amm_type).ok_or(TypeCastFailed)?;
        let amm_pool = amm_type.get_amm(self.amm_pool.to_account_info())?;

        let signer_seeds: &[&[&[u8]]] = gauge_factory_seeds!(self.gauge_factory);

        amm_pool.claim_fee(
            &self.token_account,
            &self.dest_token_account,
            &self.token_program,
            &self.amm_pool,
            &self.amm_program,
            &self.gauge_factory.to_account_info(),
            remaining_accounts,
            signer_seeds,
            fee_amount,
        )?;

        emit!(ClaimFeeGaugeEpochEvent {
            gauge: self.gauge.key(),
            amm_pool: self.amm_pool.key(),
            voting_epoch,
            fee_amount,
            fee_mint: self.token_account.mint,
            escrow: self.escrow.key(),
        });

        Ok(())
    }
}

impl<'info> Validate<'info> for ClaimFeeGaugeEpoch<'info> {
    fn validate(&self) -> Result<()> {
        invariant!(
            self.gauge.token_a_fee_key == self.token_account.key()
                || self.gauge.token_b_fee_key == self.token_account.key(),
            TokenAccountIsNotCorrect
        );

        // validate ATA
        let dest_token_account_key = anchor_spl::associated_token::get_associated_token_address(
            &self.escrow.owner,
            &self.token_account.mint,
        );
        assert_keys_eq!(dest_token_account_key, self.dest_token_account);

        Ok(())
    }
}

/// Event called in [gauge::claim_fee_gauge_epoch].
#[event]
pub struct ClaimFeeGaugeEpochEvent {
    #[index]
    /// The [Gauge].
    pub gauge: Pubkey,
    #[index]
    /// The Bribe.
    pub amm_pool: Pubkey,
    /// The voting epoch
    pub voting_epoch: u32,
    /// Fee amount.
    pub fee_amount: u64,
    /// Fee mint.
    pub fee_mint: Pubkey,
    /// The escrow.
    pub escrow: Pubkey,
}
