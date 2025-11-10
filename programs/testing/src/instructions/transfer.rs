use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{ transfer_checked, TransferChecked },
    token_interface::{ TokenAccount, Mint, TokenInterface },
};

pub fn _transfer(ctx: Context<TransferContext>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    let token_program = &ctx.accounts.token_program;
    let sender = &ctx.accounts.sender;
    let mint = &ctx.accounts.mint;
    let recipient_ata = &ctx.accounts.recipient_ata;
    let sender_ata = &ctx.accounts.sender_ata;

    let cpi_ctx = CpiContext::new(
        token_program.to_account_info(),
        TransferChecked {
            authority: sender.to_account_info(),
            mint: mint.to_account_info(),
            to: recipient_ata.to_account_info(),
            from: sender_ata.to_account_info(),
        },
    );

    transfer_checked(cpi_ctx, amount, mint.decimals)?;

    Ok(())
}

#[derive(Accounts)]
pub struct TransferContext<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program,
    )]
    pub recipient_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = sender,
        associated_token::token_program = token_program,
    )]
    pub sender_ata: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: recipient wallet
    pub recipient: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
}
