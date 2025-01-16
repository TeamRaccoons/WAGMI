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
    ///padding
    pub padding: [u128; 4],
}

static_assertions::const_assert!(DisputeRequest::INIT_SPACE == 136);

#[test]
fn test_size() {
    println!("{}", DisputeRequest::INIT_SPACE);
}
