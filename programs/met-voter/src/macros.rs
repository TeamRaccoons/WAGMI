//! Macros

/// Generates the signer seeds for a [crate::Locker].
#[macro_export]
macro_rules! locker_seeds {
    ($locker: expr) => {
        &[&[b"Locker" as &[u8], &$locker.base.as_ref(), &[$locker.bump]]]
    };
}

/// Generates the signer seeds for an [crate::Escrow].
#[macro_export]
macro_rules! escrow_seeds {
    ($escrow: expr) => {
        &[&[
            b"Escrow" as &[u8],
            &$escrow.locker.as_ref(),
            &$escrow.owner.as_ref(),
            &[$escrow.bump],
        ]]
    };
}
