use crate::*;
use std::collections::BTreeMap;
use std::collections::BTreeSet;
// use meteora_amm::state::Pool as MeteoraAmm;

impl AmmPool for MeteoraAmm {
    fn get_mint_and_fee_account_pubkeyss(&self) -> (Pubkey, Pubkey, Pubkey, Pubkey) {
        return (
            self.token_a_mint,
            self.token_b_mint,
            self.admin_token_a_fee,
            self.admin_token_b_fee,
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
        fee_claimer: &AccountInfo<'info>,
        remaining_accounts: &[AccountInfo<'info>],
        signer_seeds: &[&[&[u8]]],
        amount: u64,
    ) -> Result<()> {
        let remaining_accounts = MeteoraRemainingAccounts::try_accounts(
            &meteora_amm::ID,
            &mut &*remaining_accounts,
            &[],
            &mut BTreeMap::new(),
            &mut BTreeSet::new(),
        )?;

        // assert amm program
        assert_keys_eq!(amm_program.key(), meteora_amm::ID);
        let accounts = meteora_amm::cpi::accounts::ClaimFee {
            pool: amm_pool.to_account_info(),
            token_program: token_program.to_account_info(),
            admin_token_fee: token_account.to_account_info(),
            claimer_token_fee: dest_token_account.to_account_info(),
            fee_claimer: fee_claimer.to_account_info(),
            a_vault_lp: remaining_accounts.a_vault_lp.to_account_info(),
        };
        let cpi_ctx =
            CpiContext::new_with_signer(amm_program.to_account_info(), accounts, signer_seeds);
        meteora_amm::cpi::claim_fee(cpi_ctx, amount)
    }
}

/// FraktRebalancingRemainingAccounts struct
#[derive(Accounts)]
pub struct MeteoraRemainingAccounts<'info> {
    /// CHECK: meteora account
    pub a_vault_lp: UncheckedAccount<'info>,
}
