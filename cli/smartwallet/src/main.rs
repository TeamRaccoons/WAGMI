mod args;

use crate::args::*;
use anyhow::Result;

use anchor_client::anchor_lang::InstructionData;
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
    let base = match opts.config_override.base {
        Some(value) => {
            read_keypair_file(&*shellexpand::tilde(&value)).expect("Requires a keypair file")
        }
        None => Keypair::new(),
    };
    let program = client.program(program_id);
    match opts.command {
        CliCommand::CreateSmartWallet {
            max_owners,
            threshold,
            minimum_delay,
            owners,
        } => {
            create_smart_wallet(&program, base, max_owners, threshold, minimum_delay, owners)?;
        }

        CliCommand::CreateSetOwnersTx {
            smart_wallet,
            owners,
        } => {
            create_set_owners_tx(&program, smart_wallet, owners)?;
        }
        CliCommand::CreateChangeThresholdTx {
            smart_wallet,
            threshold,
        } => {
            create_change_threshold_tx(&program, smart_wallet, threshold)?;
        }
        CliCommand::CreateActivateProposalTx {
            smart_wallet,
            proposal,
        } => {
            create_activate_proposal_tx(&program, smart_wallet, proposal)?;
        }
        CliCommand::ApproveTransaction {
            smart_wallet,
            transaction,
        } => {
            approve_transaction(&program, smart_wallet, transaction)?;
        }
        CliCommand::UnApproveTransaction {
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
    base_keypair: Keypair,
    max_owners: u8,
    threshold: u64,
    minimum_delay: i64,
    owners: Vec<Pubkey>,
) -> Result<()> {
    let base = base_keypair.pubkey();

    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );

    // push governor in the owner
    let mut owners = owners.to_vec();
    let (governor, bump) =
        Pubkey::find_program_address(&[b"MeteoraGovernor".as_ref(), base.as_ref()], &govern::id());
    owners.push(governor);
    assert_eq!(max_owners >= owners.len() as u8, true);

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
            owners: owners.to_vec(),
            threshold,
            minimum_delay,
        })
        .signer(&base_keypair);
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn create_set_owners_tx(
    program: &Program,
    smart_wallet: Pubkey,
    owners: Vec<Pubkey>,
) -> Result<()> {
    let data = smart_wallet::instruction::SetOwners { owners }.data();
    let instruction = smart_wallet::TXInstruction {
        program_id: smart_wallet::id(),
        keys: vec![smart_wallet::TXAccountMeta {
            pubkey: smart_wallet,
            is_signer: true,
            is_writable: true,
        }],
        data,
    };
    create_transaction(program, smart_wallet, vec![instruction])
}

fn create_change_threshold_tx(
    program: &Program,
    smart_wallet: Pubkey,
    threshold: u64,
) -> Result<()> {
    println!("Change threshold");
    let data = smart_wallet::instruction::ChangeThreshold { threshold }.data();
    let instruction = smart_wallet::TXInstruction {
        program_id: smart_wallet::id(),
        keys: vec![smart_wallet::TXAccountMeta {
            pubkey: smart_wallet,
            is_signer: true,
            is_writable: true,
        }],
        data,
    };

    create_transaction(program, smart_wallet, vec![instruction])
}

fn create_activate_proposal_tx(
    program: &Program,
    smart_wallet: Pubkey,
    proposal: Pubkey,
) -> Result<()> {
    let proposal_state: govern::Proposal = program.account(proposal)?;
    let governor_state: govern::Governor = program.account(proposal_state.governor)?;

    let data = voter::instruction::ActivateProposalInitialPhase {}.data();
    let instruction = smart_wallet::TXInstruction {
        program_id: voter::id(),
        keys: vec![
            smart_wallet::TXAccountMeta {
                pubkey: governor_state.locker,
                is_signer: false,
                is_writable: true,
            },
            smart_wallet::TXAccountMeta {
                pubkey: proposal_state.governor,
                is_signer: false,
                is_writable: true,
            },
            smart_wallet::TXAccountMeta {
                pubkey: proposal,
                is_signer: false,
                is_writable: true,
            },
            smart_wallet::TXAccountMeta {
                pubkey: govern::id(),
                is_signer: false,
                is_writable: false,
            },
            smart_wallet::TXAccountMeta {
                pubkey: smart_wallet,
                is_signer: true,
                is_writable: true,
            },
        ],
        data,
    };

    create_transaction(program, smart_wallet, vec![instruction])
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
                is_signer: false,
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
        .args(smart_wallet::instruction::ExecuteTransaction {});
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
    create_transaction(program, smart_wallet, vec![])
}

fn create_transaction(
    program: &Program,
    smart_wallet: Pubkey,
    instructions: Vec<smart_wallet::TXInstruction>,
) -> Result<()> {
    let smart_wallet_state: smart_wallet::SmartWallet = program.account(smart_wallet)?;
    let (transaction, _bump) = Pubkey::find_program_address(
        &[
            b"Transaction".as_ref(),
            smart_wallet.as_ref(),
            smart_wallet_state.num_transactions.to_le_bytes().as_ref(),
        ],
        &smart_wallet::id(),
    );
    println!("Tx {}", transaction);

    let accounts = smart_wallet::accounts::CreateTransaction {
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
                _bump: 0,
                instructions,
            });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}
