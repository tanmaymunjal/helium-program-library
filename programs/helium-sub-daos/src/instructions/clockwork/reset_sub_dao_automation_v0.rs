use crate::{
  construct_calculate_kickoff_ix, construct_issue_rewards_kickoff_ix, create_end_epoch_cron,
  current_epoch, state::*,
};
use anchor_lang::{prelude::*, solana_program::native_token::LAMPORTS_PER_SOL};
use anchor_spl::token::Token;
use circuit_breaker::CircuitBreaker;
use clockwork_sdk::{
  cpi::{automation_create, automation_reset, automation_update},
  state::{AutomationSettings, Trigger},
  AutomationProgram,
};

#[derive(Accounts)]
pub struct ResetSubDaoAutomationV0<'info> {
  #[account(mut)]
  pub authority: Signer<'info>,

  pub dao: Box<Account<'info, DaoV0>>,

  #[account(
    mut,
    has_one = authority,
    has_one = dao,
  )]
  pub sub_dao: Box<Account<'info, SubDaoV0>>,
  ///CHECK: seeds checked
  #[account(
    mut,
    seeds = [b"automation", sub_dao.key().as_ref(), b"calculate"],
    seeds::program = clockwork.key(),
    bump
  )]
  pub calculate_automation: AccountInfo<'info>,
  ///CHECK: seeds checked
  #[account(
    mut,
    seeds = [b"automation", sub_dao.key().as_ref(), b"issue"],
    seeds::program = clockwork.key(),
    bump
  )]
  pub issue_automation: AccountInfo<'info>,
  pub clockwork: Program<'info, AutomationProgram>,

  pub system_program: Program<'info, System>,
  pub token_program: Program<'info, Token>,
  pub circuit_breaker_program: Program<'info, CircuitBreaker>,
}

pub fn handler(ctx: Context<ResetSubDaoAutomationV0>) -> Result<()> {
  let calculate_ix = construct_calculate_kickoff_ix(
    ctx.accounts.dao.key(),
    ctx.accounts.sub_dao.key(),
    ctx.accounts.dao.hnt_mint,
    ctx.accounts.sub_dao.active_device_aggregator,
    ctx.accounts.system_program.key(),
    ctx.accounts.token_program.key(),
    ctx.accounts.circuit_breaker_program.key(),
  );
  let curr_ts = Clock::get()?.unix_timestamp;

  let cron = create_end_epoch_cron(curr_ts, 60 * 5);

  let signer_seeds: &[&[&[u8]]] = &[&[
    "sub_dao".as_bytes(),
    ctx.accounts.sub_dao.dnt_mint.as_ref(),
    &[ctx.accounts.sub_dao.bump_seed],
  ]];

  // reset calculate automation
  if ctx.accounts.calculate_automation.data_is_empty()
    && ctx.accounts.calculate_automation.lamports() == 0
  {
    automation_create(
      CpiContext::new_with_signer(
        ctx.accounts.clockwork.to_account_info(),
        clockwork_sdk::cpi::AutomationCreate {
          authority: ctx.accounts.sub_dao.to_account_info(),
          payer: ctx.accounts.authority.to_account_info(),
          automation: ctx.accounts.calculate_automation.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
        },
        signer_seeds,
      ),
      LAMPORTS_PER_SOL / 100,
      "calculate".as_bytes().to_vec(),
      vec![calculate_ix.into()],
      Trigger::Cron {
        schedule: cron,
        skippable: false,
      },
    )?;
  } else {
    automation_reset(CpiContext::new_with_signer(
      ctx.accounts.clockwork.to_account_info(),
      clockwork_sdk::cpi::AutomationReset {
        authority: ctx.accounts.sub_dao.to_account_info(),
        automation: ctx.accounts.calculate_automation.to_account_info(),
      },
      signer_seeds,
    ))?;
    automation_update(
      CpiContext::new_with_signer(
        ctx.accounts.clockwork.to_account_info(),
        clockwork_sdk::cpi::AutomationUpdate {
          authority: ctx.accounts.sub_dao.to_account_info(),
          automation: ctx.accounts.calculate_automation.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
        },
        signer_seeds,
      ),
      AutomationSettings {
        name: None,
        fee: None,
        instructions: Some(vec![calculate_ix.into()]),
        rate_limit: None,
        trigger: Some(Trigger::Cron {
          schedule: cron,
          skippable: false,
        }),
      },
    )?;
  }

  // reset the issue automation
  let epoch = current_epoch(curr_ts);
  let dao_epoch_info = Pubkey::find_program_address(
    &[
      "dao_epoch_info".as_bytes(),
      ctx.accounts.dao.key().as_ref(),
      &epoch.to_le_bytes(),
    ],
    &crate::id(),
  )
  .0;

  let issue_ix = construct_issue_rewards_kickoff_ix(
    ctx.accounts.dao.key(),
    ctx.accounts.sub_dao.key(),
    ctx.accounts.dao.hnt_mint,
    ctx.accounts.sub_dao.dnt_mint,
    ctx.accounts.system_program.key(),
    ctx.accounts.token_program.key(),
    ctx.accounts.circuit_breaker_program.key(),
  );

  if ctx.accounts.issue_automation.data_is_empty() && ctx.accounts.issue_automation.lamports() == 0
  {
    automation_create(
      CpiContext::new_with_signer(
        ctx.accounts.clockwork.to_account_info(),
        clockwork_sdk::cpi::AutomationCreate {
          authority: ctx.accounts.sub_dao.to_account_info(),
          payer: ctx.accounts.authority.to_account_info(),
          automation: ctx.accounts.issue_automation.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
        },
        signer_seeds,
      ),
      LAMPORTS_PER_SOL / 100,
      "issue".as_bytes().to_vec(),
      vec![issue_ix.into()],
      Trigger::Account {
        address: dao_epoch_info,
        offset: 8,
        size: 1,
      },
    )?;
  } else {
    automation_reset(CpiContext::new_with_signer(
      ctx.accounts.clockwork.to_account_info(),
      clockwork_sdk::cpi::AutomationReset {
        authority: ctx.accounts.sub_dao.to_account_info(),
        automation: ctx.accounts.issue_automation.to_account_info(),
      },
      signer_seeds,
    ))?;
    automation_update(
      CpiContext::new_with_signer(
        ctx.accounts.clockwork.to_account_info(),
        clockwork_sdk::cpi::AutomationUpdate {
          authority: ctx.accounts.sub_dao.to_account_info(),
          automation: ctx.accounts.issue_automation.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
        },
        signer_seeds,
      ),
      AutomationSettings {
        name: None,
        fee: None,
        instructions: Some(vec![issue_ix.into()]),
        rate_limit: None,
        trigger: Some(Trigger::Account {
          address: dao_epoch_info,
          offset: 8,
          size: 1,
        }),
      },
    )?;
  }

  Ok(())
}
