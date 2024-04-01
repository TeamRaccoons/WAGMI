mod args;
use crate::args::*;
use anchor_client::solana_client::rpc_client::RpcClient;
use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::keypair::*;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::{Client, Program};
use anchor_lang::AccountDeserialize;
use anchor_lang::Discriminator;
use anchor_lang::InstructionData;
use anchor_lang::ToAccountMetas;
use anchor_spl::associated_token::get_associated_token_address;
use anyhow::Result;
use clap::*;
use solana_account_decoder::UiAccountEncoding;
use solana_program::instruction::Instruction;
use solana_rpc_client_api::config::RpcAccountInfoConfig;
use solana_rpc_client_api::config::RpcProgramAccountsConfig;
use solana_rpc_client_api::filter::Memcmp;
use solana_rpc_client_api::filter::RpcFilterType;
use std::ops::Deref;
use std::rc::Rc;
use std::str::FromStr;
use std::time::Duration;

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
        CliCommand::NewLocker {
            token_mint,
            max_stake_vote_multiplier,
            min_stake_duration,
            max_stake_duration,
            proposal_activation_min_votes,
        } => {
            new_locker(
                &program,
                base,
                token_mint,
                max_stake_vote_multiplier,
                min_stake_duration,
                max_stake_duration,
                proposal_activation_min_votes,
            )?;
        }
        CliCommand::NewEscrow { base } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            new_escrow(&program, locker)?;
        }
        CliCommand::IncreaseLockedAmount { base, amount } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            increase_locked_amount(&program, locker, amount)?;
        }
        CliCommand::ExtendLockDuration { base, duration } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            extend_locked_duration(&program, locker, duration)?;
        }
        CliCommand::ToggleMaxLock { base, is_max_lock } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            toggle_max_lock(&program, locker, is_max_lock)?;
        }
        CliCommand::Withdraw { base } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            withdraw(&program, locker)?;
        }
        CliCommand::CastVote {
            base,
            proposal,
            side,
        } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            cast_vote(&program, locker, proposal, side)?;
        }
        CliCommand::SetVoteDelegate { base, new_delegate } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            set_vote_delegate(&program, locker, new_delegate)?;
        }
        CliCommand::ViewLocker { base } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            let locker: locked_voter::Locker = program.account(locker)?;
            println!("{:?}", locker);
        }
        CliCommand::ViewEscrow { base, owner } => {
            let (locker, _bump) = Pubkey::find_program_address(
                &[b"Locker".as_ref(), base.as_ref()],
                &locked_voter::id(),
            );
            let (escrow, _bump) = Pubkey::find_program_address(
                &[b"Escrow".as_ref(), locker.as_ref(), owner.as_ref()],
                &locked_voter::id(),
            );
            let escrow_state: locked_voter::Escrow = program.account(escrow)?;
            println!("{:?}", escrow_state);
        }
        CliCommand::Verify {
            base,
            token_mint,
            max_stake_vote_multiplier,
            min_stake_duration,
            max_stake_duration,
            proposal_activation_min_votes,
        } => {
            verify(
                &program,
                base,
                token_mint,
                max_stake_vote_multiplier,
                min_stake_duration,
                max_stake_duration,
                proposal_activation_min_votes,
            )
            .unwrap();
        }
        CliCommand::GetStakers { locker } => get_stakers(&program, locker).unwrap(),
    }
    Ok(())
}

