import { BN, web3 } from "@coral-xyz/anchor";
import { keccak_256 } from "js-sha3";

import { MerkleTree } from "./merkle-tree";


export class BalanceTree {
  private readonly _tree: MerkleTree;
  constructor(balances: { account: web3.PublicKey; amount: BN }[]) {
    this._tree = new MerkleTree(
      balances.map(({ account, amount }, index) => {
        return BalanceTree.toNode(index, account, amount);
      })
    );
  }

  static verifyProof(
    index: number,
    account: web3.PublicKey,
    amount: BN,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = BalanceTree.toNode(index, account, amount);
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item);
    }

    return pair.equals(root);
  }

  // keccak256(abi.encode(index, account, amount))
  static toNode(index: number, account: web3.PublicKey, amount: BN): Buffer {
    const buf = Buffer.concat([
      new BN(index).toArrayLike(Buffer, "le", 8),
      account.toBuffer(),
      new BN(amount).toArrayLike(Buffer, "le", 8),
    ]);
    return Buffer.from(keccak_256(buf), "hex");
  }

  getHexRoot(): string {
    return this._tree.getHexRoot();
  }

  // returns the hex bytes32 values of the proof
  getHexProof(index: number, account: web3.PublicKey, amount: BN): string[] {
    return this._tree.getHexProof(BalanceTree.toNode(index, account, amount));
  }

  getRoot(): Buffer {
    return this._tree.getRoot();
  }

  getProof(index: number, account: web3.PublicKey, amount: BN): Buffer[] {
    return this._tree.getProof(BalanceTree.toNode(index, account, amount));
  }
}
