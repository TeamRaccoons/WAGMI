//! State structs.

use crate::*;

#[account]
#[derive(Default, Debug)]
/// State of pool account
pub struct MocAmm {
    /// base
    pub base: Pubkey,
    /// LP token mint of the pool
    pub lp_mint: Pubkey, //32
    /// Admin fee token account for token A. Used to receive trading fee.
    pub token_a_fee: Pubkey, //32
    /// Admin fee token account for token B. Used to receive trading fee.
    pub token_b_fee: Pubkey, //32

    /// Cached
    pub token_a_mint: Pubkey, //32
    /// Cached
    pub token_b_mint: Pubkey, //32

    /// Fee
    pub fee: u64,
    /// bump
    pub bump: u8,
}
