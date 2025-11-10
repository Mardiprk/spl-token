use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
    token_2022::{ mint_to, MintTo }
};

pub fn _mint(ctx: Context<MintContext>, amount: u64) -> Result<()> {
    if amount == 0 {
        panic!("Invalid Amount");
    }

    let token_program = &ctx.accounts.token_program;
    let creator = &ctx.accounts.creator;
    let mint = &ctx.accounts.mint;
    let receipent_ata = &ctx.accounts.recipient_ata;

    let mint_ctx = CpiContext::new(
        token_program.to_account_info(),
        MintTo {
            authority: creator.to_account_info(),
            mint: mint.to_account_info(),
            to: receipent_ata.to_account_info(),
        },
    );

    mint_to(mint_ctx, amount)?;

    Ok(())
}

#[derive(Accounts)]
pub struct MintContext<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        mint::authority = creator,
        mint::token_program = token_program,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Recipient of the minted tokens
    pub recipient: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program,
    )]
    pub recipient_ata: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
