### WAGMI protocol

Open source programs for launching DAO, inspired by Tribeca. Current projects has used WAGMI protocol for their DAO
- [Jupiter](https://vote.jup.ag/)
- Meteora (ongoing)

At the nutshell, WAGMI protocol includes 3 programs:
- [Locked-Voter](./programs/locked-voter/)
- [Governor](./programs/govern/)
- [Smart-Wallet](./programs/smart-wallet/)

And there are 2 roles in WAGMI protocol:
- User: entity stake governence token and vote for a proposal
- Council: entity create proposal, and update state of proposal once it is executed 

## Some use cases can be done by WAGMI protocol

# 1. Voting for Yes/No question
- Council creates a proposal, Ex: Spend 1M USDC from treasury to pay salaries for Devs. 
- User stake governence token, and vote for the proposal with 3 options Yes/No/Abstain
- After proposal ends, result will be revealed
- If the proposal passes, team will execute the proposal off-chain. Council will monitor this and mark proposal executed after everything is done 

# 2. Voting for multiple options question
- Council creates a proposal, Ex: Vote for 3 projects: WEN, JUP, MET to go to launchpad. 
- User stake governence token, and vote for the proposal with 3 options WEN, JUP, MET
- After proposal ends, result will be revealed
- If the proposal passes, team launch the project with the most vote to launchpad. Council will monitor this and mark proposal executed after everything is done 

# 3. Reward on-chain based on voting weight
- Council can set rewards for each proposal to incentive voters.
- Voter can claim rewards on-chain after the proposal ends based on their voting power for this proposal

# 4. Multiple option for staking
- User can choose a duration for locking governence token. Voting power will linear decay
- User has option to switch to max_lock. User will get full voting power with max_lock, but when they start unstaking, duration for withdraw will be reset to max_lock_duration
- User has option to partially unstake, partial-unstaked amount will not be counted in voting power. 


## For developer

To run all the test, please run the following commands:
```
anchor test -- --features test-bpf 
```

Build programs:
```
anchor build
```


## Audit
WAGMI Protocol has been audited by [Offside Labs](https://offside.io). View the audit report [here](./audits/Raccoons_DAO_Final_Audit_Report.pdf).


## License
Anchor is licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in WAGMI by you, as defined in the Apache-2.0 license, shall be licensed as above, without any additional terms or conditions.
