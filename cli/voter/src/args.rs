use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::Cluster;
use clap::*;

#[derive(Parser, Debug)]
pub struct ConfigOverride {
    /// Cluster override
    ///
    /// Values = Mainnet, Testnet, Devnet, Localnet.
    /// Default: Devnet
    #[clap(global = true, short, long, default_value_t = Cluster::Devnet)]
    pub cluster: Cluster,
    /// Wallet override
    ///
    /// Example: /path/to/wallet/keypair.json
    /// Default: ~/.config/solana/id.json
    #[clap(
        global = true,
        short,
        long,
        default_value_t = String::from(shellexpand::tilde("~/.config/solana/id.json"))
    )]
    pub wallet_path: String,

    /// Base keypair file required to initialize the vault
    ///
    /// /path/to/base/keypair.json
    // #[clap(global = true, short, long, default_value_t = String::from(""))]
    // pub base: String,

    #[clap(
    global = true,
    short,
    long,
    default_value_t = voter::id().to_string()
    )]
    pub program_id: String,
}

#[derive(Parser, Debug)]
pub enum CliCommand {
    NewLocker {
        #[clap(long)]
        token_mint: Pubkey,
        #[clap(long)]
        governor: Pubkey,
        #[clap(long)]
        expiration: i64,
        /// For example, veCRV is 10 because 1 CRV locked for 4 years = 10 veCRV.
        #[clap(long)]
        max_stake_vote_multiplier: u8,
        /// Minimum staking duration.
        #[clap(long)]
        min_stake_duration: u64,
        /// Maximum staking duration.
        #[clap(long)]
        max_stake_duration: u64,
        /// Minimum number of votes required to activate a proposal.
        #[clap(long)]
        proposal_activation_min_votes: u64,
    },
    NewEscrow {
        #[clap(long)]
        locker: Pubkey,
    },
    IncreaseLockedAmount {
        #[clap(long)]
        locker: Pubkey,
        #[clap(long)]
        amount: u64,
    },
    ExtendLockDuration {
        #[clap(long)]
        locker: Pubkey,
        #[clap(long)]
        duration: i64,
    },
    Withdraw {
        #[clap(long)]
        locker: Pubkey,
    },
    ActivateProposal {
        #[clap(long)]
        locker: Pubkey,
        #[clap(long)]
        proposal: Pubkey,
    },
    CastVote {
        #[clap(long)]
        locker: Pubkey,
        #[clap(long)]
        proposal: Pubkey,
        #[clap(long)]
        side: u8,
    },
    SetVoteDelegate {
        #[clap(long)]
        locker: Pubkey,
        #[clap(long)]
        new_delegate: Pubkey,
    },
    ViewLocker {
        #[clap(long)]
        locker: Pubkey,
    },
    ViewEscrow {
        #[clap(long)]
        locker: Pubkey,
        #[clap(long)]
        owner: Pubkey,
    },
}

#[derive(Parser, Debug)]
#[clap(version, about, author)]
pub struct Opts {
    #[clap(flatten)]
    pub config_override: ConfigOverride,
    #[clap(subcommand)]
    pub command: CliCommand,
}
