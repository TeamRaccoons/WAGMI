import * as anchor from "@project-serum/anchor";
import { Program, web3, Wallet } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID, createMint, setAuthority, AuthorityType, getMint, mintTo } from "@solana/spl-token";

import {
  PublicKey,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import { expect } from "chai";
import invariant from "tiny-invariant";
import {
  setupTokenMintAndMinter,
  createAndFundWallet,
  getOrCreateATA,
  createMocAmm,
} from "../utils";

import { Quarry } from "../../target/types/quarry";
import { Minter } from "../../target/types/minter";


const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.Quarry as Program<Quarry>;
const programMinter = anchor.workspace.Minter as Program<Minter>;
// const programMocAmm = anchor.workspace.MocAmm as Program<MocAmm>;

export const DEFAULT_DECIMALS = 9;
export const DEFAULT_HARD_CAP = 1_000_000_000_000_000;

describe("Mine", () => {
  const { web3, BN } = anchor;

  const DAILY_REWARDS_RATE = new BN(1_000 * web3.LAMPORTS_PER_SOL);
  const ANNUAL_REWARDS_RATE = DAILY_REWARDS_RATE.mul(new BN(365));

  let adminKP: web3.Keypair;
  let wallet: Wallet;
  let stakeTokenMint: PublicKey;
  let stakedMintAuthority: anchor.web3.Keypair;
  let ammPool: PublicKey;

  before(async () => {
    const result = await createAndFundWallet(provider.connection);
    adminKP = result.keypair;
    wallet = result.wallet;
    // create mint
    stakedMintAuthority = web3.Keypair.generate();
    stakeTokenMint = await createMint(
      provider.connection,
      adminKP,
      stakedMintAuthority.publicKey,
      null,
      DEFAULT_DECIMALS
    );
    ammPool = await createMocAmm(30, stakeTokenMint, adminKP);
  });

  let rewardsMint: PublicKey;
  let mintWrapperKey: PublicKey;
  let minterBase: web3.Keypair;

  beforeEach("Initialize minter", async () => {
    minterBase = new anchor.web3.Keypair();


    let minterResult = await setupTokenMintAndMinter(minterBase, adminKP, DEFAULT_DECIMALS, DEFAULT_HARD_CAP);
    rewardsMint = minterResult.rewardsMint;
    mintWrapperKey = minterResult.mintWrapper;
  });

  describe("Rewarder", () => {
    let rewarderKey: PublicKey;

    beforeEach("rewarder", async () => {
      let rewarderBaseKP = new anchor.web3.Keypair();
      let rewarderBase = rewarderBaseKP.publicKey;
      const [rewarder, sBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("Rewarder"), rewarderBase.toBuffer()],
          program.programId
        );
      await program.methods.newRewarder().accounts({
        base: rewarderBase,
        rewarder,
        admin: adminKP.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        mintWrapper: mintWrapperKey,
        rewardsTokenMint: rewardsMint,
      }).signers([rewarderBaseKP, adminKP]).rpc();
      rewarderKey = rewarder;
    });

    it("Is initialized!", async () => {
      const rewarder = await program.account.rewarder.fetch(rewarderKey);

      expect(rewarder.admin).to.deep.equal(adminKP.publicKey);
      expect(rewarder.annualRewardsRate.toNumber()).to.equal(0);
      expect(rewarder.numQuarries).to.equal(0);
      expect(rewarder.totalRewardsShares.toNumber()).to.deep.equal(0);
    });

    it("Set daily rewards rate", async () => {
      await program.methods.setAnnualRewards(ANNUAL_REWARDS_RATE).accounts({
        auth: {
          admin: adminKP.publicKey,
          rewarder: rewarderKey,
        }
      }).signers([adminKP]).rpc();
      const rewarder = await program.account.rewarder.fetch(rewarderKey);
      expect(rewarder.annualRewardsRate.toNumber()).to.deep.equal(ANNUAL_REWARDS_RATE.toNumber());
    });

    it("Transfer admin and accept admin", async () => {
      const newAdmin = web3.Keypair.generate();

      await program.methods.transferAdmin(newAdmin.publicKey).accounts({
        admin: adminKP.publicKey,
        rewarder: rewarderKey,
      }).signers([adminKP]).rpc();

      let rewarder = await program.account.rewarder.fetch(rewarderKey);
      expect(rewarder.admin).to.deep.equal(adminKP.publicKey);
      expect(rewarder.pendingAdmin).to.deep.equal(newAdmin.publicKey);

      await program.methods.acceptAdmin().accounts({
        admin: newAdmin.publicKey,
        rewarder: rewarderKey,
      }).signers([newAdmin]).rpc();


      rewarder = await program.account.rewarder.fetch(rewarderKey);
      expect(rewarder.admin).to.deep.equal(newAdmin.publicKey);
      expect(rewarder.pendingAdmin).to.deep.equal(web3.PublicKey.default);

      // transfer back
      await program.methods.transferAdmin(adminKP.publicKey).accounts({
        admin: newAdmin.publicKey,
        rewarder: rewarderKey,
      }).signers([newAdmin]).rpc();
      await program.methods.acceptAdmin().accounts({
        admin: adminKP.publicKey,
        rewarder: rewarderKey,
      }).signers([adminKP]).rpc();

      rewarder = await program.account.rewarder.fetch(rewarderKey);
      expect(rewarder.admin).to.deep.equal(adminKP.publicKey);
      expect(rewarder.pendingAdmin).to.deep.equal(web3.PublicKey.default);
    });
  });

  describe("Quarry", () => {
    const quarryRewardsShare = ANNUAL_REWARDS_RATE.div(new BN(10));
    let quarryKey: anchor.web3.PublicKey;
    let rewarderKey: anchor.web3.PublicKey;

    beforeEach(async () => {
      let rewarderBaseKP = new anchor.web3.Keypair();
      let rewarderBase = rewarderBaseKP.publicKey;
      const [rewarder, sBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("Rewarder"), rewarderBase.toBuffer()],
          program.programId
        );
      await program.methods.newRewarder().accounts({
        base: rewarderBase,
        rewarder,
        admin: adminKP.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        mintWrapper: mintWrapperKey,
        rewardsTokenMint: rewardsMint,
      }).signers([rewarderBaseKP, adminKP]).rpc();

      rewarderKey = rewarder;

      await program.methods.setAnnualRewards(ANNUAL_REWARDS_RATE).accounts({
        auth: {
          admin: adminKP.publicKey,
          rewarder: rewarderKey,
        }
      }).signers([adminKP]).rpc();
      const rewarderState = await program.account.rewarder.fetch(rewarderKey);
      expect(rewarderState.annualRewardsRate.toNumber()).to.deep.equal(ANNUAL_REWARDS_RATE.toNumber());
    });



    describe("Single quarry", () => {
      beforeEach("Create a new quarry", async () => {
        const [quarry, sBump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPool.toBuffer()],
            program.programId
          );

        await program.methods.createQuarry(new BN(0)).accounts({
          quarry,
          auth: {
            admin: adminKP.publicKey,
            rewarder: rewarderKey,
          },
          ammPool,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }).signers([adminKP]).rpc();

        let rewarderState = await program.account.rewarder.fetch(rewarderKey);
        expect(rewarderState.numQuarries).to.deep.equal(1);

        let quarryState = await program.account.quarry.fetch(quarry);
        expect(quarryState.famineTs.toString()).to.deep.equal("9223372036854775807");
        expect(quarryState.tokenMintKey).to.deep.equal(stakeTokenMint);
        expect(quarryState.annualRewardsRate.toNumber()).to.deep.equal(0);
        expect(quarryState.rewardsShare.toNumber()).to.deep.equal(0);

        quarryKey = quarry;
      });

      it("Set rewards share", async () => {
        await program.methods.setRewardsShare(quarryRewardsShare).accounts({
          quarry: quarryKey,
          authority: adminKP.publicKey,
          rewarder: rewarderKey,
        }).signers([adminKP]).rpc();
        let rewarderState = await program.account.rewarder.fetch(rewarderKey);
        expect(rewarderState.totalRewardsShares.toNumber()).to.deep.equal(quarryRewardsShare.toNumber());

        let quarryState = await program.account.quarry.fetch(quarryKey);
        expect(quarryState.rewardsShare.toNumber()).to.deep.equal(quarryRewardsShare.toNumber());
        expect(quarryState.annualRewardsRate.toNumber()).to.deep.equal(0);
        expect(quarryState.lastUpdateTs.toNumber()).to.deep.equal(0);
        // sync quarry
        // permissionless
        const currentTime = Math.floor(new Date().getTime() / 1000);
        await program.methods.updateQuarryRewards().accounts({
          quarry: quarryKey,
          rewarder: rewarderKey,
        }).rpc();
        quarryState = await program.account.quarry.fetch(quarryKey);
        expect(quarryState.annualRewardsRate.toNumber()).not.deep.equal(0);

        expect(
          quarryState.lastUpdateTs
            .sub(new BN(currentTime))
            .abs()
            .lte(new BN(1))
        ).to.be.true;
      });

      it("Set famine", async () => {
        const now = new BN(Date.now());

        await program.methods.setFamine(now).accounts({
          quarry: quarryKey,
          auth: {
            admin: adminKP.publicKey,
            rewarder: rewarderKey,
          },
        }).signers([adminKP]).rpc();

        let quarryState = await program.account.quarry.fetch(quarryKey);
        expect(quarryState.famineTs.toNumber()).deep.equal(now.toNumber());
      });

      it("Unauthorized", async () => {
        const fakeAuthority = web3.Keypair.generate();
        const nextMint = await createMint(
          provider.connection,
          adminKP,
          adminKP.publicKey,
          null,
          DEFAULT_DECIMALS
        );
        let ammPool = await createMocAmm(30, nextMint, adminKP);

        const [quarry, sBump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPool.toBuffer()],
            program.programId
          );

        try {
          await program.methods.createQuarry(new BN(0)).accounts({
            quarry,
            auth: {
              admin: fakeAuthority.publicKey,
              rewarder: rewarderKey,
            },
            ammPool,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          }).signers([fakeAuthority]).rpc();
          expect(1).to.deep.equal(0);
        } catch (e) {
          console.log("cannot create quarry with fake authority")
        }
      });

      it("Invalid PDA", async () => {
        let nonAmmKey = Keypair.generate().publicKey;
        const [quarry, sBump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("Quarry"), rewarderKey.toBuffer(), nonAmmKey.toBuffer()],
            program.programId
          );

        try {
          await program.methods.createQuarry(new BN(0)).accounts({
            quarry,
            auth: {
              admin: adminKP.publicKey,
              rewarder: rewarderKey,
            },
            ammPool: nonAmmKey,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          }).signers([adminKP]).rpc();
          expect(1).to.deep.equal(0);
        } catch (e) {
          console.log("cannot create quarry with invalid PDA")
        }
      });
    });

    describe("Multiple quarries", () => {
      const ammPools: PublicKey[] = [];

      beforeEach("Create quarries", async () => {
        let totalRewardsShare = new BN(0);
        const numQuarries = 5;
        for (let i = 0; i < numQuarries; i++) {
          const mint = await createMint(
            provider.connection,
            adminKP,
            adminKP.publicKey,
            null,
            DEFAULT_DECIMALS
          );
          const rewardsShare = new BN(i + 1);

          let ammPool = await createMocAmm(30, mint, adminKP);

          ammPools.push(ammPool);

          const [quarry, sBump] =
            await anchor.web3.PublicKey.findProgramAddress(
              [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPool.toBuffer()],
              program.programId
            );

          await program.methods.createQuarry(new BN(0)).accounts({
            quarry,
            auth: {
              admin: adminKP.publicKey,
              rewarder: rewarderKey,
            },
            ammPool,
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          }).signers([adminKP]).rpc();

          await program.methods.setRewardsShare(rewardsShare).accounts({
            quarry,
            authority: adminKP.publicKey,
            rewarder: rewarderKey,
          }).signers([adminKP]).rpc();

          totalRewardsShare = totalRewardsShare.add(rewardsShare);
        }
        let rewarderState = await program.account.rewarder.fetch(rewarderKey);
        expect(rewarderState.numQuarries).to.deep.equal(numQuarries);
        expect(rewarderState.totalRewardsShares.toNumber()).to.deep.equal(
          totalRewardsShare.toNumber()
        );

        for (let i = 0; i < numQuarries; i++) {
          const [quarry, sBump] =
            await anchor.web3.PublicKey.findProgramAddress(
              [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPools[i].toBuffer()],
              program.programId
            );
          await program.methods.updateQuarryRewards().accounts({
            quarry,
            rewarder: rewarderKey,
          }).rpc();
        }
      });

      it("Set annual rewards and make sure quarries update", async () => {
        const multiplier = new BN(10);
        const nextAnnualRewardsRate = ANNUAL_REWARDS_RATE.mul(multiplier);
        const prevRates = await Promise.all(
          ammPools.map(async (t) => {
            const [quarry, sBump] =
              await anchor.web3.PublicKey.findProgramAddress(
                [Buffer.from("Quarry"), rewarderKey.toBuffer(), t.toBuffer()],
                program.programId
              );
            let quarryState = await program.account.quarry.fetch(quarry);
            return { ammPool: t, rate: quarryState.annualRewardsRate };
          })
        );
        // update annual reward
        await program.methods.setAnnualRewards(nextAnnualRewardsRate).accounts({
          auth: {
            admin: adminKP.publicKey,
            rewarder: rewarderKey,
          }
        }).signers([adminKP]).rpc();
        // sync all quarry rewards
        for (let i = 0; i < ammPools.length; i++) {
          const [quarry, sBump] =
            await anchor.web3.PublicKey.findProgramAddress(
              [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPools[i].toBuffer()],
              program.programId
            );
          await program.methods.updateQuarryRewards().accounts({
            quarry,
            rewarder: rewarderKey,
          }).rpc();
        }
        let rewarderState = await program.account.rewarder.fetch(rewarderKey);
        expect(rewarderState.annualRewardsRate.toNumber()).to.deep.equal(nextAnnualRewardsRate.toNumber());
        let sumRewardsPerAnnum = new BN(0);
        for (const ammPool of ammPools) {
          const [quarry, sBump] =
            await anchor.web3.PublicKey.findProgramAddress(
              [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPool.toBuffer()],
              program.programId
            );
          let quarryState = await program.account.quarry.fetch(quarry);

          const nextRate = quarryState.annualRewardsRate;
          sumRewardsPerAnnum = sumRewardsPerAnnum.add(nextRate);
          const prevRate = prevRates.find((r) => r.ammPool.equals(ammPool))?.rate;
          invariant(
            prevRate,
            `prev rate not found for ammPool ${ammPool.toString()}`
          );

          // Epsilon is 10
          // check to see difference is less than 10
          const expectedRate = prevRate.mul(multiplier);
          expect(nextRate.toNumber()).to.closeTo(expectedRate.toNumber(), 10);
        }

        expect(
          sumRewardsPerAnnum.toNumber(),
          "rewards rate within one day multiple"
        ).to.closeTo(
          nextAnnualRewardsRate.toNumber(),
          2 // precision lost
        );
        // Restore daily rewards rate
        // update annual reward
        await program.methods.setAnnualRewards(ANNUAL_REWARDS_RATE).accounts({
          auth: {
            admin: adminKP.publicKey,
            rewarder: rewarderKey,
          }
        }).signers([adminKP]).rpc();
        // sync all quarry rewards
        for (let i = 0; i < ammPools.length; i++) {
          const [quarry, sBump] =
            await anchor.web3.PublicKey.findProgramAddress(
              [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPools[i].toBuffer()],
              program.programId
            );
          await program.methods.updateQuarryRewards().accounts({
            quarry,
            rewarder: rewarderKey,
          }).rpc();
        }

        for (const ammPool of ammPools) {
          const [quarry, sBump] =
            await anchor.web3.PublicKey.findProgramAddress(
              [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPool.toBuffer()],
              program.programId
            );
          let quarryState = await program.account.quarry.fetch(quarry);

          const nextRate = quarryState.annualRewardsRate;
          sumRewardsPerAnnum = sumRewardsPerAnnum.add(nextRate);
          const prevRate = prevRates.find((r) => r.ammPool.equals(ammPool))?.rate;
          invariant(
            prevRate,
            `prev rate not found for ammPool ${ammPool.toString()}`
          );

          expect(nextRate.toNumber()).to.deep.equal(prevRate.toNumber());
        }
      });
    });
  });

  describe("Miner", () => {
    let rewarderKey: anchor.web3.PublicKey;
    let quarryKey: anchor.web3.PublicKey;
    let minerKey: anchor.web3.PublicKey;

    beforeEach(async () => {
      let rewarderBaseKP = new anchor.web3.Keypair();
      let rewarderBase = rewarderBaseKP.publicKey;
      const [rewarder, sBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("Rewarder"), rewarderBase.toBuffer()],
          program.programId
        );
      await program.methods.newRewarder().accounts({
        base: rewarderBase,
        rewarder,
        admin: adminKP.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        mintWrapper: mintWrapperKey,
        rewardsTokenMint: rewardsMint,
      }).signers([rewarderBaseKP, adminKP]).rpc();
      rewarderKey = rewarder;

      await program.methods.setAnnualRewards(ANNUAL_REWARDS_RATE).accounts({
        auth: {
          admin: adminKP.publicKey,
          rewarder: rewarderKey,
        }
      }).signers([adminKP]).rpc();

      const [quarry, bump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPool.toBuffer()],
          program.programId
        );

      await program.methods.createQuarry(new BN(0)).accounts({
        quarry,
        auth: {
          admin: adminKP.publicKey,
          rewarder: rewarderKey,
        },
        ammPool,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).signers([adminKP]).rpc();

      quarryKey = quarry
    });

    beforeEach("Create miner", async () => {
      const [quarry, qbump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("Quarry"), rewarderKey.toBuffer(), ammPool.toBuffer()],
          program.programId
        );
      const [miner, mbump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("Miner"), quarry.toBuffer(), provider.wallet.publicKey.toBuffer()],
          program.programId
        );

      const [minerVault, bump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("MinerVault"), miner.toBuffer()],
          program.programId
        );

      await program.methods.createMiner().accounts({
        authority: provider.wallet.publicKey,
        miner,
        quarry,
        rewarder: rewarderKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenMint: stakeTokenMint,
        minerVault,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).rpc();

      minerKey = miner;
    });

    it("Valid miner", async () => {

      let minerState = await program.account.miner.fetch(minerKey);
      expect(minerState.authority).to.deep.equal(provider.wallet.publicKey);
      expect(minerState.quarry).to.deep.equal(quarryKey);
      const minerBalance = await provider.connection
        .getTokenAccountBalance(minerState.tokenVaultKey);

      expect(minerBalance.value.amount).to.deep.equal("0");
    });

    it("Stake and withdraw", async () => {
      // mint test tokens
      const amount = 1_000_000_000;

      let userStakeTokenAccount = await getOrCreateATA(
        stakeTokenMint,
        provider.wallet.publicKey,
        adminKP,
        provider.connection
      );

      await mintTo(
        provider.connection,
        adminKP,
        stakeTokenMint,
        userStakeTokenAccount,
        stakedMintAuthority,
        amount
      );

      const [minerVault, bump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [Buffer.from("MinerVault"), minerKey.toBuffer()],
          program.programId
        );

      // stake into the quarry
      await program.methods.stakeTokens(new BN(amount)).accounts({
        authority: provider.wallet.publicKey,
        miner: minerKey,
        quarry: quarryKey,
        minerVault,
        tokenAccount: userStakeTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewarder: rewarderKey,
      }).rpc();

      let minerBalance = await provider.connection
        .getTokenAccountBalance(minerVault);
      expect(Number(minerBalance.value.amount)).to.deep.equal(amount);

      let userBalance = await provider.connection
        .getTokenAccountBalance(userStakeTokenAccount);
      expect(Number(userBalance.value.amount)).to.deep.equal(0);



      // withdraw from the quarry
      await program.methods.unstakeTokens(new BN(amount)).accounts({
        authority: provider.wallet.publicKey,
        miner: minerKey,
        quarry: quarryKey,
        minerVault,
        tokenAccount: userStakeTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewarder: rewarderKey,
      }).rpc();
      minerBalance = await provider.connection
        .getTokenAccountBalance(minerVault);
      expect(Number(minerBalance.value.amount)).to.deep.equal(0);

      userBalance = await provider.connection
        .getTokenAccountBalance(userStakeTokenAccount);
      expect(Number(userBalance.value.amount)).to.deep.equal(amount);
    });
  });
});
