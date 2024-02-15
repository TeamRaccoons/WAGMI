import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet, web3 } from "@coral-xyz/anchor";
import { Govern, IDL as GovernIDL } from "../../target/types/govern";
import {
  MerkleDistributor,
  IDL as MerkleDistributorIDL,
} from "../../target/types/merkle_distributor";
import {
  SmartWallet,
  IDL as SmartWalletIDL,
} from "../../target/types/smart_wallet";
import { MetVoter, IDL as MetVoterIDL } from "../../target/types/met_voter";
import { LockedVoter, IDL as LockedVoterIDL } from "../../target/types/locked_voter";

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

export function createMetVoterProgram(wallet: Wallet, programId: web3.PublicKey) {
  const provider = new anchor.AnchorProvider(
    anchor.AnchorProvider.env().connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new Program<MetVoter>(MetVoterIDL, programId, provider);

  return program;
}

export function createLockedVoterProgram(wallet: Wallet, programId: web3.PublicKey) {
  const provider = new anchor.AnchorProvider(
    anchor.AnchorProvider.env().connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new Program<LockedVoter>(LockedVoterIDL, programId, provider);

  return program;
}

export const MERKLE_DISTRIBUTOR_PROGRAM_ID = new web3.PublicKey(
  "MRKgRBL5XCCT5rwUGnim4yioq9wR4c6rj2EZkw8KdyZ"
);

export const GOVERN_PROGRAM_ID = new web3.PublicKey(
  "GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY"
);

export const MET_VOTER_PROGRAM_ID = new web3.PublicKey(
  "voteXZxajNhmCGpqzBhVArCANMKra5nwqtaaLA6v9CX"
);

export const LOCKED_VOTER_PROGRAM_ID = new web3.PublicKey(
  "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"
);

export const SMART_WALLET_PROGRAM_ID = new web3.PublicKey(
  "smaK3fwkA7ubbxEhsimp1iqPTzfS4MBsNL77QLABZP6"
);
