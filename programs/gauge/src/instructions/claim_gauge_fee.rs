//! ClaimFee

use crate::ErrorCode::TypeCastFailed;

use crate::*;

/// Accounts for [gauge::claim_gauge_fee].
#[derive(Accounts)]
pub struct ClaimGaugeFee<'info> {
    /// The [GaugeFactory].
    pub gauge_factory: Box<Account<'info, GaugeFactory>>,

    /// The [Gauge].
    #[account(mut, has_one = gauge_factory, has_one = amm_pool)]
    pub gauge: AccountLoader<'info, Gauge>,

    /// The [GaugeVoter].
    #[account(has_one = gauge_factory, has_one = escrow)]
    pub gauge_voter: AccountLoader<'info, GaugeVoter>,

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
impl<'info> ClaimGaugeFee<'info> {
    pub fn claim_gauge_fee(
        &mut self,
        // from_epoch: u32,
        to_epoch: u32,
        remaining_accounts: &[AccountInfo<'info>],
    ) -> Result<()> {
        let current_voting_epoch = self.gauge_factory.current_voting_epoch;
        invariant!(to_epoch < current_voting_epoch, CloseEpochNotElapsed);

        let mut gauge = self.gauge.load_mut()?;

        invariant!(
            gauge.token_a_fee_key == self.token_account.key()
                || gauge.token_b_fee_key == self.token_account.key(),
            TokenAccountIsNotCorrect
        );

        let mut gauge_vote = self.gauge_vote.load_mut()?;

        let fee_amount = if gauge.token_a_fee_key == self.token_account.key() {
            invariant!(gauge_vote.last_claim_a_fee_epoch < to_epoch, InvalidEpoch);
            let fee_amount = gauge_vote.claim_a_fee(to_epoch, &gauge)?;

            gauge.cummulative_claimed_token_a_fee = unwrap_int!(gauge
                .cummulative_claimed_token_a_fee
                .checked_add(fee_amount as u128));

            fee_amount
        } else {
            invariant!(gauge_vote.last_claim_b_fee_epoch < to_epoch, InvalidEpoch);
            let fee_amount = gauge_vote.claim_b_fee(to_epoch, &gauge)?;
            gauge.cummulative_claimed_token_b_fee = unwrap_int!(gauge
                .cummulative_claimed_token_b_fee
                .checked_add(fee_amount as u128));

            fee_amount
        };

        if fee_amount > 0 {
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

            emit!(ClaimGaugeFeeEvent {
                gauge: self.gauge.key(),
                amm_pool: self.amm_pool.key(),
                to_epoch,
                fee_amount,
                fee_mint: self.token_account.mint,
                escrow: self.escrow.key(),
            });
        }

        Ok(())
    }
}

impl<'info> Validate<'info> for ClaimGaugeFee<'info> {
    fn validate(&self) -> Result<()> {
        // validate ATA
        let dest_token_account_key = anchor_spl::associated_token::get_associated_token_address(
            &self.escrow.owner,
            &self.token_account.mint,
        );
        assert_keys_eq!(dest_token_account_key, self.dest_token_account);

        Ok(())
    }
}

/// Event called in [gauge::claim_gauge_fee].
#[event]
pub struct ClaimGaugeFeeEvent {
    #[index]
    /// The [Gauge].
    pub gauge: Pubkey,
    #[index]
    /// The Bribe.
    pub amm_pool: Pubkey,
    ///// The voting epoch
    // pub from_epoch: u32,
    /// The voting epoch
    pub to_epoch: u32,
    /// Fee amount.
    pub fee_amount: u64,
    /// Fee mint.
    pub fee_mint: Pubkey,
    /// The escrow.
    pub escrow: Pubkey,
}
