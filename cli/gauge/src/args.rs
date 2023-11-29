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
    default_value_t = gauge::id().to_string()
    )]
    pub program_id: String,
}

#[derive(Parser, Debug)]
pub enum CliCommand {
    CreateGaugeFactory {
        #[clap(long)]
        epoch_duration_seconds: u32,
        #[clap(long)]
        first_epoch_starts_at: u64,
    },
    CreateGauge {
        #[clap(long)]
        quarry_base: String,
    },
    CreateGaugeVoter {},
    CreateGaugeVote {
        #[clap(long)]
        token_mint: Pubkey,
    },
    PumpGaugeEpoch {
        #[clap(long)]
        token_mint: Pubkey,
    },
    PrepareVote {},
    ResetVote {},
    SetVote {
        #[clap(long)]
        token_mint: Pubkey,
        #[clap(long)]
        weight: u32,
    },
    CommitVote {
        #[clap(long)]
        token_mint: Pubkey,
    },
    RevertVote {
        #[clap(long)]
        token_mint: Pubkey,
    },
    EnableGauge {
        #[clap(long)]
        quarry_base: String,
    },
    DisableGauge {
        #[clap(long)]
        token_mint: Pubkey,
    },
    TriggerNextEpoch {},
    SyncGauge {
        #[clap(long)]
        token_mint: Pubkey,
    },
    SyncDisabledGauge {
        #[clap(long)]
        token_mint: Pubkey,
    },
    // CloseEpochGaugeVote {
    //     #[clap(long)]
    //     token_mint: Pubkey,
    //     #[clap(long)]
    //     voting_epoch: u32,
    // },
    CreateBribe {
        #[clap(long)]
        token_mint: Pubkey,
        #[clap(long)]
        quarry_base: Pubkey,
        #[clap(long)]
        reward_each_epoch: u64,
        #[clap(long)]
        reward_end: u32,
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
