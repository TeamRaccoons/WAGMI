import * as anchor from "@project-serum/anchor";
import { Program, Wallet, web3 } from "@project-serum/anchor";
import { Govern, IDL as GovernIDL } from "../../target/types/govern";
import {
  MerkleDistributor,
  IDL as MerkleDistributorIDL,
} from "../../target/types/merkle_distributor";
import {
  SmartWallet,
  IDL as SmartWalletIDL,
} from "../../target/types/smart_wallet";
import { Voter, IDL as VoterIDL } from "../../target/types/voter";

export function createMerkleDistributorProgram(
  wallet: Wallet,
  programId: web3.PublicKey
) {
  const provider = new anchor.AnchorProvider(
    anchor.AnchorProvider.env().connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new Program<MerkleDistributor>(
    MerkleDistributorIDL,
    programId,
    provider
  );

  return program;
}

export function createSmartWalletProgram(
  wallet: Wallet,
  programId: web3.PublicKey
) {
  const provider = new anchor.AnchorProvider(
    anchor.AnchorProvider.env().connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new Program<SmartWallet>(SmartWalletIDL, programId, provider);

  return program;
}

export function createGovernProgram(wallet: Wallet, programId: web3.PublicKey) {
  const provider = new anchor.AnchorProvider(
    anchor.AnchorProvider.env().connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new Program<Govern>(GovernIDL, programId, provider);

  return program;
}

export function createVoterProgram(wallet: Wallet, programId: web3.PublicKey) {
  const provider = new anchor.AnchorProvider(
    anchor.AnchorProvider.env().connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new Program<Voter>(VoterIDL, programId, provider);

  return program;
}

export const MERKLE_DISTRIBUTOR_PROGRAM_ID = new web3.PublicKey(
  "MRKgRBL5XCCT5rwUGnim4yioq9wR4c6rj2EZkw8KdyZ"
);

export const GOVERN_PROGRAM_ID = new web3.PublicKey(
  "GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY"
);

export const VOTER_PROGRAM_ID = new web3.PublicKey(
  "voteXZxajNhmCGpqzBhVArCANMKra5nwqtaaLA6v9CX"
);

export const SMART_WALLET_PROGRAM_ID = new web3.PublicKey(
  "smaK3fwkA7ubbxEhsimp1iqPTzfS4MBsNL77QLABZP6"
);
