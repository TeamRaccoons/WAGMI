export type MocAmm = {
  "version": "0.1.0",
  "name": "moc_amm",
  "instructions": [
    {
      "name": "newMocAmm",
      "docs": [
        "Creates a new [MocAmm]."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base account."
          ]
        },
        {
          "name": "mocAmm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAFee",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token a fee account"
          ]
        },
        {
          "name": "tokenMintA",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token mint account"
          ]
        },
        {
          "name": "tokenBFee",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token b fee account"
          ]
        },
        {
          "name": "tokenMintB",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token mint account"
          ]
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "rent"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "token_program"
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
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "lpMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "claimFee",
      "accounts": [
        {
          "name": "mocAmm",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "token_program"
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "token_program"
          ]
        },
        {
          "name": "destTokenAccount",
          "isMut": true,
          "isSigner": false
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
      "name": "mocAmm",
      "docs": [
        "State of pool account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "base"
            ],
            "type": "publicKey"
          },
          {
            "name": "lpMint",
            "docs": [
              "LP token mint of the pool"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenAFee",
            "docs": [
              "Admin fee token account for token A. Used to receive trading fee."
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenBFee",
            "docs": [
              "Admin fee token account for token B. Used to receive trading fee."
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenAMint",
            "docs": [
              "Cached"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenBMint",
            "docs": [
              "Cached"
            ],
            "type": "publicKey"
          },
          {
            "name": "fee",
            "docs": [
              "Fee"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "bump"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};

export const IDL: MocAmm = {
  "version": "0.1.0",
  "name": "moc_amm",
  "instructions": [
    {
      "name": "newMocAmm",
      "docs": [
        "Creates a new [MocAmm]."
      ],
      "accounts": [
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base account."
          ]
        },
        {
          "name": "mocAmm",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAFee",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token a fee account"
          ]
        },
        {
          "name": "tokenMintA",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token mint account"
          ]
        },
        {
          "name": "tokenBFee",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token b fee account"
          ]
        },
        {
          "name": "tokenMintB",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token mint account"
          ]
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "rent"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "token_program"
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
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "lpMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "claimFee",
      "accounts": [
        {
          "name": "mocAmm",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "token_program"
          ]
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "token_program"
          ]
        },
        {
          "name": "destTokenAccount",
          "isMut": true,
          "isSigner": false
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
      "name": "mocAmm",
      "docs": [
        "State of pool account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "base"
            ],
            "type": "publicKey"
          },
          {
            "name": "lpMint",
            "docs": [
              "LP token mint of the pool"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenAFee",
            "docs": [
              "Admin fee token account for token A. Used to receive trading fee."
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenBFee",
            "docs": [
              "Admin fee token account for token B. Used to receive trading fee."
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenAMint",
            "docs": [
              "Cached"
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenBMint",
            "docs": [
              "Cached"
            ],
            "type": "publicKey"
          },
          {
            "name": "fee",
            "docs": [
              "Fee"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "bump"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
