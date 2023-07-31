export type Voter = {
  "version": "0.1.0",
  "name": "voter",
  "docs": [
    "Locked voter program."
  ],
  "instructions": [
    {
      "name": "newLocker",
      "docs": [
        "Creates a new [Locker]."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base."
          ]
        },
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Mint of the token that can be used to join the [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Governor] associated with the [Locker]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the initialization."
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
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "params",
          "type": {
            "defined": "LockerParams"
          }
        }
      ]
    },
    {
      "name": "changeLockerExpiration",
      "docs": [
        "change locker expiration [Locker]."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The smart wallet on the [Governor]."
          ]
        }
      ],
      "args": [
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "newEscrow",
      "docs": [
        "Creates a new [Escrow] for an account.",
        "",
        "A Vote Escrow, or [Escrow] for short, is an agreement between an account (known as the `authority`) and the DAO to",
        "lock up tokens for a specific period of time, in exchange for voting rights",
        "linearly proportional to the amount of votes given."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the initialization."
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
      "name": "increaseLockedAmount",
      "docs": [
        "increase locked amount [Escrow]."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Escrow]."
          ]
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token account held by the [Escrow]."
          ]
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority [Self::source_tokens], Anyone can increase amount for user"
          ]
        },
        {
          "name": "sourceTokens",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The source of deposited tokens."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program."
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
      "name": "extendLockDuration",
      "docs": [
        "extend locked duration [Escrow]."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the [Escrow] and"
          ]
        }
      ],
      "args": [
        {
          "name": "duration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "toggleMaxLock",
      "docs": [
        "toogle max lock [Escrow]."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the [Escrow] and"
          ]
        }
      ],
      "args": [
        {
          "name": "isMaxLock",
          "type": "bool"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Exits the DAO; i.e., withdraws all staked tokens in an [Escrow] if the [Escrow] is unlocked."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Locker] being exited from."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Escrow] that is being closed."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the [Escrow]."
          ]
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Tokens locked up in the [Escrow]."
          ]
        },
        {
          "name": "destinationTokens",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Destination for the tokens to unlock."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The payer to receive the rent refund."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "activateProposal",
      "docs": [
        "Activates a proposal in token launch phase"
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Proposal]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The user's [Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [Escrow]'s owner."
          ]
        },
        {
          "name": "governProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [govern] program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "activateProposalInitialPhase",
      "docs": [
        "Activates a proposal in inital phase"
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Proposal]."
          ]
        },
        {
          "name": "governProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [govern] program."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The smart wallet on the [Governor]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "castVote",
      "docs": [
        "Casts a vote."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Escrow] that is voting."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Vote delegate of the [Escrow]."
          ]
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Proposal] being voted on."
          ]
        },
        {
          "name": "vote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Vote]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "governProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [govern] program."
          ]
        }
      ],
      "args": [
        {
          "name": "side",
          "type": "u8"
        }
      ]
    },
    {
      "name": "setVoteDelegate",
      "docs": [
        "Delegate escrow vote."
      ],
      "accounts": [
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The owner of the [Escrow]."
          ]
        }
      ],
      "args": [
        {
          "name": "newDelegate",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setLockerParams",
      "docs": [
        "Set locker params."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The smart wallet on the [Governor]."
          ]
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "LockerParams"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "locker",
      "docs": [
        "A group of [Escrow]s."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base account used to generate signer seeds."
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
            "name": "tokenMint",
            "docs": [
              "Mint of the token that must be locked in the [Locker]."
            ],
            "type": "publicKey"
          },
          {
            "name": "lockedSupply",
            "docs": [
              "Total number of tokens locked in [Escrow]s."
            ],
            "type": "u64"
          },
          {
            "name": "governor",
            "docs": [
              "Governor associated with the [Locker]."
            ],
            "type": "publicKey"
          },
          {
            "name": "expiration",
            "docs": [
              "Indicate whether a locker expired, if then all escrow can be withdraw before expiration",
              "This is only used for our initial phase, in the next phase, smartwallet cannot change expiration"
            ],
            "type": "i64"
          },
          {
            "name": "params",
            "docs": [
              "Mutable parameters of how a [Locker] should behave."
            ],
            "type": {
              "defined": "LockerParams"
            }
          }
        ]
      }
    },
    {
      "name": "escrow",
      "docs": [
        "Locks tokens on behalf of a user."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "locker",
            "docs": [
              "The [Locker] that this [Escrow] is part of."
            ],
            "type": "publicKey"
          },
          {
            "name": "owner",
            "docs": [
              "The key of the account that is authorized to stake into/withdraw from this [Escrow]."
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
            "name": "tokens",
            "docs": [
              "The token account holding the escrow tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount of tokens staked."
            ],
            "type": "u64"
          },
          {
            "name": "escrowStartedAt",
            "docs": [
              "When the [Escrow::owner] started their escrow."
            ],
            "type": "i64"
          },
          {
            "name": "escrowEndsAt",
            "docs": [
              "When the escrow unlocks; i.e. the [Escrow::owner] is scheduled to be allowed to withdraw their tokens."
            ],
            "type": "i64"
          },
          {
            "name": "voteDelegate",
            "docs": [
              "Account that is authorized to vote on behalf of this [Escrow].",
              "Defaults to the [Escrow::owner]."
            ],
            "type": "publicKey"
          },
          {
            "name": "isMaxLock",
            "docs": [
              "Max lock"
            ],
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "LockerParams",
      "docs": [
        "Contains parameters for the [Locker]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxStakeVoteMultiplier",
            "docs": [
              "The weight of a maximum vote lock relative to the total number of tokens locked.",
              "For example, veCRV is 10 because 1 CRV locked for 4 years = 10 veCRV."
            ],
            "type": "u8"
          },
          {
            "name": "minStakeDuration",
            "docs": [
              "Minimum staking duration."
            ],
            "type": "u64"
          },
          {
            "name": "maxStakeDuration",
            "docs": [
              "Maximum staking duration."
            ],
            "type": "u64"
          },
          {
            "name": "proposalActivationMinVotes",
            "docs": [
              "Minimum number of votes required to activate a proposal."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Phase",
      "docs": [
        "Phase"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InitialPhase"
          },
          {
            "name": "TokenLaunchPhase"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ChangeLockerExpirationEvent",
      "fields": [
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "prevExpiration",
          "type": "i64",
          "index": false
        },
        {
          "name": "newExpiration",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ExtendLockDurationEvent",
      "fields": [
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "lockerSupply",
          "type": "u64",
          "index": false
        },
        {
          "name": "duration",
          "type": "i64",
          "index": false
        },
        {
          "name": "prevEscrowEndsAt",
          "type": "i64",
          "index": false
        },
        {
          "name": "nextEscrowEndsAt",
          "type": "i64",
          "index": false
        },
        {
          "name": "nextEscrowStartedAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "IncreaseLockedAmountEvent",
      "fields": [
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "lockerSupply",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "NewEscrowEvent",
      "fields": [
        {
          "name": "escrow",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "locker",
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
      "name": "NewLockerEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "params",
          "type": {
            "defined": "LockerParams"
          },
          "index": false
        }
      ]
    },
    {
      "name": "LockerSetParamsEvent",
      "fields": [
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "prevParams",
          "type": {
            "defined": "LockerParams"
          },
          "index": false
        },
        {
          "name": "params",
          "type": {
            "defined": "LockerParams"
          },
          "index": false
        }
      ]
    },
    {
      "name": "SetVoteDelegateEvent",
      "fields": [
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldDelegate",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newDelegate",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ExitEscrowEvent",
      "fields": [
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "lockerSupply",
          "type": "u64",
          "index": false
        },
        {
          "name": "releasedAmount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "LockupDurationTooShort",
      "msg": "Lockup duration must at least be the min stake duration"
    },
    {
      "code": 6001,
      "name": "LockupDurationTooLong",
      "msg": "Lockup duration must at most be the max stake duration"
    },
    {
      "code": 6002,
      "name": "RefreshCannotShorten",
      "msg": "A voting escrow refresh cannot shorten the escrow time remaining"
    },
    {
      "code": 6003,
      "name": "EscrowNotEnded",
      "msg": "Escrow has not ended"
    },
    {
      "code": 6004,
      "name": "MaxLockIsSet",
      "msg": "Maxlock is set"
    },
    {
      "code": 6005,
      "name": "ExpirationIsLessThanCurrentTime",
      "msg": "Cannot set expiration less than the current time"
    },
    {
      "code": 6006,
      "name": "LockerIsExpired",
      "msg": "Locker is expired"
    },
    {
      "code": 6007,
      "name": "ExpirationIsNotZero",
      "msg": "Expiration is not zero"
    },
    {
      "code": 6008,
      "name": "AmountIsZero",
      "msg": "Amount is zero"
    }
  ]
};

export const IDL: Voter = {
  "version": "0.1.0",
  "name": "voter",
  "docs": [
    "Locked voter program."
  ],
  "instructions": [
    {
      "name": "newLocker",
      "docs": [
        "Creates a new [Locker]."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base."
          ]
        },
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Mint of the token that can be used to join the [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Governor] associated with the [Locker]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the initialization."
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
          "name": "expiration",
          "type": "i64"
        },
        {
          "name": "params",
          "type": {
            "defined": "LockerParams"
          }
        }
      ]
    },
    {
      "name": "changeLockerExpiration",
      "docs": [
        "change locker expiration [Locker]."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The smart wallet on the [Governor]."
          ]
        }
      ],
      "args": [
        {
          "name": "expiration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "newEscrow",
      "docs": [
        "Creates a new [Escrow] for an account.",
        "",
        "A Vote Escrow, or [Escrow] for short, is an agreement between an account (known as the `authority`) and the DAO to",
        "lock up tokens for a specific period of time, in exchange for voting rights",
        "linearly proportional to the amount of votes given."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the initialization."
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
      "name": "increaseLockedAmount",
      "docs": [
        "increase locked amount [Escrow]."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Escrow]."
          ]
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token account held by the [Escrow]."
          ]
        },
        {
          "name": "payer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority [Self::source_tokens], Anyone can increase amount for user"
          ]
        },
        {
          "name": "sourceTokens",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The source of deposited tokens."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program."
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
      "name": "extendLockDuration",
      "docs": [
        "extend locked duration [Escrow]."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the [Escrow] and"
          ]
        }
      ],
      "args": [
        {
          "name": "duration",
          "type": "i64"
        }
      ]
    },
    {
      "name": "toggleMaxLock",
      "docs": [
        "toogle max lock [Escrow]."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "[Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the [Escrow] and"
          ]
        }
      ],
      "args": [
        {
          "name": "isMaxLock",
          "type": "bool"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Exits the DAO; i.e., withdraws all staked tokens in an [Escrow] if the [Escrow] is unlocked."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Locker] being exited from."
          ]
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Escrow] that is being closed."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the [Escrow]."
          ]
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Tokens locked up in the [Escrow]."
          ]
        },
        {
          "name": "destinationTokens",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Destination for the tokens to unlock."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The payer to receive the rent refund."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "activateProposal",
      "docs": [
        "Activates a proposal in token launch phase"
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Proposal]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The user's [Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [Escrow]'s owner."
          ]
        },
        {
          "name": "governProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [govern] program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "activateProposalInitialPhase",
      "docs": [
        "Activates a proposal in inital phase"
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Proposal]."
          ]
        },
        {
          "name": "governProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [govern] program."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The smart wallet on the [Governor]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "castVote",
      "docs": [
        "Casts a vote."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "escrow",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Escrow] that is voting."
          ]
        },
        {
          "name": "voteDelegate",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Vote delegate of the [Escrow]."
          ]
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Proposal] being voted on."
          ]
        },
        {
          "name": "vote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Vote]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "governProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [govern] program."
          ]
        }
      ],
      "args": [
        {
          "name": "side",
          "type": "u8"
        }
      ]
    },
    {
      "name": "setVoteDelegate",
      "docs": [
        "Delegate escrow vote."
      ],
      "accounts": [
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Escrow]."
          ]
        },
        {
          "name": "escrowOwner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The owner of the [Escrow]."
          ]
        }
      ],
      "args": [
        {
          "name": "newDelegate",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setLockerParams",
      "docs": [
        "Set locker params."
      ],
      "accounts": [
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Locker]."
          ]
        },
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Governor]."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The smart wallet on the [Governor]."
          ]
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "LockerParams"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "locker",
      "docs": [
        "A group of [Escrow]s."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base account used to generate signer seeds."
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
            "name": "tokenMint",
            "docs": [
              "Mint of the token that must be locked in the [Locker]."
            ],
            "type": "publicKey"
          },
          {
            "name": "lockedSupply",
            "docs": [
              "Total number of tokens locked in [Escrow]s."
            ],
            "type": "u64"
          },
          {
            "name": "governor",
            "docs": [
              "Governor associated with the [Locker]."
            ],
            "type": "publicKey"
          },
          {
            "name": "expiration",
            "docs": [
              "Indicate whether a locker expired, if then all escrow can be withdraw before expiration",
              "This is only used for our initial phase, in the next phase, smartwallet cannot change expiration"
            ],
            "type": "i64"
          },
          {
            "name": "params",
            "docs": [
              "Mutable parameters of how a [Locker] should behave."
            ],
            "type": {
              "defined": "LockerParams"
            }
          }
        ]
      }
    },
    {
      "name": "escrow",
      "docs": [
        "Locks tokens on behalf of a user."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "locker",
            "docs": [
              "The [Locker] that this [Escrow] is part of."
            ],
            "type": "publicKey"
          },
          {
            "name": "owner",
            "docs": [
              "The key of the account that is authorized to stake into/withdraw from this [Escrow]."
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
            "name": "tokens",
            "docs": [
              "The token account holding the escrow tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount of tokens staked."
            ],
            "type": "u64"
          },
          {
            "name": "escrowStartedAt",
            "docs": [
              "When the [Escrow::owner] started their escrow."
            ],
            "type": "i64"
          },
          {
            "name": "escrowEndsAt",
            "docs": [
              "When the escrow unlocks; i.e. the [Escrow::owner] is scheduled to be allowed to withdraw their tokens."
            ],
            "type": "i64"
          },
          {
            "name": "voteDelegate",
            "docs": [
              "Account that is authorized to vote on behalf of this [Escrow].",
              "Defaults to the [Escrow::owner]."
            ],
            "type": "publicKey"
          },
          {
            "name": "isMaxLock",
            "docs": [
              "Max lock"
            ],
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "LockerParams",
      "docs": [
        "Contains parameters for the [Locker]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxStakeVoteMultiplier",
            "docs": [
              "The weight of a maximum vote lock relative to the total number of tokens locked.",
              "For example, veCRV is 10 because 1 CRV locked for 4 years = 10 veCRV."
            ],
            "type": "u8"
          },
          {
            "name": "minStakeDuration",
            "docs": [
              "Minimum staking duration."
            ],
            "type": "u64"
          },
          {
            "name": "maxStakeDuration",
            "docs": [
              "Maximum staking duration."
            ],
            "type": "u64"
          },
          {
            "name": "proposalActivationMinVotes",
            "docs": [
              "Minimum number of votes required to activate a proposal."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Phase",
      "docs": [
        "Phase"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InitialPhase"
          },
          {
            "name": "TokenLaunchPhase"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ChangeLockerExpirationEvent",
      "fields": [
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "prevExpiration",
          "type": "i64",
          "index": false
        },
        {
          "name": "newExpiration",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ExtendLockDurationEvent",
      "fields": [
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "lockerSupply",
          "type": "u64",
          "index": false
        },
        {
          "name": "duration",
          "type": "i64",
          "index": false
        },
        {
          "name": "prevEscrowEndsAt",
          "type": "i64",
          "index": false
        },
        {
          "name": "nextEscrowEndsAt",
          "type": "i64",
          "index": false
        },
        {
          "name": "nextEscrowStartedAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "IncreaseLockedAmountEvent",
      "fields": [
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "lockerSupply",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "NewEscrowEvent",
      "fields": [
        {
          "name": "escrow",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "locker",
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
      "name": "NewLockerEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "params",
          "type": {
            "defined": "LockerParams"
          },
          "index": false
        }
      ]
    },
    {
      "name": "LockerSetParamsEvent",
      "fields": [
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "prevParams",
          "type": {
            "defined": "LockerParams"
          },
          "index": false
        },
        {
          "name": "params",
          "type": {
            "defined": "LockerParams"
          },
          "index": false
        }
      ]
    },
    {
      "name": "SetVoteDelegateEvent",
      "fields": [
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "oldDelegate",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newDelegate",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "ExitEscrowEvent",
      "fields": [
        {
          "name": "escrowOwner",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "locker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "lockerSupply",
          "type": "u64",
          "index": false
        },
        {
          "name": "releasedAmount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "LockupDurationTooShort",
      "msg": "Lockup duration must at least be the min stake duration"
    },
    {
      "code": 6001,
      "name": "LockupDurationTooLong",
      "msg": "Lockup duration must at most be the max stake duration"
    },
    {
      "code": 6002,
      "name": "RefreshCannotShorten",
      "msg": "A voting escrow refresh cannot shorten the escrow time remaining"
    },
    {
      "code": 6003,
      "name": "EscrowNotEnded",
      "msg": "Escrow has not ended"
    },
    {
      "code": 6004,
      "name": "MaxLockIsSet",
      "msg": "Maxlock is set"
    },
    {
      "code": 6005,
      "name": "ExpirationIsLessThanCurrentTime",
      "msg": "Cannot set expiration less than the current time"
    },
    {
      "code": 6006,
      "name": "LockerIsExpired",
      "msg": "Locker is expired"
    },
    {
      "code": 6007,
      "name": "ExpirationIsNotZero",
      "msg": "Expiration is not zero"
    },
    {
      "code": 6008,
      "name": "AmountIsZero",
      "msg": "Amount is zero"
    }
  ]
};
