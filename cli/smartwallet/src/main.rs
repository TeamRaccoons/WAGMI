mod args;

use crate::args::*;
use anchor_lang::Key;
use anyhow::Ok;
use anyhow::Result;
use utils_cli::*;

use anchor_client::anchor_lang::InstructionData;
use anchor_client::anchor_lang::ToAccountMetas;
use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::keypair::*;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::{Client, Program};
use solana_program::instruction::AccountMeta;
use std::ops::Deref;
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
    let base = match opts.config_override.base_path {
        Some(value) => {
            read_keypair_file(&*shellexpand::tilde(&value)).expect("Requires a keypair file")
        }
        None => Keypair::new(),
    };
    let program = client.program(program_id)?;
    match opts.command {
        CliCommand::CreateSmartWallet {
            max_owners,
            threshold,
            minimum_delay,
            owners,
        } => {
            create_smart_wallet(&program, base, max_owners, threshold, minimum_delay, owners)?;
        }

        CliCommand::CreateSetOwnersTx { base, owners } => {
            create_set_owners_tx(&program, base, owners)?;
        }
        CliCommand::CreateChangeThresholdTx { base, threshold } => {
            create_change_threshold_tx(&program, base, threshold)?;
        }
        CliCommand::CreateActivateProposalTx { base, proposal } => {
            create_activate_proposal_tx(&program, base, proposal)?;
        }
        CliCommand::ApproveTransaction { base, transaction } => {
            approve_transaction(&program, base, transaction)?;
        }
        CliCommand::UnApproveTransaction { base, transaction } => {
            unapprove_transaction(&program, base, transaction)?;
        }
        CliCommand::RemoveTransaction { base, transaction } => {
            remove_transaction(&program, base, transaction)?;
        }
        CliCommand::ExecuteTransaction { base, transaction } => {
            execute_transaction(&program, base, transaction)?;
        }
        CliCommand::ViewSmartwallet { base } => {
            view_smartwallet(&program, base)?;
        }
        CliCommand::ViewTransaction { transaction } => {
            view_transaction(&program, transaction)?;
        }
        CliCommand::CreateDummyTransaction { base } => {
            create_dummy_transaction(&program, base)?;
        }
        CliCommand::CreateAddNewOwnerTx { base, owner } => {
            create_add_new_owner_tx(&program, base, owner)?;
        }
        CliCommand::CreateRemoveOwnerTx { base, owner } => {
            create_remove_owner_tx(&program, base, owner)?;
        }
        CliCommand::CreateSetGovernanceParamsTx {
            base,
            voting_delay,
            voting_period,
            quorum_votes,
            timelock_delay_seconds,
        } => {
            create_set_governance_params_tx(
                &program,
                base,
                voting_delay,
                voting_period,
                quorum_votes,
                timelock_delay_seconds,
            )?;
        }
    }

    Ok(())
}

fn create_smart_wallet<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
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

    println!(
        "smart_wallet address {}, max owner {}",
        smart_wallet, max_owners
    );

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

    // let result =
    //     simulate_transaction(&builder, program, &vec![&base_keypair, &default_keypair()]).unwrap();
    // println!("{:?}", result);

    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn create_set_owners_tx<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    owners: Vec<Pubkey>,
) -> Result<()> {
    println!("new owners {:?}", owners);
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );

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
    create_transaction(program, base, vec![instruction])
}

fn create_add_new_owner_tx<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    new_owner: Pubkey,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
    let smart_wallet_state: smart_wallet::SmartWallet = program.account(smart_wallet)?;
    // check whether owner is exsited
    for old_owner in smart_wallet_state.owners.iter() {
        if *old_owner == new_owner {
            println!("Owner is existed in smartwallet");
            return Ok(());
        }
    }

    let mut owners = smart_wallet_state.owners.clone();
    owners.push(new_owner);

    if owners.len() > smart_wallet_state.max_owners as usize {
        println!("Max owners is reached, cannot add more");
        return Ok(());
    }

    create_set_owners_tx(program, base, owners)
}

fn create_remove_owner_tx<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    owner: Pubkey,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
    let smart_wallet_state: smart_wallet::SmartWallet = program.account(smart_wallet)?;

    if smart_wallet_state.owners.len() <= smart_wallet_state.threshold as usize {
        println!("threshold is reached, cannot remove");
        return Ok(());
    }
    // check whether the owner is governor
    let (governor, _bump) =
        Pubkey::find_program_address(&[b"MeteoraGovernor".as_ref(), base.as_ref()], &govern::id());
    if owner == governor {
        println!("Cannot remove governor");
        return Ok(());
    }
    let mut owners = smart_wallet_state.owners;
    let index = owners.iter().position(|x| *x == owner).unwrap();
    owners.remove(index);

    create_set_owners_tx(program, base, owners)
}

fn create_change_threshold_tx<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    threshold: u64,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
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

    create_transaction(program, base, vec![instruction])
}

fn create_set_governance_params_tx<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    voting_delay: u64,
    voting_period: u64,
    quorum_votes: u64,
    timelock_delay_seconds: i64,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
    let (governor, bump) =
        Pubkey::find_program_address(&[b"MeteoraGovernor".as_ref(), base.as_ref()], &govern::id());

    println!("set governance parameters");
    let data = govern::instruction::SetGovernanceParams {
        params: govern::GovernanceParameters {
            voting_delay,
            voting_period,
            quorum_votes,
            timelock_delay_seconds,
        },
    }
    .data();
    let instruction = smart_wallet::TXInstruction {
        program_id: govern::ID,
        keys: vec![
            smart_wallet::TXAccountMeta {
                pubkey: governor,
                is_signer: false,
                is_writable: true,
            },
            smart_wallet::TXAccountMeta {
                pubkey: smart_wallet,
                is_signer: true,
                is_writable: false,
            },
        ],
        data,
    };

    create_transaction(program, base, vec![instruction])
}

fn create_activate_proposal_tx<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    proposal: Pubkey,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
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

    create_transaction(program, base, vec![instruction])
}

fn approve_transaction<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    transaction: Pubkey,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );

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
fn unapprove_transaction<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    transaction: Pubkey,
) -> Result<()> {
    let (smart_wallet, _bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
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

fn remove_transaction<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    transaction: Pubkey,
) -> Result<()> {
    let (smart_wallet, _bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
    println!("Remove transaction {}", transaction);
    let builder = program
        .request()
        .accounts(smart_wallet::accounts::RemoveTransaction {
            smart_wallet,
            transaction,
            proposer: program.payer(),
        })
        .args(smart_wallet::instruction::RemoveTransaction {});
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn execute_transaction<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    transaction: Pubkey,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );

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

    // let result = simulate_transaction(&builder, program, &vec![&default_keypair()]).unwrap();
    // println!("{:?}", result);
    // return Ok(());

    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn view_transaction<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    transaction: Pubkey,
) -> Result<()> {
    let state: smart_wallet::Transaction = program.account(transaction)?;
    println!("{:?}", state);
    Ok(())
}
fn view_smartwallet<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );

    let state: smart_wallet::SmartWallet = program.account(smart_wallet)?;
    println!("{:?}", state);
    Ok(())
}

fn create_dummy_transaction<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
) -> Result<()> {
    create_transaction(program, base, vec![])
}

fn create_transaction<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    instructions: Vec<smart_wallet::TXInstruction>,
) -> Result<()> {
    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
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
