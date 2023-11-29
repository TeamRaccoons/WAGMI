cargo run -- create-smart-wallet --max-owners 5 --threshold 1 --minimum-delay 0 --owners DHLXnJdACTY83yKwnUkeoDjqi4QBbsYGa1v8tJL76ViX --base /Users/andrewnguyen/Documents/solana/ve33/dao/cli/base.json
# smart_wallet address 3hsFvuLMd9Mskxu51CHM2os585MtF5rfkTxk1wZhUPiu


cargo run -- view-smartwallet --smart-wallet 3hsFvuLMd9Mskxu51CHM2os585MtF5rfkTxk1wZhUPiu

# set owner
cargo run -- create-set-owners-tx --smart-wallet 3hsFvuLMd9Mskxu51CHM2os585MtF5rfkTxk1wZhUPiu --owners DHLXnJdACTY83yKwnUkeoDjqi4QBbsYGa1v8tJL76ViX

# tx: FKEE2fbe4P4Tvp8ZhTPLEpNbcgXFzCktbZoL36S8Dtsk

cargo run -- view-transaction --transaction 9q6XSfttYuSwusFR8xxuzGJtpji2tRyHrwp3YXtQmWxv

cargo run -- approve-transaction --smart-wallet 3hsFvuLMd9Mskxu51CHM2os585MtF5rfkTxk1wZhUPiu --transaction 9q6XSfttYuSwusFR8xxuzGJtpji2tRyHrwp3YXtQmWxv

cargo run -- execute-transaction --smart-wallet 3hsFvuLMd9Mskxu51CHM2os585MtF5rfkTxk1wZhUPiu --transaction 9q6XSfttYuSwusFR8xxuzGJtpji2tRyHrwp3YXtQmWxv


# change threshold

cargo run -- create-activate-proposal-tx --smart-wallet 3hsFvuLMd9Mskxu51CHM2os585MtF5rfkTxk1wZhUPiu --proposal J9Sneru483WmrncXQa7XQVHPUQtbECQdgJf7or5KnAzq

