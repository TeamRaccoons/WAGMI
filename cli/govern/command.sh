cargo run -- create-governor --electorate 5Djar3SEVWD2uzoToK3tUUHpSHdtZppLqjFaLZS9YHLZ --voting-delay 0 --voting-period 120 --quorum-votes 1000 --timelock-delay-seconds 0
# smart_wallet address 5Djar3SEVWD2uzoToK3tUUHpSHdtZppLqjFaLZS9YHLZ


cargo run -- view-smartwallet --smart-wallet 5Djar3SEVWD2uzoToK3tUUHpSHdtZppLqjFaLZS9YHLZ

# set owner
cargo run -- create-set-owners-tx --smart-wallet 5Djar3SEVWD2uzoToK3tUUHpSHdtZppLqjFaLZS9YHLZ --owners DHLXnJdACTY83yKwnUkeoDjqi4QBbsYGa1v8tJL76ViX

# tx: FKEE2fbe4P4Tvp8ZhTPLEpNbcgXFzCktbZoL36S8Dtsk

cargo run -- view-transaction --transaction FKEE2fbe4P4Tvp8ZhTPLEpNbcgXFzCktbZoL36S8Dtsk

cargo run -- approve-transaction --smart-wallet 5Djar3SEVWD2uzoToK3tUUHpSHdtZppLqjFaLZS9YHLZ --transaction FKEE2fbe4P4Tvp8ZhTPLEpNbcgXFzCktbZoL36S8Dtsk

cargo run -- execute-transaction --smart-wallet 5Djar3SEVWD2uzoToK3tUUHpSHdtZppLqjFaLZS9YHLZ --transaction FKEE2fbe4P4Tvp8ZhTPLEpNbcgXFzCktbZoL36S8Dtsk


# change threshold

