use crate::ErrorCode;
use anchor_lang::solana_program::msg;
use std::panic::Location;

pub trait SafeMath<T>: Sized {
    fn safe_add(self, rhs: Self) -> Result<Self, ErrorCode>;
    fn safe_mul(self, rhs: Self) -> Result<Self, ErrorCode>;
    fn safe_div(self, rhs: Self) -> Result<Self, ErrorCode>;
    fn safe_sub(self, rhs: Self) -> Result<Self, ErrorCode>;
    fn safe_shl(self, offset: T) -> Result<Self, ErrorCode>;
    fn safe_shr(self, offset: T) -> Result<Self, ErrorCode>;
}

macro_rules! checked_impl {
    ($t:ty, $offset:ty) => {
        impl SafeMath<$offset> for $t {
            #[inline(always)]
            fn safe_add(self, v: $t) -> Result<$t, ErrorCode> {
                match self.checked_add(v) {
                    Some(result) => Ok(result),
                    None => {
                        let caller = Location::caller();
                        msg!("Math error thrown at {}:{}", caller.file(), caller.line());
                        Err(ErrorCode::MathOverflow)
                    }
                }
            }

            #[inline(always)]
            fn safe_sub(self, v: $t) -> Result<$t, ErrorCode> {
                match self.checked_sub(v) {
                    Some(result) => Ok(result),
                    None => {
                        let caller = Location::caller();
                        msg!("Math error thrown at {}:{}", caller.file(), caller.line());
                        Err(ErrorCode::MathOverflow)
                    }
                }
            }

            #[inline(always)]
            fn safe_mul(self, v: $t) -> Result<$t, ErrorCode> {
                match self.checked_mul(v) {
                    Some(result) => Ok(result),
                    None => {
                        let caller = Location::caller();
                        msg!("Math error thrown at {}:{}", caller.file(), caller.line());
                        Err(ErrorCode::MathOverflow)
                    }
                }
            }

            #[inline(always)]
            fn safe_div(self, v: $t) -> Result<$t, ErrorCode> {
                match self.checked_div(v) {
                    Some(result) => Ok(result),
                    None => {
                        let caller = Location::caller();
                        msg!("Math error thrown at {}:{}", caller.file(), caller.line());
                        Err(ErrorCode::MathOverflow)
                    }
                }
            }

            #[inline(always)]
            fn safe_shl(self, v: $offset) -> Result<$t, ErrorCode> {
                match self.checked_shl(v) {
                    Some(result) => Ok(result),
                    None => {
                        let caller = Location::caller();
                        msg!("Math error thrown at {}:{}", caller.file(), caller.line());
                        Err(ErrorCode::MathOverflow)
                    }
                }
            }

            #[inline(always)]
            fn safe_shr(self, v: $offset) -> Result<$t, ErrorCode> {
                match self.checked_shr(v) {
                    Some(result) => Ok(result),
                    None => {
                        let caller = Location::caller();
                        msg!("Math error thrown at {}:{}", caller.file(), caller.line());
                        Err(ErrorCode::MathOverflow)
                    }
                }
            }
        }
    };
}

checked_impl!(i32, u32);
checked_impl!(u32, u32);
checked_impl!(u64, u32);
checked_impl!(i64, u32);
checked_impl!(u128, u32);
checked_impl!(usize, u32);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_add() {
        assert_eq!(u64::MAX.safe_add(u64::MAX).is_err(), true);
        assert_eq!(100u64.safe_add(100u64).is_ok(), true);
        assert_eq!(100u64.safe_add(100u64).unwrap(), 200u64);
    }

    #[test]
    fn safe_sub() {
        assert_eq!(0u64.safe_sub(u64::MAX).is_err(), true);
        assert_eq!(200u64.safe_sub(100u64).is_ok(), true);
        assert_eq!(200u64.safe_sub(100u64).unwrap(), 100u64);
    }

    #[test]
    fn safe_mul() {
        assert_eq!(u64::MAX.safe_mul(u64::MAX).is_err(), true);
        assert_eq!(100u64.safe_mul(100u64).is_ok(), true);
        assert_eq!(100u64.safe_mul(100u64).unwrap(), 10000u64);
    }
}
