use crate::{circuit_breaker::CircuitBreaker, DataCreditsV0};
use anchor_lang::prelude::*;
use anchor_spl::{
  associated_token::AssociatedToken,
  token::{self, Burn, FreezeAccount, Mint, ThawAccount, Token, TokenAccount},
};
use circuit_breaker::{
  cpi::{accounts::MintV0, mint_v0},
  MintArgsV0, MintWindowedCircuitBreakerV0,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MintDataCreditsArgsV0 {
  amount: u64,
}

#[derive(Accounts)]
#[instruction(args: MintDataCreditsArgsV0)]
pub struct MintDataCreditsV0<'info> {
  #[account(
    seeds = [
      "dc".as_bytes(),
      dc_mint.key().as_ref(),
    ],
    bump = data_credits.data_credits_bump,
    has_one = hnt_mint,
    has_one = dc_mint
  )]
  pub data_credits: Box<Account<'info, DataCreditsV0>>,

  // hnt tokens from this account are burned
  #[account(
    mut,
    constraint = burner.mint == hnt_mint.key(),
    constraint = burner.amount >= args.amount,
    has_one = owner,
  )]
  pub burner: Box<Account<'info, TokenAccount>>,
  #[account(
    init_if_needed,
    payer = owner,
    associated_token::mint = dc_mint,
    associated_token::authority = recipient,
  )]
  pub recipient_token_account: Box<Account<'info, TokenAccount>>,
  /// CHECK: DC credits sent here
  pub recipient: AccountInfo<'info>,

  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(mut)]
  pub hnt_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub dc_mint: Box<Account<'info, Mint>>,
  /// CHECK: Verified by cpi
  #[account(
    mut,
    seeds = ["mint_windowed_breaker".as_bytes(), dc_mint.key().as_ref()],
    seeds::program = circuit_breaker_program.key(),
    bump = circuit_breaker.bump_seed
  )]
  pub circuit_breaker: Box<Account<'info, MintWindowedCircuitBreakerV0>>,
  pub circuit_breaker_program: Program<'info, CircuitBreaker>,
  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
  pub rent: Sysvar<'info, Rent>,
  pub system_program: Program<'info, System>,
  pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> MintDataCreditsV0<'info> {
  fn burn_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
    let cpi_accounts = Burn {
      mint: self.hnt_mint.to_account_info(),
      from: self.burner.to_account_info(),
      authority: self.owner.to_account_info(),
    };

    CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
  }

  fn thaw_ctx(&self) -> CpiContext<'_, '_, '_, 'info, ThawAccount<'info>> {
    let cpi_accounts = ThawAccount {
      account: self.recipient_token_account.to_account_info(),
      mint: self.dc_mint.to_account_info(),
      authority: self.data_credits.to_account_info(),
    };
    CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
  }

  fn mint_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintV0<'info>> {
    let cpi_accounts = MintV0 {
      mint: self.dc_mint.to_account_info(),
      to: self.recipient_token_account.to_account_info(),
      mint_authority: self.data_credits.to_account_info(),
      token_program: self.token_program.to_account_info(),
      circuit_breaker: self.circuit_breaker.to_account_info(),
      clock: self.clock.to_account_info(),
    };
    CpiContext::new(self.circuit_breaker_program.to_account_info(), cpi_accounts)
  }

  fn freeze_ctx(&self) -> CpiContext<'_, '_, '_, 'info, FreezeAccount<'info>> {
    let cpi_accounts = FreezeAccount {
      account: self.recipient_token_account.to_account_info(),
      mint: self.dc_mint.to_account_info(),
      authority: self.data_credits.to_account_info(),
    };
    CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
  }
}

pub fn handler(ctx: Context<MintDataCreditsV0>, args: MintDataCreditsArgsV0) -> Result<()> {
  let signer_seeds: &[&[&[u8]]] = &[&[
    b"dc",
    ctx.accounts.dc_mint.to_account_info().key.as_ref(),
    &[ctx.accounts.data_credits.data_credits_bump],
  ]];

  // burn the hnt tokens
  token::burn(ctx.accounts.burn_ctx(), args.amount)?;

  // unfreeze the recipient_token_account if necessary
  if ctx.accounts.recipient_token_account.is_frozen() {
    token::thaw_account(ctx.accounts.thaw_ctx().with_signer(signer_seeds))?;
  }

  // mint the new tokens to recipient
  // TODO needs to mint at an oracle provided rate to hnt
  mint_v0(
    ctx.accounts.mint_ctx().with_signer(signer_seeds),
    MintArgsV0 {
      amount: args.amount,
    },
  )?;

  token::freeze_account(ctx.accounts.freeze_ctx().with_signer(signer_seeds))?;

  Ok(())
}
