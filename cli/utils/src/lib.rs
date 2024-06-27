use anchor_client::solana_client::rpc_client::RpcClient;
use anchor_client::solana_client::rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig};
use anchor_client::solana_client::rpc_filter::{Memcmp, RpcFilterType};
use anchor_client::solana_client::rpc_response::RpcSimulateTransactionResult;
use anchor_client::solana_sdk::signature::{read_keypair_file, Keypair};
use anchor_client::RequestBuilder;
use anchor_client::{
    solana_client::rpc_response::Response,
    solana_sdk::{signature::Signer, transaction::Transaction},
    Program,
};
use anchor_lang::prelude::Pubkey;
use anchor_lang::{AccountDeserialize, Discriminator};
use anyhow::Result;
use regex::Regex;
use solana_account_decoder::UiAccountEncoding;
use std::ops::Deref;
use std::time::Duration;

pub fn parse_event_log<
    T: anchor_lang::AnchorDeserialize + anchor_lang::AnchorSerialize + anchor_lang::Discriminator,
>(
    logs: &Vec<String>,
    program_id: Pubkey,
) -> Option<T> {
    let program_start_pattern = Regex::new(r"Program .* invoke \[\d{1}\]").unwrap();
    let program_end_pattern = Regex::new(r"Program .* success").unwrap();
    let mut execution_stack: Vec<String> = vec![];
    for log in logs.into_iter() {
        if program_start_pattern.is_match(log) {
            execution_stack.push(log.chars().skip(8).take(44).collect());
        }
        if program_end_pattern.is_match(log) {
            execution_stack.pop();
        }
        if log.starts_with("Program data:") && *execution_stack.last()? == program_id.to_string() {
            // Skip the prefix "Program data: "
            // Event logged has been changed to Program data: instead of Program log:
            // https://github.com/project-serum/anchor/pull/1608/files
            let log_info: String = log.chars().skip(14).collect();
            let log_buf = anchor_lang::__private::base64::decode(log_info.as_bytes());
            if log_buf.is_ok() {
                let log_buf = log_buf.unwrap();
                // Check for event discriminator, it is a 8-byte prefix
                if log_buf[0..8] == T::discriminator() {
                    // Skip event discriminator when deserialize
                    return T::try_from_slice(&log_buf[8..]).ok();
                }
            }
        }
    }
    None
}

pub fn simulate_transaction<C: Deref<Target = impl Signer> + Clone>(
    builder: &RequestBuilder<C>,
    program: &Program<C>,
    signers: &Vec<&dyn Signer>,
) -> Result<Response<RpcSimulateTransactionResult>, Box<dyn std::error::Error>> {
    let instructions = builder.instructions()?;
    let rpc_client = program.rpc();
    let recent_blockhash = rpc_client.get_latest_blockhash()?;
    let tx = Transaction::new_signed_with_payer(
        &instructions,
        Some(&program.payer()),
        signers,
        recent_blockhash,
    );

    let simulation = rpc_client.simulate_transaction(&tx)?;
    Ok(simulation)
}

pub fn default_keypair() -> Keypair {
    read_keypair_file(&*shellexpand::tilde("~/.config/solana/id.json"))
        .expect("Requires a keypair file")
}

pub fn accounts_with_rpc_timeout<
    C: Deref<Target = impl Signer> + Clone,
    A: AccountDeserialize + Discriminator,
>(
    program: &Program<C>,
    filters: Option<Vec<RpcFilterType>>,
) -> Result<Vec<(Pubkey, A)>> {
    let rpc_client = RpcClient::new_with_timeout(program.rpc().url(), Duration::from_secs(600));

    let mut all_filters = vec![RpcFilterType::Memcmp(Memcmp::new_base58_encoded(
        0,
        &A::DISCRIMINATOR,
    ))];
    if let Some(filters) = filters {
        all_filters.extend(filters);
    }
    let program_accounts = rpc_client.get_program_accounts_with_config(
        &program.id(),
        RpcProgramAccountsConfig {
            filters: Some(all_filters),
            account_config: RpcAccountInfoConfig {
                encoding: Some(UiAccountEncoding::Base64Zstd),
                ..Default::default()
            },
            ..Default::default()
        },
    )?;

    let program_accounts = program_accounts
        .into_iter()
        .map(|(address, account)| {
            A::try_deserialize(&mut account.data.as_slice()).map(|account| (address, account))
        })
        .collect::<Result<Vec<_>, anchor_lang::error::Error>>()?;

    Ok(program_accounts)
}
