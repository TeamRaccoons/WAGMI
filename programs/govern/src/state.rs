//! Struct definitions for accounts that hold state.

use anchor_lang::prelude::*;

/// A Governor is the "DAO": it is the account that holds control over important protocol functions,
/// including treasury, protocol parameters, and more.
#[account]
#[derive(Copy, Debug, Default)]
pub struct Governor {
    /// Base.
    pub base: Pubkey,
    /// Bump seed
    pub bump: u8,

    /// The total number of [Proposal]s
    pub proposal_count: u64,
    /// The voting body associated with the Governor.
    /// This account is responsible for handling vote proceedings, such as:
    /// - activating proposals
    /// - setting the number of votes per voter
    pub locker: Pubkey,
    /// The public key of the [smart_wallet::SmartWallet] account.
    /// This smart wallet executes proposals.
    pub smart_wallet: Pubkey,

    /// Governance parameters.
    pub params: GovernanceParameters,

    /// optional reward, can set by smartwallet
    pub voting_reward: VotingReward,

    /// The total number of [OptionProposal]s
    pub option_proposal_count: u64,
    /// buffer for further use
    pub padding: u64,
    /// buffer for further use
    pub buffers: [u128; 31],
}

/// Governance parameters.
#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, Debug, Default, Eq, PartialEq)]
pub struct VotingReward {
    /// Reward mint
    pub reward_mint: Pubkey,
    /// Reward vault
    pub reward_vault: Pubkey,
    /// Total reward per proposal
    pub reward_per_proposal: u64,
}

/// Governance parameters.
#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, Debug, Default, Eq, PartialEq)]
pub struct GovernanceParameters {
    /// The delay before voting on a proposal may take place, once proposed, in seconds
    pub voting_delay: u64,
    /// The duration of voting on a proposal, in seconds
    pub voting_period: u64,
    /// The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
    pub quorum_votes: u64,
    /// The timelock delay of the DAO's created proposals.
    pub timelock_delay_seconds: i64,
}

/// Option proposal
#[account]
#[derive(Debug, Default)]
pub struct OptionProposal {
    /// The public key of the governor.
    pub governor: Pubkey,
    /// The unique ID of the proposal, auto-incremented.
    pub index: u64,
    /// Bump seed
    pub bump: u8,

    /// The public key of the proposer.
    pub proposer: Pubkey,

    /// The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
    pub quorum_votes: u64,

    /// maximum options of the proposal
    pub max_option: u8,
    /// Vote for each option
    pub option_votes: Vec<u8>,

    /// The timestamp when the proposal was canceled.
    pub canceled_at: i64,
    /// The timestamp when the proposal was created.
    pub created_at: i64,
    /// The timestamp in which the proposal was activated.
    /// This is when voting begins.
    pub activated_at: i64,
    /// The timestamp when voting ends.
    /// This only applies to active proposals.
    pub voting_ends_at: i64,

    /// The timestamp in which the proposal was queued, i.e.
    /// approved for execution on the Smart Wallet.
    pub queued_at: i64,
    /// If the transaction was queued, this is the associated Smart Wallet transaction.
    pub queued_transaction: Pubkey,

    /// optional reward
    pub voting_reward: VotingReward,

    /// total claimed reward
    pub total_claimed_reward: u64,

    /// buffers for future use
    pub buffers: [u128; 10],

    /// The instructions associated with the proposal.
    pub instructions: Vec<ProposalInstruction>,
}

impl OptionProposal {
    /// Space that the [OptionProposal] takes up.
    pub fn space(max_option: u8, instructions: Vec<ProposalInstruction>) -> usize {
        8  // Anchor discriminator.
        + std::mem::size_of::<OptionProposal>()
        + 4 // Vec discriminator
        + max_option as usize
        + 4 // Vec discriminator
            + (instructions.iter().map(|ix| ix.space()).sum::<usize>())
    }
}

