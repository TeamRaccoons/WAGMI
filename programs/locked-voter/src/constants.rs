#[cfg(feature = "test-bpf")]
pub const DISPUTE_EXPIRATION: i64 = 5; // 5 seconds

#[cfg(not(feature = "test-bpf"))]
pub const DISPUTE_EXPIRATION: i64 = 7 * 24 * 3600; // 7 days
