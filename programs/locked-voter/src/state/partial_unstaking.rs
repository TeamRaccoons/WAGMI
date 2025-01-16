use crate::*;

/// Account to store infor for partial unstaking
#[account]
#[derive(Debug, Default)]
pub struct PartialUnstaking {
    /// The [Escrow] pubkey.
    pub escrow: Pubkey,
    /// Amount of this partial unstaking
    pub amount: u64,
    /// Timestamp when owner can withdraw the partial unstaking amount
    pub expiration: i64,
    /// buffer for further use
    pub buffers: [u128; 6],
    /// Memo
    pub memo: String,
}

impl PartialUnstaking {
    /// LEN of PartialUnstaking
    pub const LEN: usize = std::mem::size_of::<Pubkey>() + 8 + 8 + 16 * 6;
}
