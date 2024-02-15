mod args;
mod utils;
use crate::args::*;
use crate::utils::*;
use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::keypair::*;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::{Client, Program};
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;
use anchor_spl::associated_token::get_associated_token_address;
use anchor_spl::token::Mint;
use anchor_spl::token::TokenAccount;
use anyhow::Ok;
use anyhow::Result;
use clap::*;
use solana_program::instruction::Instruction;
use std::ops::Deref;
use std::path::PathBuf;
use std::rc::Rc;
use std::str::FromStr;
use utils_cli::*;

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
        CliCommand::NewDistributor {
            token_mint,
            path_to_snapshot,
            clawback_owner,
            clawback_start_ts,
        } => {
            new_distributor(
                &program,
                base,
                token_mint,
                path_to_snapshot,
                clawback_owner,
                clawback_start_ts,
            )?;
        }
        CliCommand::Fund { path_to_snapshot } => {
            fund(&program, base, path_to_snapshot)?;
        }
        CliCommand::Claim {
            base,
            path_to_snapshot,
        } => {
            claim(&program, base, path_to_snapshot)?;
        }
        CliCommand::ViewDistributor { base } => {
            let (distributor, _bump) = Pubkey::find_program_address(
                &[b"MerkleDistributor".as_ref(), base.as_ref()],
                &merkle_distributor::id(),
            );

            let distributor_state: merkle_distributor::MerkleDistributor =
                program.account(distributor)?;
            println!("{:?}", distributor_state);
        }
        CliCommand::ViewClaimStatus {
            base,
            claimant,
            path_to_snapshot,
        } => {
            let (distributor, _bump) = Pubkey::find_program_address(
                &[b"MerkleDistributor".as_ref(), base.as_ref()],
                &merkle_distributor::id(),
            );

            let (distributor, _bump) = Pubkey::find_program_address(
                &[b"MerkleDistributor".as_ref(), base.as_ref()],
                &merkle_distributor::id(),
            );
            let distributor_state: merkle_distributor::MerkleDistributor =
                program.account(distributor)?;

            let token_mint_state: Mint = program.account(distributor_state.mint)?;

            let snapshot = read_snapshot(path_to_snapshot, token_mint_state.decimals);
            let (index, _amount, _proof) = snapshot.get_user_claim_info(claimant)?;
            let (claim_status, _bump) = Pubkey::find_program_address(
                &[
                    b"ClaimStatus".as_ref(),
                    index.to_le_bytes().as_ref(),
                    distributor.as_ref(),
                ],
                &merkle_distributor::id(),
            );
            let claim_status_state: merkle_distributor::ClaimStatus =
                program.account(claim_status)?;
            println!("{:?}", claim_status_state);
        }
        CliCommand::Verify {
            base,
            clawback_start_ts,
            clawback_receiver_owner,
            admin,
            token_mint,
            path_to_snapshot,
            verify_amount,
        } => {
            verify(
                &program,
                base,
                token_mint,
                clawback_start_ts,
                clawback_receiver_owner,
                admin,
                path_to_snapshot,
                verify_amount,
            )
            .unwrap();
        }
    }

    Ok(())
}

fn verify<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    token_mint: Pubkey,
    clawback_start_ts: i64,
    clawback_receiver_owner: Pubkey,
    admin: Pubkey,
    path_to_snapshot: PathBuf,
    verify_amount: bool,
) -> Result<()> {
    let (locker, _bump) =
        Pubkey::find_program_address(&[b"Locker".as_ref(), base.as_ref()], &met_voter::id());

    let (distributor, _bump) = Pubkey::find_program_address(
        &[b"MerkleDistributor".as_ref(), base.as_ref()],
        &merkle_distributor::id(),
    );
    let distributor_state: merkle_distributor::MerkleDistributor = program.account(distributor)?;

    println!("verify token mint");
    assert_eq!(distributor_state.mint, token_mint);

    println!("verify locker");
    assert_eq!(distributor_state.locker, locker);

    println!("verify admin");
    assert_eq!(distributor_state.admin, admin);

    println!("verify clawback start");
    assert_eq!(distributor_state.clawback_start_ts, clawback_start_ts);

    let clawback_receiver = spl_associated_token_account::get_associated_token_address(
        &clawback_receiver_owner,
        &distributor_state.mint,
    );
    println!("verify clawback receiver");
    assert_eq!(distributor_state.clawback_receiver, clawback_receiver);

    let token_mint_state: Mint = program.account(token_mint)?;
    let snapshot = read_snapshot(path_to_snapshot, token_mint_state.decimals);
    let (max_num_nodes, max_total_claim, root) = build_tree(&snapshot);

    println!("verify root");
    assert_eq!(distributor_state.root, root);

    println!("verify max_num_nodes");
    assert_eq!(distributor_state.max_num_nodes, max_num_nodes);

    println!("verify max_total_claim");
    assert_eq!(distributor_state.max_total_claim, max_total_claim);

    if verify_amount {
        let token_vault_state: TokenAccount = program.account(distributor_state.token_vault)?;
        println!("verify amount");
        assert_eq!(token_vault_state.amount, distributor_state.max_total_claim);
    }

    Ok(())
}

