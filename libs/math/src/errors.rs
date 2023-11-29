use anchor_lang::prelude::*;

// Error Codes
#[error_code]
pub enum ErrorCode {
    #[msg("type cast faled")]
    TypeCastFailed,
    #[msg("Math operation overflow")]
    MathOverflow,
}
