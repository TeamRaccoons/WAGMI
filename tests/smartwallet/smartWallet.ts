import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { AnchorError, Program } from "@project-serum/anchor";
import { SmartWallet } from "../../target/types/smart_wallet";
import { Keypair, SystemProgram, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

type Pubkey = anchor.web3.PublicKey;
const BN = anchor.BN;
type BN = anchor.BN;
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);


const program = anchor.workspace.SmartWallet as Program<SmartWallet>;

async function assertAnchorError(result: Promise<string>, errorCode: string) {
    try {
        await result;
    } catch (error) {
        assert.strictEqual(error instanceof AnchorError, true);
        let anchorError = error as AnchorError;
        assert.strictEqual(anchorError.error.errorCode.code, errorCode);
    }
}


describe("smartWallet", () => {
    // Before
    const smartWalletBase = new anchor.web3.Keypair();
    const numOwners = 10; // Big enough.

    const ownerA = new anchor.web3.Keypair();
    const ownerB = new anchor.web3.Keypair();
    const ownerC = new anchor.web3.Keypair();
    const ownerD = new anchor.web3.Keypair();
    const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey];

    const threshold = new anchor.BN(2);
    const delay = new BN(0);

    let smartWalletState: SmartWallet;
    let smartWallet: Pubkey;
    let bump: Number;
    before(async () => {
        const [smartWalletAddr, sBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("SmartWallet"), smartWalletBase.publicKey.toBuffer()],
            program.programId,
        );
        smartWallet = smartWalletAddr;
        bump = sBump;
        await program.methods
            .createSmartWallet(numOwners, owners, threshold, delay)
            .accounts({
                base: smartWalletBase.publicKey,
                smartWallet,
                payer: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([smartWalletBase])
            .rpc();
        smartWalletState = await program.account.smartWallet.fetch(smartWallet);
        expect(smartWalletState["threshold"].toString()).to.deep.equal("2");
        expect(smartWalletState["owners"]).to.deep.equal(owners);
        expect(smartWalletState["bump"]).to.be.equal(bump);
    })

    it("Happy path", async () => {
        const newOwners = [ownerA.publicKey, ownerB.publicKey, ownerD.publicKey];
        const data = program.coder.instruction.encode("set_owners", {
            owners: newOwners,
        });
        const instruction = {
            programId: program.programId,
            keys: [
                {
                    pubkey: smartWallet,
                    isWritable: true,
                    isSigner: true,
                },
            ],
            data,
        };
        const [txKey, txBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("Transaction"),
                smartWallet.toBuffer(),
                smartWalletState["numTransactions"].toBuffer("le", 8)
            ],
            program.programId
        );
        await program.methods.createTransaction(txBump, [instruction]).accounts({
            smartWallet,
            transaction: txKey,
            proposer: ownerA.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).signers([ownerA]).rpc();
        const txAccount = await program.account.transaction.fetch(txKey);
        expect(txAccount.executedAt.toNumber()).to.equal(-1);
        expect(txAccount.ownerSetSeqno).to.equal(0);
        expect(txAccount.instructions[0]?.programId, "program id").to.deep.equal(
            program.programId
        );
        expect(txAccount.instructions[0]?.data, "data").to.deep.equal(data);
        expect(txAccount.instructions[0]?.keys, "keys").to.deep.equal(
            instruction.keys
        );
        expect(txAccount.smartWallet).to.deep.equal(smartWallet);


        // Other owner approves transaction.
        await program.methods.approve().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerB.publicKey,
        }).signers([ownerB]).rpc();

        // Now that we've reached the threshold, send the transaction.
        await program.methods.executeTransaction().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerA.publicKey,
        }).remainingAccounts(
            txAccount.instructions.flatMap((ix) => [
                {
                    pubkey: ix.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...ix.keys.map((k) => {
                    return {
                        ...k,
                        isSigner: false,
                    };
                }),
            ])
        ).signers([ownerA]).rpc();

        // reload data
        smartWalletState = await program.account.smartWallet.fetch(smartWallet);
        expect(smartWalletState["bump"]).to.be.equal(bump);
        expect(smartWalletState["ownerSetSeqno"]).to.equal(1);
        expect(smartWalletState["threshold"].toString()).to.deep.equal("2");
        expect(smartWalletState["owners"]).to.deep.equal(newOwners);

    })

    it("owner set changed", async () => {
        const [txKey, txBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("Transaction"),
                smartWallet.toBuffer(),
                new BN(0).toBuffer(null, 8)
                // smartWalletState["numTransactions"].toBuffer(null, 8)
            ],
            program.programId
        );

        let tx = program.methods.approve().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerB.publicKey,
        }).signers([ownerB]);

        try {
            await tx.rpc();
        } catch (e) {
            const err = e as Error;
            console.log(err["error"]["errorMessage"])
        }

        const txAccount = await program.account.transaction.fetch(txKey);
        tx = program.methods.executeTransaction().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerA.publicKey,
        }).remainingAccounts(
            txAccount.instructions.flatMap((ix) => [
                {
                    pubkey: ix.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...ix.keys.map((k) => {
                    return {
                        ...k,
                        isSigner: false,
                    };
                }),
            ])
        ).signers([ownerA]);
        try {
            await tx.rpc();
        } catch (e) {
            const err = e as Error;
            console.log(err["error"]["errorMessage"])
        }
    });

    it("transaction execution is idempotent", async () => {
        const newThreshold = new BN(1);
        const data = program.coder.instruction.encode("change_threshold", {
            threshold: newThreshold,
        });
        const instruction = {
            programId: program.programId,
            keys: [
                {
                    pubkey: smartWallet,
                    isWritable: true,
                    isSigner: true,
                },
            ],
            data,
        };
        const [txKey, txBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("Transaction"),
                smartWallet.toBuffer(),
                smartWalletState["numTransactions"].toBuffer("le", 8)
            ],
            program.programId
        );

        await program.methods.createTransaction(txBump, [instruction]).accounts({
            smartWallet,
            transaction: txKey,
            proposer: ownerA.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).signers([ownerA]).rpc();


        // Other owner approves transaction.
        await program.methods.approve().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerB.publicKey,
        }).signers([ownerB]).rpc();

        // Now that we've reached the threshold, send the transaction.
        let txAccount = await program.account.transaction.fetch(txKey);
        await program.methods.executeTransaction().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerA.publicKey,
        }).remainingAccounts(
            txAccount.instructions.flatMap((ix) => [
                {
                    pubkey: ix.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...ix.keys.map((k) => {
                    return {
                        ...k,
                        isSigner: false,
                    };
                }),
            ])
        ).signers([ownerA]).rpc();
        // reload data
        smartWalletState = await program.account.smartWallet.fetch(smartWallet);
        expect(smartWalletState["threshold"].toString()).to.deep.equal("1");

        // Other owner approves transaction.
        txAccount = await program.account.transaction.fetch(txKey);
        let execTxDuplicate = program.methods.executeTransaction().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerB.publicKey,
        }).remainingAccounts(
            txAccount.instructions.flatMap((ix) => [
                {
                    pubkey: ix.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...ix.keys.map((k) => {
                    return {
                        ...k,
                        isSigner: false,
                    };
                }),
            ])
        ).signers([ownerB]);

        try {
            await execTxDuplicate.rpc();
        } catch (e) {
            const err = e as Error;
            console.log(err["error"]["errorMessage"])
        }
    });



});


