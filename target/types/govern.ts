export type Govern = {
  "version": "0.1.0",
  "name": "govern",
  "docs": [
    "The [govern] program."
  ],
  "instructions": [
    {
      "name": "createGovernor",
      "docs": [
        "Creates a [Governor]."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base of the [Governor] key."
          ]
        },
        {
          "name": "governor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Governor."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Smart Wallet."
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
          "name": "locker",
          "type": "publicKey"
        },
        {
          "name": "params",
          "type": {
            "defined": "GovernanceParameters"
          }
        }
      ]
    },
    {
      "name": "createProposal",
      "docs": [
        "Creates a [Proposal].",
        "This may be called by anyone, since the [Proposal] does not do anything until",
        "it is activated in [activate_proposal]."
      ],
      "accounts": [
        {
          "name": "governor",
          "isMut": true,
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
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Proposer of the proposal."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the proposal."
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
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "instructions",
          "type": {
            "vec": {
              "defined": "ProposalInstruction"
            }
          }
        }
      ]
    },
    {
      "name": "activateProposal",
      "docs": [
        "Activates a proposal.",
        "Only the [Governor::voter] may call this; that program",
        "may ensure that only certain types of users can activate proposals."
      ],
      "accounts": [
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
            "The [Proposal] to activate."
          ]
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The locker of the [Governor] that may activate the proposal."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "cancelProposal",
      "docs": [
        "Cancels a proposal.",
        "This is only callable by the creator of the proposal."
      ],
      "accounts": [
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
            "The [Proposal] to activate."
          ]
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [Proposal::proposer]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "queueProposal",
      "docs": [
        "Queues a proposal for execution by the [SmartWallet]."
      ],
      "accounts": [
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Governor."
          ]
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The Proposal to queue."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The transaction key of the proposal.",
            "This account is passed to and validated by the Smart Wallet program to be initialized."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The Smart Wallet."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the queued transaction."
          ]
        },
        {
          "name": "smartWalletProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Smart Wallet program."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The System program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "newVote",
      "docs": [
        "Creates a new [Vote]. Anyone can call this."
      ],
      "accounts": [
        {
          "name": "proposal",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Proposal being voted on."
          ]
        },
        {
          "name": "vote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vote."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the [Vote]."
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
          "name": "voter",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setVote",
      "docs": [
        "Sets a [Vote] weight and side.",
        "This may only be called by the [Governor::voter]."
      ],
      "accounts": [
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
          "name": "vote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Vote]."
          ]
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [Governor::locker]."
          ]
        }
      ],
      "args": [
        {
          "name": "side",
          "type": "u8"
        },
        {
          "name": "weight",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setGovernanceParams",
      "docs": [
        "Sets the [GovernanceParameters].",
        "This may only be called by the [Governor::smart_wallet]."
      ],
      "accounts": [
        {
          "name": "governor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Governor]"
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The Smart Wallet."
          ]
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "GovernanceParameters"
          }
        }
      ]
    },
    {
      "name": "setLocker",
      "docs": [
        "Sets the locker of the [Governor]."
      ],
      "accounts": [
        {
          "name": "governor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Governor]"
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The Smart Wallet."
          ]
        }
      ],
      "args": [
        {
          "name": "newLocker",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createProposalMeta",
      "docs": [
        "Creates a [ProposalMeta]."
      ],
      "accounts": [
        {
          "name": "proposal",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Proposal]."
          ]
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Proposer of the proposal."
          ]
        },
        {
          "name": "proposalMeta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [ProposalMeta]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the [ProposalMeta]."
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
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "descriptionLink",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "governor",
      "docs": [
        "A Governor is the \"DAO\": it is the account that holds control over important protocol functions,",
        "including treasury, protocol parameters, and more."
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
              "Bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "proposalCount",
            "docs": [
              "The total number of [Proposal]s"
            ],
            "type": "u64"
          },
          {
            "name": "locker",
            "docs": [
              "The voting body associated with the Governor.",
              "This account is responsible for handling vote proceedings, such as:",
              "- activating proposals",
              "- setting the number of votes per voter"
            ],
            "type": "publicKey"
          },
          {
            "name": "smartWallet",
            "docs": [
              "The public key of the [smart_wallet::SmartWallet] account.",
              "This smart wallet executes proposals."
            ],
            "type": "publicKey"
          },
          {
            "name": "params",
            "docs": [
              "Governance parameters."
            ],
            "type": {
              "defined": "GovernanceParameters"
            }
          }
        ]
      }
    },
    {
      "name": "proposal",
      "docs": [
        "A Proposal is a pending transaction that may or may not be executed by the DAO."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governor",
            "docs": [
              "The public key of the governor."
            ],
            "type": "publicKey"
          },
          {
            "name": "index",
            "docs": [
              "The unique ID of the proposal, auto-incremented."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "proposer",
            "docs": [
              "The public key of the proposer."
            ],
            "type": "publicKey"
          },
          {
            "name": "quorumVotes",
            "docs": [
              "The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed"
            ],
            "type": "u64"
          },
          {
            "name": "forVotes",
            "docs": [
              "Current number of votes in favor of this proposal"
            ],
            "type": "u64"
          },
          {
            "name": "againstVotes",
            "docs": [
              "Current number of votes in opposition to this proposal"
            ],
            "type": "u64"
          },
          {
            "name": "abstainVotes",
            "docs": [
              "Current number of votes for abstaining for this proposal"
            ],
            "type": "u64"
          },
          {
            "name": "canceledAt",
            "docs": [
              "The timestamp when the proposal was canceled."
            ],
            "type": "i64"
          },
          {
            "name": "createdAt",
            "docs": [
              "The timestamp when the proposal was created."
            ],
            "type": "i64"
          },
          {
            "name": "activatedAt",
            "docs": [
              "The timestamp in which the proposal was activated.",
              "This is when voting begins."
            ],
            "type": "i64"
          },
          {
            "name": "votingEndsAt",
            "docs": [
              "The timestamp when voting ends.",
              "This only applies to active proposals."
            ],
            "type": "i64"
          },
          {
            "name": "queuedAt",
            "docs": [
              "The timestamp in which the proposal was queued, i.e.",
              "approved for execution on the Smart Wallet."
            ],
            "type": "i64"
          },
          {
            "name": "queuedTransaction",
            "docs": [
              "If the transaction was queued, this is the associated Smart Wallet transaction."
            ],
            "type": "publicKey"
          },
          {
            "name": "instructions",
            "docs": [
              "The instructions associated with the proposal."
            ],
            "type": {
              "vec": {
                "defined": "ProposalInstruction"
              }
            }
          }
        ]
      }
    },
    {
      "name": "proposalMeta",
      "docs": [
        "Metadata about a proposal."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "docs": [
              "The [Proposal]."
            ],
            "type": "publicKey"
          },
          {
            "name": "title",
            "docs": [
              "Title of the proposal."
            ],
            "type": "string"
          },
          {
            "name": "descriptionLink",
            "docs": [
              "Link to a description of the proposal."
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "vote",
      "docs": [
        "A [Vote] is a vote made by a `voter`"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "docs": [
              "The proposal being voted on."
            ],
            "type": "publicKey"
          },
          {
            "name": "voter",
            "docs": [
              "The voter."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "side",
            "docs": [
              "The side of the vote taken."
            ],
            "type": "u8"
          },
          {
            "name": "weight",
            "docs": [
              "The number of votes this vote holds."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GovernanceParameters",
      "docs": [
        "Governance parameters."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingDelay",
            "docs": [
              "The delay before voting on a proposal may take place, once proposed, in seconds"
            ],
            "type": "u64"
          },
          {
            "name": "votingPeriod",
            "docs": [
              "The duration of voting on a proposal, in seconds"
            ],
            "type": "u64"
          },
          {
            "name": "quorumVotes",
            "docs": [
              "The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed"
            ],
            "type": "u64"
          },
          {
            "name": "timelockDelaySeconds",
            "docs": [
              "The timelock delay of the DAO's created proposals."
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "ProposalInstruction",
      "docs": [
        "Instruction."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "programId",
            "docs": [
              "Pubkey of the instruction processor that executes this instruction"
            ],
            "type": "publicKey"
          },
          {
            "name": "keys",
            "docs": [
              "Metadata for what accounts should be passed to the instruction processor"
            ],
            "type": {
              "vec": {
                "defined": "ProposalAccountMeta"
              }
            }
          },
          {
            "name": "data",
            "docs": [
              "Opaque data passed to the instruction processor"
            ],
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "ProposalAccountMeta",
      "docs": [
        "Account metadata used to define Instructions"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "docs": [
              "An account's public key"
            ],
            "type": "publicKey"
          },
          {
            "name": "isSigner",
            "docs": [
              "True if an Instruction requires a Transaction signature matching `pubkey`."
            ],
            "type": "bool"
          },
          {
            "name": "isWritable",
            "docs": [
              "True if the `pubkey` can be loaded as a read-write account."
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "ProposalState",
      "docs": [
        "The state of a proposal.",
        "",
        "The `expired` state from Compound is missing here, because the",
        "Smart Wallet handles execution."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Draft"
          },
          {
            "name": "Active"
          },
          {
            "name": "Canceled"
          },
          {
            "name": "Defeated"
          },
          {
            "name": "Succeeded"
          },
          {
            "name": "Queued"
          }
        ]
      }
    },
    {
      "name": "VoteSide",
      "docs": [
        "Side of a vote."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pending"
          },
          {
            "name": "Against"
          },
          {
            "name": "For"
          },
          {
            "name": "Abstain"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ProposalActivateEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "votingEndsAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalCancelEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "GovernorCreateEvent",
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
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "parameters",
          "type": {
            "defined": "GovernanceParameters"
          },
          "index": false
        }
      ]
    },
    {
      "name": "ProposalMetaCreateEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "title",
          "type": "string",
          "index": false
        },
        {
          "name": "descriptionLink",
          "type": "string",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalCreateEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "index",
          "type": "u64",
          "index": false
        },
        {
          "name": "instructions",
          "type": {
            "vec": {
              "defined": "ProposalInstruction"
            }
          },
          "index": false
        }
      ]
    },
    {
      "name": "ProposalQueueEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "GovernorSetParamsEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "prevParams",
          "type": {
            "defined": "GovernanceParameters"
          },
          "index": false
        },
        {
          "name": "params",
          "type": {
            "defined": "GovernanceParameters"
          },
          "index": false
        }
      ]
    },
    {
      "name": "GovernorSetVoterEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "prevLocker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newLocker",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "VoteSetEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "voter",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "vote",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "side",
          "type": "u8",
          "index": false
        },
        {
          "name": "weight",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidVoteSide",
      "msg": "Invalid vote side."
    },
    {
      "code": 6001,
      "name": "GovernorNotFound",
      "msg": "The owner of the smart wallet doesn't match with current."
    },
    {
      "code": 6002,
      "name": "VotingDelayNotMet",
      "msg": "The proposal cannot be activated since it has not yet passed the voting delay."
    },
    {
      "code": 6003,
      "name": "ProposalNotDraft",
      "msg": "Only drafts can be canceled."
    },
    {
      "code": 6004,
      "name": "ProposalNotActive",
      "msg": "The proposal must be active."
    }
  ]
};

export const IDL: Govern = {
  "version": "0.1.0",
  "name": "govern",
  "docs": [
    "The [govern] program."
  ],
  "instructions": [
    {
      "name": "createGovernor",
      "docs": [
        "Creates a [Governor]."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base of the [Governor] key."
          ]
        },
        {
          "name": "governor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Governor."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Smart Wallet."
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
          "name": "locker",
          "type": "publicKey"
        },
        {
          "name": "params",
          "type": {
            "defined": "GovernanceParameters"
          }
        }
      ]
    },
    {
      "name": "createProposal",
      "docs": [
        "Creates a [Proposal].",
        "This may be called by anyone, since the [Proposal] does not do anything until",
        "it is activated in [activate_proposal]."
      ],
      "accounts": [
        {
          "name": "governor",
          "isMut": true,
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
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Proposer of the proposal."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the proposal."
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
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "instructions",
          "type": {
            "vec": {
              "defined": "ProposalInstruction"
            }
          }
        }
      ]
    },
    {
      "name": "activateProposal",
      "docs": [
        "Activates a proposal.",
        "Only the [Governor::voter] may call this; that program",
        "may ensure that only certain types of users can activate proposals."
      ],
      "accounts": [
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
            "The [Proposal] to activate."
          ]
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The locker of the [Governor] that may activate the proposal."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "cancelProposal",
      "docs": [
        "Cancels a proposal.",
        "This is only callable by the creator of the proposal."
      ],
      "accounts": [
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
            "The [Proposal] to activate."
          ]
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [Proposal::proposer]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "queueProposal",
      "docs": [
        "Queues a proposal for execution by the [SmartWallet]."
      ],
      "accounts": [
        {
          "name": "governor",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Governor."
          ]
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The Proposal to queue."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The transaction key of the proposal.",
            "This account is passed to and validated by the Smart Wallet program to be initialized."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The Smart Wallet."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the queued transaction."
          ]
        },
        {
          "name": "smartWalletProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The Smart Wallet program."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The System program."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "newVote",
      "docs": [
        "Creates a new [Vote]. Anyone can call this."
      ],
      "accounts": [
        {
          "name": "proposal",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Proposal being voted on."
          ]
        },
        {
          "name": "vote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The vote."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the [Vote]."
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
          "name": "voter",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "setVote",
      "docs": [
        "Sets a [Vote] weight and side.",
        "This may only be called by the [Governor::voter]."
      ],
      "accounts": [
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
          "name": "vote",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Vote]."
          ]
        },
        {
          "name": "locker",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The [Governor::locker]."
          ]
        }
      ],
      "args": [
        {
          "name": "side",
          "type": "u8"
        },
        {
          "name": "weight",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setGovernanceParams",
      "docs": [
        "Sets the [GovernanceParameters].",
        "This may only be called by the [Governor::smart_wallet]."
      ],
      "accounts": [
        {
          "name": "governor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Governor]"
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The Smart Wallet."
          ]
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "GovernanceParameters"
          }
        }
      ]
    },
    {
      "name": "setLocker",
      "docs": [
        "Sets the locker of the [Governor]."
      ],
      "accounts": [
        {
          "name": "governor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Governor]"
          ]
        },
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The Smart Wallet."
          ]
        }
      ],
      "args": [
        {
          "name": "newLocker",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createProposalMeta",
      "docs": [
        "Creates a [ProposalMeta]."
      ],
      "accounts": [
        {
          "name": "proposal",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [Proposal]."
          ]
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Proposer of the proposal."
          ]
        },
        {
          "name": "proposalMeta",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [ProposalMeta]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the [ProposalMeta]."
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
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "descriptionLink",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "governor",
      "docs": [
        "A Governor is the \"DAO\": it is the account that holds control over important protocol functions,",
        "including treasury, protocol parameters, and more."
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
              "Bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "proposalCount",
            "docs": [
              "The total number of [Proposal]s"
            ],
            "type": "u64"
          },
          {
            "name": "locker",
            "docs": [
              "The voting body associated with the Governor.",
              "This account is responsible for handling vote proceedings, such as:",
              "- activating proposals",
              "- setting the number of votes per voter"
            ],
            "type": "publicKey"
          },
          {
            "name": "smartWallet",
            "docs": [
              "The public key of the [smart_wallet::SmartWallet] account.",
              "This smart wallet executes proposals."
            ],
            "type": "publicKey"
          },
          {
            "name": "params",
            "docs": [
              "Governance parameters."
            ],
            "type": {
              "defined": "GovernanceParameters"
            }
          }
        ]
      }
    },
    {
      "name": "proposal",
      "docs": [
        "A Proposal is a pending transaction that may or may not be executed by the DAO."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governor",
            "docs": [
              "The public key of the governor."
            ],
            "type": "publicKey"
          },
          {
            "name": "index",
            "docs": [
              "The unique ID of the proposal, auto-incremented."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "proposer",
            "docs": [
              "The public key of the proposer."
            ],
            "type": "publicKey"
          },
          {
            "name": "quorumVotes",
            "docs": [
              "The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed"
            ],
            "type": "u64"
          },
          {
            "name": "forVotes",
            "docs": [
              "Current number of votes in favor of this proposal"
            ],
            "type": "u64"
          },
          {
            "name": "againstVotes",
            "docs": [
              "Current number of votes in opposition to this proposal"
            ],
            "type": "u64"
          },
          {
            "name": "abstainVotes",
            "docs": [
              "Current number of votes for abstaining for this proposal"
            ],
            "type": "u64"
          },
          {
            "name": "canceledAt",
            "docs": [
              "The timestamp when the proposal was canceled."
            ],
            "type": "i64"
          },
          {
            "name": "createdAt",
            "docs": [
              "The timestamp when the proposal was created."
            ],
            "type": "i64"
          },
          {
            "name": "activatedAt",
            "docs": [
              "The timestamp in which the proposal was activated.",
              "This is when voting begins."
            ],
            "type": "i64"
          },
          {
            "name": "votingEndsAt",
            "docs": [
              "The timestamp when voting ends.",
              "This only applies to active proposals."
            ],
            "type": "i64"
          },
          {
            "name": "queuedAt",
            "docs": [
              "The timestamp in which the proposal was queued, i.e.",
              "approved for execution on the Smart Wallet."
            ],
            "type": "i64"
          },
          {
            "name": "queuedTransaction",
            "docs": [
              "If the transaction was queued, this is the associated Smart Wallet transaction."
            ],
            "type": "publicKey"
          },
          {
            "name": "instructions",
            "docs": [
              "The instructions associated with the proposal."
            ],
            "type": {
              "vec": {
                "defined": "ProposalInstruction"
              }
            }
          }
        ]
      }
    },
    {
      "name": "proposalMeta",
      "docs": [
        "Metadata about a proposal."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "docs": [
              "The [Proposal]."
            ],
            "type": "publicKey"
          },
          {
            "name": "title",
            "docs": [
              "Title of the proposal."
            ],
            "type": "string"
          },
          {
            "name": "descriptionLink",
            "docs": [
              "Link to a description of the proposal."
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "vote",
      "docs": [
        "A [Vote] is a vote made by a `voter`"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposal",
            "docs": [
              "The proposal being voted on."
            ],
            "type": "publicKey"
          },
          {
            "name": "voter",
            "docs": [
              "The voter."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed"
            ],
            "type": "u8"
          },
          {
            "name": "side",
            "docs": [
              "The side of the vote taken."
            ],
            "type": "u8"
          },
          {
            "name": "weight",
            "docs": [
              "The number of votes this vote holds."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "GovernanceParameters",
      "docs": [
        "Governance parameters."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votingDelay",
            "docs": [
              "The delay before voting on a proposal may take place, once proposed, in seconds"
            ],
            "type": "u64"
          },
          {
            "name": "votingPeriod",
            "docs": [
              "The duration of voting on a proposal, in seconds"
            ],
            "type": "u64"
          },
          {
            "name": "quorumVotes",
            "docs": [
              "The number of votes in support of a proposal required in order for a quorum to be reached and for a vote to succeed"
            ],
            "type": "u64"
          },
          {
            "name": "timelockDelaySeconds",
            "docs": [
              "The timelock delay of the DAO's created proposals."
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "ProposalInstruction",
      "docs": [
        "Instruction."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "programId",
            "docs": [
              "Pubkey of the instruction processor that executes this instruction"
            ],
            "type": "publicKey"
          },
          {
            "name": "keys",
            "docs": [
              "Metadata for what accounts should be passed to the instruction processor"
            ],
            "type": {
              "vec": {
                "defined": "ProposalAccountMeta"
              }
            }
          },
          {
            "name": "data",
            "docs": [
              "Opaque data passed to the instruction processor"
            ],
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "ProposalAccountMeta",
      "docs": [
        "Account metadata used to define Instructions"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pubkey",
            "docs": [
              "An account's public key"
            ],
            "type": "publicKey"
          },
          {
            "name": "isSigner",
            "docs": [
              "True if an Instruction requires a Transaction signature matching `pubkey`."
            ],
            "type": "bool"
          },
          {
            "name": "isWritable",
            "docs": [
              "True if the `pubkey` can be loaded as a read-write account."
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "ProposalState",
      "docs": [
        "The state of a proposal.",
        "",
        "The `expired` state from Compound is missing here, because the",
        "Smart Wallet handles execution."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Draft"
          },
          {
            "name": "Active"
          },
          {
            "name": "Canceled"
          },
          {
            "name": "Defeated"
          },
          {
            "name": "Succeeded"
          },
          {
            "name": "Queued"
          }
        ]
      }
    },
    {
      "name": "VoteSide",
      "docs": [
        "Side of a vote."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pending"
          },
          {
            "name": "Against"
          },
          {
            "name": "For"
          },
          {
            "name": "Abstain"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ProposalActivateEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "votingEndsAt",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalCancelEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "GovernorCreateEvent",
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
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "parameters",
          "type": {
            "defined": "GovernanceParameters"
          },
          "index": false
        }
      ]
    },
    {
      "name": "ProposalMetaCreateEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "title",
          "type": "string",
          "index": false
        },
        {
          "name": "descriptionLink",
          "type": "string",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalCreateEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "index",
          "type": "u64",
          "index": false
        },
        {
          "name": "instructions",
          "type": {
            "vec": {
              "defined": "ProposalInstruction"
            }
          },
          "index": false
        }
      ]
    },
    {
      "name": "ProposalQueueEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "GovernorSetParamsEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "prevParams",
          "type": {
            "defined": "GovernanceParameters"
          },
          "index": false
        },
        {
          "name": "params",
          "type": {
            "defined": "GovernanceParameters"
          },
          "index": false
        }
      ]
    },
    {
      "name": "GovernorSetVoterEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "prevLocker",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "newLocker",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "VoteSetEvent",
      "fields": [
        {
          "name": "governor",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposal",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "voter",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "vote",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "side",
          "type": "u8",
          "index": false
        },
        {
          "name": "weight",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidVoteSide",
      "msg": "Invalid vote side."
    },
    {
      "code": 6001,
      "name": "GovernorNotFound",
      "msg": "The owner of the smart wallet doesn't match with current."
    },
    {
      "code": 6002,
      "name": "VotingDelayNotMet",
      "msg": "The proposal cannot be activated since it has not yet passed the voting delay."
    },
    {
      "code": 6003,
      "name": "ProposalNotDraft",
      "msg": "Only drafts can be canceled."
    },
    {
      "code": 6004,
      "name": "ProposalNotActive",
      "msg": "The proposal must be active."
    }
  ]
};
