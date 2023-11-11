export type Gauge = {
  "version": "0.1.0",
  "name": "gauge",
  "docs": [
    "Smart wallet program."
  ],
  "constants": [
    {
      "name": "MAX_BRIBE_EPOCH",
      "type": "u32",
      "value": "200"
    },
    {
      "name": "MAX_EPOCH_PER_GAUGE",
      "type": {
        "defined": "usize"
      },
      "value": "100"
    }
  ],
  "instructions": [
    {
      "name": "createGaugeFactory",
      "docs": [
        "Creates a [GaugeFactory]."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory] to be created."
          ]
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [minter::Rewarder]."
          ]
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[voter::Locker] which determines gauge weights."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer."
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
          "name": "foreman",
          "type": "publicKey"
        },
        {
          "name": "epochDurationSeconds",
          "type": "u32"
        },
        {
          "name": "firstEpochStartsAt",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createGauge",
      "docs": [
        "Creates a [Gauge]. Permissionless."
      ],
      "accounts": [
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge] to be created."
          ]
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[GaugeFactory]."
          ]
        },
        {
          "name": "quarry",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[quarry::Quarry]."
          ]
        },
        {
          "name": "ammPool",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[amm::Amm]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer."
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
      "args": []
    },
    {
      "name": "createGaugeVoter",
      "docs": [
        "Creates a [GaugeVoter]. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[GaugeFactory]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[voter::Escrow]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter] to be created."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer."
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
      "args": []
    },
    {
      "name": "createGaugeVote",
      "docs": [
        "Creates a [GaugeVote]. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVote] to be created."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Gauge voter."
          ]
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer."
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
      "args": []
    },
    {
      "name": "pumpGaugeEpoch",
      "docs": [
        "pump gauge epoch"
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge] to create an [EpochGauge] of."
          ]
        },
        {
          "name": "ammPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAFee",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBFee",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "prepareVote",
      "docs": [
        "Prepare vote Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[GaugeVoter]."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The vote delegate."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "resetVote",
      "docs": [
        "Resets an [EpochGaugeVoter]; that is, syncs the [EpochGaugeVoter]",
        "with the latest power amount only if the votes have yet to be",
        "committed. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory::locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter::escrow]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [EpochGaugeVoter::gauge_voter]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "setVote",
      "docs": [
        "Sets the vote of a [Gauge]."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVote]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The escrow."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The vote delegate."
          ]
        }
      ],
      "args": [
        {
          "name": "weight",
          "type": "u32"
        }
      ]
    },
    {
      "name": "commitVote",
      "docs": [
        "Commits the vote of a [Gauge].",
        "Anyone can call this on any voter's gauge votes."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVote] containing the vote weights."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The escrow."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The vote delegate."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "revertVote",
      "docs": [
        "Reverts a vote commitment of a [Gauge].",
        "Only the voter can call this."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The escrow."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The vote delegate.",
            "#[account(mut)]"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "enableGauge",
      "docs": [
        "Enables a [Gauge]."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge] to enable."
          ]
        },
        {
          "name": "foreman",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [GaugeFactorty::foreman]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "disableGauge",
      "docs": [
        "Disables a [Gauge]."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge] to disable."
          ]
        },
        {
          "name": "foreman",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [GaugeFactorty::foreman]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "triggerNextEpoch",
      "docs": [
        "Triggers the next epoch. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "syncGauge",
      "docs": [
        "Synchronizes the [quarry::Quarry] with the relevant [EpochGauge]. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[quarry::Quarry]."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[GaugeFactory::rewarder]."
          ]
        },
        {
          "name": "quarryProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[quarry] program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "syncDisabledGauge",
      "docs": [
        "Sets the [quarry::Quarry] rewards to zero if the gauge is disabled. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[quarry::Quarry]."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[GaugeFactory::rewarder]."
          ]
        },
        {
          "name": "quarryProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[quarry] program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "claimGaugeFee",
      "docs": [
        "Holder claim fee from amm",
        "",
        "Only the [voter::Escrow::vote_delegate] may call this."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVote]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Escrow] which owns this [EpochGaugeVote]."
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ammPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ammProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [Escrow::vote_delegate]."
          ]
        }
      ],
      "args": [
        {
          "name": "toEpoch",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createGaugeBribe",
      "docs": [
        "Create an [Bribe]",
        "",
        "Permissionless, anyone can crate bribe"
      ],
      "accounts": [
        {
          "name": "bribe",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Bribe] to be created."
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
            "Payer."
          ]
        },
        {
          "name": "gaugeFactory",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "tokenAccountVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[TokenAccount] holding the token [Mint]."
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
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
          "name": "rewardEachEpoch",
          "type": "u64"
        },
        {
          "name": "bribeEpochEnd",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createEpochBribeVoter",
      "accounts": [
        {
          "name": "bribe",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Bribe]"
          ]
        },
        {
          "name": "epochBribeVoter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The [Escrow::vote_delegate]."
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
      "args": []
    },
    {
      "name": "claimGaugeBribe",
      "docs": [
        "Claim an [Bribe] for voting epoch",
        "",
        "Permissionless, anyone can crate bribe"
      ],
      "accounts": [
        {
          "name": "bribe",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Bribe]"
          ]
        },
        {
          "name": "epochBribeVoter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gaugeVote",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "tokenAccountVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Escrow] which owns this [EpochGaugeVote]."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The [Escrow::vote_delegate]."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "clawbackBribeGaugeEpoch",
      "docs": [
        "Rescue an [Bribe] for voting epoch",
        "",
        "Briber claim rewards back in case onbody vote for a gauge in this epoch"
      ],
      "accounts": [
        {
          "name": "bribe",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Bribe]"
          ]
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "tokenAccountVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "briber",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "votingEpoch",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gaugeFactory",
      "docs": [
        "Manages the rewards shares of all [Gauge]s of a [quarry::rewarder]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          },
          {
            "name": "rewarder",
            "type": "publicKey"
          },
          {
            "name": "locker",
            "docs": [
              "The [voter::Locker]."
            ],
            "type": "publicKey"
          },
          {
            "name": "foreman",
            "docs": [
              "Account which may enable/disable gauges on the [GaugeFactory].",
              "Normally this should be smartwallet",
              "May call the following instructions:",
              "- gauge_enable",
              "- gauge_disable"
            ],
            "type": "publicKey"
          },
          {
            "name": "epochDurationSeconds",
            "docs": [
              "Number of seconds per rewards epoch.",
              "This may be modified later.",
              "The epoch duration is not exact, as epochs must manually be incremented."
            ],
            "type": "u32"
          },
          {
            "name": "currentVotingEpoch",
            "docs": [
              "The current voting epoch, start from 1"
            ],
            "type": "u32"
          },
          {
            "name": "nextEpochStartsAt",
            "docs": [
              "When the next epoch starts."
            ],
            "type": "u64"
          },
          {
            "name": "bribeIndex",
            "docs": [
              "bribe index"
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "gauge",
      "docs": [
        "A [Gauge] determines the rewards shares to give to a [quarry::Quarry]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gaugeFactory",
            "docs": [
              "The [GaugeFactory]."
            ],
            "type": "publicKey"
          },
          {
            "name": "quarry",
            "docs": [
              "The [quarry::Quarry] being voted on."
            ],
            "type": "publicKey"
          },
          {
            "name": "ammPool",
            "docs": [
              "The [amm::Amm] being voted on.",
              "Can be meteora pool or Lbclmm"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenAFeeKey",
            "docs": [
              "token_a_fee_key of amm pool"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenBFeeKey",
            "docs": [
              "token_b_fee_key of amm pool"
            ],
            "type": "publicKey"
          },
          {
            "name": "cummulativeTokenAFee",
            "docs": [
              "Total fee of token a in all epochs so far"
            ],
            "type": "u128"
          },
          {
            "name": "cummulativeTokenBFee",
            "docs": [
              "Total fee of token b in all epochs so far"
            ],
            "type": "u128"
          },
          {
            "name": "cummulativeClaimedTokenAFee",
            "docs": [
              "Total claimed fee of token a in all epochs so far",
              "invariant: token_a_fee.amount + cummulative_claimed_token_a_fee = cummulative_token_a_fee"
            ],
            "type": "u128"
          },
          {
            "name": "cummulativeClaimedTokenBFee",
            "docs": [
              "Total claimed fee of token b in all epochs so far"
            ],
            "type": "u128"
          },
          {
            "name": "tokenAMint",
            "docs": [
              "token_a_mint of amm pool, only used for tracking"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenBMint",
            "docs": [
              "token_b_fee_mint of amm pool, only used for tracking"
            ],
            "type": "publicKey"
          },
          {
            "name": "currentIndex",
            "docs": [
              "ring buffer to store vote for all epochs"
            ],
            "type": "u64"
          },
          {
            "name": "isDisabled",
            "docs": [
              "If true, this Gauge cannot receive any more votes",
              "and rewards shares cannot be synchronized from it."
            ],
            "type": "u32"
          },
          {
            "name": "ammType",
            "docs": [
              "Gauge type"
            ],
            "type": "u32"
          },
          {
            "name": "voteEpochs",
            "type": {
              "array": [
                {
                  "defined": "EpochGauge"
                },
                100
              ]
            }
          }
        ]
      }
    },
    {
      "name": "gaugeVoter",
      "docs": [
        "A [GaugeVoter] represents an [voter::Escrow] that can vote on gauges."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gaugeFactory",
            "docs": [
              "The [GaugeFactory]."
            ],
            "type": "publicKey"
          },
          {
            "name": "escrow",
            "docs": [
              "The Escrow of the [GaugeVoter]."
            ],
            "type": "publicKey"
          },
          {
            "name": "owner",
            "docs": [
              "Owner of the Escrow of the [GaugeVoter]."
            ],
            "type": "publicKey"
          },
          {
            "name": "weightChangeSeqno",
            "docs": [
              "This number gets incremented whenever weights are changed.",
              "Use this to determine if votes must be re-committed.",
              "",
              "This is primarily used when provisioning an [EpochGaugeVoter]:",
              "1. When one wants to commit their votes, they call [gauge::prepare_epoch_gauge_voter]",
              "2. The [Self::weight_change_seqno] gets written to [EpochGaugeVoter::weight_change_seqno].",
              "3. In [gauge::gauge_commit_vote], if the [Self::weight_change_seqno] has changed, the transaction is blocked with a [crate::ErrorCode::WeightSeqnoChanged] error."
            ],
            "type": "u64"
          },
          {
            "name": "totalWeight",
            "docs": [
              "Total number of parts that the voter has distributed."
            ],
            "type": "u32"
          },
          {
            "name": "currentIndex",
            "docs": [
              "ring buffer to store epochgaugeVoter"
            ],
            "type": "u32"
          },
          {
            "name": "padding",
            "type": "u64"
          },
          {
            "name": "voteEpochs",
            "type": {
              "array": [
                {
                  "defined": "EpochGaugeVoter"
                },
                100
              ]
            }
          }
        ]
      }
    },
    {
      "name": "gaugeVote",
      "docs": [
        "A [GaugeVote] is a user's vote for a given [Gauge]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gaugeVoter",
            "docs": [
              "The [GaugeVoter]."
            ],
            "type": "publicKey"
          },
          {
            "name": "gauge",
            "docs": [
              "The [Gauge] being voted on."
            ],
            "type": "publicKey"
          },
          {
            "name": "weight",
            "docs": [
              "Proportion of votes that the voter is applying to this gauge."
            ],
            "type": "u32"
          },
          {
            "name": "padding1",
            "type": {
              "array": [
                "u8",
                12
              ]
            }
          },
          {
            "name": "claimedTokenAFee",
            "docs": [
              "stats to track how many fee user has claimed"
            ],
            "type": "u128"
          },
          {
            "name": "claimedTokenBFee",
            "docs": [
              "stats to track how many fee user has claimed"
            ],
            "type": "u128"
          },
          {
            "name": "currentIndex",
            "docs": [
              "ring buffer to store vote for all epochs"
            ],
            "type": "u64"
          },
          {
            "name": "lastClaimAFeeEpoch",
            "type": "u32"
          },
          {
            "name": "lastClaimBFeeEpoch",
            "type": "u32"
          },
          {
            "name": "voteEpochs",
            "type": {
              "array": [
                {
                  "defined": "GaugeVoteItem"
                },
                100
              ]
            }
          }
        ]
      }
    },
    {
      "name": "bribe",
      "docs": [
        "Bribe with a gauge"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gauge",
            "docs": [
              "The gauge bribe for"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "token mint of the bribe"
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardEachEpoch",
            "docs": [
              "reward for each epoch of bribe"
            ],
            "type": "u64"
          },
          {
            "name": "briber",
            "docs": [
              "user who give the bribe"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenAccountVault",
            "docs": [
              "token account store bribe"
            ],
            "type": "publicKey"
          },
          {
            "name": "bribeRewardsEpochStart",
            "docs": [
              "When bribe epoch end"
            ],
            "type": "u32"
          },
          {
            "name": "bribeRewardsEpochEnd",
            "docs": [
              "When bribe epoch end"
            ],
            "type": "u32"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "Claimed amount, just for display"
            ],
            "type": "u64"
          },
          {
            "name": "bribeIndex",
            "docs": [
              "bribe index"
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "epochBribeVoter",
      "docs": [
        "An [EpochBribeVoter]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bribe",
            "docs": [
              "The [Bribe]."
            ],
            "type": "publicKey"
          },
          {
            "name": "gaugeVoter",
            "docs": [
              "gauge voter"
            ],
            "type": "publicKey"
          },
          {
            "name": "lastClaimedEpoch",
            "docs": [
              "last claimed epoch"
            ],
            "type": "u32"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "claimed amount"
            ],
            "type": "u128"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GaugeVoteItem",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingEpoch",
            "type": "u32"
          },
          {
            "name": "padding",
            "type": "u32"
          },
          {
            "name": "allocatedPower",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "EpochGauge",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingEpoch",
            "type": "u32"
          },
          {
            "name": "padding",
            "type": "u32"
          },
          {
            "name": "totalPower",
            "type": "u64"
          },
          {
            "name": "tokenAFee",
            "docs": [
              "Token a fee in this epoch"
            ],
            "type": "u128"
          },
          {
            "name": "tokenBFee",
            "docs": [
              "Token b fee in this epoch"
            ],
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "EpochGaugeVoter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingEpoch",
            "type": "u32"
          },
          {
            "name": "padding",
            "type": "u32"
          },
          {
            "name": "weightChangeSeqno",
            "type": "u64"
          },
          {
            "name": "votingPower",
            "docs": [
              "The total amount of voting power."
            ],
            "type": "u64"
          },
          {
            "name": "allocatedPower",
            "docs": [
              "The total amount of gauge voting power that has been allocated.",
              "If this number is non-zero, vote weights cannot be changed until they are all withdrawn."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ClaimGaugeBribeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribe",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "rewards",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAccount",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrow",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ClaimGaugeFeeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "toEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "feeAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "feeMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrow",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ClawbackBribeGaugeEpochEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribe",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": true
        }
      ]
    },
    {
      "name": "CommitVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "voteSharesForNextEpoch",
          "type": "u64",
          "index": false
        },
        {
          "name": "updatedAllocatedPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "updatedTotalPower",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CreateEpochBribeVoterEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribe",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "gaugeVoter",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateGaugeBribeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribe",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribeRewardsEpochStart",
          "type": "u32",
          "index": false
        },
        {
          "name": "bribeRewardsEpochEnd",
          "type": "u32",
          "index": false
        },
        {
          "name": "rewardEachEpoch",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CreateGaugeFactoryEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewarder",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "foreman",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "firstRewardsEpoch",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CreateGaugeVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CreateGaugeVoterEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "rewarder",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CreateGaugeEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "quarry",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "ammType",
          "type": "u32",
          "index": false
        }
      ]
    },
    {
      "name": "DisableGaugeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "foreman",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "EnableGaugeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "foreman",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "PrepareVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "rewarder",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "locker",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "votingPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "weightChangeSeqno",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "PumpGaugeEpochEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": true
        },
        {
          "name": "tokenAFee",
          "type": "u128",
          "index": false
        },
        {
          "name": "tokenBFee",
          "type": "u128",
          "index": false
        }
      ]
    },
    {
      "name": "ResetVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "prevVotingPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "votingPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "prevWeightChangeSeqno",
          "type": "u64",
          "index": false
        },
        {
          "name": "weightChangeSeqno",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "RevertVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "subtractedPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "updatedAllocatedPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "updatedTotalPower",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "SetVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "voteDelegate",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "prevTotalWeight",
          "type": "u32",
          "index": false
        },
        {
          "name": "totalWeight",
          "type": "u32",
          "index": false
        },
        {
          "name": "weightChangeSeqno",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "SyncGaugeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "epoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "previousShare",
          "type": "u64",
          "index": false
        },
        {
          "name": "newShare",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "TriggerNextEpochEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": true
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "WrongAccount",
      "msg": "The give account is not correct."
    },
    {
      "code": 6001,
      "name": "UnauthorizedNotForeman",
      "msg": "You must be the foreman to perform this action."
    },
    {
      "code": 6002,
      "name": "GaugeEpochCannotBeZero",
      "msg": "Cannot sync gauges at the 0th epoch."
    },
    {
      "code": 6003,
      "name": "GaugeWrongEpoch",
      "msg": "The gauge is not set to the current epoch."
    },
    {
      "code": 6004,
      "name": "NextEpochNotReached",
      "msg": "The start time for the next epoch has not yet been reached."
    },
    {
      "code": 6005,
      "name": "CannotVoteMustReset",
      "msg": "Must set all votes to 0 before changing votes."
    },
    {
      "code": 6006,
      "name": "CannotVoteGaugeDisabled",
      "msg": "Cannot vote since gauge is disabled; all you may do is set weight to 0."
    },
    {
      "code": 6007,
      "name": "VoteAlreadyCommitted",
      "msg": "You have already committed your vote to this gauge."
    },
    {
      "code": 6008,
      "name": "CannotCommitGaugeDisabled",
      "msg": "Cannot commit votes since gauge is disabled; all you may do is set weight to 0."
    },
    {
      "code": 6009,
      "name": "EpochGaugeNotVoting",
      "msg": "Voting on this epoch gauge is closed."
    },
    {
      "code": 6010,
      "name": "WeightSeqnoChanged",
      "msg": "Gauge voter voting weights have been modified since you started committing your votes. Please withdraw your votes and try again."
    },
    {
      "code": 6011,
      "name": "EpochClosed",
      "msg": "You may no longer modify votes for this epoch."
    },
    {
      "code": 6012,
      "name": "AllocatedPowerMustBeZero",
      "msg": "You must have zero allocated power in order to reset the epoch gauge."
    },
    {
      "code": 6013,
      "name": "CloseEpochNotElapsed",
      "msg": "The epoch in which you are closing an account for has not yet elapsed."
    },
    {
      "code": 6014,
      "name": "UnauthorizedNotDelegate",
      "msg": "You must be the vote delegate of the escrow to perform this action."
    },
    {
      "code": 6015,
      "name": "FeeIsNotClaimed",
      "msg": "You must claimed fee firstly to perform this action."
    },
    {
      "code": 6016,
      "name": "FeeHasBeenClaimed",
      "msg": "Fee has been claimed already."
    },
    {
      "code": 6017,
      "name": "TokenAccountIsNotCorrect",
      "msg": "Token account is not correct."
    },
    {
      "code": 6018,
      "name": "VotingEpochIsNotCorrect",
      "msg": "VotingEpoch is not correct."
    },
    {
      "code": 6019,
      "name": "ClawbackEpochIsNotCorrect",
      "msg": "ClawbackEpoch is not correct."
    },
    {
      "code": 6020,
      "name": "EpochGaugeIsVoted",
      "msg": "EpochGauge is voted."
    },
    {
      "code": 6021,
      "name": "BribeEpochEndError",
      "msg": "Bribe Epoch End must be greater than voting epoch."
    },
    {
      "code": 6022,
      "name": "BribeRewardsIsZero",
      "msg": "Bribe rewards are zero."
    },
    {
      "code": 6023,
      "name": "MathOverflow",
      "msg": "Math overflow."
    },
    {
      "code": 6024,
      "name": "TypeCastFailed",
      "msg": "type cast faled"
    },
    {
      "code": 6025,
      "name": "VotingEpochNotFound",
      "msg": "Voting epoch is not found"
    },
    {
      "code": 6026,
      "name": "RecreatedVotingEpoch",
      "msg": "Recreate voting epoch"
    },
    {
      "code": 6027,
      "name": "InvalidEpoch",
      "msg": "Invalid epoch"
    },
    {
      "code": 6028,
      "name": "BribeHasBeenEnded",
      "msg": "Bribe has been ended."
    },
    {
      "code": 6029,
      "name": "NoMoreBribeReward",
      "msg": "No more bribe rewards."
    }
  ]
};

