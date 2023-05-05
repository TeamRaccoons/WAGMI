use crate::*;

/// Accounts for [smart_wallet::create_subaccount_info].
#[derive(Accounts)]
#[instruction(subaccount: Pubkey)]
pub struct CreateSubaccountInfo<'info> {
    /// The [SubaccountInfo] to create.
    #[account(
        init,
        seeds = [
            b"SubaccountInfo".as_ref(),
            &subaccount.as_ref()
        ],
        bump,
        space = 8 + std::mem::size_of::<SubaccountInfo>(),
        payer = payer
    )]
    pub subaccount_info: Account<'info, SubaccountInfo>,
    /// Payer to create the [SubaccountInfo].
    #[account(mut)]
    pub payer: Signer<'info>,
    /// The [System] program.
    pub system_program: Program<'info, System>,
}

impl<'info> CreateSubaccountInfo<'info> {
    pub fn create_subaccount_info(
        &mut self,
        subaccount: Pubkey,
        smart_wallet: Pubkey,
        index: u64,
        subaccount_type: SubaccountType,
    ) -> Result<()> {
        let (address, _derived_bump) = match subaccount_type {
            SubaccountType::Derived => Pubkey::find_program_address(
                &[
                    b"SmartWalletDerived" as &[u8],
                    &smart_wallet.as_ref(),
                    &index.to_le_bytes(),
                ],
                &crate::ID,
            ),
            SubaccountType::OwnerInvoker => Pubkey::find_program_address(
                &[
                    b"SmartWalletOwnerInvoker" as &[u8],
                    &smart_wallet.as_ref(),
                    &index.to_le_bytes(),
                ],
                &crate::ID,
            ),
        };

        invariant!(address == subaccount, SubaccountOwnerMismatch);

        let info = &mut self.subaccount_info;
        info.smart_wallet = smart_wallet;
        info.subaccount_type = subaccount_type;
        info.index = index;

        Ok(())
    }
}
impl<'info> Validate<'info> for CreateSubaccountInfo<'info> {
    fn validate(&self) -> Result<()> {
        // no validation necessary
        Ok(())
    }
}
