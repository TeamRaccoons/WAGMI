mod args;

use crate::args::*;
use anyhow::Result;

use anchor_client::anchor_lang::ToAccountMetas;
use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::keypair::*;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::{Client, Program};
use solana_program::instruction::AccountMeta;
use std::rc::Rc;
use std::str::FromStr;

use clap::*;

fn main() -> Result<()> {
    let opts = Opts::parse();
    let payer =
        read_keypair_file(opts.config_override.wallet_path).expect("Wallet keypair file not found");
    let wallet = payer.pubkey();

    println!("Wallet {:#?}", wallet);
    println!("Program ID: {:#?}", opts.config_override.program_id);

    let program_id = Pubkey::from_str(opts.config_override.program_id.as_str())?;
    let client = Client::new_with_options(
        opts.config_override.cluster,
        Rc::new(Keypair::from_bytes(&payer.to_bytes())?),
        CommitmentConfig::finalized(),
    );

    let program = client.program(program_id);
    match opts.command {
        CliCommand::CreateSmartWallet {
            max_owners,
            threshold,
            minimum_delay,
            owners,
        } => {
            create_smart_wallet(&program, max_owners, threshold, minimum_delay, owners)?;
        }
        CliCommand::SetOwners {
            smart_wallet,
            owners,
        } => {
            set_owners(&program, smart_wallet, owners)?;
        }
        CliCommand::ChangeThreshold {
            smart_wallet,
            threshold,
        } => {
            change_threshold(&program, smart_wallet, threshold)?;
        }
        CliCommand::AprroveTransaction {
            smart_wallet,
            transaction,
        } => {
            approve_transaction(&program, smart_wallet, transaction)?;
        }
        CliCommand::UnAprroveTransaction {
            smart_wallet,
            transaction,
        } => {
            unapprove_transaction(&program, smart_wallet, transaction)?;
        }
        CliCommand::ExecuteTransaction {
            smart_wallet,
            transaction,
        } => {
            execute_transaction(&program, smart_wallet, transaction)?;
        }
        CliCommand::ViewSmartwallet { smart_wallet } => {
            view_smartwallet(&program, smart_wallet)?;
        }
        CliCommand::ViewTransaction { transaction } => {
            view_transaction(&program, transaction)?;
        }
        CliCommand::CreateDummyTransaction { smart_wallet } => {
            create_dummy_transaction(&program, smart_wallet)?;
        }
    }

    Ok(())
}

fn create_smart_wallet(
    program: &Program,
    max_owners: u8,
    threshold: u64,
    minimum_delay: i64,
    owners: Vec<Pubkey>,
) -> Result<()> {
    let base_keypair = Keypair::new();
    let base = base_keypair.pubkey();

    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
    println!("smart_wallet address {}", smart_wallet);

    let builder = program
        .request()
        .accounts(smart_wallet::accounts::CreateSmartWallet {
            base,
            smart_wallet,
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(smart_wallet::instruction::CreateSmartWallet {
            max_owners,
            owners,
            threshold,
            minimum_delay,
        })
        .signer(&base_keypair);
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn set_owners(program: &Program, smart_wallet: Pubkey, owners: Vec<Pubkey>) -> Result<()> {
    println!("Set owner");
    let builder = program
        .request()
        .accounts(smart_wallet::accounts::Auth { smart_wallet })
        .args(smart_wallet::instruction::SetOwners { owners });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn change_threshold(program: &Program, smart_wallet: Pubkey, threshold: u64) -> Result<()> {
    println!("Change threshold");
    let builder = program
        .request()
        .accounts(smart_wallet::accounts::Auth { smart_wallet })
        .args(smart_wallet::instruction::ChangeThreshold { threshold });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn approve_transaction(program: &Program, smart_wallet: Pubkey, transaction: Pubkey) -> Result<()> {
    println!("Approve transaction {}", transaction);
    let builder = program
        .request()
        .accounts(smart_wallet::accounts::Approve {
            smart_wallet,
            transaction,
            owner: program.payer(),
        })
        .args(smart_wallet::instruction::Approve {});
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}
fn unapprove_transaction(
    program: &Program,
    smart_wallet: Pubkey,
    transaction: Pubkey,
) -> Result<()> {
    println!("UnApprove transaction {}", transaction);
    let builder = program
        .request()
        .accounts(smart_wallet::accounts::Approve {
            smart_wallet,
            transaction,
            owner: program.payer(),
        })
        .args(smart_wallet::instruction::Unapprove {});
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn execute_transaction(program: &Program, smart_wallet: Pubkey, transaction: Pubkey) -> Result<()> {
    println!("Execute transaction {}", transaction);
    let tx_account: smart_wallet::Transaction = program.account(transaction)?;
    let mut remaining_accounts = vec![];
    for ix in tx_account.instructions.iter() {
        remaining_accounts.push(AccountMeta::new_readonly(ix.program_id, false));
        for key in ix.keys.iter() {
            remaining_accounts.push(AccountMeta {
                pubkey: key.pubkey,
                is_signer: key.is_signer,
                is_writable: key.is_writable,
            });
        }
    }

    let mut accounts = smart_wallet::accounts::ExecuteTransaction {
        smart_wallet,
        transaction,
        owner: program.payer(),
    }
    .to_account_metas(None);

    accounts.append(&mut remaining_accounts);

    let builder = program
        .request()
        .accounts(accounts)
        .args(smart_wallet::instruction::Unapprove {});
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn view_transaction(program: &Program, transaction: Pubkey) -> Result<()> {
    let state: smart_wallet::Transaction = program.account(transaction)?;
    println!("{:?}", state);
    Ok(())
}
fn view_smartwallet(program: &Program, smart_wallet: Pubkey) -> Result<()> {
    let state: smart_wallet::SmartWallet = program.account(smart_wallet)?;
    println!("{:?}", state);
    Ok(())
}

fn create_dummy_transaction(program: &Program, smart_wallet: Pubkey) -> Result<()> {
    let smart_wallet_state: smart_wallet::SmartWallet = program.account(smart_wallet)?;
    let (transaction, bump) = Pubkey::find_program_address(
        &[
            b"Transaction".as_ref(),
            smart_wallet.as_ref(),
            smart_wallet_state.num_transactions.to_le_bytes().as_ref(),
        ],
        &smart_wallet::id(),
    );

    println!("Create Dummy transaction {}", transaction);

    let mut accounts = smart_wallet::accounts::CreateTransaction {
        smart_wallet,
        transaction,
        proposer: program.payer(),
        payer: program.payer(),
        system_program: solana_program::system_program::ID,
    }
    .to_account_metas(None);

    let builder =
        program
            .request()
            .accounts(accounts)
            .args(smart_wallet::instruction::CreateTransaction {
                bump: 0,
                instructions: vec![],
            });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}
