export type Quarry = {
  "version": "0.1.0",
  "name": "quarry",
  "docs": [
    "Program for [quarry]."
  ],
  "constants": [
    {
      "name": "MIN_REWARD_DURATION",
      "type": "u64",
      "value": "1"
    },
    {
      "name": "MAX_REWARD_DURATION",
      "type": "u64",
      "value": "31536000"
    }
  ],
  "instructions": [
    {
      "name": "newRewarder",
      "docs": [
        "Creates a new [Rewarder]."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base. Arbitrary key."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Rewarder] of mines."
          ]
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Initial admin of the rewarder."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the [Rewarder] initialization."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program."
          ]
        },
        {
          "name": "mintWrapper",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Mint wrapper."
          ]
        },
        {
          "name": "rewardsTokenMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rewards token mint."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "setMintAuthority",
      "docs": [
        "Set operator [Rewarder]."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Admin of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": [
        {
          "name": "mintAuthority",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setPauseAuthority",
      "docs": [
        "Sets the pause authority."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        },
        {
          "name": "newPauseAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The pause authority."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "pause",
      "docs": [
        "Pauses the [Rewarder]."
      ],
      "accounts": [
        {
          "name": "pauseAuthority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Pause authority of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "unpause",
      "docs": [
        "Unpauses the [Rewarder]."
      ],
      "accounts": [
        {
          "name": "pauseAuthority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Pause authority of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "transferAdmin",
      "docs": [
        "Transfers the [Rewarder] admin to a different account."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Admin of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "acceptAdmin",
      "docs": [
        "Accepts the admin to become the new rewarder."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Admin of the next rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "setAnnualRewards",
      "docs": [
        "Sets the amount of reward tokens distributed to all [Quarry]s per day."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        }
      ],
      "args": [
        {
          "name": "newRate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createQuarry",
      "docs": [
        "Creates a new [Quarry].",
        "This may only be called by the [Rewarder]::admin."
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry]."
          ]
        },
        {
          "name": "ammPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of [Quarry] creation."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program."
          ]
        }
      ],
      "args": [
        {
          "name": "ammType",
          "type": "u32"
        }
      ]
    },
    {
      "name": "setRewardsShare",
      "docs": [
        "Sets the rewards share of a quarry."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry] updated."
          ]
        }
      ],
      "args": [
        {
          "name": "newShare",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setFamine",
      "docs": [
        "Sets the famine, which stops rewards."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "[Rewarder]."
              ]
            }
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry] updated."
          ]
        }
      ],
      "args": [
        {
          "name": "famineTs",
          "type": "i64"
        }
      ]
    },
    {
      "name": "updateQuarryRewards",
      "docs": [
        "Synchronizes quarry rewards with the rewarder.",
        "Anyone can call this."
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry]."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Rewarder]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateQuarryLbClmmRewards",
      "docs": [
        "Synchronizes quarry rewards with the rewarder.",
        "Anyone can call this.",
        "For LbClmm"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry]."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Rewarder]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeNewReward",
      "docs": [
        "Init new reward, only admin can do this",
        "Init new rewards, provided by partners, similar to bribe"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of [Quarry] creation."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "rewardDuration",
          "type": "u64"
        },
        {
          "name": "funder",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateRewardFunder",
      "docs": [
        "Update reward funder, only admin can change"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        }
      ],
      "args": [
        {
          "name": "rewardIndex",
          "type": "u64"
        },
        {
          "name": "newFunder",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateRewardDuration",
      "docs": [
        "Update reward duration, only admin can change"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        }
      ],
      "args": [
        {
          "name": "rewardIndex",
          "type": "u64"
        },
        {
          "name": "newDuration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fundReward",
      "docs": [
        "Fund reward, only admin or funder can fund"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "funderTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "funder",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rewardIndex",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createMiner",
      "docs": [
        "--------------------------------",
        "Miner functions",
        "--------------------------------",
        "Creates a [Miner] for the given authority.",
        "",
        "Anyone can call this; this is an associated account."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the [Miner]."
          ]
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Miner] to be created."
          ]
        },
        {
          "name": "minerVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[TokenAccount] holding the token [Mint]."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry] to create a [Miner] for."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Rewarder]."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of [Miner] creation."
          ]
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Mint] of the token to create a [Quarry] for."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "SPL Token program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "claimRewards",
      "docs": [
        "Claims rewards for the [Miner]."
      ],
      "accounts": [
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Mint wrapper."
          ]
        },
        {
          "name": "mintWrapperProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Mint wrapper program."
          ]
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[minter::Minter] information."
          ]
        },
        {
          "name": "rewardsTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Mint of the rewards token."
          ]
        },
        {
          "name": "rewardsTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Account to claim rewards for."
          ]
        },
        {
          "name": "claim",
          "accounts": [
            {
              "name": "authority",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Miner authority (i.e. the user)."
              ]
            },
            {
              "name": "miner",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Miner."
              ]
            },
            {
              "name": "quarry",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Quarry to claim from."
              ]
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "Token program"
              ]
            },
            {
              "name": "rewarder",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "Rewarder"
              ]
            }
          ]
        }
      ],
      "args": []
    },
    {
      "name": "claimPartnerRewards",
      "docs": [
        "Claims partner rewards for the [Miner]."
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Quarry to claim from."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program"
          ]
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Miner."
          ]
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardsTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Account to claim rewards for."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rewarder"
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Miner authority (i.e. the user)."
          ]
        }
      ],
      "args": [
        {
          "name": "rewardIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "stakeTokens",
      "docs": [
        "Stakes tokens into the [Miner]."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Miner authority (i.e. the user)."
          ]
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Miner."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Quarry to claim from."
          ]
        },
        {
          "name": "minerVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Vault of the miner."
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User's staked token account"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program"
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rewarder"
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstakeTokens",
      "docs": [
        "Unstake tokens from the [Miner]."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Miner authority (i.e. the user)."
          ]
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Miner."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Quarry to claim from."
          ]
        },
        {
          "name": "minerVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Vault of the miner."
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User's staked token account"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program"
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rewarder"
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "rewarder",
      "docs": [
        "Controls token rewards distribution to all [Quarry]s.",
        "The [Rewarder] is also the [minter::Minter] registered to the [minter::MintWrapper]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Random pubkey used for generating the program address."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for program address."
            ],
            "type": "u8"
          },
          {
            "name": "admin",
            "docs": [
              "Admin who controls the rewarder"
            ],
            "type": "publicKey"
          },
          {
            "name": "pendingAdmin",
            "docs": [
              "Pending admin which must accept the admin"
            ],
            "type": "publicKey"
          },
          {
            "name": "numQuarries",
            "docs": [
              "Number of [Quarry]s the [Rewarder] manages.",
              "If more than this many [Quarry]s are desired, one can create",
              "a second rewarder."
            ],
            "type": "u16"
          },
          {
            "name": "annualRewardsRate",
            "docs": [
              "Amount of reward tokens distributed per day"
            ],
            "type": "u64"
          },
          {
            "name": "totalRewardsShares",
            "docs": [
              "Total amount of rewards shares allocated to [Quarry]s"
            ],
            "type": "u64"
          },
          {
            "name": "mintWrapper",
            "docs": [
              "Mint wrapper."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardsTokenMint",
            "docs": [
              "Mint of the rewards token for this [Rewarder]."
            ],
            "type": "publicKey"
          },
          {
            "name": "pauseAuthority",
            "docs": [
              "Authority allowed to pause a [Rewarder]."
            ],
            "type": "publicKey"
          },
          {
            "name": "isPaused",
            "docs": [
              "If true, all instructions on the [Rewarder] are paused other than [quarry::unpause]."
            ],
            "type": "bool"
          },
          {
            "name": "mintAuthority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "quarry",
      "docs": [
        "A pool which distributes tokens to its [Miner]s."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewarder",
            "docs": [
              "Rewarder which manages this quarry"
            ],
            "type": "publicKey"
          },
          {
            "name": "ammPool",
            "docs": [
              "Amm pool this quarry is designated to"
            ],
            "type": "publicKey"
          },
          {
            "name": "ammType",
            "docs": [
              "Amm type, can be Meteora or LbClmm"
            ],
            "type": "u32"
          },
          {
            "name": "tokenMintKey",
            "docs": [
              "LP token this quarry is designated to"
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump."
            ],
            "type": "u8"
          },
          {
            "name": "index",
            "docs": [
              "Index of the [Quarry]."
            ],
            "type": "u16"
          },
          {
            "name": "famineTs",
            "docs": [
              "Decimals on the token [Mint].",
              "Timestamp when quarry rewards cease"
            ],
            "type": "i64"
          },
          {
            "name": "lastUpdateTs",
            "docs": [
              "Timestamp of last checkpoint"
            ],
            "type": "i64"
          },
          {
            "name": "rewardsPerTokenStored",
            "docs": [
              "Rewards per token stored in the quarry"
            ],
            "type": "u128"
          },
          {
            "name": "annualRewardsRate",
            "docs": [
              "Amount of rewards distributed to the quarry per year."
            ],
            "type": "u64"
          },
          {
            "name": "rewardsShare",
            "docs": [
              "Rewards shared allocated to this quarry"
            ],
            "type": "u64"
          },
          {
            "name": "totalTokensDeposited",
            "docs": [
              "Total number of tokens deposited into the quarry."
            ],
            "type": "u64"
          },
          {
            "name": "numMiners",
            "docs": [
              "Number of [Miner]s."
            ],
            "type": "u64"
          },
          {
            "name": "rewardInfos",
            "docs": [
              "Other reward info, possibly from partners"
            ],
            "type": {
              "array": [
                {
                  "defined": "RewardInfo"
                },
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "miner",
      "docs": [
        "An account that has staked tokens into a [Quarry]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "quarry",
            "docs": [
              "Key of the [Quarry] this [Miner] works on."
            ],
            "type": "publicKey"
          },
          {
            "name": "authority",
            "docs": [
              "Authority who manages this [Miner].",
              "All withdrawals of tokens must accrue to [TokenAccount]s owned by this account."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump."
            ],
            "type": "u8"
          },
          {
            "name": "tokenVaultKey",
            "docs": [
              "[TokenAccount] to hold the [Miner]'s staked LP tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardsEarned",
            "docs": [
              "Stores the amount of tokens that the [Miner] may claim.",
              "Whenever the [Miner] claims tokens, this is reset to 0."
            ],
            "type": "u64"
          },
          {
            "name": "rewardsPerTokenPaid",
            "docs": [
              "A checkpoint of the [Quarry]'s reward tokens paid per staked token.",
              "",
              "When the [Miner] is initialized, this number starts at 0.",
              "On the first [quarry::stake_tokens], the [Quarry]#update_rewards_and_miner",
              "method is called, which updates this checkpoint to the current quarry value.",
              "",
              "On a [quarry::claim_rewards], the difference in checkpoints is used to calculate",
              "the amount of tokens owed."
            ],
            "type": "u128"
          },
          {
            "name": "balance",
            "docs": [
              "Number of tokens the [Miner] holds."
            ],
            "type": "u64"
          },
          {
            "name": "index",
            "docs": [
              "Index of the [Miner]."
            ],
            "type": "u64"
          },
          {
            "name": "rewardInfos",
            "docs": [
              "Other reward info, possibly from partners"
            ],
            "type": {
              "array": [
                {
                  "defined": "UserRewardInfo"
                },
                3
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RewardInfo",
      "docs": [
        "Other rewards beside main token"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "Reward token mint."
            ],
            "type": "publicKey"
          },
          {
            "name": "vault",
            "docs": [
              "Reward vault token account."
            ],
            "type": "publicKey"
          },
          {
            "name": "funder",
            "docs": [
              "Authority account that allows to fund rewards"
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardDuration",
            "docs": [
              "Reward duration"
            ],
            "type": "u64"
          },
          {
            "name": "rewardDurationEnd",
            "docs": [
              "Reward duration end"
            ],
            "type": "u64"
          },
          {
            "name": "rewardRate",
            "docs": [
              "Reward rate"
            ],
            "type": "u128"
          },
          {
            "name": "lastUpdateTime",
            "docs": [
              "The last time reward states were updated."
            ],
            "type": "u64"
          },
          {
            "name": "rewardPerTokenStored",
            "docs": [
              "reward per token stored"
            ],
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "UserRewardInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewardPerTokenComplete",
            "type": "u128"
          },
          {
            "name": "rewardPending",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "StakeAction",
      "docs": [
        "An action for a user to take on the staking pool."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Stake"
          },
          {
            "name": "Withdraw"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ClaimPartnerRewardEvent",
      "fields": [
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "stakedToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardsToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ClaimEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "stakedToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardsToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "MinerCreateEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "miner",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "QuarryCreateEvent",
      "fields": [
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "FundRewardEvent",
      "fields": [
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "funder",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "InitializeNewRewardEvent",
      "fields": [
        {
          "name": "rewardMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "funder",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "rewardDuration",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "NewRewarderEvent",
      "fields": [
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "RewarderAnnualRewardsUpdateEvent",
      "fields": [
        {
          "name": "previousRate",
          "type": "u64",
          "index": false
        },
        {
          "name": "newRate",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "QuarryLbClmmRewardsUpdateEvent",
      "fields": [
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "emission",
          "type": "u64",
          "index": false
        },
        {
          "name": "annualRewardsRate",
          "type": "u64",
          "index": false
        },
        {
          "name": "rewardsShare",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "QuarryRewardsUpdateEvent",
      "fields": [
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "annualRewardsRate",
          "type": "u64",
          "index": false
        },
        {
          "name": "rewardsShare",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UpdateRewardDurationEvent",
      "fields": [
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "oldRewardDuration",
          "type": "u64",
          "index": false
        },
        {
          "name": "newRewardDuration",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "UpdateRewardFunderEvent",
      "fields": [
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "oldFunder",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newFunder",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "StakeEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "token",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "WithdrawEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "token",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6001,
      "name": "InsufficientBalance",
      "msg": "Insufficient staked balance for withdraw request."
    },
    {
      "code": 6002,
      "name": "PendingAuthorityNotSet",
      "msg": "Pending authority not set"
    },
    {
      "code": 6003,
      "name": "InvalidRewardsShare",
      "msg": "Invalid quarry rewards share"
    },
    {
      "code": 6004,
      "name": "InsufficientAllowance",
      "msg": "Insufficient allowance."
    },
    {
      "code": 6005,
      "name": "NewVaultNotEmpty",
      "msg": "New vault not empty."
    },
    {
      "code": 6006,
      "name": "NotEnoughTokens",
      "msg": "Not enough tokens."
    },
    {
      "code": 6007,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp."
    },
    {
      "code": 6008,
      "name": "MaxAnnualRewardsRateExceeded",
      "msg": "Max annual rewards rate exceeded."
    },
    {
      "code": 6009,
      "name": "Paused",
      "msg": "Rewarder is paused."
    },
    {
      "code": 6010,
      "name": "UpperboundExceeded",
      "msg": "Rewards earned exceeded quarry's upper bound."
    },
    {
      "code": 6011,
      "name": "TypeCastFailed",
      "msg": "type cast faled"
    },
    {
      "code": 6012,
      "name": "InvalidRewardIndex",
      "msg": "Invalid reward index"
    },
    {
      "code": 6013,
      "name": "InvalidRewardDuration",
      "msg": "Invalid reward duration"
    },
    {
      "code": 6014,
      "name": "RewardUninitialized",
      "msg": "Reward not initialized"
    },
    {
      "code": 6015,
      "name": "RewardCampaignInProgress",
      "msg": "Reward campaign in progress"
    },
    {
      "code": 6016,
      "name": "InvalidRewardVault",
      "msg": "Invalid reward vault"
    },
    {
      "code": 6017,
      "name": "InvalidAdmin",
      "msg": "Invalid admin"
    },
    {
      "code": 6018,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6019,
      "name": "SameFunder",
      "msg": "Update same reward funder"
    }
  ]
};

export const IDL: Quarry = {
  "version": "0.1.0",
  "name": "quarry",
  "docs": [
    "Program for [quarry]."
  ],
  "constants": [
    {
      "name": "MIN_REWARD_DURATION",
      "type": "u64",
      "value": "1"
    },
    {
      "name": "MAX_REWARD_DURATION",
      "type": "u64",
      "value": "31536000"
    }
  ],
  "instructions": [
    {
      "name": "newRewarder",
      "docs": [
        "Creates a new [Rewarder]."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base. Arbitrary key."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Rewarder] of mines."
          ]
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Initial admin of the rewarder."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the [Rewarder] initialization."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program."
          ]
        },
        {
          "name": "mintWrapper",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Mint wrapper."
          ]
        },
        {
          "name": "rewardsTokenMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rewards token mint."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "setMintAuthority",
      "docs": [
        "Set operator [Rewarder]."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Admin of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": [
        {
          "name": "mintAuthority",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setPauseAuthority",
      "docs": [
        "Sets the pause authority."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        },
        {
          "name": "newPauseAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The pause authority."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "pause",
      "docs": [
        "Pauses the [Rewarder]."
      ],
      "accounts": [
        {
          "name": "pauseAuthority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Pause authority of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "unpause",
      "docs": [
        "Unpauses the [Rewarder]."
      ],
      "accounts": [
        {
          "name": "pauseAuthority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Pause authority of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "transferAdmin",
      "docs": [
        "Transfers the [Rewarder] admin to a different account."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Admin of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "acceptAdmin",
      "docs": [
        "Accepts the admin to become the new rewarder."
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Admin of the next rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "setAnnualRewards",
      "docs": [
        "Sets the amount of reward tokens distributed to all [Quarry]s per day."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        }
      ],
      "args": [
        {
          "name": "newRate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createQuarry",
      "docs": [
        "Creates a new [Quarry].",
        "This may only be called by the [Rewarder]::admin."
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry]."
          ]
        },
        {
          "name": "ammPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of [Quarry] creation."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program."
          ]
        }
      ],
      "args": [
        {
          "name": "ammType",
          "type": "u32"
        }
      ]
    },
    {
      "name": "setRewardsShare",
      "docs": [
        "Sets the rewards share of a quarry."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the rewarder."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Rewarder of the farm."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry] updated."
          ]
        }
      ],
      "args": [
        {
          "name": "newShare",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setFamine",
      "docs": [
        "Sets the famine, which stops rewards."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "[Rewarder]."
              ]
            }
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry] updated."
          ]
        }
      ],
      "args": [
        {
          "name": "famineTs",
          "type": "i64"
        }
      ]
    },
    {
      "name": "updateQuarryRewards",
      "docs": [
        "Synchronizes quarry rewards with the rewarder.",
        "Anyone can call this."
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry]."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Rewarder]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateQuarryLbClmmRewards",
      "docs": [
        "Synchronizes quarry rewards with the rewarder.",
        "Anyone can call this.",
        "For LbClmm"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry]."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Rewarder]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeNewReward",
      "docs": [
        "Init new reward, only admin can do this",
        "Init new rewards, provided by partners, similar to bribe"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of [Quarry] creation."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "rewardDuration",
          "type": "u64"
        },
        {
          "name": "funder",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateRewardFunder",
      "docs": [
        "Update reward funder, only admin can change"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        }
      ],
      "args": [
        {
          "name": "rewardIndex",
          "type": "u64"
        },
        {
          "name": "newFunder",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateRewardDuration",
      "docs": [
        "Update reward duration, only admin can change"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auth",
          "accounts": [
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Admin of the rewarder."
              ]
            },
            {
              "name": "rewarder",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Rewarder of the farm."
              ]
            }
          ]
        }
      ],
      "args": [
        {
          "name": "rewardIndex",
          "type": "u64"
        },
        {
          "name": "newDuration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fundReward",
      "docs": [
        "Fund reward, only admin or funder can fund"
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "funderTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "funder",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rewardIndex",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createMiner",
      "docs": [
        "--------------------------------",
        "Miner functions",
        "--------------------------------",
        "Creates a [Miner] for the given authority.",
        "",
        "Anyone can call this; this is an associated account."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the [Miner]."
          ]
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Miner] to be created."
          ]
        },
        {
          "name": "minerVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[TokenAccount] holding the token [Mint]."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Quarry] to create a [Miner] for."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Rewarder]."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of [Miner] creation."
          ]
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Mint] of the token to create a [Quarry] for."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "SPL Token program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "claimRewards",
      "docs": [
        "Claims rewards for the [Miner]."
      ],
      "accounts": [
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Mint wrapper."
          ]
        },
        {
          "name": "mintWrapperProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Mint wrapper program."
          ]
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[minter::Minter] information."
          ]
        },
        {
          "name": "rewardsTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Mint of the rewards token."
          ]
        },
        {
          "name": "rewardsTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Account to claim rewards for."
          ]
        },
        {
          "name": "claim",
          "accounts": [
            {
              "name": "authority",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "Miner authority (i.e. the user)."
              ]
            },
            {
              "name": "miner",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Miner."
              ]
            },
            {
              "name": "quarry",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "Quarry to claim from."
              ]
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "Token program"
              ]
            },
            {
              "name": "rewarder",
              "isMut": false,
              "isSigner": false,
              "docs": [
                "Rewarder"
              ]
            }
          ]
        }
      ],
      "args": []
    },
    {
      "name": "claimPartnerRewards",
      "docs": [
        "Claims partner rewards for the [Miner]."
      ],
      "accounts": [
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Quarry to claim from."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program"
          ]
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Miner."
          ]
        },
        {
          "name": "rewardVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardsTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Account to claim rewards for."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rewarder"
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Miner authority (i.e. the user)."
          ]
        }
      ],
      "args": [
        {
          "name": "rewardIndex",
          "type": "u64"
        }
      ]
    },
    {
      "name": "stakeTokens",
      "docs": [
        "Stakes tokens into the [Miner]."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Miner authority (i.e. the user)."
          ]
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Miner."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Quarry to claim from."
          ]
        },
        {
          "name": "minerVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Vault of the miner."
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User's staked token account"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program"
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rewarder"
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstakeTokens",
      "docs": [
        "Unstake tokens from the [Miner]."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Miner authority (i.e. the user)."
          ]
        },
        {
          "name": "miner",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Miner."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Quarry to claim from."
          ]
        },
        {
          "name": "minerVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Vault of the miner."
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User's staked token account"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program"
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rewarder"
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "rewarder",
      "docs": [
        "Controls token rewards distribution to all [Quarry]s.",
        "The [Rewarder] is also the [minter::Minter] registered to the [minter::MintWrapper]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Random pubkey used for generating the program address."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for program address."
            ],
            "type": "u8"
          },
          {
            "name": "admin",
            "docs": [
              "Admin who controls the rewarder"
            ],
            "type": "publicKey"
          },
          {
            "name": "pendingAdmin",
            "docs": [
              "Pending admin which must accept the admin"
            ],
            "type": "publicKey"
          },
          {
            "name": "numQuarries",
            "docs": [
              "Number of [Quarry]s the [Rewarder] manages.",
              "If more than this many [Quarry]s are desired, one can create",
              "a second rewarder."
            ],
            "type": "u16"
          },
          {
            "name": "annualRewardsRate",
            "docs": [
              "Amount of reward tokens distributed per day"
            ],
            "type": "u64"
          },
          {
            "name": "totalRewardsShares",
            "docs": [
              "Total amount of rewards shares allocated to [Quarry]s"
            ],
            "type": "u64"
          },
          {
            "name": "mintWrapper",
            "docs": [
              "Mint wrapper."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardsTokenMint",
            "docs": [
              "Mint of the rewards token for this [Rewarder]."
            ],
            "type": "publicKey"
          },
          {
            "name": "pauseAuthority",
            "docs": [
              "Authority allowed to pause a [Rewarder]."
            ],
            "type": "publicKey"
          },
          {
            "name": "isPaused",
            "docs": [
              "If true, all instructions on the [Rewarder] are paused other than [quarry::unpause]."
            ],
            "type": "bool"
          },
          {
            "name": "mintAuthority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "quarry",
      "docs": [
        "A pool which distributes tokens to its [Miner]s."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewarder",
            "docs": [
              "Rewarder which manages this quarry"
            ],
            "type": "publicKey"
          },
          {
            "name": "ammPool",
            "docs": [
              "Amm pool this quarry is designated to"
            ],
            "type": "publicKey"
          },
          {
            "name": "ammType",
            "docs": [
              "Amm type, can be Meteora or LbClmm"
            ],
            "type": "u32"
          },
          {
            "name": "tokenMintKey",
            "docs": [
              "LP token this quarry is designated to"
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump."
            ],
            "type": "u8"
          },
          {
            "name": "index",
            "docs": [
              "Index of the [Quarry]."
            ],
            "type": "u16"
          },
          {
            "name": "famineTs",
            "docs": [
              "Decimals on the token [Mint].",
              "Timestamp when quarry rewards cease"
            ],
            "type": "i64"
          },
          {
            "name": "lastUpdateTs",
            "docs": [
              "Timestamp of last checkpoint"
            ],
            "type": "i64"
          },
          {
            "name": "rewardsPerTokenStored",
            "docs": [
              "Rewards per token stored in the quarry"
            ],
            "type": "u128"
          },
          {
            "name": "annualRewardsRate",
            "docs": [
              "Amount of rewards distributed to the quarry per year."
            ],
            "type": "u64"
          },
          {
            "name": "rewardsShare",
            "docs": [
              "Rewards shared allocated to this quarry"
            ],
            "type": "u64"
          },
          {
            "name": "totalTokensDeposited",
            "docs": [
              "Total number of tokens deposited into the quarry."
            ],
            "type": "u64"
          },
          {
            "name": "numMiners",
            "docs": [
              "Number of [Miner]s."
            ],
            "type": "u64"
          },
          {
            "name": "rewardInfos",
            "docs": [
              "Other reward info, possibly from partners"
            ],
            "type": {
              "array": [
                {
                  "defined": "RewardInfo"
                },
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "miner",
      "docs": [
        "An account that has staked tokens into a [Quarry]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "quarry",
            "docs": [
              "Key of the [Quarry] this [Miner] works on."
            ],
            "type": "publicKey"
          },
          {
            "name": "authority",
            "docs": [
              "Authority who manages this [Miner].",
              "All withdrawals of tokens must accrue to [TokenAccount]s owned by this account."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump."
            ],
            "type": "u8"
          },
          {
            "name": "tokenVaultKey",
            "docs": [
              "[TokenAccount] to hold the [Miner]'s staked LP tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardsEarned",
            "docs": [
              "Stores the amount of tokens that the [Miner] may claim.",
              "Whenever the [Miner] claims tokens, this is reset to 0."
            ],
            "type": "u64"
          },
          {
            "name": "rewardsPerTokenPaid",
            "docs": [
              "A checkpoint of the [Quarry]'s reward tokens paid per staked token.",
              "",
              "When the [Miner] is initialized, this number starts at 0.",
              "On the first [quarry::stake_tokens], the [Quarry]#update_rewards_and_miner",
              "method is called, which updates this checkpoint to the current quarry value.",
              "",
              "On a [quarry::claim_rewards], the difference in checkpoints is used to calculate",
              "the amount of tokens owed."
            ],
            "type": "u128"
          },
          {
            "name": "balance",
            "docs": [
              "Number of tokens the [Miner] holds."
            ],
            "type": "u64"
          },
          {
            "name": "index",
            "docs": [
              "Index of the [Miner]."
            ],
            "type": "u64"
          },
          {
            "name": "rewardInfos",
            "docs": [
              "Other reward info, possibly from partners"
            ],
            "type": {
              "array": [
                {
                  "defined": "UserRewardInfo"
                },
                3
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "RewardInfo",
      "docs": [
        "Other rewards beside main token"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "Reward token mint."
            ],
            "type": "publicKey"
          },
          {
            "name": "vault",
            "docs": [
              "Reward vault token account."
            ],
            "type": "publicKey"
          },
          {
            "name": "funder",
            "docs": [
              "Authority account that allows to fund rewards"
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardDuration",
            "docs": [
              "Reward duration"
            ],
            "type": "u64"
          },
          {
            "name": "rewardDurationEnd",
            "docs": [
              "Reward duration end"
            ],
            "type": "u64"
          },
          {
            "name": "rewardRate",
            "docs": [
              "Reward rate"
            ],
            "type": "u128"
          },
          {
            "name": "lastUpdateTime",
            "docs": [
              "The last time reward states were updated."
            ],
            "type": "u64"
          },
          {
            "name": "rewardPerTokenStored",
            "docs": [
              "reward per token stored"
            ],
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "UserRewardInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rewardPerTokenComplete",
            "type": "u128"
          },
          {
            "name": "rewardPending",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "StakeAction",
      "docs": [
        "An action for a user to take on the staking pool."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Stake"
          },
          {
            "name": "Withdraw"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ClaimPartnerRewardEvent",
      "fields": [
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "stakedToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardsToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ClaimEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "stakedToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardsToken",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "MinerCreateEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "miner",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "QuarryCreateEvent",
      "fields": [
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "FundRewardEvent",
      "fields": [
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "funder",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "InitializeNewRewardEvent",
      "fields": [
        {
          "name": "rewardMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "funder",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "rewardDuration",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "NewRewarderEvent",
      "fields": [
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "RewarderAnnualRewardsUpdateEvent",
      "fields": [
        {
          "name": "previousRate",
          "type": "u64",
          "index": false
        },
        {
          "name": "newRate",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "QuarryLbClmmRewardsUpdateEvent",
      "fields": [
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "emission",
          "type": "u64",
          "index": false
        },
        {
          "name": "annualRewardsRate",
          "type": "u64",
          "index": false
        },
        {
          "name": "rewardsShare",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "QuarryRewardsUpdateEvent",
      "fields": [
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "annualRewardsRate",
          "type": "u64",
          "index": false
        },
        {
          "name": "rewardsShare",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UpdateRewardDurationEvent",
      "fields": [
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "oldRewardDuration",
          "type": "u64",
          "index": false
        },
        {
          "name": "newRewardDuration",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "UpdateRewardFunderEvent",
      "fields": [
        {
          "name": "quarry",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewardIndex",
          "type": "u64",
          "index": false
        },
        {
          "name": "oldFunder",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newFunder",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "StakeEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "token",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "WithdrawEvent",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "token",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6001,
      "name": "InsufficientBalance",
      "msg": "Insufficient staked balance for withdraw request."
    },
    {
      "code": 6002,
      "name": "PendingAuthorityNotSet",
      "msg": "Pending authority not set"
    },
    {
      "code": 6003,
      "name": "InvalidRewardsShare",
      "msg": "Invalid quarry rewards share"
    },
    {
      "code": 6004,
      "name": "InsufficientAllowance",
      "msg": "Insufficient allowance."
    },
    {
      "code": 6005,
      "name": "NewVaultNotEmpty",
      "msg": "New vault not empty."
    },
    {
      "code": 6006,
      "name": "NotEnoughTokens",
      "msg": "Not enough tokens."
    },
    {
      "code": 6007,
      "name": "InvalidTimestamp",
      "msg": "Invalid timestamp."
    },
    {
      "code": 6008,
      "name": "MaxAnnualRewardsRateExceeded",
      "msg": "Max annual rewards rate exceeded."
    },
    {
      "code": 6009,
      "name": "Paused",
      "msg": "Rewarder is paused."
    },
    {
      "code": 6010,
      "name": "UpperboundExceeded",
      "msg": "Rewards earned exceeded quarry's upper bound."
    },
    {
      "code": 6011,
      "name": "TypeCastFailed",
      "msg": "type cast faled"
    },
    {
      "code": 6012,
      "name": "InvalidRewardIndex",
      "msg": "Invalid reward index"
    },
    {
      "code": 6013,
      "name": "InvalidRewardDuration",
      "msg": "Invalid reward duration"
    },
    {
      "code": 6014,
      "name": "RewardUninitialized",
      "msg": "Reward not initialized"
    },
    {
      "code": 6015,
      "name": "RewardCampaignInProgress",
      "msg": "Reward campaign in progress"
    },
    {
      "code": 6016,
      "name": "InvalidRewardVault",
      "msg": "Invalid reward vault"
    },
    {
      "code": 6017,
      "name": "InvalidAdmin",
      "msg": "Invalid admin"
    },
    {
      "code": 6018,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6019,
      "name": "SameFunder",
      "msg": "Update same reward funder"
    }
  ]
};
