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
    pub base: Option<String>,

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

    CreateSetOwnersTx {
        #[clap(long)]
        smart_wallet: Pubkey,
        #[clap(long)]
        owners: Vec<Pubkey>,
    },

    CreateChangeThresholdTx {
        #[clap(long)]
        smart_wallet: Pubkey,
        #[clap(long)]
        threshold: u64,
    },

    ApproveTransaction {
        #[clap(long)]
        smart_wallet: Pubkey,
        #[clap(long)]
        transaction: Pubkey,
    },
    UnApproveTransaction {
        #[clap(long)]
        smart_wallet: Pubkey,
        #[clap(long)]
        transaction: Pubkey,
    },
    ExecuteTransaction {
        #[clap(long)]
        smart_wallet: Pubkey,
        #[clap(long)]
        transaction: Pubkey,
    },
    ViewSmartwallet {
        #[clap(long)]
        smart_wallet: Pubkey,
    },
    ViewTransaction {
        #[clap(long)]
        transaction: Pubkey,
    },
    // only for test
    CreateDummyTransaction {
        #[clap(long)]
        smart_wallet: Pubkey,
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
