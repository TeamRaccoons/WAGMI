//! Multisig Solana wallet with Timelock capabilities.
//!
//! This program can be used to allow a smart wallet to govern anything a regular
//! [Pubkey] can govern. One can use the smart wallet as a BPF program upgrade
//! authority, a mint authority, etc.
//!
//! To use, one must first create a [SmartWallet] account, specifying two important
//! parameters:
//!
//! 1. Owners - the set of addresses that sign transactions for the smart wallet.
//! 2. Threshold - the number of signers required to execute a transaction.
//! 3. Minimum Delay - the minimum amount of time that must pass before a [Transaction]
//!                    can be executed. If 0, this is ignored.
//!
//! Once the [SmartWallet] account is created, one can create a [Transaction]
//! account, specifying the parameters for a normal Solana instruction.
//!
//! To sign, owners should invoke the [smart_wallet::approve] instruction, and finally,
//! [smart_wallet::execute_transaction], once enough (i.e. [SmartWallet::threshold]) of the owners have
//! signed.
#![deny(rustdoc::all)]
#![allow(rustdoc::missing_doc_code_examples)]
#![deny(clippy::unwrap_used)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use vipers::prelude::*;

mod instructions;
mod state;

pub use instructions::*;
pub use state::*;

/// Number of seconds in a day.
pub const SECONDS_PER_DAY: i64 = 60 * 60 * 24;

/// Maximum timelock delay.
pub const MAX_DELAY_SECONDS: i64 = 365 * SECONDS_PER_DAY;

/// Default number of seconds until a transaction expires.
pub const DEFAULT_GRACE_PERIOD: i64 = 14 * SECONDS_PER_DAY;

/// Constant declaring that there is no ETA of the transaction.
pub const NO_ETA: i64 = -1;

declare_id!("smaK3fwkA7ubbxEhsimp1iqPTzfS4MBsNL77QLABZP6");

#[program]
/// Smart wallet program.
pub mod smart_wallet {
    use super::*;

    /// Initializes a new [SmartWallet] account with a set of owners and a threshold.
    #[access_control(ctx.accounts.validate())]
    pub fn create_smart_wallet(
        ctx: Context<CreateSmartWallet>,
        max_owners: u8,
        owners: Vec<Pubkey>,
        threshold: u64,
        minimum_delay: i64,
    ) -> Result<()> {
        ctx.accounts.create_smart_wallet(
            unwrap_bump!(ctx, "smart_wallet"),
            max_owners,
            owners,
            threshold,
            minimum_delay,
        )
    }

    /// Sets the owners field on the smart_wallet. The only way this can be invoked
    /// is via a recursive call from execute_transaction -> set_owners.
    #[access_control(ctx.accounts.validate())]
    pub fn set_owners(ctx: Context<Auth>, owners: Vec<Pubkey>) -> Result<()> {
        ctx.accounts.set_owners(owners)
    }

    /// Changes the execution threshold of the smart_wallet. The only way this can be
    /// invoked is via a recursive call from execute_transaction ->
    /// change_threshold.
    #[access_control(ctx.accounts.validate())]
    pub fn change_threshold(ctx: Context<Auth>, threshold: u64) -> Result<()> {
        ctx.accounts.change_threshold(threshold)
    }

    /// Creates a new [Transaction] account, automatically signed by the creator,
    /// which must be one of the owners of the smart_wallet.
    #[access_control(ctx.accounts.validate())]
    pub fn create_transaction(
        ctx: Context<CreateTransaction>,
        _bump: u8, // weird bug from Anchor
        instructions: Vec<TXInstruction>,
    ) -> Result<()> {
        ctx.accounts
            .create_transaction(unwrap_bump!(ctx, "transaction"), instructions)
    }

    /// Creates a new [Transaction] account with time delay.
    #[access_control(ctx.accounts.validate())]
    pub fn create_transaction_with_timelock(
        ctx: Context<CreateTransaction>,
        _bump: u8, // weird bug from Anchor
        instructions: Vec<TXInstruction>,
        eta: i64,
    ) -> Result<()> {
        ctx.accounts.create_transaction_with_timelock(
            unwrap_bump!(ctx, "transaction"),
            instructions,
            eta,
        )
    }

    /// Approves a transaction on behalf of an owner of the smart_wallet.
    #[access_control(ctx.accounts.validate())]
    pub fn approve(ctx: Context<Approve>) -> Result<()> {
        ctx.accounts.approve()
    }