/// A Yes/No Proposal is a pending transaction that may or may not be executed by the DAO.
#[account]
#[derive(Debug, Default)]
pub struct Proposal {
    /// The public key of the governor.
    pub governor: Pubkey,
    /// The unique ID of the proposal, auto-incremented.
    pub index: u64,
    /// Bump seed
    pub bump: u8,

    /// The public key of the proposer.
    pub proposer: Pubkey,

    /// The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
    pub quorum_votes: u64,
    /// Current number of votes in favor of this proposal
    pub for_votes: u64,
    /// Current number of votes in opposition to this proposal
    pub against_votes: u64,
    /// Current number of votes for abstaining for this proposal
    pub abstain_votes: u64,

    /// The timestamp when the proposal was canceled.
    pub canceled_at: i64,
    /// The timestamp when the proposal was created.
    pub created_at: i64,
    /// The timestamp in which the proposal was activated.
    /// This is when voting begins.
    pub activated_at: i64,
    /// The timestamp when voting ends.
    /// This only applies to active proposals.
    pub voting_ends_at: i64,

    /// The timestamp in which the proposal was queued, i.e.
    /// approved for execution on the Smart Wallet.
    pub queued_at: i64,
    /// If the transaction was queued, this is the associated Smart Wallet transaction.
    pub queued_transaction: Pubkey,

    /// optional reward
    pub voting_reward: VotingReward,

    /// total claimed reward
    pub total_claimed_reward: u64,

    /// buffers for future use
    pub buffers: [u128; 10],

    /// The instructions associated with the proposal.
    pub instructions: Vec<ProposalInstruction>,
}

impl Proposal {
    /// Space that the [Proposal] takes up.
    pub fn space(instructions: Vec<ProposalInstruction>) -> usize {
        8  // Anchor discriminator.
        + 4 // Vec discriminator
            + std::mem::size_of::<Proposal>()
            + (instructions.iter().map(|ix| ix.space()).sum::<usize>())
    }

    pub fn get_voting_reward(&self, vote: &Vote) -> Option<u64> {
        let total_vote = self.total_votes()? as u128;
        if total_vote == 0 {
            return Some(0);
        }
        let reward_per_proposal = self.voting_reward.reward_per_proposal as u128;
        let weight = vote.weight as u128;
        let voting_reward = reward_per_proposal
            .checked_mul(weight)?
            .checked_div(total_vote)?;
        return voting_reward.try_into().ok();
    }
}

/// Metadata about a proposal.
#[account]
#[derive(Debug, Default)]
pub struct ProposalMeta {
    /// The [Proposal].
    pub proposal: Pubkey,
    /// Title of the proposal.
    pub title: String,
    /// Link to a description of the proposal.
    pub description_link: String,
}

/// A [Vote] is a vote made by a `voter`
#[account]
#[derive(Debug, Default)]
pub struct Vote {
    /// The proposal being voted on.
    pub proposal: Pubkey,
    /// The voter.
    pub voter: Pubkey,
    /// Bump seed
    pub bump: u8,
    /// The side of the vote taken.
    pub side: u8,
    /// The number of votes this vote holds.
    pub weight: u64,
    /// Flag to check whether voter has claim the reward or not
    pub claimed: bool,
    /// buffers for future use
    pub buffers: [u8; 32],
}

/// Instruction.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default, PartialEq)]
pub struct ProposalInstruction {
    /// Pubkey of the instruction processor that executes this instruction
    pub program_id: Pubkey,
    /// Metadata for what accounts should be passed to the instruction processor
    pub keys: Vec<ProposalAccountMeta>,
    /// Opaque data passed to the instruction processor
    pub data: Vec<u8>,
}

impl ProposalInstruction {
    /// Space that a [ProposalInstruction] takes up.
    pub fn space(&self) -> usize {
        std::mem::size_of::<Pubkey>()
            + 4 // keys vector length
            + (self.keys.len() as usize) * std::mem::size_of::<AccountMeta>()
            + 4 // data vector length
            + (self.data.len() as usize)
    }
}

