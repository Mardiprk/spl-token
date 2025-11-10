use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface, WithdrawWithheldTokensFromAccounts, withdraw_withheld_tokens_from_accounts}
};

pub fn _withdraw(ctx: Context<WithdrawContext>, _amount: u64) -> Result<()> {
    let token_program = &ctx.accounts.token_program;
    let creator_ata = &ctx.accounts.creator_ata;
    let creator = ctx.accounts.creator.clone();
    let mint = &ctx.accounts.mint;
    let from_ata = &ctx.accounts.from_ata;

    let withdraw_ctx = CpiContext::new(
        token_program.to_account_info(),
        WithdrawWithheldTokensFromAccounts {
            token_program_id: token_program.to_account_info(),
            mint: mint.to_account_info(),
            destination: creator_ata.to_account_info(),
            authority: creator.to_account_info()
        },
    );

    withdraw_withheld_tokens_from_accounts(withdraw_ctx, vec![from_ata.to_account_info()])?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawContext<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        mint::authority = creator,
        mint::token_program = token_program,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: Account from which tokens will be withdrawn
    pub from: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = from,
        associated_token::token_program = token_program,
    )]
    pub from_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = creator,
        associated_token::token_program = token_program,
    )]
    pub creator_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
