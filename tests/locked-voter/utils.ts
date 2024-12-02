import { Wallet, web3, BN } from "@coral-xyz/anchor";
import { createLockedVoterProgram, createSmartWalletProgram, deriveTransaction, GOVERN_PROGRAM_ID, LOCKED_VOTER_PROGRAM_ID, SMART_WALLET_PROGRAM_ID } from "../utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";

export enum DisputePhase {
    None = 0,
    Dispute = 1,
    Resolve = 2,
    Withdraw = 3,
}


export interface OpenDisputeParams {
    payerKP: web3.Keypair,
    ownerKP: web3.Keypair,
    newOwner: web3.PublicKey,
    escrow: web3.PublicKey,
    isAssertion: boolean,
}

export async function openDispute(
    params: OpenDisputeParams
): Promise<web3.PublicKey> {
    const { payerKP, ownerKP, newOwner, escrow, isAssertion } = params;
    const voterProgram = createLockedVoterProgram(
        new Wallet(payerKP),
        LOCKED_VOTER_PROGRAM_ID
    );
    let escrowState = await voterProgram.account.escrow.fetch(escrow);
    const disputeKP = web3.Keypair.generate();
    await voterProgram.methods
        .openDispute(newOwner)
        .accounts({
            escrow,
            escrowTokens: escrowState.tokens,
            disputeRequest: disputeKP.publicKey,
            owner: ownerKP.publicKey,
            payer: payerKP.publicKey,
            systemProgram: web3.SystemProgram.programId,
        })
        .signers([disputeKP, ownerKP])
        .rpc();
    if (isAssertion) {
        escrowState = await voterProgram.account.escrow.fetch(escrow);
        let disputeState = await voterProgram.account.disputeRequest.fetch(disputeKP.publicKey);
        expect(escrowState.dispute.phase).to.be.equal(DisputePhase.Dispute);
        expect(escrowState.dispute.phaseDisputeTimestamp.toNumber()).to.be.greaterThan(0);
        expect(disputeState.escrow.toString()).to.be.eq(escrow.toString());
        expect(disputeState.newOwner.toString()).to.be.eq(newOwner.toString());
        expect(disputeState.phaseIndex.toNumber()).to.be.eq(escrowState.dispute.phaseIndex.toNumber());
    }
    return disputeKP.publicKey;
}



export interface CloseDisputeParams {
    ownerKP: web3.Keypair,
    escrow: web3.PublicKey,
    isAssertion: boolean,
}

export async function closeDispute(
    params: CloseDisputeParams
) {
    const { ownerKP, escrow, isAssertion } = params;
    const voterProgram = createLockedVoterProgram(
        new Wallet(ownerKP),
        LOCKED_VOTER_PROGRAM_ID
    );
    let oldEscrowState = await voterProgram.account.escrow.fetch(escrow);
    await voterProgram.methods
        .closeDispute()
        .accounts({
            escrow,
            owner: ownerKP.publicKey
        })
        .rpc();
    if (isAssertion) {
        let escrowState = await voterProgram.account.escrow.fetch(escrow);
        expect(escrowState.dispute.phase).to.be.equal(DisputePhase.None);
        expect(escrowState.dispute.phaseIndex.toNumber()).to.be.equal(oldEscrowState.dispute.phaseIndex.toNumber() + 1);
        expect(escrowState.dispute.phaseDisputeTimestamp.toNumber()).to.be.eq(0);
    }
}

