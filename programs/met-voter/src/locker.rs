//! Locker math.
#![deny(clippy::integer_arithmetic)]

use crate::*;
use num_traits::ToPrimitive;

#[cfg(test)]
fn get_unix_timestamp() -> Result<i64> {
    use std::time::SystemTime;

    Ok(SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64)
}

#[cfg(not(test))]
fn get_unix_timestamp() -> Result<i64> {
    Ok(Clock::get()?.unix_timestamp)
}

impl Locker {
    pub fn get_current_phase(&self) -> Result<Phase> {
        let now = get_unix_timestamp()?;
        if self.expiration > now {
            return Ok(Phase::InitialPhase);
        }
        Ok(Phase::TokenLaunchPhase)
    }
    /// Calculates the amount of voting power an [Escrow] has.
    pub fn calculate_voter_power(&self, escrow: &Escrow, now: i64) -> Option<u64> {
        // invalid `now` argument, should never happen.
        if now == 0 {
            return None;
        }
        let phase: Phase = match self.get_current_phase() {
            Ok(value) => value,
            Err(_) => return None,
        };
        if phase == Phase::InitialPhase {
            if self.expiration <= now {
                return Some(0);
            }
            // Constant voting power
            let power_if_max_lockup = escrow
                .amount
                .checked_mul(self.params.max_stake_vote_multiplier.into())?;
            return Some(power_if_max_lockup);
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