describe("Tests the smartWallet program with timelock", () => {
    const smartWalletBase = new anchor.web3.Keypair();
    const numOwners = 10; // Big enough.

    const ownerA = new anchor.web3.Keypair();
    const ownerB = new anchor.web3.Keypair();
    const ownerC = new anchor.web3.Keypair();
    const ownerD = new anchor.web3.Keypair();
    const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey];

    const threshold = new anchor.BN(1);
    const delay = new anchor.BN(10);

    let smartWalletState: SmartWallet;
    let smartWallet: Pubkey;
    let bump: Number;
    before(async () => {
        const [smartWalletAddr, sBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("SmartWallet"), smartWalletBase.publicKey.toBuffer()],
            program.programId,
        );
        smartWallet = smartWalletAddr;
        bump = sBump;
        await program.methods
            .createSmartWallet(numOwners, owners, threshold, delay)
            .accounts({
                base: smartWalletBase.publicKey,
                smartWallet,
                payer: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([smartWalletBase])
            .rpc();
        smartWalletState = await program.account.smartWallet.fetch(smartWallet);
    })

    it("invalid eta", async () => {
        smartWalletState = await program.account.smartWallet.fetch(smartWallet);

        const newOwners = [ownerA.publicKey, ownerB.publicKey];
        const data = program.coder.instruction.encode("set_owners", {
            owners: newOwners,
        });
        const instruction = new TransactionInstruction({
            programId: program.programId,
            keys: [
                {
                    pubkey: smartWallet,
                    isWritable: true,
                    isSigner: true,
                },
            ],
            data,
        });

        const [txKey, txBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("Transaction"),
                smartWallet.toBuffer(),
                smartWalletState["numTransactions"].toBuffer("le", 8)
            ],
            program.programId
        );
        const tx = program.methods.createTransaction(txBump, [instruction]).accounts({
            smartWallet,
            transaction: txKey,
            proposer: ownerB.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).signers([ownerB]);

        try {
            await tx.rpc();
        } catch (e) {
            const err = e as Error;
            console.log(err["error"]["errorMessage"])
        }
    });

    it("execute tx", async () => {
        smartWalletState = await program.account.smartWallet.fetch(smartWallet);

        const newOwners = [ownerA.publicKey, ownerB.publicKey];
        const data = program.coder.instruction.encode("set_owners", {
            owners: newOwners,
        });
        const instruction = new TransactionInstruction({
            programId: program.programId,
            keys: [
                {
                    pubkey: smartWallet,
                    isWritable: true,
                    isSigner: true,
                },
            ],
            data,
        });

        const eta = smartWalletState["minimumDelay"].add(
            new BN(Date.now() / 1000)
        );

        const [txKey, txBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("Transaction"),
                smartWallet.toBuffer(),
                smartWalletState["numTransactions"].toBuffer("le", 8)
            ],
            program.programId
        );
        await program.methods.createTransactionWithTimelock(txBump, [instruction], eta).accounts({
            smartWallet,
            transaction: txKey,
            proposer: ownerB.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).signers([ownerB]).rpc();


        let txAccount = await program.account.transaction.fetch(txKey);
        let falseStartTx = program.methods.executeTransaction().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerB.publicKey,
        }).remainingAccounts(
            txAccount.instructions.flatMap((ix) => [
                {
                    pubkey: ix.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...ix.keys.map((k) => {
                    return {
                        ...k,
                        isSigner: false,
                    };
                }),
            ])
        ).signers([ownerB]);
        try {
            await falseStartTx.rpc();
        } catch (e) {
            const err = e as Error;
            console.log(err["error"]["errorMessage"])
        }

        const sleepTime = eta.sub(new BN(Date.now() / 1000)).add(new BN(5));
        await sleep(sleepTime.toNumber() * 1000);


        await program.methods.executeTransaction().accounts({
            smartWallet,
            transaction: txKey,
            owner: ownerB.publicKey,
        }).remainingAccounts(
            txAccount.instructions.flatMap((ix) => [
                {
                    pubkey: ix.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...ix.keys.map((k) => {
                    return {
                        ...k,
                        isSigner: false,
                    };
                }),
            ])
        ).signers([ownerB]).rpc();

        smartWalletState = await program.account.smartWallet.fetch(smartWallet);
        expect(smartWalletState["ownerSetSeqno"]).to.equal(1);
        expect(smartWalletState["owners"]).to.deep.equal(newOwners);
    });
})


