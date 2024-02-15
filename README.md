Meteora DAO

The repository consists of 4 programs:

1. Govern program
2. Merkle Distributor
3. Smart wallet
4. Voter

To run all the test, please run the following commands:

```
anchor test
```

You may run tests belong to specific program by:

```
Govern:
anchor test --skip-build --run ./tests/govern -- --features test-bpf

Merkle distributor:
anchor test --skip-build  --run ./tests/merkle-distributor -- --features test-bpf 

Smart wallet:
anchor test --skip-build --run ./tests/smartwallet -- --features test-bpf

Met-Voter:
anchor test --skip-build --run ./tests/met-voter -- --features test-bpf

Locked-Voter:
anchor test --skip-build --run ./tests/locked-voter -- --features test-bpf

```
