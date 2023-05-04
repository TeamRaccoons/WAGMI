use crate::*;

/// Accounts for [smart_wallet::owner_invoke_instruction].
#[derive(Accounts)]
pub struct OwnerInvokeInstruction<'info> {
    /// The [SmartWallet].
    pub smart_wallet: Account<'info, SmartWallet>,
    /// An owner of the [SmartWallet].
    pub owner: Signer<'info>,
}

impl<'info> OwnerInvokeInstruction<'info> {
    pub fn owner_invoke_instruction(
        &mut self,
        index: u64,
        bump: u8,
        ix: TXInstruction,
        remaining_accounts: &[AccountInfo<'info>],
    ) -> Result<()> {
        let smart_wallet = &self.smart_wallet;
        // Execute the transaction signed by the smart_wallet.
        let invoker_seeds: &[&[&[u8]]] = &[&[
            b"SmartWalletOwnerInvoker" as &[u8],
            &smart_wallet.key().to_bytes(),
            &index.to_le_bytes(),
            &[bump],
        ]];

        solana_program::program::invoke_signed(&(&ix).into(), remaining_accounts, invoker_seeds)?;

        Ok(())
    }

    pub fn owner_invoke_instruction_v2(
        &mut self,
        index: u64,
        bump: u8,
        invoker: Pubkey,
        data: Vec<u8>,
        remaining_accounts: &[AccountInfo<'info>],
    ) -> Result<()> {
        let smart_wallet = &self.smart_wallet;
        // Execute the transaction signed by the smart_wallet.
        let invoker_seeds: &[&[&[u8]]] = &[&[
            b"SmartWalletOwnerInvoker" as &[u8],
            &smart_wallet.key().to_bytes(),
            &index.to_le_bytes(),
            &[bump],
        ]];

        let program_id = remaining_accounts[0].key();
        let accounts: Vec<AccountMeta> = remaining_accounts[1..]
            .iter()
            .map(|v| AccountMeta {
                pubkey: *v.key,
                is_signer: if v.key == &invoker { true } else { v.is_signer },
                is_writable: v.is_writable,
            })
            .collect();
        let ix = &solana_program::instruction::Instruction {
            program_id,
            accounts,
            data,
        };

        solana_program::program::invoke_signed(ix, remaining_accounts, invoker_seeds)?;
        Ok(())
    }
}

impl<'info> Validate<'info> for OwnerInvokeInstruction<'info> {
    fn validate(&self) -> Result<()> {
        self.smart_wallet.owner_index(self.owner.key())?;
        Ok(())
    }
}
