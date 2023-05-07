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
anchor test --run ./tests/govern

Merkle distributor:
anchor test --run ./tests/merkle-distributor

Smart wallet:
anchor test --run ./tests/smartwallet

Voter:
anchor test --run ./tests/voter

```
