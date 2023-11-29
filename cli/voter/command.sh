cargo run -- new-locker --token-mint 2aK29BjbXawWhCC3pA8Xwj6qZsEpHgjaGi24s9JMB2Nm --expiration 1686125407 --max-stake-vote-multiplier 10 --min-stake-duration 86400 --max-stake-duration 31536000 --proposal-activation-min-votes 2000 --base /Users/andrewnguyen/Documents/solana/ve33/dao/cli/base.json
# locker address 4U2hiYrMfqJFjGEDJUVBgeLKdAtSkVNCH7Uu2BRZNr3i


# ViewLocker
cargo run -- view-locker --locker 4U2hiYrMfqJFjGEDJUVBgeLKdAtSkVNCH7Uu2BRZNr3i

# view voter
cargo run -- view-escrow --locker 4U2hiYrMfqJFjGEDJUVBgeLKdAtSkVNCH7Uu2BRZNr3i --owner DHLXnJdACTY83yKwnUkeoDjqi4QBbsYGa1v8tJL76ViX

# vote
cargo run -- cast-vote --locker 4U2hiYrMfqJFjGEDJUVBgeLKdAtSkVNCH7Uu2BRZNr3i --proposal J9Sneru483WmrncXQa7XQVHPUQtbECQdgJf7or5KnAzq --side 2

cargo run -- cast-vote --locker 4U2hiYrMfqJFjGEDJUVBgeLKdAtSkVNCH7Uu2BRZNr3i --proposal 8Aewqp2qE548PDSHUNzMp7r5TyU4XBxzmV773SNiRyFH --side 2