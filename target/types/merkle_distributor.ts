export type MerkleDistributor = {
  "version": "0.1.0",
  "name": "merkle_distributor",
  "docs": [
    "The [merkle_distributor] program."
  ],
  "instructions": [
    {
      "name": "newDistributor",
      "docs": [
        "Creates a new [MerkleDistributor].",
        "After creating this [MerkleDistributor], the account should be seeded with tokens via its ATA."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base key of the distributor."
          ]
        },
        {
          "name": "distributor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[MerkleDistributor]."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint to distribute."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the distributor."
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
          "name": "locker",
          "type": "publicKey"
        },
        {
          "name": "root",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "maxTotalClaim",
          "type": "u64"
        },
        {
          "name": "maxNumNodes",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim",
      "docs": [
        "Claims tokens from the [MerkleDistributor]."
      ],
      "accounts": [
        {
          "name": "distributor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [MerkleDistributor]."
          ]
        },
        {
          "name": "claimStatus",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Status of the claim."
          ]
        },
        {
          "name": "from",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Distributor ATA containing the tokens to distribute."
          ]
        },
        {
          "name": "claimant",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the claim, must be claimant or admin"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "SPL [Token] program."
          ]
        },
        {
          "name": "voterProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Voter program"
          ]
        },
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "merkleDistributor",
      "docs": [
        "State for the account which distributes tokens."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base key used to generate the PDA."
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
            "name": "root",
            "docs": [
              "The 256-bit merkle root."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "mint",
            "docs": [
              "[Mint] of the token to be distributed."
            ],
            "type": "publicKey"
          },
          {
            "name": "maxTotalClaim",
            "docs": [
              "Maximum number of tokens that can ever be claimed from this [MerkleDistributor]."
            ],
            "type": "u64"
          },
          {
            "name": "maxNumNodes",
            "docs": [
              "Maximum number of nodes that can ever be claimed from this [MerkleDistributor]."
            ],
            "type": "u64"
          },
          {
            "name": "totalAmountClaimed",
            "docs": [
              "Total amount of tokens that have been claimed."
            ],
            "type": "u64"
          },
          {
            "name": "numNodesClaimed",
            "docs": [
              "Number of nodes that have been claimed."
            ],
            "type": "u64"
          },
          {
            "name": "locker",
            "docs": [
              "Locker of voter"
            ],
            "type": "publicKey"
          },
          {
            "name": "admin",
            "docs": [
              "admin"
            ],
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "claimStatus",
      "docs": [
        "Holds whether or not a claimant has claimed tokens.",
        "",
        "TODO: this is probably better stored as the node that was verified."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isClaimed",
            "docs": [
              "If true, the tokens have been claimed."
            ],
            "type": "bool"
          },
          {
            "name": "claimant",
            "docs": [
              "Authority that claimed the tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "claimedAt",
            "docs": [
              "When the tokens were claimed."
            ],
            "type": "i64"
          },
          {
            "name": "amount",
            "docs": [
              "Amount of tokens claimed."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ClaimedEvent",
      "fields": [
        {
          "name": "index",
          "type": "u64",
          "index": false
        },
        {
          "name": "claimant",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidProof",
      "msg": "Invalid Merkle proof"
    },
    {
      "code": 6001,
      "name": "DropAlreadyClaimed",
      "msg": "Drop already claimed"
    },
    {
      "code": 6002,
      "name": "ExceededMaxClaim",
      "msg": "Exceeded maximum claim amount"
    },
    {
      "code": 6003,
      "name": "ExceededMaxNumNodes",
      "msg": "Exceeded maximum number of claimed nodes"
    },
    {
      "code": 6004,
      "name": "Unauthorized",
      "msg": "Account is not authorized to execute this instruction"
    },
    {
      "code": 6005,
      "name": "MintMismatch",
      "msg": "Token mint did not match intended mint"
    },
    {
      "code": 6006,
      "name": "OwnerMismatch",
      "msg": "Token account owner did not match intended owner"
    },
    {
      "code": 6007,
      "name": "PayerMismatch",
      "msg": "Payer did not match intended payer"
    }
  ]
};

export const IDL: MerkleDistributor = {
  "version": "0.1.0",
  "name": "merkle_distributor",
  "docs": [
    "The [merkle_distributor] program."
  ],
  "instructions": [
    {
      "name": "newDistributor",
      "docs": [
        "Creates a new [MerkleDistributor].",
        "After creating this [MerkleDistributor], the account should be seeded with tokens via its ATA."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base key of the distributor."
          ]
        },
        {
          "name": "distributor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[MerkleDistributor]."
          ]
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The mint to distribute."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer to create the distributor."
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
          "name": "locker",
          "type": "publicKey"
        },
        {
          "name": "root",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "maxTotalClaim",
          "type": "u64"
        },
        {
          "name": "maxNumNodes",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim",
      "docs": [
        "Claims tokens from the [MerkleDistributor]."
      ],
      "accounts": [
        {
          "name": "distributor",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [MerkleDistributor]."
          ]
        },
        {
          "name": "claimStatus",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Status of the claim."
          ]
        },
        {
          "name": "from",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Distributor ATA containing the tokens to distribute."
          ]
        },
        {
          "name": "claimant",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer of the claim, must be claimant or admin"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The [System] program."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "SPL [Token] program."
          ]
        },
        {
          "name": "voterProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Voter program"
          ]
        },
        {
          "name": "locker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowTokens",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "merkleDistributor",
      "docs": [
        "State for the account which distributes tokens."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base key used to generate the PDA."
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
            "name": "root",
            "docs": [
              "The 256-bit merkle root."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "mint",
            "docs": [
              "[Mint] of the token to be distributed."
            ],
            "type": "publicKey"
          },
          {
            "name": "maxTotalClaim",
            "docs": [
              "Maximum number of tokens that can ever be claimed from this [MerkleDistributor]."
            ],
            "type": "u64"
          },
          {
            "name": "maxNumNodes",
            "docs": [
              "Maximum number of nodes that can ever be claimed from this [MerkleDistributor]."
            ],
            "type": "u64"
          },
          {
            "name": "totalAmountClaimed",
            "docs": [
              "Total amount of tokens that have been claimed."
            ],
            "type": "u64"
          },
          {
            "name": "numNodesClaimed",
            "docs": [
              "Number of nodes that have been claimed."
            ],
            "type": "u64"
          },
          {
            "name": "locker",
            "docs": [
              "Locker of voter"
            ],
            "type": "publicKey"
          },
          {
            "name": "admin",
            "docs": [
              "admin"
            ],
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "claimStatus",
      "docs": [
        "Holds whether or not a claimant has claimed tokens.",
        "",
        "TODO: this is probably better stored as the node that was verified."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isClaimed",
            "docs": [
              "If true, the tokens have been claimed."
            ],
            "type": "bool"
          },
          {
            "name": "claimant",
            "docs": [
              "Authority that claimed the tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "claimedAt",
            "docs": [
              "When the tokens were claimed."
            ],
            "type": "i64"
          },
          {
            "name": "amount",
            "docs": [
              "Amount of tokens claimed."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ClaimedEvent",
      "fields": [
        {
          "name": "index",
          "type": "u64",
          "index": false
        },
        {
          "name": "claimant",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidProof",
      "msg": "Invalid Merkle proof"
    },
    {
      "code": 6001,
      "name": "DropAlreadyClaimed",
      "msg": "Drop already claimed"
    },
    {
      "code": 6002,
      "name": "ExceededMaxClaim",
      "msg": "Exceeded maximum claim amount"
    },
    {
      "code": 6003,
      "name": "ExceededMaxNumNodes",
      "msg": "Exceeded maximum number of claimed nodes"
    },
    {
      "code": 6004,
      "name": "Unauthorized",
      "msg": "Account is not authorized to execute this instruction"
    },
    {
      "code": 6005,
      "name": "MintMismatch",
      "msg": "Token mint did not match intended mint"
    },
    {
      "code": 6006,
      "name": "OwnerMismatch",
      "msg": "Token account owner did not match intended owner"
    },
    {
      "code": 6007,
      "name": "PayerMismatch",
      "msg": "Payer did not match intended payer"
    }
  ]
};