fn new_distributor<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base_keypair: Keypair,
    token_mint: Pubkey,
    path_to_snapshot: PathBuf,
    clawback_owner: Pubkey,
    clawback_start_ts: u64,
) -> Result<()> {
    let token_mint_state: Mint = program.account(token_mint)?;
    let snapshot = read_snapshot(path_to_snapshot, token_mint_state.decimals);
    let (max_num_nodes, max_total_claim, root) = build_tree(&snapshot);

    let base = base_keypair.pubkey();

    let (locker, _bump) =
        Pubkey::find_program_address(&[b"Locker".as_ref(), base.as_ref()], &met_voter::id());

    let (distributor, _bump) = Pubkey::find_program_address(
        &[b"MerkleDistributor".as_ref(), base.as_ref()],
        &merkle_distributor::id(),
    );

    let token_vault =
        spl_associated_token_account::get_associated_token_address(&distributor, &token_mint);

    let clawback_receiver =
        spl_associated_token_account::get_associated_token_address(&clawback_owner, &token_mint);

    println!("distributor address {}", distributor);

    let builder = program
        .request()
        .accounts(merkle_distributor::accounts::NewDistributor {
            base,
            distributor,
            mint: token_mint,
            admin: program.payer(),
            clawback_receiver,
            token_vault,
            token_program: anchor_spl::token::ID,
            associated_token_program: spl_associated_token_account::ID,
            system_program: solana_program::system_program::ID,
        })
        .args(merkle_distributor::instruction::NewDistributor {
            locker,
            root,
            max_total_claim,
            max_num_nodes,
            clawback_start_ts: clawback_start_ts as i64,
        })
        .signer(&base_keypair);
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn fund<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base_keypair: Keypair,
    path_to_snapshot: PathBuf,
) -> Result<()> {
    let base = base_keypair.pubkey();
    let (distributor, _bump) = Pubkey::find_program_address(
        &[b"MerkleDistributor".as_ref(), base.as_ref()],
        &merkle_distributor::id(),
    );
    let distributor_state: merkle_distributor::MerkleDistributor = program.account(distributor)?;
    let token_mint = distributor_state.mint;
    let token_mint_state: Mint = program.account(distributor_state.mint)?;

    let snapshot = read_snapshot(path_to_snapshot, token_mint_state.decimals);
    let (max_num_nodes, max_total_claim, root) = build_tree(&snapshot);

    let destination_pubkey = get_associated_token_address(&distributor, &token_mint);

    println!(
        "distributor {}, distributor ata {} token mint {} total claim {} payer {}",
        distributor,
        destination_pubkey,
        token_mint,
        max_total_claim,
        program.payer()
    );

    let admin_ata =
        spl_associated_token_account::get_associated_token_address(&program.payer(), &token_mint);

    let instructions = vec![
        spl_token::instruction::mint_to(
            &spl_token::id(),
            &token_mint,
            &admin_ata,
            &program.payer(),
            &[],
            max_total_claim,
        )?,
        spl_token::instruction::transfer(
            &spl_token::id(),
            &admin_ata,
            &destination_pubkey,
            &program.payer(),
            &[],
            max_total_claim,
        )?,
    ];

    let builder = program.request();
    let builder = instructions
        .into_iter()
        .fold(builder, |bld, ix| bld.instruction(ix));

    // let result = simulate_transaction(&builder, program, &vec![&default_keypair()]).unwrap();
    // println!("{:?}", result);
    // return Ok(());

    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn claim<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    path_to_snapshot: PathBuf,
) -> Result<()> {
    let (distributor, _bump) = Pubkey::find_program_address(
        &[b"MerkleDistributor".as_ref(), base.as_ref()],
        &merkle_distributor::id(),
    );
    let distributor_state: merkle_distributor::MerkleDistributor = program.account(distributor)?;

    let token_mint_state: Mint = program.account(distributor_state.mint)?;

    let snapshot = read_snapshot(path_to_snapshot, token_mint_state.decimals);

    let claimant = program.payer();

    let (index, amount, proof) = snapshot.get_user_claim_info(claimant)?;

    let (claim_status, _bump) = Pubkey::find_program_address(
        &[
            b"ClaimStatus".as_ref(),
            index.to_le_bytes().as_ref(),
            distributor.as_ref(),
        ],
        &merkle_distributor::id(),
    );

    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            distributor_state.locker.as_ref(),
            claimant.as_ref(),
        ],
        &met_voter::id(),
    );
    // check whether escrow is created
    let mut instructions = vec![];
    let escrow_info = program.rpc().get_account(&escrow);
    if escrow_info.is_err() {
        instructions = vec![Instruction {
            accounts: met_voter::accounts::NewEscrow {
                locker: distributor_state.locker,
                escrow,
                escrow_owner: claimant,
                payer: program.payer(),
                system_program: solana_program::system_program::ID,
            }
            .to_account_metas(None),
            data: met_voter::instruction::NewEscrow {}.data(),
            program_id: met_voter::id(),
        }];
    }
    let escrow_tokens = get_associated_token_address(&escrow, &distributor_state.mint);
    if program.rpc().get_account_data(&escrow_tokens).is_err() {
        instructions.push(
            spl_associated_token_account::create_associated_token_account(
                &program.payer(),
                &escrow,
                &distributor_state.mint,
            ),
        );
    }
    instructions.push(Instruction {
        accounts: merkle_distributor::accounts::Claim {
            distributor,
            claim_status,
            token_vault: distributor_state.token_vault,
            claimant,
            system_program: solana_program::system_program::ID,
            token_program: anchor_spl::token::ID,
            voter_program: met_voter::ID,
            locker: distributor_state.locker,
            escrow,
            escrow_tokens,
        }
        .to_account_metas(None),
        data: merkle_distributor::instruction::Claim {
            index,
            amount,
            proof,
        }
        .data(),
        program_id: merkle_distributor::id(),
    });

    let builder = program.request();
    let builder = instructions
        .into_iter()
        .fold(builder, |bld, ix| bld.instruction(ix));

    // let result = simulate_transaction(&builder, program, &vec![&default_keypair()]).unwrap();
    // println!("{:?}", result);
    // return Ok(());

    let signature = builder.send()?;
    println!("{}", signature);
    Ok(())
}
