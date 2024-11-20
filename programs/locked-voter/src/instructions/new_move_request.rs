use crate::*;
/// Accounts for [voter::create_move_request].
#[derive(Accounts)]
pub struct CreateMoveRequest<'info> {
    /// [Old_Escrow].
    #[account(
        mut,
        has_one = owner
    )]
    pub old_escrow: Box<Account<'info, Escrow>>,

    /// [New_Escrow].
    #[account(mut)]
    pub new_escrow: Box<Account<'info, Escrow>>,

    /// [Request].
    #[account( 
        init, 
        seeds = [
            b"Request".as_ref(),
            old_escrow.key().as_ref(),
            new_escrow.key().as_ref()
        ],
        bump,
        payer = feepayer, 
        space = MoveRequest::LEN
    )]
    pub request: Box<Account<'info, MoveRequest>>,

    /// Authority of the [Old_Escrow].
    pub owner: Signer<'info>,

    /// Fee payer of the new [Move_Request].
    #[account(mut)]
    pub feepayer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateMoveRequest<'info> {
    pub fn create_move_request(&mut self) -> Result<()> {
        self.request.old_escrow = self.old_escrow.key();
        self.request.new_escrow = self.new_escrow.key();

        invariant!(
            self.old_escrow.frozen_until > Clock::get()?.unix_timestamp,
            "Escrow must be frozen first"
        );
        Ok(())
    }
}

impl<'info> Validate<'info> for CreateMoveRequest<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }
}
