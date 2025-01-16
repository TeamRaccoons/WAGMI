use crate::*;
use vipers::program_err;
/// Locks tokens on behalf of a user.
#[account]
#[derive(Copy, Debug, Default, InitSpace)]
pub struct Escrow {
    /// The [Locker] that this [Escrow] is part of.
    pub locker: Pubkey,
    /// The key of the account that is authorized to stake into/withdraw from this [Escrow].
    pub owner: Pubkey,
    /// Bump seed.
    pub bump: u8,

    /// The token account holding the escrow tokens.
    pub tokens: Pubkey,
    /// Amount of tokens staked.
    pub amount: u64,
    /// When the [Escrow::owner] started their escrow.
    pub escrow_started_at: i64,
    /// When the escrow unlocks; i.e. the [Escrow::owner] is scheduled to be allowed to withdraw their tokens.
    pub escrow_ends_at: i64,

    /// Account that is authorized to vote on behalf of this [Escrow].
    /// Defaults to the [Escrow::owner].
    pub vote_delegate: Pubkey,

    /// Max lock
    pub is_max_lock: bool,
    /// total amount of partial unstaking amount
    pub partial_unstaking_amount: u64,

    /// escrow dispute
    pub dispute: Dispute,

    /// padding 0
    pub padding_0: [u8; 15],

    /// padding 1
    pub padding_1: [u128; 5],
}

static_assertions::const_assert!(Escrow::INIT_SPACE == 314);

#[derive(
    AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, PartialEq, Eq, InitSpace,
)]
pub struct Dispute {
    /// dispute phase
    pub phase: u8,
    /// phase index
    pub phase_index: u64,
    /// last timestamp of a dispute
    pub phase_dispute_timestamp: i64,
    /// resolve dispute request timestamp
    pub phase_resolve_timestamp: i64,
    /// approve dispute request
    pub approved_dispute_request: Pubkey,
}

/// Dispute phase
#[repr(u8)]
pub enum DisputePhase {
    /// No dispute
    None,
    /// In dispute process
    Dispute,
    /// Multisig has resolved
    Resolve,
    /// User has withdraw fund from dispute
    Withdraw,
}

impl From<DisputePhase> for u8 {
    fn from(phase: DisputePhase) -> Self {
        phase as u8
    }
}

impl TryFrom<u8> for DisputePhase {
    type Error = Error;

    fn try_from(value: u8) -> Result<Self> {
        match value {
            0 => Ok(DisputePhase::None),
            1 => Ok(DisputePhase::Dispute),
            2 => Ok(DisputePhase::Resolve),
            3 => Ok(DisputePhase::Withdraw),
            _ => program_err!(InvalidDisputePhase),
        }
    }
}

impl Dispute {
    // when owner open a new dispute
    pub fn go_to_dispute_phase(&mut self, current_ts: i64) {
        self.phase_dispute_timestamp = current_ts;
        self.phase = DisputePhase::Dispute.into();
    }

    // when owner close a dispute
    pub fn go_to_none_phase(&mut self) -> Result<()> {
        self.phase = DisputePhase::None.into();
        self.phase_dispute_timestamp = 0;
        self.phase_index = unwrap_int!(self.phase_index.checked_add(1));
        Ok(())
    }

    // when multisig resolve a dispute
    pub fn go_to_resolve_phase(&mut self, current_ts: i64, dispute_request: Pubkey) {
        self.phase = DisputePhase::Resolve.into();
        self.phase_resolve_timestamp = current_ts;
        self.approved_dispute_request = dispute_request;
    }

    // when user withdraw fund from dispute
    pub fn go_to_withdraw_phase(&mut self) {
        self.phase = DisputePhase::Withdraw.into();
    }
}

impl Escrow {
    /// Gets the amount of voting power the [Escrow] will have at the given time.
    pub fn voting_power_at_time(&self, locker: &Locker, timestamp: i64) -> Option<u64> {
        locker.calculate_voter_power(self, timestamp)
    }

    /// Gets the amount of voting power the [Escrow] currently has.
    pub fn voting_power(&self, locker: &Locker) -> Result<u64> {
        Ok(unwrap_int!(self.voting_power_at_time(
            locker,
            Clock::get()?.unix_timestamp
        )))
    }

    /// Update the escrow and its locker to account for a increase locked amount event.
    pub fn record_increase_locked_amount_event(
        &mut self,
        locker: &mut Locker,
        lock_amount: u64,
    ) -> Result<()> {
        self.amount = unwrap_int!(self.amount.checked_add(lock_amount));
        locker.locked_supply = unwrap_int!(locker.locked_supply.checked_add(lock_amount));
        Ok(())
    }

    /// Update the escrow and its locker to account for a extend lock duration event.
    pub fn record_extend_lock_duration_event(
        &mut self,
        next_escrow_started_at: i64,
        next_escrow_ends_at: i64,
    ) -> Result<()> {
        self.escrow_started_at = next_escrow_started_at;
        self.escrow_ends_at = next_escrow_ends_at;
        Ok(())
    }

    /// Checks if the account is in dispute
    pub fn is_not_in_dispute(&self) -> bool {
        self.dispute.phase == DisputePhase::None as u8
    }

    /// get remaining duration
    pub fn get_remaining_duration_until_expiration(
        &self,
        current_time: i64,
        locker: &Locker,
    ) -> Option<u64> {
        if self.is_max_lock {
            return Some(locker.params.max_stake_duration);
        }
        if self.escrow_ends_at < current_time {
            return Some(0);
        }
        let duration = self.escrow_ends_at.checked_sub(current_time)?;
        Some(duration as u64)
    }
    /// accumulate partial unstaking amount
    pub fn accumulate_partial_unstaking_amount(&mut self, amount: u64) -> Option<()> {
        self.amount = self.amount.checked_sub(amount)?;
        self.partial_unstaking_amount = self.partial_unstaking_amount.checked_add(amount)?;
        Some(())
    }

    /// accumulate partial unstaking amount
    pub fn merge_partial_unstaking_amount(&mut self, amount: u64) -> Option<()> {
        self.amount = self.amount.checked_add(amount)?;
        self.partial_unstaking_amount = self.partial_unstaking_amount.checked_sub(amount)?;
        Some(())
    }

    /// withdraw partial unstaking amount
    pub fn withdraw_partial_unstaking_amount(&mut self, amount: u64) -> Option<()> {
        self.partial_unstaking_amount = self.partial_unstaking_amount.checked_sub(amount)?;
        Some(())
    }
}

// #[test]
// fn test_size() {
//     println!("{}", Escrow::INIT_SPACE);
// }
