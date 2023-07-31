export type SmartWallet = {
  "version": "0.1.0",
  "name": "smart_wallet",
  "docs": [
    "Smart wallet program."
  ],
  "instructions": [
    {
      "name": "createSmartWallet",
      "docs": [
        "Initializes a new [SmartWallet] account with a set of owners and a threshold."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base key of the SmartWallet."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SmartWallet] to create."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the smart_wallet."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
          ]
        }
      ],
      "args": [
        {
          "name": "maxOwners",
          "type": "u8"
        },
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "threshold",
          "type": "u64"
        },
        {
          "name": "minimumDelay",
          "type": "i64"
        }
      ]
    },
    {
      "name": "setOwners",
      "docs": [
        "Sets the owners field on the smart_wallet. The only way this can be invoked",
        "is via a recursive call from execute_transaction -> set_owners."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          }
        }
      ]
    },
    {
      "name": "changeThreshold",
      "docs": [
        "Changes the execution threshold of the smart_wallet. The only way this can be",
        "invoked is via a recursive call from execute_transaction ->",
        "change_threshold."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "threshold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createTransaction",
      "docs": [
        "Creates a new [Transaction] account, automatically signed by the creator,",
        "which must be one of the owners of the smart_wallet."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "One of the owners. Checked in the handler via [SmartWallet::owner_index]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the [Transaction]."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
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
              "defined": "TXInstruction"
            }
          }
        }
      ]
    },
    {
      "name": "removeTransaction",
      "docs": [
        "Remove a [Transaction] account, automatically signed by the creator,",
        "which must be one of the owners of the smart_wallet."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "proposer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Must be proposer of the transaction"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "createTransactionWithTimelock",
      "docs": [
        "Creates a new [Transaction] account with time delay."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "One of the owners. Checked in the handler via [SmartWallet::owner_index]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the [Transaction]."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
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
              "defined": "TXInstruction"
            }
          }
        },
        {
          "name": "eta",
          "type": "i64"
        }
      ]
    },
    {
      "name": "approve",
      "docs": [
        "Approves a transaction on behalf of an owner of the smart_wallet."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "One of the smart_wallet owners. Checked in the handler."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "unapprove",
      "docs": [
        "Unapproves a transaction on behalf of an owner of the smart_wallet."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "One of the smart_wallet owners. Checked in the handler."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "executeTransaction",
      "docs": [
        "Executes the given transaction if threshold owners have signed it."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction] to execute."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "An owner of the [SmartWallet]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "executeTransactionDerived",
      "docs": [
        "Executes the given transaction signed by the given derived address,",
        "if threshold owners have signed it.",
        "This allows a Smart Wallet to receive SOL."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction] to execute."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "An owner of the [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "ownerInvokeInstruction",
      "docs": [
        "Invokes an arbitrary instruction as a PDA derived from the owner,",
        "i.e. as an \"Owner Invoker\".",
        "",
        "This is useful for using the multisig as a whitelist or as a council,",
        "e.g. a whitelist of approved owners."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "An owner of the [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "ix",
          "type": {
            "defined": "TXInstruction"
          }
        }
      ]
    },
    {
      "name": "ownerInvokeInstructionV2",
      "docs": [
        "Invokes an arbitrary instruction as a PDA derived from the owner,",
        "i.e. as an \"Owner Invoker\".",
        "",
        "This is useful for using the multisig as a whitelist or as a council,",
        "e.g. a whitelist of approved owners.",
        "",
        "# Arguments",
        "- `index` - The index of the owner-invoker.",
        "- `bump` - Bump seed of the owner-invoker.",
        "- `invoker` - The owner-invoker.",
        "- `data` - The raw bytes of the instruction data."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "An owner of the [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "invoker",
          "type": "publicKey"
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "createSubaccountInfo",
      "docs": [
        "Creates a struct containing a reverse mapping of a subaccount to a",
        "[SmartWallet]."
      ],
      "accounts": [
        {
          "name": "subaccountInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SubaccountInfo] to create."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the [SubaccountInfo]."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
          ]
        }
      ],
      "args": [
        {
          "name": "subaccount",
          "type": "publicKey"
        },
        {
          "name": "smartWallet",
          "type": "publicKey"
        },
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "subaccountType",
          "type": {
            "defined": "SubaccountType"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "smartWallet",
      "docs": [
        "A [SmartWallet] is a multisig wallet with Timelock capabilities."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base used to derive."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for deriving PDA seeds."
            ],
            "type": "u8"
          },
          {
            "name": "threshold",
            "docs": [
              "Minimum number of owner approvals needed to sign a [Transaction]."
            ],
            "type": "u64"
          },
          {
            "name": "minimumDelay",
            "docs": [
              "Minimum delay between approval and execution, in seconds."
            ],
            "type": "i64"
          },
          {
            "name": "gracePeriod",
            "docs": [
              "Time after the ETA until a [Transaction] expires."
            ],
            "type": "i64"
          },
          {
            "name": "maxOwners",
            "docs": [
              "Max owners"
            ],
            "type": "u8"
          },
          {
            "name": "ownerSetSeqno",
            "docs": [
              "Sequence of the ownership set.",
              "",
              "This may be used to see if the owners on the multisig have changed",
              "since the last time the owners were checked. This is used on",
              "[Transaction] approval to ensure that owners cannot approve old",
              "transactions."
            ],
            "type": "u32"
          },
          {
            "name": "numTransactions",
            "docs": [
              "Total number of [Transaction]s on this [SmartWallet]."
            ],
            "type": "u64"
          },
          {
            "name": "owners",
            "docs": [
              "Owners of the [SmartWallet]."
            ],
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "reserved",
            "docs": [
              "Extra space for program upgrades."
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "transaction",
      "docs": [
        "A [Transaction] is a series of instructions that may be executed",
        "by a [SmartWallet]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "smartWallet",
            "docs": [
              "The [SmartWallet] account this transaction belongs to."
            ],
            "type": "publicKey"
          },
          {
            "name": "index",
            "docs": [
              "The auto-incremented integer index of the transaction.",
              "All transactions on the [SmartWallet] can be looked up via this index,",
              "allowing for easier browsing of a wallet's historical transactions."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          },
          {
            "name": "proposer",
            "docs": [
              "The proposer of the [Transaction]."
            ],
            "type": "publicKey"
          },
          {
            "name": "instructions",
            "docs": [
              "The instruction."
            ],
            "type": {
              "vec": {
                "defined": "TXInstruction"
              }
            }
          },
          {
            "name": "signers",
            "docs": [
              "`signers[index]` is true iff `[SmartWallet]::owners[index]` signed the transaction."
            ],
            "type": {
              "vec": "bool"
            }
          },
          {
            "name": "ownerSetSeqno",
            "docs": [
              "Owner set sequence number."
            ],
            "type": "u32"
          },
          {
            "name": "eta",
            "docs": [
              "Estimated time the [Transaction] will be executed.",
              "",
              "- If set to [crate::NO_ETA], the transaction may be executed at any time.",
              "- Otherwise, the [Transaction] may be executed at any point after the ETA has elapsed."
            ],
            "type": "i64"
          },
          {
            "name": "executor",
            "docs": [
              "The account that executed the [Transaction]."
            ],
            "type": "publicKey"
          },
          {
            "name": "executedAt",
            "docs": [
              "When the transaction was executed. -1 if not executed."
            ],
            "type": "i64"
          },
          {
            "name": "createdAt",
            "docs": [
              "Time when transaction is created"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "subaccountInfo",
      "docs": [
        "Mapping of a Subaccount to its [SmartWallet]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "smartWallet",
            "docs": [
              "Smart wallet of the sub-account."
            ],
            "type": "publicKey"
          },
          {
            "name": "subaccountType",
            "docs": [
              "Type of sub-account."
            ],
            "type": {
              "defined": "SubaccountType"
            }
          },
          {
            "name": "index",
            "docs": [
              "Index of the sub-account."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stagedTxInstruction",
      "docs": [
        "An account which holds the data of a single [TXInstruction].",
        "Creating this allows an owner-invoker to execute a transaction",
        "with a minimal transaction size."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "smartWallet",
            "docs": [
              "The [SmartWallet] to execute this on."
            ],
            "type": "publicKey"
          },
          {
            "name": "index",
            "docs": [
              "The owner-invoker index."
            ],
            "type": "u64"
          },
          {
            "name": "ownerInvokerBump",
            "docs": [
              "Bump seed of the owner-invoker."
            ],
            "type": "u8"
          },
          {
            "name": "owner",
            "docs": [
              "The owner which will execute the instruction."
            ],
            "type": "publicKey"
          },
          {
            "name": "ownerSetSeqno",
            "docs": [
              "Owner set sequence number."
            ],
            "type": "u32"
          },
          {
            "name": "ix",
            "docs": [
              "The instruction to execute."
            ],
            "type": {
              "defined": "TXInstruction"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "TXInstruction",
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
                "defined": "TXAccountMeta"
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
      "name": "TXAccountMeta",
      "docs": [
        "Account metadata used to define [TXInstruction]s"
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
      "name": "SubaccountType",
      "docs": [
        "Type of Subaccount."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Derived"
          },
          {
            "name": "OwnerInvoker"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "TransactionApproveEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
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
      "name": "TransactionUnapproveEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
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
      "name": "WalletSetOwnersEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          },
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
      "name": "WalletChangeThresholdEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "threshold",
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
      "name": "WalletCreateEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          },
          "index": false
        },
        {
          "name": "threshold",
          "type": "u64",
          "index": false
        },
        {
          "name": "minimumDelay",
          "type": "i64",
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
      "name": "TransactionCreateEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "instructions",
          "type": {
            "vec": {
              "defined": "TXInstruction"
            }
          },
          "index": false
        },
        {
          "name": "eta",
          "type": "i64",
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
      "name": "TransactionExecuteEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "executor",
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
      "name": "TransactionRemoveEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposer",
          "type": "publicKey",
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
      "name": "InvalidOwner",
      "msg": "The given owner is not part of this smart wallet."
    },
    {
      "code": 6001,
      "name": "InvalidETA",
      "msg": "Estimated execution block must satisfy delay."
    },
    {
      "code": 6002,
      "name": "DelayTooHigh",
      "msg": "Delay greater than the maximum."
    },
    {
      "code": 6003,
      "name": "NotEnoughSigners",
      "msg": "Not enough owners signed this transaction."
    },
    {
      "code": 6004,
      "name": "TransactionIsStale",
      "msg": "Transaction is past the grace period."
    },
    {
      "code": 6005,
      "name": "TransactionNotReady",
      "msg": "Transaction hasn't surpassed time lock."
    },
    {
      "code": 6006,
      "name": "AlreadyExecuted",
      "msg": "The given transaction has already been executed."
    },
    {
      "code": 6007,
      "name": "InvalidThreshold",
      "msg": "Threshold must be less than or equal to the number of owners."
    },
    {
      "code": 6008,
      "name": "OwnerSetChanged",
      "msg": "Owner set has changed since the creation of the transaction."
    },
    {
      "code": 6009,
      "name": "SubaccountOwnerMismatch",
      "msg": "Subaccount does not belong to smart wallet."
    },
    {
      "code": 6010,
      "name": "NumSignerIsNotZero",
      "msg": "Number of signers is not zero."
    }
  ]
};

export const IDL: SmartWallet = {
  "version": "0.1.0",
  "name": "smart_wallet",
  "docs": [
    "Smart wallet program."
  ],
  "instructions": [
    {
      "name": "createSmartWallet",
      "docs": [
        "Initializes a new [SmartWallet] account with a set of owners and a threshold."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base key of the SmartWallet."
          ]
        },
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SmartWallet] to create."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the smart_wallet."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
          ]
        }
      ],
      "args": [
        {
          "name": "maxOwners",
          "type": "u8"
        },
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "threshold",
          "type": "u64"
        },
        {
          "name": "minimumDelay",
          "type": "i64"
        }
      ]
    },
    {
      "name": "setOwners",
      "docs": [
        "Sets the owners field on the smart_wallet. The only way this can be invoked",
        "is via a recursive call from execute_transaction -> set_owners."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          }
        }
      ]
    },
    {
      "name": "changeThreshold",
      "docs": [
        "Changes the execution threshold of the smart_wallet. The only way this can be",
        "invoked is via a recursive call from execute_transaction ->",
        "change_threshold."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "threshold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createTransaction",
      "docs": [
        "Creates a new [Transaction] account, automatically signed by the creator,",
        "which must be one of the owners of the smart_wallet."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "One of the owners. Checked in the handler via [SmartWallet::owner_index]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the [Transaction]."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
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
              "defined": "TXInstruction"
            }
          }
        }
      ]
    },
    {
      "name": "removeTransaction",
      "docs": [
        "Remove a [Transaction] account, automatically signed by the creator,",
        "which must be one of the owners of the smart_wallet."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "proposer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Must be proposer of the transaction"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "createTransactionWithTimelock",
      "docs": [
        "Creates a new [Transaction] account with time delay."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "proposer",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "One of the owners. Checked in the handler via [SmartWallet::owner_index]."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the [Transaction]."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
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
              "defined": "TXInstruction"
            }
          }
        },
        {
          "name": "eta",
          "type": "i64"
        }
      ]
    },
    {
      "name": "approve",
      "docs": [
        "Approves a transaction on behalf of an owner of the smart_wallet."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "One of the smart_wallet owners. Checked in the handler."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "unapprove",
      "docs": [
        "Unapproves a transaction on behalf of an owner of the smart_wallet."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction]."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "One of the smart_wallet owners. Checked in the handler."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "executeTransaction",
      "docs": [
        "Executes the given transaction if threshold owners have signed it."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction] to execute."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "An owner of the [SmartWallet]."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "executeTransactionDerived",
      "docs": [
        "Executes the given transaction signed by the given derived address,",
        "if threshold owners have signed it.",
        "This allows a Smart Wallet to receive SOL."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [Transaction] to execute."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "An owner of the [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "ownerInvokeInstruction",
      "docs": [
        "Invokes an arbitrary instruction as a PDA derived from the owner,",
        "i.e. as an \"Owner Invoker\".",
        "",
        "This is useful for using the multisig as a whitelist or as a council,",
        "e.g. a whitelist of approved owners."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "An owner of the [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "ix",
          "type": {
            "defined": "TXInstruction"
          }
        }
      ]
    },
    {
      "name": "ownerInvokeInstructionV2",
      "docs": [
        "Invokes an arbitrary instruction as a PDA derived from the owner,",
        "i.e. as an \"Owner Invoker\".",
        "",
        "This is useful for using the multisig as a whitelist or as a council,",
        "e.g. a whitelist of approved owners.",
        "",
        "# Arguments",
        "- `index` - The index of the owner-invoker.",
        "- `bump` - Bump seed of the owner-invoker.",
        "- `invoker` - The owner-invoker.",
        "- `data` - The raw bytes of the instruction data."
      ],
      "accounts": [
        {
          "name": "smartWallet",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [SmartWallet]."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "An owner of the [SmartWallet]."
          ]
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "invoker",
          "type": "publicKey"
        },
        {
          "name": "data",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "createSubaccountInfo",
      "docs": [
        "Creates a struct containing a reverse mapping of a subaccount to a",
        "[SmartWallet]."
      ],
      "accounts": [
        {
          "name": "subaccountInfo",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [SubaccountInfo] to create."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the [SubaccountInfo]."
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
          ]
        }
      ],
      "args": [
        {
          "name": "subaccount",
          "type": "publicKey"
        },
        {
          "name": "smartWallet",
          "type": "publicKey"
        },
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "subaccountType",
          "type": {
            "defined": "SubaccountType"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "smartWallet",
      "docs": [
        "A [SmartWallet] is a multisig wallet with Timelock capabilities."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base used to derive."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for deriving PDA seeds."
            ],
            "type": "u8"
          },
          {
            "name": "threshold",
            "docs": [
              "Minimum number of owner approvals needed to sign a [Transaction]."
            ],
            "type": "u64"
          },
          {
            "name": "minimumDelay",
            "docs": [
              "Minimum delay between approval and execution, in seconds."
            ],
            "type": "i64"
          },
          {
            "name": "gracePeriod",
            "docs": [
              "Time after the ETA until a [Transaction] expires."
            ],
            "type": "i64"
          },
          {
            "name": "maxOwners",
            "docs": [
              "Max owners"
            ],
            "type": "u8"
          },
          {
            "name": "ownerSetSeqno",
            "docs": [
              "Sequence of the ownership set.",
              "",
              "This may be used to see if the owners on the multisig have changed",
              "since the last time the owners were checked. This is used on",
              "[Transaction] approval to ensure that owners cannot approve old",
              "transactions."
            ],
            "type": "u32"
          },
          {
            "name": "numTransactions",
            "docs": [
              "Total number of [Transaction]s on this [SmartWallet]."
            ],
            "type": "u64"
          },
          {
            "name": "owners",
            "docs": [
              "Owners of the [SmartWallet]."
            ],
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "reserved",
            "docs": [
              "Extra space for program upgrades."
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "transaction",
      "docs": [
        "A [Transaction] is a series of instructions that may be executed",
        "by a [SmartWallet]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "smartWallet",
            "docs": [
              "The [SmartWallet] account this transaction belongs to."
            ],
            "type": "publicKey"
          },
          {
            "name": "index",
            "docs": [
              "The auto-incremented integer index of the transaction.",
              "All transactions on the [SmartWallet] can be looked up via this index,",
              "allowing for easier browsing of a wallet's historical transactions."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          },
          {
            "name": "proposer",
            "docs": [
              "The proposer of the [Transaction]."
            ],
            "type": "publicKey"
          },
          {
            "name": "instructions",
            "docs": [
              "The instruction."
            ],
            "type": {
              "vec": {
                "defined": "TXInstruction"
              }
            }
          },
          {
            "name": "signers",
            "docs": [
              "`signers[index]` is true iff `[SmartWallet]::owners[index]` signed the transaction."
            ],
            "type": {
              "vec": "bool"
            }
          },
          {
            "name": "ownerSetSeqno",
            "docs": [
              "Owner set sequence number."
            ],
            "type": "u32"
          },
          {
            "name": "eta",
            "docs": [
              "Estimated time the [Transaction] will be executed.",
              "",
              "- If set to [crate::NO_ETA], the transaction may be executed at any time.",
              "- Otherwise, the [Transaction] may be executed at any point after the ETA has elapsed."
            ],
            "type": "i64"
          },
          {
            "name": "executor",
            "docs": [
              "The account that executed the [Transaction]."
            ],
            "type": "publicKey"
          },
          {
            "name": "executedAt",
            "docs": [
              "When the transaction was executed. -1 if not executed."
            ],
            "type": "i64"
          },
          {
            "name": "createdAt",
            "docs": [
              "Time when transaction is created"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "subaccountInfo",
      "docs": [
        "Mapping of a Subaccount to its [SmartWallet]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "smartWallet",
            "docs": [
              "Smart wallet of the sub-account."
            ],
            "type": "publicKey"
          },
          {
            "name": "subaccountType",
            "docs": [
              "Type of sub-account."
            ],
            "type": {
              "defined": "SubaccountType"
            }
          },
          {
            "name": "index",
            "docs": [
              "Index of the sub-account."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stagedTxInstruction",
      "docs": [
        "An account which holds the data of a single [TXInstruction].",
        "Creating this allows an owner-invoker to execute a transaction",
        "with a minimal transaction size."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "smartWallet",
            "docs": [
              "The [SmartWallet] to execute this on."
            ],
            "type": "publicKey"
          },
          {
            "name": "index",
            "docs": [
              "The owner-invoker index."
            ],
            "type": "u64"
          },
          {
            "name": "ownerInvokerBump",
            "docs": [
              "Bump seed of the owner-invoker."
            ],
            "type": "u8"
          },
          {
            "name": "owner",
            "docs": [
              "The owner which will execute the instruction."
            ],
            "type": "publicKey"
          },
          {
            "name": "ownerSetSeqno",
            "docs": [
              "Owner set sequence number."
            ],
            "type": "u32"
          },
          {
            "name": "ix",
            "docs": [
              "The instruction to execute."
            ],
            "type": {
              "defined": "TXInstruction"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "TXInstruction",
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
                "defined": "TXAccountMeta"
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
      "name": "TXAccountMeta",
      "docs": [
        "Account metadata used to define [TXInstruction]s"
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
      "name": "SubaccountType",
      "docs": [
        "Type of Subaccount."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Derived"
          },
          {
            "name": "OwnerInvoker"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "TransactionApproveEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
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
      "name": "TransactionUnapproveEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owner",
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
      "name": "WalletSetOwnersEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          },
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
      "name": "WalletChangeThresholdEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "threshold",
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
      "name": "WalletCreateEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          },
          "index": false
        },
        {
          "name": "threshold",
          "type": "u64",
          "index": false
        },
        {
          "name": "minimumDelay",
          "type": "i64",
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
      "name": "TransactionCreateEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "instructions",
          "type": {
            "vec": {
              "defined": "TXInstruction"
            }
          },
          "index": false
        },
        {
          "name": "eta",
          "type": "i64",
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
      "name": "TransactionExecuteEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "executor",
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
      "name": "TransactionRemoveEvent",
      "fields": [
        {
          "name": "smartWallet",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "transaction",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposer",
          "type": "publicKey",
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
      "name": "InvalidOwner",
      "msg": "The given owner is not part of this smart wallet."
    },
    {
      "code": 6001,
      "name": "InvalidETA",
      "msg": "Estimated execution block must satisfy delay."
    },
    {
      "code": 6002,
      "name": "DelayTooHigh",
      "msg": "Delay greater than the maximum."
    },
    {
      "code": 6003,
      "name": "NotEnoughSigners",
      "msg": "Not enough owners signed this transaction."
    },
    {
      "code": 6004,
      "name": "TransactionIsStale",
      "msg": "Transaction is past the grace period."
    },
    {
      "code": 6005,
      "name": "TransactionNotReady",
      "msg": "Transaction hasn't surpassed time lock."
    },
    {
      "code": 6006,
      "name": "AlreadyExecuted",
      "msg": "The given transaction has already been executed."
    },
    {
      "code": 6007,
      "name": "InvalidThreshold",
      "msg": "Threshold must be less than or equal to the number of owners."
    },
    {
      "code": 6008,
      "name": "OwnerSetChanged",
      "msg": "Owner set has changed since the creation of the transaction."
    },
    {
      "code": 6009,
      "name": "SubaccountOwnerMismatch",
      "msg": "Subaccount does not belong to smart wallet."
    },
    {
      "code": 6010,
      "name": "NumSignerIsNotZero",
      "msg": "Number of signers is not zero."
    }
  ]
};