    /// Unapproves a transaction on behalf of an owner of the smart_wallet.
    #[access_control(ctx.accounts.validate())]
    pub fn unapprove(ctx: Context<Approve>) -> Result<()> {
        ctx.accounts.unapprove()
    }

    /// Executes the given transaction if threshold owners have signed it.
    #[access_control(ctx.accounts.validate())]
    pub fn execute_transaction<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ExecuteTransaction<'info>>,
    ) -> Result<()> {
        ctx.accounts.execute_transaction(ctx.remaining_accounts)
    }

    /// Executes the given transaction signed by the given derived address,
    /// if threshold owners have signed it.
    /// This allows a Smart Wallet to receive SOL.
    #[access_control(ctx.accounts.validate())]
    pub fn execute_transaction_derived<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, ExecuteTransaction<'info>>,
        index: u64,
        bump: u8,
    ) -> Result<()> {
        let smart_wallet = &ctx.accounts.smart_wallet;
        let smart_wallet_key = smart_wallet.key();
        // Execute the transaction signed by the smart_wallet.
        let wallet_seeds: &[&[&[u8]]] = &[&[
            b"SmartWalletDerived" as &[u8],
            &smart_wallet_key.as_ref(),
            &index.to_le_bytes(),
            &[bump],
        ]];

        ctx.accounts
            .do_execute_transaction(wallet_seeds, ctx.remaining_accounts)
    }

    /// Invokes an arbitrary instruction as a PDA derived from the owner,
    /// i.e. as an "Owner Invoker".
    ///
    /// This is useful for using the multisig as a whitelist or as a council,
    /// e.g. a whitelist of approved owners.
    #[access_control(ctx.accounts.validate())]
    pub fn owner_invoke_instruction<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, OwnerInvokeInstruction<'info>>,
        index: u64,
        bump: u8,
        ix: TXInstruction,
    ) -> Result<()> {
        ctx.accounts
            .owner_invoke_instruction(index, bump, ix, ctx.remaining_accounts)
    }

    /// Invokes an arbitrary instruction as a PDA derived from the owner,
    /// i.e. as an "Owner Invoker".
    ///
    /// This is useful for using the multisig as a whitelist or as a council,
    /// e.g. a whitelist of approved owners.
    ///
    /// # Arguments
    /// - `index` - The index of the owner-invoker.
    /// - `bump` - Bump seed of the owner-invoker.
    /// - `invoker` - The owner-invoker.
    /// - `data` - The raw bytes of the instruction data.
    #[access_control(ctx.accounts.validate())]
    pub fn owner_invoke_instruction_v2<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, OwnerInvokeInstruction<'info>>,
        index: u64,
        bump: u8,
        invoker: Pubkey,
        data: Vec<u8>,
    ) -> Result<()> {
        ctx.accounts
            .owner_invoke_instruction_v2(index, bump, invoker, data, ctx.remaining_accounts)
    }

    /// Creates a struct containing a reverse mapping of a subaccount to a
    /// [SmartWallet].
    #[access_control(ctx.accounts.validate())]
    pub fn create_subaccount_info(
        ctx: Context<CreateSubaccountInfo>,
        subaccount: Pubkey,
        smart_wallet: Pubkey,
        index: u64,
        subaccount_type: SubaccountType,
    ) -> Result<()> {
        ctx.accounts
            .create_subaccount_info(subaccount, smart_wallet, index, subaccount_type)
    }
}

/// Program errors.
#[error_code]
pub enum ErrorCode {
    #[msg("The given owner is not part of this smart wallet.")]
    InvalidOwner,
    #[msg("Estimated execution block must satisfy delay.")]
    InvalidETA,
    #[msg("Delay greater than the maximum.")]
    DelayTooHigh,
    #[msg("Not enough owners signed this transaction.")]
    NotEnoughSigners,
    #[msg("Transaction is past the grace period.")]
    TransactionIsStale,
    #[msg("Transaction hasn't surpassed time lock.")]
    TransactionNotReady,
    #[msg("The given transaction has already been executed.")]
    AlreadyExecuted,
    #[msg("Threshold must be less than or equal to the number of owners.")]
    InvalidThreshold,
    #[msg("Owner set has changed since the creation of the transaction.")]
    OwnerSetChanged,
    #[msg("Subaccount does not belong to smart wallet.")]
    SubaccountOwnerMismatch,
}
