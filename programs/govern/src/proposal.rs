//! Proposal logic.
use crate::ErrorCode::InvalidVoteSide;
use crate::*;

/// The state of a proposal.
///
/// The `expired` state from Compound is missing here, because the
/// Smart Wallet handles execution.
#[derive(Debug, Eq, PartialEq)]
#[repr(C)]
pub enum ProposalState {
    /// Anyone can create a proposal. When a governance proposal is created,
    /// it is considered a [ProposalState::Draft] and enters a review period, after which voting weights
    /// are recorded and voting begins.
    Draft,
    /// Each DAO has requirements for who can activate proposals; a common way
    /// is to require the user to have a minimum amount of tokens.
    /// An [ProposalState::Active] proposal is one that is surfaced to the community to put up for voting.
    Active,
    /// If a proposal is still a [ProposalState::Draft], a proposal may be canceled by its creator.
    /// A canceled proposal cannot be reactivated; it simply just exists as a record.
    Canceled,
    /// After the voting period ends, votes are tallied up. A proposal is [ProposalState::Defeated] if one of
    /// two scenarios happen:
    /// - More or equal votes are [VoteSide::Against] than [VoteSide::For].
    /// - The sum of all votes does not meet quorum.
    Defeated,
    /// A proposal is [ProposalState::Succeeded] if it is not defeated and voting is over.
    Succeeded,
    /// A succeeded proposal may be [ProposalState::Queued] into the [SmartWallet].
    Queued,
}

impl Default for ProposalState {
    fn default() -> Self {
        Self::Draft
    }
}

impl Proposal {
    // /// Subtracts from the total weight of a vote for a [Proposal].
    pub(crate) fn subtract_vote_weight(&mut self, side: u8, voting_power: u64) -> Result<()> {
        if voting_power == 0 {
            return Ok(());
        }
        if side >= self.max_option {
            return Err(InvalidVoteSide.into());
        }
        let current_vote: u64 = self.option_votes[side as usize];
        self.option_votes[side as usize] = unwrap_int!(current_vote.checked_sub(voting_power));
        Ok(())
    }

    /// Adds to the total weight of a vote for a [Proposal].
    pub(crate) fn add_vote_weight(&mut self, side: u8, voting_power: u64) -> Result<()> {
        if voting_power == 0 {
            return Ok(());
        }
        if side >= self.max_option {
            return Err(InvalidVoteSide.into());
        }
        let current_vote: u64 = self.option_votes[side as usize];
        self.option_votes[side as usize] = unwrap_int!(current_vote.checked_add(voting_power));
        Ok(())
    }

    // Gets the state.
    pub fn get_state(&self) -> Result<ProposalState> {
        Ok(unwrap_opt!(
            self.state(Clock::get()?.unix_timestamp),
            "invalid state"
        ))
    }

    /// total votes
    pub fn total_votes(&self) -> Option<u64> {
        let total_vote = self.option_votes.iter().sum();
        Some(total_vote)
    }

    /// Checks if the proposal meets quorum; that is,
    /// enough votes were made on the proposal.
    pub fn meets_quorum(&self) -> Option<bool> {
        Some(self.total_votes()? >= self.quorum_votes)
    }

    // /// The state of the proposal. See [ProposalState] for more details.
    // /// Adapted from <https://github.com/compound-finance/compound-protocol/blob/4a8648ec0364d24c4ecfc7d6cae254f55030d65f/contracts/Governance/GovernorBravoDelegate.sol#L205>
    pub fn state(&self, current_time: i64) -> Option<ProposalState> {
        if self.canceled_at > 0 {
            return Some(ProposalState::Canceled);
        } else if self.activated_at == 0 {
            return Some(ProposalState::Draft);
        } else if current_time < self.voting_ends_at {
            return Some(ProposalState::Active);
        } else if !self.meets_quorum()? {
            return Some(ProposalState::Defeated);
        } else if self.queued_at > 0 {
            return Some(ProposalState::Queued);
        }

        if self.proposal_type == u8::from(ProposalType::YesNo) {
            if self.option_votes[FOR_VOTE_INDEX] <= self.option_votes[AGAINST_VOTE_INDEX] {
                return Some(ProposalState::Defeated);
            } else {
                return Some(ProposalState::Succeeded);
            }
        }
        Some(ProposalState::Succeeded)
    }

    /// Converts this proposal to Smart Wallet [smart_wallet::TXInstruction]s.
    pub fn to_smart_wallet_instructions(&self) -> Vec<smart_wallet::TXInstruction> {
        self.instructions
            .iter()
            .map(
                |ProposalInstruction {
                     program_id,
                     keys,
                     data,
                 }| smart_wallet::TXInstruction {
                    program_id: *program_id,
                    keys: keys
                        .iter()
                        .map(
                            |&ProposalAccountMeta {
                                 pubkey,
                                 is_signer,
                                 is_writable,
                             }| smart_wallet::TXAccountMeta {
                                pubkey,
                                is_signer,
                                is_writable,
                            },
                        )
                        .collect(),
                    data: data.clone(),
                },
            )
            .collect()
    }
}