fn verify<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    token_mint: Pubkey,
    max_stake_vote_multiplier: u8,
    min_stake_duration: u64,
    max_stake_duration: u64,
    proposal_activation_min_votes: u64,
) -> Result<()> {
    let (locker, _bump) =
        Pubkey::find_program_address(&[b"Locker".as_ref(), base.as_ref()], &locked_voter::id());
    let locker_state: locked_voter::Locker = program.account(locker)?;

    println!("verify token mint");
    assert_eq!(locker_state.token_mint, token_mint);

    println!("verify governor");
    let (governor, _bump) =
        Pubkey::find_program_address(&[b"Governor".as_ref(), base.as_ref()], &govern::id());
    assert_eq!(locker_state.governor, governor);

    let params = locker_state.params;
    println!("verify max_stake_vote_multiplier");
    assert_eq!(params.max_stake_vote_multiplier, max_stake_vote_multiplier);
    println!("verify min_stake_duration");
    assert_eq!(params.min_stake_duration, min_stake_duration);

    println!("verify max_stake_duration");
    assert_eq!(params.max_stake_duration, max_stake_duration);

    println!("verify proposal_activation_min_votes");
    assert_eq!(
        params.proposal_activation_min_votes,
        proposal_activation_min_votes
    );
    Ok(())
}

fn new_locker<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base_keypair: Keypair,
    token_mint: Pubkey,
    max_stake_vote_multiplier: u8,
    min_stake_duration: u64,
    max_stake_duration: u64,
    proposal_activation_min_votes: u64,
) -> Result<()> {
    let base = base_keypair.pubkey();
    let (governor, _bump) =
        Pubkey::find_program_address(&[b"Governor".as_ref(), base.as_ref()], &govern::id());

    let (locker, _bump) =
        Pubkey::find_program_address(&[b"Locker".as_ref(), base.as_ref()], &locked_voter::id());
    println!("locker address {}", locker);

    let builder = program
        .request()
        .accounts(locked_voter::accounts::NewLocker {
            base,
            locker,
            token_mint,
            governor,
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(locked_voter::instruction::NewLocker {
            params: locked_voter::LockerParams {
                max_stake_vote_multiplier,
                min_stake_duration,
                max_stake_duration,
                proposal_activation_min_votes,
            },
        })
        .signer(&base_keypair);
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn new_escrow<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    locker: Pubkey,
) -> Result<()> {
    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            locker.as_ref(),
            program.payer().as_ref(),
        ],
        &locked_voter::id(),
    );

    let builder = program
        .request()
        .accounts(locked_voter::accounts::NewEscrow {
            locker,
            escrow,
            escrow_owner: program.payer(),
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(locked_voter::instruction::NewEscrow {});
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn increase_locked_amount<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    locker: Pubkey,
    amount: u64,
) -> Result<()> {
    let locker_state: locked_voter::Locker = program.account(locker)?;
    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            locker.as_ref(),
            program.payer().as_ref(),
        ],
        &locked_voter::id(),
    );
    let escrow_tokens = get_associated_token_address(&escrow, &locker_state.token_mint);

    let source_tokens = get_associated_token_address(&program.payer(), &locker_state.token_mint);

    let builder = program
        .request()
        .accounts(locked_voter::accounts::IncreaseLockedAmount {
            locker,
            escrow,
            escrow_tokens,
            source_tokens,
            payer: program.payer(),
            token_program: anchor_spl::token::ID,
        })
        .args(locked_voter::instruction::IncreaseLockedAmount { amount });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn extend_locked_duration<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    locker: Pubkey,
    duration: i64,
) -> Result<()> {
    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            locker.as_ref(),
            program.payer().as_ref(),
        ],
        &locked_voter::id(),
    );

    let builder = program
        .request()
        .accounts(locked_voter::accounts::ExtendLockDuration {
            locker,
            escrow,
            escrow_owner: program.payer(),
        })
        .args(locked_voter::instruction::ExtendLockDuration { duration });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn toggle_max_lock<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    locker: Pubkey,
    is_max_lock: i64,
) -> Result<()> {
    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            locker.as_ref(),
            program.payer().as_ref(),
        ],
        &locked_voter::id(),
    );

    let is_max_lock = if is_max_lock == 0 { false } else { true };
    let builder = program
        .request()
        .accounts(locked_voter::accounts::ToggleMaxLock {
            locker,
            escrow,
            escrow_owner: program.payer(),
        })
        .args(locked_voter::instruction::ToggleMaxLock { is_max_lock });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn withdraw<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    locker: Pubkey,
) -> Result<()> {
    let locker_state: locked_voter::Locker = program.account(locker)?;
    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            locker.as_ref(),
            program.payer().as_ref(),
        ],
        &locked_voter::id(),
    );
    let escrow_tokens = get_associated_token_address(&escrow, &locker_state.token_mint);

    let destination_tokens =
        get_associated_token_address(&program.payer(), &locker_state.token_mint);

    let builder = program
        .request()
        .accounts(locked_voter::accounts::Withdraw {
            locker,
            escrow,
            escrow_tokens,
            destination_tokens,
            escrow_owner: program.payer(),
            payer: program.payer(),
            token_program: anchor_spl::token::ID,
        })
        .args(locked_voter::instruction::Withdraw {});
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn cast_vote<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    locker: Pubkey,
    proposal: Pubkey,
    side: u8,
) -> Result<()> {
    let locker_state: locked_voter::Locker = program.account(locker)?;
    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            locker.as_ref(),
            program.payer().as_ref(),
        ],
        &locked_voter::id(),
    );

    let (vote, _bump) = Pubkey::find_program_address(
        &[
            b"Vote".as_ref(),
            proposal.as_ref(),
            program.payer().as_ref(),
        ],
        &govern::id(),
    );
    let mut instructions = vec![];
    if program.rpc().get_account_data(&vote).is_err() {
        instructions.push(Instruction {
            program_id: govern::id(),
            accounts: govern::accounts::NewVote {
                proposal,
                vote,
                payer: program.payer(),
                system_program: solana_program::system_program::ID,
            }
            .to_account_metas(None),
            data: govern::instruction::NewVote {
                voter: program.payer(),
            }
            .data(),
        });
    }
    instructions.push(Instruction {
        program_id: locked_voter::id(),
        accounts: locked_voter::accounts::CastVote {
            locker,
            escrow,
            vote,
            proposal,
            vote_delegate: program.payer(),
            governor: locker_state.governor,
            govern_program: govern::ID,
        }
        .to_account_metas(None),
        data: locked_voter::instruction::CastVote { side }.data(),
    });

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