export interface ResolveDisputeParams {
    multisigMember: web3.Keypair, // only work for the case threshold == 1
    escrow: web3.PublicKey,
    smartWallet: web3.PublicKey,
    disputeRequest: web3.PublicKey,
    isAssertion: boolean,
}
export async function resolveDispute(
    params: ResolveDisputeParams
) {
    const { multisigMember, escrow, smartWallet, disputeRequest, isAssertion } = params;


    const voterProgram = createLockedVoterProgram(
        new Wallet(multisigMember),
        LOCKED_VOTER_PROGRAM_ID
    );

    const ixData = voterProgram.coder.instruction.encode(
        "resolve_dispute",
        {}
    );

    const smartWalletProgram = createSmartWalletProgram(
        new Wallet(multisigMember),
        SMART_WALLET_PROGRAM_ID
    );

    const smartWalletState = await smartWalletProgram.account.smartWallet.fetch(
        smartWallet
    );

    const [transaction, txBump] = deriveTransaction(
        smartWallet,
        smartWalletState.numTransactions
    );

    const escrowState = await voterProgram.account.escrow.fetch(escrow);
    const lockerState = await voterProgram.account.locker.fetch(escrowState.locker);

    const activateProposalIx = {
        programId: LOCKED_VOTER_PROGRAM_ID,
        data: ixData,
        keys: [
            {
                isSigner: false,
                isWritable: false,
                pubkey: disputeRequest,
            },
            {
                isSigner: false,
                isWritable: true,
                pubkey: escrow,
            },
            {
                isSigner: false,
                isWritable: true,
                pubkey: escrowState.locker,
            },
            {
                isSigner: false,
                isWritable: false,
                pubkey: lockerState.governor,
            },
            {
                isSigner: true,
                isWritable: false,
                pubkey: smartWallet,
            },
        ],
    };

    await smartWalletProgram.methods
        .createTransaction(txBump, [activateProposalIx])
        .accounts({
            payer: smartWalletProgram.provider.publicKey,
            proposer: smartWalletProgram.provider.publicKey,
            smartWallet,
            systemProgram: web3.SystemProgram.programId,
            transaction,
        })
        .rpc();

    // Smart wallet execute activate proposal transaction
    await smartWalletProgram.methods
        .executeTransaction()
        .accounts({
            owner: smartWalletProgram.provider.publicKey,
            smartWallet,
            transaction,
        })
        .remainingAccounts([
            {
                isSigner: false,
                isWritable: false,
                pubkey: LOCKED_VOTER_PROGRAM_ID,
            },
            ...activateProposalIx.keys.map((x) => {
                return {
                    ...x,
                    isSigner: false, // Need to override to false as these are signed by the smart wallet
                };
            }),
        ])
        .rpc();
    if (isAssertion) {
        let escrowState = await voterProgram.account.escrow.fetch(escrow);
        expect(escrowState.dispute.phase).to.be.equal(DisputePhase.Resolve);
        expect(escrowState.dispute.phaseResolveTimestamp.toNumber()).to.be.greaterThan(0);
        expect(escrowState.dispute.approvedDisputeRequest.toString()).to.be.eq(disputeRequest.toString());
    }
}


export interface WithdrawFundFromDisputeParams {
    newOwnerKp: web3.Keypair,
    escrow: web3.PublicKey,
    approvedDisputeRequest: web3.PublicKey,
    destinationTokens: web3.PublicKey,
    isAssertion: boolean,
}

export async function withdrawFundFromDispute(
    params: WithdrawFundFromDisputeParams
) {

    const { newOwnerKp, escrow, approvedDisputeRequest, destinationTokens, isAssertion } = params;
    const voterProgram = createLockedVoterProgram(
        new Wallet(newOwnerKp),
        LOCKED_VOTER_PROGRAM_ID
    );
    const escrowState = await voterProgram.account.escrow.fetch(escrow);
    await voterProgram.methods.withdrawFundFromDispute().accounts({
        locker: escrowState.locker,
        escrow,
        approvedDisputeRequest,
        newOwner: newOwnerKp.publicKey,
        escrowTokens: escrowState.tokens,
        destinationTokens,
        tokenProgram: TOKEN_PROGRAM_ID,
    }).rpc();

    if (isAssertion) {
        let escrowState = await voterProgram.account.escrow.fetch(escrow);
        expect(escrowState.dispute.phase).to.be.equal(DisputePhase.Withdraw);
    }

}