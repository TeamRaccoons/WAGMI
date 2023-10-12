use super::u128x128_math::{mul_div, mul_shr, shl_div, Rounding};
use crate::ErrorCode;
use anchor_lang::prelude::Result;
use num_traits::cast::FromPrimitive;

// #[inline]
// pub fn safe_pow_cast<T: FromPrimitive>(base: u128, exp: i32) -> Result<T> {
//     T::from_u128(pow(base, exp).ok_or_else(|| ErrorCode::MathOverflow)?)
//         .ok_or_else(|| ErrorCode::TypeCastFailed.into())
// }

#[inline]
pub fn safe_mul_div_cast<T: FromPrimitive>(
    x: u128,
    y: u128,
    denominator: u128,
    rounding: Rounding,
) -> Result<T> {
    T::from_u128(mul_div(x, y, denominator, rounding).ok_or_else(|| ErrorCode::MathOverflow)?)
        .ok_or_else(|| ErrorCode::TypeCastFailed.into())
}

#[inline]
pub fn safe_mul_shr_cast<T: FromPrimitive>(
    x: u128,
    y: u128,
    offset: u8,
    rounding: Rounding,
) -> Result<T> {
    T::from_u128(mul_shr(x, y, offset, rounding).ok_or_else(|| ErrorCode::MathOverflow)?)
        .ok_or_else(|| ErrorCode::TypeCastFailed.into())
}

#[inline]
pub fn safe_shl_div_cast<T: FromPrimitive>(
    x: u128,
    y: u128,
    offset: u8,
    rounding: Rounding,
) -> Result<T> {
    T::from_u128(shl_div(x, y, offset, rounding).ok_or_else(|| ErrorCode::MathOverflow)?)
        .ok_or_else(|| ErrorCode::TypeCastFailed.into())
}
