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
    #[clap(global = true, short, long)]
    pub base_path: Option<String>,

    #[clap(
    global = true,
    short,
    long,
    default_value_t = smart_wallet::id().to_string()
    )]
    pub program_id: String,
}

#[derive(Parser, Debug)]
pub enum CliCommand {
    CreateSmartWallet {
        #[clap(long)]
        max_owners: u8,
        #[clap(long)]
        threshold: u64,
        #[clap(long)]
        minimum_delay: i64,
        #[clap(long)]
        owners: Vec<Pubkey>,
    },

    Verify {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        max_owners: u8,
        #[clap(long)]
        threshold: u64,
        #[clap(long)]
        minimum_delay: i64,
        #[clap(long)]
        owners: Vec<Pubkey>,
    },

    CreateSetOwnersTx {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        owners: Vec<Pubkey>,
    },
    CreateAddNewOwnerTx {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        owner: Pubkey,
    },
    CreateRemoveOwnerTx {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        owner: Pubkey,
    },

    CreateChangeThresholdTx {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        threshold: u64,
    },
    CreateActivateProposalTx {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        proposal: Pubkey,
    },
    CreateSetGovernanceParamsTx {
        #[clap(long)]
        base: Pubkey,
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
    ApproveTransaction {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        transaction: Pubkey,
    },
    UnApproveTransaction {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        transaction: Pubkey,
    },
    ExecuteTransaction {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        transaction: Pubkey,
    },
    RemoveTransaction {
        #[clap(long)]
        base: Pubkey,
        #[clap(long)]
        transaction: Pubkey,
    },
    ViewSmartwallet {
        #[clap(long)]
        base: Pubkey,
    },
    ViewTransaction {
        #[clap(long)]
        transaction: Pubkey,
    },
    // only for test
    CreateDummyTransaction {
        #[clap(long)]
        base: Pubkey,
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
