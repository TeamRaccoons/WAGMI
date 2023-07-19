//! Instruction processors.

pub mod activate_proposal;
pub mod activate_proposal_initial_phase;
pub mod cast_vote;
pub mod change_locker_expiration;
pub mod extend_lock_duration;
pub mod increase_locked_amount;
pub mod new_escrow;
pub mod new_locker;
pub mod set_locker_params;
pub mod set_vote_delegate;
pub mod toggle_max_lock;
pub mod withdraw;

pub use activate_proposal::*;
pub use activate_proposal_initial_phase::*;
pub use cast_vote::*;
pub use change_locker_expiration::*;
pub use extend_lock_duration::*;
pub use increase_locked_amount::*;
pub use new_escrow::*;
pub use new_locker::*;
pub use set_locker_params::*;
pub use set_vote_delegate::*;
pub use toggle_max_lock::*;
pub use withdraw::*;
