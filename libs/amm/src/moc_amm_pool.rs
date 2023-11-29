use crate::*;
impl AmmPool for MocAmm {
    fn get_mint_and_fee_account_pubkeyss(&self) -> (Pubkey, Pubkey, Pubkey, Pubkey) {
        return (
            self.token_a_mint,
            self.token_b_mint,
            self.token_a_fee,
            self.token_b_fee,
        );
    }
    fn get_lp_token_account(&self) -> Pubkey {
        return self.lp_mint;
    }

    fn claim_fee<'a, 'b, 'c, 'info>(
        &self,
        token_account: &Account<'info, TokenAccount>,
        dest_token_account: &Account<'info, TokenAccount>,
        token_program: &Program<'info, Token>,
        amm_pool: &UncheckedAccount<'info>,
        amm_program: &UncheckedAccount<'info>,
        _fee_claimer: &AccountInfo<'info>,
        _remaining_accounts: &[AccountInfo<'info>],
        _signer_seeds: &[&[&[u8]]],
        amount: u64,
    ) -> Result<()> {
        // assert amm program
        assert_keys_eq!(amm_program.key(), moc_amm::ID);
        let accounts = moc_amm::cpi::accounts::ClaimFee {
            moc_amm: amm_pool.to_account_info(),
            token_program: token_program.to_account_info(),
            token_account: token_account.to_account_info(),
            dest_token_account: dest_token_account.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(amm_program.to_account_info(), accounts);
        moc_amm::cpi::claim_fee(cpi_ctx, amount)
    }
}