fn set_vote_delegate<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    locker: Pubkey,
    new_delegate: Pubkey,
) -> Result<()> {
    let (escrow, _bump) = Pubkey::find_program_address(
        &[
            b"Escrow".as_ref(),
            locker.as_ref(),
            program.payer().as_ref(),
        ],
        &locked_voter::id(),
    );

    let builder = program
        .request()
        .accounts(locked_voter::accounts::SetVoteDelegate {
            escrow,
            escrow_owner: program.payer(),
        })
        .args(locked_voter::instruction::SetVoteDelegate { new_delegate });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn get_stakers<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    locker: Pubkey,
) -> Result<()> {
    // Fat call, bump timeout
    let rpc_client = RpcClient::new_with_timeout(program.rpc().url(), Duration::from_secs(120));
    let program_accounts = rpc_client.get_program_accounts_with_config(
        &locked_voter::ID,
        RpcProgramAccountsConfig {
            filters: Some(vec![
                RpcFilterType::Memcmp(Memcmp::new_base58_encoded(
                    0,
                    &locked_voter::Escrow::DISCRIMINATOR,
                )),
                RpcFilterType::Memcmp(Memcmp::new_base58_encoded(8, &locker.to_bytes())),
            ]),
            account_config: RpcAccountInfoConfig {
                encoding: Some(UiAccountEncoding::Base64Zstd),
                ..Default::default()
            },
            ..Default::default()
        },
    )?;
    println!("Found {} escrows", program_accounts.len());

    println!("escrow,owner,amount");
    for (key, escrow_account) in program_accounts {
        let escrow =
            locked_voter::Escrow::try_deserialize(&mut escrow_account.data.as_slice()).unwrap();
        println!("{key},{},{}", escrow.owner, escrow.amount);
    }

    Ok(())
}
