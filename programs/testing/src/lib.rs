use anchor_lang::prelude::*;
pub mod instructions;

pub use instructions::*;

declare_id!("DoMrH7r7jF2h2JTTkYEikR1s7rUbHw8LZB8LqdfRvhEp");


#[program]
pub mod testing {
    use super::*;

    pub fn initialize(ctx: Context<InitializeContext>, fee_bps: u16, max_fee: u64) -> Result<()>{
        _initialize(ctx, fee_bps, max_fee)
    }

    pub fn mint(ctx: Context<MintContext>, amount: u64) -> Result<()>{
        _mint(ctx, amount)
    }

    pub fn transfer(ctx: Context<TransferContext>, amount: u64) -> Result<()>{
        _transfer(ctx, amount)
    }

    pub fn withdraw(ctx: Context<WithdrawContext>, amount: u64) -> Result<()>{
        _withdraw(ctx, amount)
    }
}