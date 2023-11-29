use anchor_lang::prelude::*;

#[constant]
pub const MAX_BRIBE_EPOCH: u32 = 200; // with 7 days epoch, it is roughly 4 years

// #[constant]
// pub const MAX_EPOCH_PER_GAUGE: usize = 500; // ~ 10 years

// TODO increase this
#[constant]
pub const MAX_EPOCH_PER_GAUGE: usize = 100; // ~ 2 years