describe("Execute derived transaction", () => {
    const smartWalletBase = new anchor.web3.Keypair();
    const numOwners = 3;

    const ownerA = new anchor.web3.Keypair();
    const ownerB = new anchor.web3.Keypair();
    const owners = [ownerA.publicKey, ownerB.publicKey, provider.wallet.publicKey];

    const threshold = new anchor.BN(1);
    const delay = new anchor.BN(0);

    let smartWalletState: SmartWallet;
    let smartWallet: Pubkey;
    let bump: Number;
    before(async () => {
        const [smartWalletAddr, sBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("SmartWallet"), smartWalletBase.publicKey.toBuffer()],
            program.programId,
        );
        smartWallet = smartWalletAddr;
        bump = sBump;
        await program.methods
            .createSmartWallet(numOwners, owners, threshold, delay)
            .accounts({
                base: smartWalletBase.publicKey,
                smartWallet,
                payer: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([smartWalletBase])
            .rpc();
        smartWalletState = await program.account.smartWallet.fetch(smartWallet);
    })

    it("Can transfer lamports from smart wallet", async () => {
        const index = 0;
        const [derivedWalletKey, walletBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("SmartWalletDerived"),
                smartWallet.toBuffer(),
                new BN(index).toBuffer("le", 8)
            ],
            program.programId
        );
        let sig = await program.provider.connection.requestAirdrop(
            derivedWalletKey,
            LAMPORTS_PER_SOL
        );
        await program.provider.connection.confirmTransaction(sig);

        const receiver = Keypair.generate().publicKey;

        const ix = SystemProgram.transfer({
            fromPubkey: derivedWalletKey,
            toPubkey: receiver,
            lamports: LAMPORTS_PER_SOL,
        });

        const [txKey, txBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("Transaction"),
                smartWallet.toBuffer(),
                smartWalletState["numTransactions"].toBuffer("le", 8)
            ],
            program.programId
        );

        await program.methods.createTransaction(txBump, [ix]).accounts({
            smartWallet,
            transaction: txKey,
            proposer: provider.wallet.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();

        expect(await provider.connection.getBalance(derivedWalletKey)).to.eq(
            LAMPORTS_PER_SOL
        );
        let txAccount = await program.account.transaction.fetch(txKey);
        await program.methods.executeTransactionDerived(new BN(index), walletBump).accounts({
            smartWallet,
            transaction: txKey,
            owner: provider.wallet.publicKey,
        }).remainingAccounts(
            txAccount.instructions.flatMap((ix) => [
                {
                    pubkey: ix.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...ix.keys.map((k) => {
                    if (
                        k.isSigner &&
                        ((derivedWalletKey && k.pubkey.equals(derivedWalletKey)) ||
                            k.pubkey.equals(smartWallet))
                    ) {
                        return {
                            ...k,
                            isSigner: false,
                        };
                    }
                    return k;
                }),
            ])
        ).rpc();
        expect(await provider.connection.getBalance(receiver)).to.eq(
            LAMPORTS_PER_SOL
        );
    });
})

describe("Owner Invoker", () => {
    const smartWalletBase = new anchor.web3.Keypair();
    const numOwners = 3;

    const ownerA = new anchor.web3.Keypair();
    const ownerB = new anchor.web3.Keypair();
    const owners = [ownerA.publicKey, ownerB.publicKey, provider.wallet.publicKey];

    const threshold = new anchor.BN(1);
    const delay = new anchor.BN(0);

    let smartWalletState: SmartWallet;
    let smartWallet: Pubkey;
    let bump: Number;
    before(async () => {
        const [smartWalletAddr, sBump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("SmartWallet"), smartWalletBase.publicKey.toBuffer()],
            program.programId,
        );
        smartWallet = smartWalletAddr;
        bump = sBump;
        await program.methods
            .createSmartWallet(numOwners, owners, threshold, delay)
            .accounts({
                base: smartWalletBase.publicKey,
                smartWallet,
                payer: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([smartWalletBase])
            .rpc();
        smartWalletState = await program.account.smartWallet.fetch(smartWallet);
    })

    it("should invoke 1 of N", async () => {
        const index = 5;
        const [invokerKey, invokerBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("SmartWalletOwnerInvoker"),
                smartWallet.toBuffer(),
                new BN(index).toBuffer("le", 8)
            ],
            program.programId
        );
        let sig = await program.provider.connection.requestAirdrop(
            invokerKey,
            LAMPORTS_PER_SOL
        );
        await program.provider.connection.confirmTransaction(sig);
        expect(await provider.connection.getBalance(invokerKey)).to.eq(
            LAMPORTS_PER_SOL
        );

        let instruction = SystemProgram.transfer({
            fromPubkey: invokerKey,
            toPubkey: provider.wallet.publicKey,
            lamports: LAMPORTS_PER_SOL,
        });

        await program.methods.ownerInvokeInstruction(new BN(index),
            invokerBump,
            instruction).accounts({
                smartWallet,
                owner: provider.wallet.publicKey,
            }).remainingAccounts([
                {
                    pubkey: instruction.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...instruction.keys.map((k) => {
                    if (k.isSigner && invokerKey.equals(k.pubkey)) {
                        return {
                            ...k,
                            isSigner: false,
                        };
                    }
                    return k;
                }),
            ]).rpc();

        const [subaccountInfo, bump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("SubaccountInfo"), invokerKey.toBuffer()],
            program.programId
        );
        await program.methods.createSubaccountInfo(invokerKey, smartWallet, new BN(index), {
            ["ownerInvoker"]: {},
        }).accounts({
            subaccountInfo,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();

        let info = await program.account.subaccountInfo.fetch(subaccountInfo);
        expect(info.index.toString()).to.eq(index.toString());
        expect(info.smartWallet).to.deep.eq(smartWallet);
        expect(info.subaccountType).to.deep.eq({ ownerInvoker: {} });
    });

    it("should invoke 1 of N (v2)", async () => {
        const index = 6;
        const [invokerKey, invokerBump] = await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("SmartWalletOwnerInvoker"),
                smartWallet.toBuffer(),
                new BN(index).toBuffer("le", 8)
            ],
            program.programId
        );

        let sig = await program.provider.connection.requestAirdrop(
            invokerKey,
            LAMPORTS_PER_SOL
        );
        await program.provider.connection.confirmTransaction(sig);


        let instruction = SystemProgram.transfer({
            fromPubkey: invokerKey,
            toPubkey: provider.wallet.publicKey,
            lamports: LAMPORTS_PER_SOL,
        });

        await program.methods.ownerInvokeInstructionV2(new BN(index),
            invokerBump, invokerKey, instruction.data).accounts({
                smartWallet,
                owner: provider.wallet.publicKey,
            }).remainingAccounts([
                {
                    pubkey: instruction.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...instruction.keys.map((k) => {
                    if (k.isSigner && invokerKey.equals(k.pubkey)) {
                        return {
                            ...k,
                            isSigner: false,
                        };
                    }
                    return k;
                }),
            ]).rpc();
        const [subaccountInfo, bump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("SubaccountInfo"), invokerKey.toBuffer()],
            program.programId
        );
        await program.methods.createSubaccountInfo(invokerKey, smartWallet, new BN(index), {
            ["ownerInvoker"]: {},
        }).accounts({
            subaccountInfo,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();

        let info = await program.account.subaccountInfo.fetch(subaccountInfo);
        expect(info.index.toString()).to.eq(index.toString());
        expect(info.smartWallet).to.deep.eq(smartWallet);
        expect(info.subaccountType).to.deep.eq({ ownerInvoker: {} });
    });

    it("invoke large TX (v2)", async () => {
        const index = 7;
        const [invokerKey, invokerBump] =
            await anchor.web3.PublicKey.findProgramAddress(
                [
                    Buffer.from("SmartWalletOwnerInvoker"),
                    smartWallet.toBuffer(),
                    new BN(index).toBuffer("le", 8)
                ],
                program.programId
            );


        let sig = await program.provider.connection.requestAirdrop(
            invokerKey,
            LAMPORTS_PER_SOL
        );
        await program.provider.connection.confirmTransaction(sig);

        const instruction = SystemProgram.transfer({
            fromPubkey: invokerKey,
            toPubkey: provider.wallet.publicKey,
            lamports: LAMPORTS_PER_SOL,
        });

        await program.methods.ownerInvokeInstructionV2(new BN(index),
            invokerBump, invokerKey, instruction.data).accounts({
                smartWallet,
                owner: ownerA.publicKey,
            }).remainingAccounts([
                {
                    pubkey: instruction.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...instruction.keys.map((k) => {
                    if (k.isSigner && invokerKey.equals(k.pubkey)) {
                        return {
                            ...k,
                            isSigner: false,
                        };
                    }
                    return k;
                },
                    /// Add 24 dummy keys
                    ...new Array(24).fill(null).map(() => ({
                        pubkey: Keypair.generate().publicKey,
                        isSigner: false,
                        isWritable: false,
                    })),
                ),
            ]).signers([ownerA]).rpc();
        const [subaccountInfo, bump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("SubaccountInfo"), invokerKey.toBuffer()],
            program.programId
        );
        await program.methods.createSubaccountInfo(invokerKey, smartWallet, new BN(index), {
            ["ownerInvoker"]: {},
        }).accounts({
            subaccountInfo,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        }).rpc();

        let info = await program.account.subaccountInfo.fetch(subaccountInfo);
        expect(info.index.toString()).to.eq(index.toString());
        expect(info.smartWallet).to.deep.eq(smartWallet);
        expect(info.subaccountType).to.deep.eq({ ownerInvoker: {} });
    });

    it("invalid invoker should fail (v2)", async () => {
        const index = 0;
        const [invokerKey] = await await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from("SmartWalletOwnerInvoker"),
                smartWallet.toBuffer(),
                new BN(index).toBuffer("le", 8)
            ],
            program.programId
        );
        const instructionToExecute = createMemoInstruction("hello", [invokerKey]);

        const [fakeInvoker, invokerBump] = [Keypair.generate(), 254];
        const fakeInvokerKey = fakeInvoker.publicKey;

        const tx = program.methods.ownerInvokeInstructionV2(
            new BN(index),
            invokerBump,
            fakeInvokerKey,
            instructionToExecute.data,
        ).accounts(
            {
                smartWallet,
                owner: ownerA.publicKey,
            }
        ).remainingAccounts(
            [
                {
                    pubkey: instructionToExecute.programId,
                    isSigner: false,
                    isWritable: false,
                },
                ...instructionToExecute.keys.map((k) => {
                    if (k.isSigner && invokerKey.equals(k.pubkey)) {
                        return {
                            ...k,
                            isSigner: false,
                        };
                    }
                    return k;
                }),
            ],
        ).signers([ownerA]);
        try {
            await tx.rpc();
        } catch (e) {
            const err = e as Error;
            console.log(err)
        }
    });
})

function sleep(ms: number) {
    return new Promise((res) => {
        setTimeout(res, ms);
    });
}

const MEMO_PROGRAM_ID = new anchor.web3.PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

/**
 * Creates a memo program instruction.
 *
 * More info: https://spl.solana.com/memo
 *
 * @param text Text of the memo.
 * @param signers Optional signers to validate.
 * @returns
 */
const createMemoInstruction = (
    text: string,
    signers: readonly anchor.web3.PublicKey[] = []
): TransactionInstruction => {
    return new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: signers.map((s) => ({
            pubkey: s,
            isSigner: true,
            isWritable: false,
        })),
        data: Buffer.from(text, "utf8"),
    });
};