/// Account metadata used to define Instructions
#[derive(AnchorSerialize, AnchorDeserialize, Debug, PartialEq, Copy, Clone)]
pub struct ProposalAccountMeta {
    /// An account's public key
    pub pubkey: Pubkey,
    /// True if an Instruction requires a Transaction signature matching `pubkey`.
    pub is_signer: bool,
    /// True if the `pubkey` can be loaded as a read-write account.
    pub is_writable: bool,
}

#[cfg(test)]
mod state_test {
    use std::assert_eq;

    use crate::{Proposal, ProposalAccountMeta, ProposalInstruction};
    use anchor_lang::{prelude::Pubkey, AnchorSerialize, Discriminator};

    #[test]
    fn test_proposal_instruction_space() {
        let proposal_ix = ProposalInstruction {
            program_id: Pubkey::default(),
            data: vec![0u8; 64],
            keys: vec![
                ProposalAccountMeta {
                    is_signer: false,
                    is_writable: false,
                    pubkey: Pubkey::default(),
                };
                24
            ],
        };

        let serialized_bytes = proposal_ix.try_to_vec().unwrap().len();
        let proposal_ix_rent_space = proposal_ix.space();

        assert_eq!(serialized_bytes, 920);
        // The serialized data and rental shall always EQUALS because the memory alignment for ProposalInstruction is 1 byte
        assert_eq!(serialized_bytes, proposal_ix_rent_space);
    }

    #[test]
    fn test_proposal_empty_ix_space() {
        let empty_proposal = Proposal::default();
        let mut serialized_bytes = empty_proposal.try_to_vec().unwrap();
        serialized_bytes.append(&mut Proposal::DISCRIMINATOR.to_vec());

        let bytes_length = serialized_bytes.len();
        let proposal_rental_space = Proposal::space(vec![]);

        // The serialized data shall always LESSER to the rental space as the memory alignment for Proposal struct is 8 bytes
        // Which means, std::mem::size_of::<Proposal>() will returns more bytes than the serialized one.
        // Where does the extra bytes come from ?
        // 1. bump field. To fit the memory alignment, padding automatically added by the compiler.
        // bump: u8
        // Become
        // bump: u8
        // _padding: [u8; 7]
        // To fit the 8 bytes alignment
        //
        // 2. Vec<ProposalInstruction>
        // In memory, vec was represented as
        //struct Vec<T> {
        // ptr: *mut T, // 8 bytes
        // len: usize, // 8 bytes in 64-bit machine
        // cap: usize, // 8 bytes in 64-bit machine
        // }
        // Which is 24 bytes
        // Extra bytes = 24 + 7 = 31

        let extra_bytes = proposal_rental_space - bytes_length;
        assert_eq!(extra_bytes, 31);
        assert_eq!(bytes_length <= proposal_rental_space, true);
    }

    #[test]
    fn test_proposal_multiple_ix_space() {
        let proposal_ixs = vec![ProposalInstruction {
            data: vec![0u8; 24],
            keys: vec![
                ProposalAccountMeta {
                    is_signer: false,
                    is_writable: false,
                    pubkey: Pubkey::default(),
                };
                32
            ],
            program_id: Pubkey::default(),
        }];

        let mut proposal = Proposal::default();
        proposal.instructions = proposal_ixs.clone();

        let mut serialized_bytes = proposal.try_to_vec().unwrap();
        serialized_bytes.append(&mut Proposal::DISCRIMINATOR.to_vec());

        let bytes_length = serialized_bytes.len();
        let proposal_rental_space = Proposal::space(proposal_ixs);

        let extra_bytes = proposal_rental_space - bytes_length;
        assert_eq!(extra_bytes, 31);
        assert_eq!(bytes_length <= proposal_rental_space, true);
    }
}
