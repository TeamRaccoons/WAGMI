use crate::*;

/// A request to migrate fund from hacked escrow
#[account]
#[derive(Copy, Debug, Default, InitSpace)]
pub struct DisputeRequest {
    /// The hacked escrow
    pub escrow: Pubkey,
    /// The new owner to rescue funds
    pub new_owner: Pubkey,
    /// Dispute phase index
    pub phase_index: u64,
}

static_assertions::const_assert!(DisputeRequest::INIT_SPACE <= DisputeRequest::LEN);

impl DisputeRequest {
    pub const LEN: usize = 152;
}
