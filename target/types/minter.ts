export type Minter = {
  "version": "0.1.0",
  "name": "minter",
  "instructions": [
    {
      "name": "newWrapper",
      "docs": [
        "Creates a new [MintWrapper]."
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
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token mint to mint."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program."
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
          "name": "hardCap",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferAdmin",
      "docs": [
        "Transfers admin to another account."
      ],
      "accounts": [
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [MintWrapper]."
          ]
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The previous admin."
          ]
        },
        {
          "name": "nextAdmin",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The next admin."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "acceptAdmin",
      "docs": [
        "Accepts the new admin."
      ],
      "accounts": [
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The mint wrapper."
          ]
        },
        {
          "name": "pendingAdmin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The new admin."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "newMinter",
      "docs": [
        "Creates a new [Minter]."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "mintWrapper",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "The [MintWrapper]."
              ]
            },
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "[MintWrapper::admin]."
              ]
            }
          ]
        },
        {
          "name": "minterAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Account to authorize as a minter."
          ]
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Information about the minter."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer for creating the minter."
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
      "name": "minterUpdate",
      "docs": [
        "Updates a [Minter]'s allowance."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "mintWrapper",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "The [MintWrapper]."
              ]
            },
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "[MintWrapper::admin]."
              ]
            }
          ]
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Information about the minter."
          ]
        }
      ],
      "args": [
        {
          "name": "allowance",
          "type": "u64"
        }
      ]
    },
    {
      "name": "performMint",
      "docs": [
        "TODO: implement remove minter (close account)",
        "Performs a mint."
      ],
      "accounts": [
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[MintWrapper]."
          ]
        },
        {
          "name": "minterAuthority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "[Minter]'s authority."
          ]
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token [Mint]."
          ]
        },
        {
          "name": "destination",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Destination [TokenAccount] for minted tokens."
          ]
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Minter] information."
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
      "name": "mintWrapper",
      "docs": [
        "Mint wrapper",
        "",
        "```ignore",
        "seeds = [",
        "b\"MintWrapper\",",
        "base.key().to_bytes().as_ref(),",
        "&[bump]",
        "],",
        ""
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base account."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for allowing the proxy mint authority to sign."
            ],
            "type": "u8"
          },
          {
            "name": "hardCap",
            "docs": [
              "Maximum number of tokens that can be issued."
            ],
            "type": "u64"
          },
          {
            "name": "admin",
            "docs": [
              "Admin account."
            ],
            "type": "publicKey"
          },
          {
            "name": "pendingAdmin",
            "docs": [
              "Next admin account."
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "Mint of the token."
            ],
            "type": "publicKey"
          },
          {
            "name": "numMinters",
            "docs": [
              "Number of [Minter]s."
            ],
            "type": "u64"
          },
          {
            "name": "totalAllowance",
            "docs": [
              "Total allowance outstanding."
            ],
            "type": "u64"
          },
          {
            "name": "totalMinted",
            "docs": [
              "Total amount of tokens minted through the [MintWrapper]."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "minter",
      "docs": [
        "One who can mint.",
        "",
        "```ignore",
        "seeds = [",
        "b\"MintWrapperMinter\",",
        "auth.mint_wrapper.key().to_bytes().as_ref(),",
        "minter_authority.key().to_bytes().as_ref(),",
        "&[bump]",
        "],",
        "```"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintWrapper",
            "docs": [
              "The mint wrapper."
            ],
            "type": "publicKey"
          },
          {
            "name": "minterAuthority",
            "docs": [
              "Address that can mint."
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
            "name": "index",
            "docs": [
              "Auto-incrementing index of the [Minter]."
            ],
            "type": "u64"
          },
          {
            "name": "allowance",
            "docs": [
              "Limit of number of tokens that this [Minter] can mint."
            ],
            "type": "u64"
          },
          {
            "name": "totalMinted",
            "docs": [
              "Cumulative sum of the number of tokens ever minted by this [Minter]."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "MintWrapperAdminUpdateEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "previousAdmin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "MinterAllowanceUpdateEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "minter",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "previousAllowance",
          "type": "u64",
          "index": false
        },
        {
          "name": "allowance",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "NewMinterEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "minter",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "index",
          "type": "u64",
          "index": false
        },
        {
          "name": "minterAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "NewMintWrapperEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "hardCap",
          "type": "u64",
          "index": false
        },
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "MinterMintEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "minter",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "destination",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "MintWrapperAdminProposeEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "currentAdmin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pendingAdmin",
          "type": "publicKey",
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
      "name": "HardcapExceeded",
      "msg": "Cannot mint over hard cap."
    },
    {
      "code": 6002,
      "name": "MinterAllowanceExceeded",
      "msg": "Minter allowance exceeded."
    }
  ]
};

export const IDL: Minter = {
  "version": "0.1.0",
  "name": "minter",
  "instructions": [
    {
      "name": "newWrapper",
      "docs": [
        "Creates a new [MintWrapper]."
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
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token mint to mint."
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token program."
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
          "name": "hardCap",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferAdmin",
      "docs": [
        "Transfers admin to another account."
      ],
      "accounts": [
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The [MintWrapper]."
          ]
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The previous admin."
          ]
        },
        {
          "name": "nextAdmin",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The next admin."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "acceptAdmin",
      "docs": [
        "Accepts the new admin."
      ],
      "accounts": [
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The mint wrapper."
          ]
        },
        {
          "name": "pendingAdmin",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "The new admin."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "newMinter",
      "docs": [
        "Creates a new [Minter]."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "mintWrapper",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "The [MintWrapper]."
              ]
            },
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "[MintWrapper::admin]."
              ]
            }
          ]
        },
        {
          "name": "minterAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Account to authorize as a minter."
          ]
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Information about the minter."
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Payer for creating the minter."
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
      "name": "minterUpdate",
      "docs": [
        "Updates a [Minter]'s allowance."
      ],
      "accounts": [
        {
          "name": "auth",
          "accounts": [
            {
              "name": "mintWrapper",
              "isMut": true,
              "isSigner": false,
              "docs": [
                "The [MintWrapper]."
              ]
            },
            {
              "name": "admin",
              "isMut": false,
              "isSigner": true,
              "docs": [
                "[MintWrapper::admin]."
              ]
            }
          ]
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Information about the minter."
          ]
        }
      ],
      "args": [
        {
          "name": "allowance",
          "type": "u64"
        }
      ]
    },
    {
      "name": "performMint",
      "docs": [
        "TODO: implement remove minter (close account)",
        "Performs a mint."
      ],
      "accounts": [
        {
          "name": "mintWrapper",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[MintWrapper]."
          ]
        },
        {
          "name": "minterAuthority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "[Minter]'s authority."
          ]
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token [Mint]."
          ]
        },
        {
          "name": "destination",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Destination [TokenAccount] for minted tokens."
          ]
        },
        {
          "name": "minter",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "[Minter] information."
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
      "name": "mintWrapper",
      "docs": [
        "Mint wrapper",
        "",
        "```ignore",
        "seeds = [",
        "b\"MintWrapper\",",
        "base.key().to_bytes().as_ref(),",
        "&[bump]",
        "],",
        ""
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "base",
            "docs": [
              "Base account."
            ],
            "type": "publicKey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump for allowing the proxy mint authority to sign."
            ],
            "type": "u8"
          },
          {
            "name": "hardCap",
            "docs": [
              "Maximum number of tokens that can be issued."
            ],
            "type": "u64"
          },
          {
            "name": "admin",
            "docs": [
              "Admin account."
            ],
            "type": "publicKey"
          },
          {
            "name": "pendingAdmin",
            "docs": [
              "Next admin account."
            ],
            "type": "publicKey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "Mint of the token."
            ],
            "type": "publicKey"
          },
          {
            "name": "numMinters",
            "docs": [
              "Number of [Minter]s."
            ],
            "type": "u64"
          },
          {
            "name": "totalAllowance",
            "docs": [
              "Total allowance outstanding."
            ],
            "type": "u64"
          },
          {
            "name": "totalMinted",
            "docs": [
              "Total amount of tokens minted through the [MintWrapper]."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "minter",
      "docs": [
        "One who can mint.",
        "",
        "```ignore",
        "seeds = [",
        "b\"MintWrapperMinter\",",
        "auth.mint_wrapper.key().to_bytes().as_ref(),",
        "minter_authority.key().to_bytes().as_ref(),",
        "&[bump]",
        "],",
        "```"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintWrapper",
            "docs": [
              "The mint wrapper."
            ],
            "type": "publicKey"
          },
          {
            "name": "minterAuthority",
            "docs": [
              "Address that can mint."
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
            "name": "index",
            "docs": [
              "Auto-incrementing index of the [Minter]."
            ],
            "type": "u64"
          },
          {
            "name": "allowance",
            "docs": [
              "Limit of number of tokens that this [Minter] can mint."
            ],
            "type": "u64"
          },
          {
            "name": "totalMinted",
            "docs": [
              "Cumulative sum of the number of tokens ever minted by this [Minter]."
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "MintWrapperAdminUpdateEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "previousAdmin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "MinterAllowanceUpdateEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "minter",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "previousAllowance",
          "type": "u64",
          "index": false
        },
        {
          "name": "allowance",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "NewMinterEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "minter",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "index",
          "type": "u64",
          "index": false
        },
        {
          "name": "minterAuthority",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "NewMintWrapperEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "hardCap",
          "type": "u64",
          "index": false
        },
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "tokenMint",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "MinterMintEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "minter",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "destination",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "MintWrapperAdminProposeEvent",
      "fields": [
        {
          "name": "mintWrapper",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "currentAdmin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pendingAdmin",
          "type": "publicKey",
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
      "name": "HardcapExceeded",
      "msg": "Cannot mint over hard cap."
    },
    {
      "code": 6002,
      "name": "MinterAllowanceExceeded",
      "msg": "Minter allowance exceeded."
    }
  ]
};
