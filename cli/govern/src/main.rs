mod args;

use crate::args::*;
use anyhow::Result;

use anchor_client::solana_sdk::commitment_config::CommitmentConfig;
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signer::keypair::*;
use anchor_client::solana_sdk::signer::Signer;
use anchor_client::{Client, Program};
use clap::*;
use std::ops::Deref;
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

    let base = match opts.config_override.base_path {
        Some(value) => {
            read_keypair_file(&*shellexpand::tilde(&value)).expect("Requires a keypair file")
        }
        None => Keypair::new(),
    };

    let program = client.program(program_id)?;
    match opts.command {
        CliCommand::CreateGovernor {
            voting_delay,
            voting_period,
            quorum_votes,
            timelock_delay_seconds,
        } => {
            create_governor(
                &program,
                base,
                voting_delay,
                voting_period,
                quorum_votes,
                timelock_delay_seconds,
            )?;
        }
        CliCommand::CreateDummyProposal { base } => {
            create_dummy_proposal(&program, base)?;
        }
        CliCommand::CancelProposal { proposal } => {
            cancel_proposal(&program, proposal)?;
        }
        CliCommand::QueueProposal { proposal } => {
            queue_proposal(&program, proposal)?;
        }
        CliCommand::NewVote { proposal } => {
            new_vote(&program, proposal)?;
        }
        CliCommand::CreateProposalMeta {
            proposal,
            title,
            description_link,
        } => {
            create_proposal_meta(&program, proposal, title, description_link)?;
        }
        CliCommand::ViewGovernor { base } => {
            view_governor(&program, base)?;
        }
        CliCommand::ViewProposal { proposal } => {
            view_proposal(&program, proposal)?;
        }
        CliCommand::ViewProposalMeta { proposal } => {
            view_proposal_meta(&program, proposal)?;
        }
        CliCommand::ViewVote { proposal, voter } => {
            let (vote, _bump) = Pubkey::find_program_address(
                &[b"Vote".as_ref(), proposal.as_ref(), voter.as_ref()],
                &govern::id(),
            );
            let vote_state: govern::Vote = program.account(vote)?;
            println!("{:?}", vote_state);
        }
        CliCommand::Verify {
            base,
            voting_delay,
            voting_period,
            quorum_votes,
            timelock_delay_seconds,
        } => {
            verify(
                &program,
                base,
                voting_delay,
                voting_period,
                quorum_votes,
                timelock_delay_seconds,
            )
            .unwrap();
        }
    }

    Ok(())
}

fn verify<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
    voting_delay: u64,
    voting_period: u64,
    quorum_votes: u64,
    timelock_delay_seconds: i64,
) -> Result<()> {
    let (governor, _bump) =
        Pubkey::find_program_address(&[b"Governor".as_ref(), base.as_ref()], &govern::id());
    let governor_state: govern::Governor = program.account(governor)?;

    let params = governor_state.params;
    println!("verify voting delay");
    assert_eq!(params.voting_delay, voting_delay);
    println!("verify voting period");
    assert_eq!(params.voting_period, voting_period);
    println!("verify quorum votes");
    assert_eq!(params.quorum_votes, quorum_votes);
    println!("verify timelock_delay_seconds");
    assert_eq!(params.timelock_delay_seconds, timelock_delay_seconds);

    let (smart_wallet, _bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );
    println!("verify smart wallet");
    assert_eq!(governor_state.smart_wallet, smart_wallet);
    println!("verify locker");
    let (locker, _bump) =
        Pubkey::find_program_address(&[b"Locker".as_ref(), base.as_ref()], &met_voter::id());
    assert_eq!(governor_state.locker, locker);
    Ok(())
}

