//! Locker math.
#![deny(clippy::integer_arithmetic)]

use crate::*;
use num_traits::ToPrimitive;

impl Locker {
    /// Calculates the amount of voting power an [Escrow] has.
    pub fn calculate_voter_power(&self, escrow: &Escrow, now: i64) -> Option<u64> {
        // invalid `now` argument, should never happen.
        if now == 0 {
            return None;
        }

        // if max lock is indicated, then user always get full voting power
        if escrow.is_max_lock {
            let power = escrow
                .amount
                .checked_mul(self.params.max_stake_vote_multiplier.into())?;
            return Some(power);
        }

        if escrow.escrow_started_at == 0 {
            return Some(0);
        }
        // Lockup had zero power before the start time.
        if now < escrow.escrow_started_at || now >= escrow.escrow_ends_at {
            return Some(0);
        }

        let seconds_until_lockup_expiry = escrow.escrow_ends_at.checked_sub(now)?;
        // elapsed seconds, clamped to the maximum duration
        let relevant_seconds_until_lockup_expiry = seconds_until_lockup_expiry
            .to_u64()?
            .min(self.params.max_stake_duration);

        // voting power at max lockup
        let power_if_max_lockup = escrow
            .amount
            .checked_mul(self.params.max_stake_vote_multiplier.into())?;

        // Linear voting power
        // multiply the max lockup power by the fraction of the max stake duration
        let power = (power_if_max_lockup as u128)
            .checked_mul(relevant_seconds_until_lockup_expiry.into())?
            .checked_div(self.params.max_stake_duration.into())?
            .to_u64()?;

        Some(power)
    }
}
