//! Instruction processors.

pub mod activate_proposal;
pub mod cancel_proposal;
pub mod create_governor;
pub mod create_proposal;
pub mod create_proposal_meta;
pub mod new_vote;
pub mod queue_proposal;
pub mod set_governance_params;
pub mod set_vote;

pub use activate_proposal::*;
pub use cancel_proposal::*;
pub use create_governor::*;
pub use create_proposal::*;
pub use create_proposal_meta::*;
pub use new_vote::*;
pub use queue_proposal::*;
pub use set_governance_params::*;
pub use set_vote::*;
