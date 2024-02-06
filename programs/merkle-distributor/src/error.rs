use anchor_lang::error_code;

/// Error codes.
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Merkle proof")]
    InvalidProof,
    #[msg("Drop already claimed")]
    DropAlreadyClaimed,
    #[msg("Exceeded maximum claim amount")]
    ExceededMaxClaim,
    #[msg("Exceeded maximum number of claimed nodes")]
    ExceededMaxNumNodes,
    #[msg("Account is not authorized to execute this instruction")]
    Unauthorized,
    #[msg("Token mint did not match intended mint")]
    MintMismatch,
    #[msg("Token account owner did not match intended owner")]
    OwnerMismatch,
    #[msg("Payer did not match intended payer")]
    PayerMismatch,
    #[msg("Claim window expired")]
    ClaimExpired,
    #[msg("Arithmetic Error (overflow/underflow)")]
    ArithmeticError,
    #[msg("Clawback start must be at least one day after current time")]
    InsufficientClawbackDelay,
    #[msg("New and old Clawback receivers are identical")]
    SameClawbackReceiver,
    #[msg("New and old admin are identical")]
    SameAdmin,
    #[msg("Attempted clawback before start")]
    ClawbackBeforeStart,
    #[msg("Clawback already claimed")]
    ClawbackAlreadyClaimed,
}