fn create_governor<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base_keypair: Keypair,
    voting_delay: u64,
    voting_period: u64,
    quorum_votes: u64,
    timelock_delay_seconds: i64,
) -> Result<()> {
    let base = base_keypair.pubkey();

    let (smart_wallet, bump) = Pubkey::find_program_address(
        &[b"SmartWallet".as_ref(), base.as_ref()],
        &smart_wallet::id(),
    );

    // create locker pda
    let (locker, _bump) =
        Pubkey::find_program_address(&[b"Locker".as_ref(), base.as_ref()], &met_voter::id());

    let (governor, bump) =
        Pubkey::find_program_address(&[b"Governor".as_ref(), base.as_ref()], &govern::id());
    println!("governor address {}", governor);

    let builder = program
        .request()
        .accounts(govern::accounts::CreateGovernor {
            base,
            governor,
            smart_wallet,
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(govern::instruction::CreateGovernor {
            locker,
            params: govern::GovernanceParameters {
                voting_delay,
                voting_period,
                quorum_votes,
                timelock_delay_seconds,
            },
        })
        .signer(&base_keypair);
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn create_dummy_proposal<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
) -> Result<()> {
    let (governor, bump) =
        Pubkey::find_program_address(&[b"Governor".as_ref(), base.as_ref()], &govern::id());

    let governor_state: govern::Governor = program.account(governor)?;

    let (proposal, bump) = Pubkey::find_program_address(
        &[
            b"Proposal".as_ref(),
            governor.as_ref(),
            governor_state.proposal_count.to_le_bytes().as_ref(),
        ],
        &govern::id(),
    );
    println!("proposal address {}", proposal);

    let builder = program
        .request()
        .accounts(govern::accounts::CreateProposal {
            governor,
            proposal,
            proposer: program.payer(),
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(govern::instruction::CreateProposal {
            _bump: 0,
            instructions: vec![],
        });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn cancel_proposal<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    proposal: Pubkey,
) -> Result<()> {
    let proposal_state: govern::Proposal = program.account(proposal)?;

    let builder = program
        .request()
        .accounts(govern::accounts::CancelProposal {
            governor: proposal_state.governor,
            proposal,
            proposer: program.payer(),
        })
        .args(govern::instruction::CancelProposal {});
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn queue_proposal<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    proposal: Pubkey,
) -> Result<()> {
    let proposal_state: govern::Proposal = program.account(proposal)?;
    let governor_state: govern::Governor = program.account(proposal_state.governor)?;
    let smart_wallet_state: smart_wallet::SmartWallet =
        program.account(governor_state.smart_wallet)?;
    let (transaction, _bump) = Pubkey::find_program_address(
        &[
            b"Transaction".as_ref(),
            governor_state.smart_wallet.as_ref(),
            smart_wallet_state.num_transactions.to_le_bytes().as_ref(),
        ],
        &smart_wallet::id(),
    );
    let builder = program
        .request()
        .accounts(govern::accounts::QueueProposal {
            governor: proposal_state.governor,
            proposal,
            transaction,
            smart_wallet: governor_state.smart_wallet,
            smart_wallet_program: smart_wallet::id(),
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(govern::instruction::QueueProposal {});
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn new_vote<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    proposal: Pubkey,
) -> Result<()> {
    let (vote, _bump) = Pubkey::find_program_address(
        &[
            b"Vote".as_ref(),
            proposal.as_ref(),
            program.payer().as_ref(),
        ],
        &govern::id(),
    );
    let builder = program
        .request()
        .accounts(govern::accounts::NewVote {
            proposal,
            vote,
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(govern::instruction::NewVote {
            voter: program.payer(),
        });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn create_proposal_meta<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    proposal: Pubkey,
    title: String,
    description_link: String,
) -> Result<()> {
    let (proposal_meta, _bump) = Pubkey::find_program_address(
        &[b"ProposalMeta".as_ref(), proposal.as_ref()],
        &govern::id(),
    );
    let builder = program
        .request()
        .accounts(govern::accounts::CreateProposalMeta {
            proposal,
            proposal_meta,
            proposer: program.payer(),
            payer: program.payer(),
            system_program: solana_program::system_program::ID,
        })
        .args(govern::instruction::CreateProposalMeta {
            _bump: 0,
            title,
            description_link,
        });
    let signature = builder.send()?;
    println!("Signature {:?}", signature);
    Ok(())
}

fn view_governor<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    base: Pubkey,
) -> Result<()> {
    let (governor, bump) =
        Pubkey::find_program_address(&[b"Governor".as_ref(), base.as_ref()], &govern::id());
    println!("governor address {}", governor);

    let state: govern::Governor = program.account(governor)?;
    println!("{:?}", state);
    Ok(())
}
fn view_proposal<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    proposal: Pubkey,
) -> Result<()> {
    let state: govern::Proposal = program.account(proposal)?;
    println!("{:?}", state);
    Ok(())
}
fn view_proposal_meta<C: Deref<Target = impl Signer> + Clone>(
    program: &Program<C>,
    proposal: Pubkey,
) -> Result<()> {
    let (proposal_meta, _bump) = Pubkey::find_program_address(
        &[b"ProposalMeta".as_ref(), proposal.as_ref()],
        &govern::id(),
    );
    let state: govern::ProposalMeta = program.account(proposal_meta)?;
    println!("{:?}", state);
    Ok(())
}
