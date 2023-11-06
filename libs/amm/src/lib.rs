//! State structs.

pub mod meteora_amm_pool;
pub mod moc_amm_pool;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use meteora_amm::state::Pool as MeteoraAmm;
use moc_amm::MocAmm;
use vipers::assert_keys_eq;

pub trait AmmPool {
    // return token_a_mint, token_b_mint, token_a_fee, token_b_fee
    fn get_mint_and_fee_account_pubkeyss(&self) -> (Pubkey, Pubkey, Pubkey, Pubkey);
    fn get_lp_token_account(&self) -> Pubkey;
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
    ) -> Result<()>;
}

/// AmmType struct
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum AmmType {
    /// Moc Amm
    MocAmm,
    /// Meteora Amm
    MeteoraAmm,
    /// LbClmm
    LbClmm,
}

impl Default for AmmType {
    fn default() -> Self {
        AmmType::MocAmm
    }
}

impl AmmType {
    pub fn decode(&self) -> u64 {
        match self {
            AmmType::MocAmm => 0,
            AmmType::MeteoraAmm => 1,
            AmmType::LbClmm => 2,
        }
    }
    pub fn get_amm_type(amm_type: u64) -> Option<Self> {
        match amm_type {
            0 => Some(AmmType::MocAmm),
            1 => Some(AmmType::MeteoraAmm),
            2 => Some(AmmType::LbClmm),
            _ => None,
        }
    }
    /// get strategy handler
    pub fn get_amm<'info>(&self, pool_account: AccountInfo<'info>) -> Result<Box<dyn AmmPool>> {
        match self {
            AmmType::MocAmm => {
                let data: &[u8] = &pool_account.try_borrow_data()?;
                Ok(Box::new(MocAmm::try_deserialize(&mut &*data)?))
            }
            AmmType::MeteoraAmm => {
                let data: &[u8] = &pool_account.try_borrow_data()?;
                Ok(Box::new(MeteoraAmm::try_deserialize(&mut &*data)?))
            }
            AmmType::LbClmm => panic!("implement me"),
        }
    }
}
