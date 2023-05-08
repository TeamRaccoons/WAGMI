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
    default_value_t = govern::id().to_string()
    )]
    pub program_id: String,
}

#[derive(Parser, Debug)]
pub enum CliCommand {
    CreateGovernor {
        #[clap(long)]
        smart_wallet: Pubkey, // smart_wallet
        #[clap(long)]
        locker: Pubkey, // locker
        /// The delay before voting on a proposal may take place, once proposed, in seconds
        #[clap(long)]
        voting_delay: u64,
        /// The duration of voting on a proposal, in seconds
        #[clap(long)]
        voting_period: u64,
        /// The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed
        #[clap(long)]
        quorum_votes: u64,
        /// The timelock delay of the DAO's created proposals.
        #[clap(long)]
        timelock_delay_seconds: i64,
    },
    CreateDummyProposal {
        #[clap(long)]
        governor: Pubkey,
    },
    CancelProposal {
        #[clap(long)]
        proposal: Pubkey,
    },
    QueueProposal {
        #[clap(long)]
        proposal: Pubkey,
    },
    NewVote {
        #[clap(long)]
        proposal: Pubkey,
    },
    CreateProposalMeta {
        #[clap(long)]
        proposal: Pubkey,
        #[clap(long)]
        title: String,
        #[clap(long)]
        description_link: String,
    },
    ViewGovernor {
        #[clap(long)]
        governor: Pubkey,
    },
    ViewProposal {
        #[clap(long)]
        proposal: Pubkey,
    },
    ViewProposalMeta {
        #[clap(long)]
        proposal: Pubkey,
    },
    ViewVote {
        #[clap(long)]
        proposal: Pubkey,
        #[clap(long)]
        voter: Pubkey,
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
