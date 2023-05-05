//! Macros

/// Generates the signer seeds for a Governor.
#[macro_export]
macro_rules! governor_seeds {
    ($governor: expr) => {
        &[
            b"MeteoraGovernor" as &[u8],
            &$governor.base.as_ref(),
            &[$governor.bump],
        ]
    };
}
