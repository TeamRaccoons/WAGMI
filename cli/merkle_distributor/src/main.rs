mod args;
mod helpers;
mod utils;
use crate::args::*;
use crate::helpers::*;
use crate::utils::*;
use anyhow::Result;

use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::keypair::*;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::{Client, Program};
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;
use anchor_spl::associated_token::get_associated_token_address;
use clap::*;
use solana_program::instruction::Instruction;
use std::rc::Rc;
use std::str::FromStr;

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
        CliCommand::NewDistributor {
            token_mint,
            path_to_snapshot,
        } => {
            new_distributor(&program, base, token_mint, path_to_snapshot)?;
        }
        CliCommand::Fund { path_to_snapshot } => {
            fund(&program, base, path_to_snapshot)?;
        }
        CliCommand::Claim {
            claimant,
            path_to_snapshot,
        } => {
            claim(&program, base, claimant, path_to_snapshot)?;
        }
        CliCommand::ViewDistributor { distributor } => {
            let distributor_state: merkle_distributor::MerkleDistributor =
                program.account(distributor)?;
            println!("{:?}", distributor_state);
        }
        CliCommand::ViewClaimStatus {
            distributor,
            claimant,
            path_to_snapshot,
        } => {
            let snapshot = read_snapshot(path_to_snapshot);
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
    }

    Ok(())
}

fn new_distributor(
    program: &Program,
    base_keypair: Keypair,
    token_mint: Pubkey,
    path_to_snapshot: String,
) -> Result<()> {
    let snapshot = read_snapshot(path_to_snapshot);
    let (max_num_nodes, max_total_claim, root) = build_tree(&snapshot);

    let base = base_keypair.pubkey();

    let (locker, _bump) =
        Pubkey::find_program_address(&[b"Locker".as_ref(), base.as_ref()], &voter::id());

    let (distributor, _bump) = Pubkey::find_program_address(
        &[b"MerkleDistributor".as_ref(), base.as_ref()],
        &merkle_distributor::id(),
    );
    println!("distributor address {}", distributor);

    let builder = program
        .request()
        .accounts(merkle_distributor::accounts::NewDistributor {
            base,
            distributor,
            mint: token_mint,
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(merkle_distributor::instruction::NewDistributor {
            locker,
            root,
            max_total_claim,
            max_num_nodes,
        })
        .signer(&base_keypair);
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn fund(program: &Program, base_keypair: Keypair, path_to_snapshot: String) -> Result<()> {
    let snapshot = read_snapshot(path_to_snapshot);
    let (max_num_nodes, max_total_claim, root) = build_tree(&snapshot);

    let base = base_keypair.pubkey();

    let (distributor, _bump) = Pubkey::find_program_address(
        &[b"MerkleDistributor".as_ref(), base.as_ref()],
        &merkle_distributor::id(),
    );

    let distributor_state: merkle_distributor::MerkleDistributor = program.account(distributor)?;
    let token_mint = distributor_state.mint;
    println!("{} {}", token_mint, max_total_claim);
    // let source_pubkey = get_associated_token_address(&program.payer(), &token_mint);
    let destination_pubkey = get_associated_token_address(&distributor, &token_mint);

    let instructions = vec![
        spl_token::instruction::mint_to(
            &spl_token::id(),
            &token_mint,
            &destination_pubkey,
            &program.payer(),
            &[],
            max_total_claim,
        )?,
        // spl_token::instruction::transfer(
        //     &spl_token::id(),
        //     &source_pubkey,
        //     &destination_pubkey,
        //     &program.payer(),
        //     &vec![],
        //     max_total_claim,
        // )?,
    ];

    let builder = program.request();
    let builder = instructions
        .into_iter()
        .fold(builder, |bld, ix| bld.instruction(ix));

    let result = simulate_transaction(&builder, program, &vec![&default_keypair()]).unwrap();
    println!("{:?}", result);
    return Ok(());

    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn claim(
    program: &Program,
    base_keypair: Keypair,
    claimant: Pubkey,
    path_to_snapshot: String,
) -> Result<()> {
    let snapshot = read_snapshot(path_to_snapshot);

    let (index, amount, proof) = snapshot.get_user_claim_info(claimant)?;
    let base = base_keypair.pubkey();

    let (distributor, _bump) = Pubkey::find_program_address(
        &[b"MerkleDistributor".as_ref(), base.as_ref()],
        &merkle_distributor::id(),
    );
    let distributor_state: merkle_distributor::MerkleDistributor = program.account(distributor)?;

    let (claim_status, _bump) = Pubkey::find_program_address(
        &[
            b"ClaimStatus".as_ref(),
            index.to_le_bytes().as_ref(),
            distributor.as_ref(),
        ],
        &merkle_distributor::id(),
    );

    let from = get_associated_token_address(&distributor, &distributor_state.mint);

    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            distributor_state.locker.as_ref(),
            claimant.as_ref(),
        ],
        &voter::id(),
    );
    // check whether escrow is created
    let mut instructions = vec![];
    let escrow_info = program.rpc().get_account(&escrow);
    if escrow_info.is_err() {
        instructions = vec![Instruction {
            accounts: voter::accounts::NewEscrow {
                locker: distributor_state.locker,
                escrow,
                escrow_owner: claimant,
                payer: program.payer(),
                system_program: solana_program::system_program::ID,
            }
            .to_account_metas(None),
            data: voter::instruction::NewEscrow {}.data(),
            program_id: voter::id(),
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
            from,
            claimant,
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
            token_program: anchor_spl::token::ID,
            voter_program: voter::ID,
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