export const IDL: Gauge = {
  "version": "0.1.0",
  "name": "gauge",
  "docs": [
    "Smart wallet program."
  ],
  "constants": [
    {
      "name": "MAX_BRIBE_EPOCH",
      "type": "u32",
      "value": "200"
    },
    {
      "name": "MAX_EPOCH_PER_GAUGE",
      "type": {
        "defined": "usize"
      },
      "value": "100"
    }
  ],
  "instructions": [
    {
      "name": "createGaugeFactory",
      "docs": [
        "Creates a [GaugeFactory]."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory] to be created."
          ]
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base."
          ]
        },
        {
          "name": "rewarder",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [minter::Rewarder]."
          ]
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[voter::Locker] which determines gauge weights."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer."
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
          "name": "foreman",
          "type": "publicKey"
        },
        {
          "name": "epochDurationSeconds",
          "type": "u32"
        },
        {
          "name": "firstEpochStartsAt",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createGauge",
      "docs": [
        "Creates a [Gauge]. Permissionless."
      ],
      "accounts": [
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge] to be created."
          ]
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[GaugeFactory]."
          ]
        },
        {
          "name": "quarry",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[quarry::Quarry]."
          ]
        },
        {
          "name": "ammPool",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[amm::Amm]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer."
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
      "args": []
    },
    {
      "name": "createGaugeVoter",
      "docs": [
        "Creates a [GaugeVoter]. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[GaugeFactory]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[voter::Escrow]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter] to be created."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer."
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
      "args": []
    },
    {
      "name": "createGaugeVote",
      "docs": [
        "Creates a [GaugeVote]. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVote] to be created."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Gauge voter."
          ]
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer."
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
      "args": []
    },
    {
      "name": "pumpGaugeEpoch",
      "docs": [
        "pump gauge epoch"
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge] to create an [EpochGauge] of."
          ]
        },
        {
          "name": "ammPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAFee",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBFee",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "prepareVote",
      "docs": [
        "Prepare vote Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[GaugeVoter]."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The vote delegate."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "resetVote",
      "docs": [
        "Resets an [EpochGaugeVoter]; that is, syncs the [EpochGaugeVoter]",
        "with the latest power amount only if the votes have yet to be",
        "committed. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory::locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter::escrow]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [EpochGaugeVoter::gauge_voter]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "setVote",
      "docs": [
        "Sets the vote of a [Gauge]."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVote]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The escrow."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The vote delegate."
          ]
        }
      ],
      "args": [
        {
          "name": "weight",
          "type": "u32"
        }
      ]
    },
    {
      "name": "commitVote",
      "docs": [
        "Commits the vote of a [Gauge].",
        "Anyone can call this on any voter's gauge votes."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVote] containing the vote weights."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The escrow."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The vote delegate."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "revertVote",
      "docs": [
        "Reverts a vote commitment of a [Gauge].",
        "Only the voter can call this."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gaugeVoter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The escrow."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The vote delegate.",
            "#[account(mut)]"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "enableGauge",
      "docs": [
        "Enables a [Gauge]."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge] to enable."
          ]
        },
        {
          "name": "foreman",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [GaugeFactorty::foreman]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "disableGauge",
      "docs": [
        "Disables a [Gauge]."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge] to disable."
          ]
        },
        {
          "name": "foreman",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [GaugeFactorty::foreman]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "triggerNextEpoch",
      "docs": [
        "Triggers the next epoch. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "syncGauge",
      "docs": [
        "Synchronizes the [quarry::Quarry] with the relevant [EpochGauge]. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[quarry::Quarry]."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[GaugeFactory::rewarder]."
          ]
        },
        {
          "name": "quarryProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[quarry] program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "syncDisabledGauge",
      "docs": [
        "Sets the [quarry::Quarry] rewards to zero if the gauge is disabled. Permissionless."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "quarry",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[quarry::Quarry]."
          ]
        },
        {
          "name": "rewarder",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[GaugeFactory::rewarder]."
          ]
        },
        {
          "name": "quarryProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[quarry] program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "claimGaugeFee",
      "docs": [
        "Holder claim fee from amm",
        "",
        "Only the [voter::Escrow::vote_delegate] may call this."
      ],
      "accounts": [
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gaugeVote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeVote]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Escrow] which owns this [EpochGaugeVote]."
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ammPool",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ammProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [Escrow::vote_delegate]."
          ]
        }
      ],
      "args": [
        {
          "name": "toEpoch",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createGaugeBribe",
      "docs": [
        "Create an [Bribe]",
        "",
        "Permissionless, anyone can crate bribe"
      ],
      "accounts": [
        {
          "name": "bribe",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Bribe] to be created."
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
            "Payer."
          ]
        },
        {
          "name": "gaugeFactory",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "tokenAccountVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[TokenAccount] holding the token [Mint]."
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMint",
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
          "name": "rewardEachEpoch",
          "type": "u64"
        },
        {
          "name": "bribeEpochEnd",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createEpochBribeVoter",
      "accounts": [
        {
          "name": "bribe",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Bribe]"
          ]
        },
        {
          "name": "epochBribeVoter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The [Escrow::vote_delegate]."
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
      "args": []
    },
    {
      "name": "claimGaugeBribe",
      "docs": [
        "Claim an [Bribe] for voting epoch",
        "",
        "Permissionless, anyone can crate bribe"
      ],
      "accounts": [
        {
          "name": "bribe",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Bribe]"
          ]
        },
        {
          "name": "epochBribeVoter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gaugeVoter",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gaugeVote",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeVoter]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "tokenAccountVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Escrow] which owns this [EpochGaugeVote]."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The [Escrow::vote_delegate]."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "clawbackBribeGaugeEpoch",
      "docs": [
        "Rescue an [Bribe] for voting epoch",
        "",
        "Briber claim rewards back in case onbody vote for a gauge in this epoch"
      ],
      "accounts": [
        {
          "name": "bribe",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Bribe]"
          ]
        },
        {
          "name": "gaugeFactory",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [GaugeFactory]."
          ]
        },
        {
          "name": "gauge",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Gauge]."
          ]
        },
        {
          "name": "tokenAccountVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "briber",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "votingEpoch",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gaugeFactory",
      "docs": [
        "Manages the rewards shares of all [Gauge]s of a [quarry::rewarder]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          },
          {
            "name": "rewarder",
            "type": "publicKey"
          },
          {
            "name": "locker",
            "docs": [
              "The [voter::Locker]."
            ],
            "type": "publicKey"
          },
          {
            "name": "foreman",
            "docs": [
              "Account which may enable/disable gauges on the [GaugeFactory].",
              "Normally this should be smartwallet",
              "May call the following instructions:",
              "- gauge_enable",
              "- gauge_disable"
            ],
            "type": "publicKey"
          },
          {
            "name": "epochDurationSeconds",
            "docs": [
              "Number of seconds per rewards epoch.",
              "This may be modified later.",
              "The epoch duration is not exact, as epochs must manually be incremented."
            ],
            "type": "u32"
          },
          {
            "name": "currentVotingEpoch",
            "docs": [
              "The current voting epoch, start from 1"
            ],
            "type": "u32"
          },
          {
            "name": "nextEpochStartsAt",
            "docs": [
              "When the next epoch starts."
            ],
            "type": "u64"
          },
          {
            "name": "bribeIndex",
            "docs": [
              "bribe index"
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "gauge",
      "docs": [
        "A [Gauge] determines the rewards shares to give to a [quarry::Quarry]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gaugeFactory",
            "docs": [
              "The [GaugeFactory]."
            ],
            "type": "publicKey"
          },
          {
            "name": "quarry",
            "docs": [
              "The [quarry::Quarry] being voted on."
            ],
            "type": "publicKey"
          },
          {
            "name": "ammPool",
            "docs": [
              "The [amm::Amm] being voted on.",
              "Can be meteora pool or Lbclmm"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenAFeeKey",
            "docs": [
              "token_a_fee_key of amm pool"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenBFeeKey",
            "docs": [
              "token_b_fee_key of amm pool"
            ],
            "type": "publicKey"
          },
          {
            "name": "cummulativeTokenAFee",
            "docs": [
              "Total fee of token a in all epochs so far"
            ],
            "type": "u128"
          },
          {
            "name": "cummulativeTokenBFee",
            "docs": [
              "Total fee of token b in all epochs so far"
            ],
            "type": "u128"
          },
          {
            "name": "cummulativeClaimedTokenAFee",
            "docs": [
              "Total claimed fee of token a in all epochs so far",
              "invariant: token_a_fee.amount + cummulative_claimed_token_a_fee = cummulative_token_a_fee"
            ],
            "type": "u128"
          },
          {
            "name": "cummulativeClaimedTokenBFee",
            "docs": [
              "Total claimed fee of token b in all epochs so far"
            ],
            "type": "u128"
          },
          {
            "name": "tokenAMint",
            "docs": [
              "token_a_mint of amm pool, only used for tracking"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenBMint",
            "docs": [
              "token_b_fee_mint of amm pool, only used for tracking"
            ],
            "type": "publicKey"
          },
          {
            "name": "currentIndex",
            "docs": [
              "ring buffer to store vote for all epochs"
            ],
            "type": "u64"
          },
          {
            "name": "isDisabled",
            "docs": [
              "If true, this Gauge cannot receive any more votes",
              "and rewards shares cannot be synchronized from it."
            ],
            "type": "u32"
          },
          {
            "name": "ammType",
            "docs": [
              "Gauge type"
            ],
            "type": "u32"
          },
          {
            "name": "voteEpochs",
            "type": {
              "array": [
                {
                  "defined": "EpochGauge"
                },
                100
              ]
            }
          }
        ]
      }
    },
    {
      "name": "gaugeVoter",
      "docs": [
        "A [GaugeVoter] represents an [voter::Escrow] that can vote on gauges."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gaugeFactory",
            "docs": [
              "The [GaugeFactory]."
            ],
            "type": "publicKey"
          },
          {
            "name": "escrow",
            "docs": [
              "The Escrow of the [GaugeVoter]."
            ],
            "type": "publicKey"
          },
          {
            "name": "owner",
            "docs": [
              "Owner of the Escrow of the [GaugeVoter]."
            ],
            "type": "publicKey"
          },
          {
            "name": "weightChangeSeqno",
            "docs": [
              "This number gets incremented whenever weights are changed.",
              "Use this to determine if votes must be re-committed.",
              "",
              "This is primarily used when provisioning an [EpochGaugeVoter]:",
              "1. When one wants to commit their votes, they call [gauge::prepare_epoch_gauge_voter]",
              "2. The [Self::weight_change_seqno] gets written to [EpochGaugeVoter::weight_change_seqno].",
              "3. In [gauge::gauge_commit_vote], if the [Self::weight_change_seqno] has changed, the transaction is blocked with a [crate::ErrorCode::WeightSeqnoChanged] error."
            ],
            "type": "u64"
          },
          {
            "name": "totalWeight",
            "docs": [
              "Total number of parts that the voter has distributed."
            ],
            "type": "u32"
          },
          {
            "name": "currentIndex",
            "docs": [
              "ring buffer to store epochgaugeVoter"
            ],
            "type": "u32"
          },
          {
            "name": "padding",
            "type": "u64"
          },
          {
            "name": "voteEpochs",
            "type": {
              "array": [
                {
                  "defined": "EpochGaugeVoter"
                },
                100
              ]
            }
          }
        ]
      }
    },
    {
      "name": "gaugeVote",
      "docs": [
        "A [GaugeVote] is a user's vote for a given [Gauge]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gaugeVoter",
            "docs": [
              "The [GaugeVoter]."
            ],
            "type": "publicKey"
          },
          {
            "name": "gauge",
            "docs": [
              "The [Gauge] being voted on."
            ],
            "type": "publicKey"
          },
          {
            "name": "weight",
            "docs": [
              "Proportion of votes that the voter is applying to this gauge."
            ],
            "type": "u32"
          },
          {
            "name": "padding1",
            "type": {
              "array": [
                "u8",
                12
              ]
            }
          },
          {
            "name": "claimedTokenAFee",
            "docs": [
              "stats to track how many fee user has claimed"
            ],
            "type": "u128"
          },
          {
            "name": "claimedTokenBFee",
            "docs": [
              "stats to track how many fee user has claimed"
            ],
            "type": "u128"
          },
          {
            "name": "currentIndex",
            "docs": [
              "ring buffer to store vote for all epochs"
            ],
            "type": "u64"
          },
          {
            "name": "lastClaimAFeeEpoch",
            "type": "u32"
          },
          {
            "name": "lastClaimBFeeEpoch",
            "type": "u32"
          },
          {
            "name": "voteEpochs",
            "type": {
              "array": [
                {
                  "defined": "GaugeVoteItem"
                },
                100
              ]
            }
          }
        ]
      }
    },
    {
      "name": "bribe",
      "docs": [
        "Bribe with a gauge"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gauge",
            "docs": [
              "The gauge bribe for"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "token mint of the bribe"
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardEachEpoch",
            "docs": [
              "reward for each epoch of bribe"
            ],
            "type": "u64"
          },
          {
            "name": "briber",
            "docs": [
              "user who give the bribe"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenAccountVault",
            "docs": [
              "token account store bribe"
            ],
            "type": "publicKey"
          },
          {
            "name": "bribeRewardsEpochStart",
            "docs": [
              "When bribe epoch end"
            ],
            "type": "u32"
          },
          {
            "name": "bribeRewardsEpochEnd",
            "docs": [
              "When bribe epoch end"
            ],
            "type": "u32"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "Claimed amount, just for display"
            ],
            "type": "u64"
          },
          {
            "name": "bribeIndex",
            "docs": [
              "bribe index"
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "epochBribeVoter",
      "docs": [
        "An [EpochBribeVoter]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bribe",
            "docs": [
              "The [Bribe]."
            ],
            "type": "publicKey"
          },
          {
            "name": "gaugeVoter",
            "docs": [
              "gauge voter"
            ],
            "type": "publicKey"
          },
          {
            "name": "lastClaimedEpoch",
            "docs": [
              "last claimed epoch"
            ],
            "type": "u32"
          },
          {
            "name": "claimedAmount",
            "docs": [
              "claimed amount"
            ],
            "type": "u128"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GaugeVoteItem",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingEpoch",
            "type": "u32"
          },
          {
            "name": "padding",
            "type": "u32"
          },
          {
            "name": "allocatedPower",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "EpochGauge",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingEpoch",
            "type": "u32"
          },
          {
            "name": "padding",
            "type": "u32"
          },
          {
            "name": "totalPower",
            "type": "u64"
          },
          {
            "name": "tokenAFee",
            "docs": [
              "Token a fee in this epoch"
            ],
            "type": "u128"
          },
          {
            "name": "tokenBFee",
            "docs": [
              "Token b fee in this epoch"
            ],
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "EpochGaugeVoter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingEpoch",
            "type": "u32"
          },
          {
            "name": "padding",
            "type": "u32"
          },
          {
            "name": "weightChangeSeqno",
            "type": "u64"
          },
          {
            "name": "votingPower",
            "docs": [
              "The total amount of voting power."
            ],
            "type": "u64"
          },
          {
            "name": "allocatedPower",
            "docs": [
              "The total amount of gauge voting power that has been allocated.",
              "If this number is non-zero, vote weights cannot be changed until they are all withdrawn."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ClaimGaugeBribeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribe",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "rewards",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAccount",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrow",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ClaimGaugeFeeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "toEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "feeAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "feeMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrow",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ClawbackBribeGaugeEpochEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribe",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": true
        }
      ]
    },
    {
      "name": "CommitVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "voteSharesForNextEpoch",
          "type": "u64",
          "index": false
        },
        {
          "name": "updatedAllocatedPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "updatedTotalPower",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CreateEpochBribeVoterEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribe",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "gaugeVoter",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "CreateGaugeBribeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribe",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "bribeRewardsEpochStart",
          "type": "u32",
          "index": false
        },
        {
          "name": "bribeRewardsEpochEnd",
          "type": "u32",
          "index": false
        },
        {
          "name": "rewardEachEpoch",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CreateGaugeFactoryEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "rewarder",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "foreman",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "firstRewardsEpoch",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CreateGaugeVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CreateGaugeVoterEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "rewarder",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        }
      ]
    },
    {
      "name": "CreateGaugeEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "ammPool",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "quarry",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "ammType",
          "type": "u32",
          "index": false
        }
      ]
    },
    {
      "name": "DisableGaugeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "foreman",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "EnableGaugeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "foreman",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "PrepareVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "rewarder",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "locker",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "votingPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "weightChangeSeqno",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "PumpGaugeEpochEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": true
        },
        {
          "name": "tokenAFee",
          "type": "u128",
          "index": false
        },
        {
          "name": "tokenBFee",
          "type": "u128",
          "index": false
        }
      ]
    },
    {
      "name": "ResetVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "prevVotingPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "votingPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "prevWeightChangeSeqno",
          "type": "u64",
          "index": false
        },
        {
          "name": "weightChangeSeqno",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "RevertVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "subtractedPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "updatedAllocatedPower",
          "type": "u64",
          "index": false
        },
        {
          "name": "updatedTotalPower",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "SetVoteEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gauge",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "gaugeVoterOwner",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "voteDelegate",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "prevTotalWeight",
          "type": "u32",
          "index": false
        },
        {
          "name": "totalWeight",
          "type": "u32",
          "index": false
        },
        {
          "name": "weightChangeSeqno",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "SyncGaugeEvent",
      "fields": [
        {
          "name": "gauge",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "epoch",
          "type": "u32",
          "index": false
        },
        {
          "name": "previousShare",
          "type": "u64",
          "index": false
        },
        {
          "name": "newShare",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "TriggerNextEpochEvent",
      "fields": [
        {
          "name": "gaugeFactory",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "votingEpoch",
          "type": "u32",
          "index": true
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "WrongAccount",
      "msg": "The give account is not correct."
    },
    {
      "code": 6001,
      "name": "UnauthorizedNotForeman",
      "msg": "You must be the foreman to perform this action."
    },
    {
      "code": 6002,
      "name": "GaugeEpochCannotBeZero",
      "msg": "Cannot sync gauges at the 0th epoch."
    },
    {
      "code": 6003,
      "name": "GaugeWrongEpoch",
      "msg": "The gauge is not set to the current epoch."
    },
    {
      "code": 6004,
      "name": "NextEpochNotReached",
      "msg": "The start time for the next epoch has not yet been reached."
    },
    {
      "code": 6005,
      "name": "CannotVoteMustReset",
      "msg": "Must set all votes to 0 before changing votes."
    },
    {
      "code": 6006,
      "name": "CannotVoteGaugeDisabled",
      "msg": "Cannot vote since gauge is disabled; all you may do is set weight to 0."
    },
    {
      "code": 6007,
      "name": "VoteAlreadyCommitted",
      "msg": "You have already committed your vote to this gauge."
    },
    {
      "code": 6008,
      "name": "CannotCommitGaugeDisabled",
      "msg": "Cannot commit votes since gauge is disabled; all you may do is set weight to 0."
    },
    {
      "code": 6009,
      "name": "EpochGaugeNotVoting",
      "msg": "Voting on this epoch gauge is closed."
    },
    {
      "code": 6010,
      "name": "WeightSeqnoChanged",
      "msg": "Gauge voter voting weights have been modified since you started committing your votes. Please withdraw your votes and try again."
    },
    {
      "code": 6011,
      "name": "EpochClosed",
      "msg": "You may no longer modify votes for this epoch."
    },
    {
      "code": 6012,
      "name": "AllocatedPowerMustBeZero",
      "msg": "You must have zero allocated power in order to reset the epoch gauge."
    },
    {
      "code": 6013,
      "name": "CloseEpochNotElapsed",
      "msg": "The epoch in which you are closing an account for has not yet elapsed."
    },
    {
      "code": 6014,
      "name": "UnauthorizedNotDelegate",
      "msg": "You must be the vote delegate of the escrow to perform this action."
    },
    {
      "code": 6015,
      "name": "FeeIsNotClaimed",
      "msg": "You must claimed fee firstly to perform this action."
    },
    {
      "code": 6016,
      "name": "FeeHasBeenClaimed",
      "msg": "Fee has been claimed already."
    },
    {
      "code": 6017,
      "name": "TokenAccountIsNotCorrect",
      "msg": "Token account is not correct."
    },
    {
      "code": 6018,
      "name": "VotingEpochIsNotCorrect",
      "msg": "VotingEpoch is not correct."
    },
    {
      "code": 6019,
      "name": "ClawbackEpochIsNotCorrect",
      "msg": "ClawbackEpoch is not correct."
    },
    {
      "code": 6020,
      "name": "EpochGaugeIsVoted",
      "msg": "EpochGauge is voted."
    },
    {
      "code": 6021,
      "name": "BribeEpochEndError",
      "msg": "Bribe Epoch End must be greater than voting epoch."
    },
    {
      "code": 6022,
      "name": "BribeRewardsIsZero",
      "msg": "Bribe rewards are zero."
    },
    {
      "code": 6023,
      "name": "MathOverflow",
      "msg": "Math overflow."
    },
    {
      "code": 6024,
      "name": "TypeCastFailed",
      "msg": "type cast faled"
    },
    {
      "code": 6025,
      "name": "VotingEpochNotFound",
      "msg": "Voting epoch is not found"
    },
    {
      "code": 6026,
      "name": "RecreatedVotingEpoch",
      "msg": "Recreate voting epoch"
    },
    {
      "code": 6027,
      "name": "InvalidEpoch",
      "msg": "Invalid epoch"
    },
    {
      "code": 6028,
      "name": "BribeHasBeenEnded",
      "msg": "Bribe has been ended."
    },
    {
      "code": 6029,
      "name": "NoMoreBribeReward",
      "msg": "No more bribe rewards."
    }
  ]
};
