use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("StakeVERM1111111111111111111111111111111111111");

#[program]
pub mod verm_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> Result<()> {
        let stake_pool = &mut ctx.accounts.stake_pool;
        stake_pool.authority = ctx.accounts.authority.key();
        stake_pool.total_staked = 0;
        stake_pool.reward_rate = 24600; // 246% APR in basis points
        stake_pool.bump = bump;
        stake_pool.last_update_slot = Clock::get()?.slot;
        Ok(())
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        user_account.authority = ctx.accounts.authority.key();
        user_account.amount_staked = 0;
        user_account.rewards_debt = 0;
        user_account.last_stake_slot = 0;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount >= 100_000_000, StakeError::InsufficientAmount); // 100 VERM minimum

        let stake_pool = &mut ctx.accounts.stake_pool;
        let user_account = &mut ctx.accounts.user_account;
        let clock = Clock::get()?;

        // Calculate pending rewards before updating stake
        let pending_rewards = calculate_pending_rewards(
            user_account.amount_staked,
            user_account.rewards_debt,
            stake_pool.reward_rate,
            clock.slot - user_account.last_stake_slot
        );

        // Transfer tokens from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update stake pool
        stake_pool.total_staked = stake_pool.total_staked.checked_add(amount).unwrap();
        stake_pool.last_update_slot = clock.slot;

        // Update user account
        user_account.amount_staked = user_account.amount_staked.checked_add(amount).unwrap();
        user_account.rewards_debt = user_account.rewards_debt.checked_add(pending_rewards).unwrap();
        user_account.last_stake_slot = clock.slot;

        // Calculate new APR tier based on total staked amount
        stake_pool.reward_rate = calculate_apr_tier(user_account.amount_staked);

        emit!(StakeEvent {
            user: ctx.accounts.authority.key(),
            amount,
            total_staked: user_account.amount_staked,
            apr: stake_pool.reward_rate,
        });

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let stake_pool = &mut ctx.accounts.stake_pool;
        let user_account = &mut ctx.accounts.user_account;
        let clock = Clock::get()?;

        require!(amount <= user_account.amount_staked, StakeError::InsufficientStake);

        // Calculate pending rewards
        let pending_rewards = calculate_pending_rewards(
            user_account.amount_staked,
            user_account.rewards_debt,
            stake_pool.reward_rate,
            clock.slot - user_account.last_stake_slot
        );

        // Transfer tokens from vault to user
        let authority_seeds = &[
            b"stake_pool".as_ref(),
            &[stake_pool.bump],
        ];
        let signer = &[&authority_seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.stake_pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // Update stake pool
        stake_pool.total_staked = stake_pool.total_staked.checked_sub(amount).unwrap();
        stake_pool.last_update_slot = clock.slot;

        // Update user account
        user_account.amount_staked = user_account.amount_staked.checked_sub(amount).unwrap();
        user_account.rewards_debt = pending_rewards;
        user_account.last_stake_slot = clock.slot;

        // Recalculate APR tier
        stake_pool.reward_rate = calculate_apr_tier(user_account.amount_staked);

        emit!(UnstakeEvent {
            user: ctx.accounts.authority.key(),
            amount,
            total_staked: user_account.amount_staked,
        });

        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let stake_pool = &mut ctx.accounts.stake_pool;
        let user_account = &mut ctx.accounts.user_account;
        let clock = Clock::get()?;

        let pending_rewards = calculate_pending_rewards(
            user_account.amount_staked,
            user_account.rewards_debt,
            stake_pool.reward_rate,
            clock.slot - user_account.last_stake_slot
        );

        require!(pending_rewards > 0, StakeError::NoRewards);

        // Transfer reward tokens from vault to user
        let authority_seeds = &[
            b"stake_pool".as_ref(),
            &[stake_pool.bump],
        ];
        let signer = &[&authority_seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.stake_pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, pending_rewards)?;

        // Reset rewards debt
        user_account.rewards_debt = 0;
        user_account.last_stake_slot = clock.slot;

        emit!(ClaimRewardsEvent {
            user: ctx.accounts.authority.key(),
            amount: pending_rewards,
        });

        Ok(())
    }
}

fn calculate_pending_rewards(
    amount_staked: u64,
    rewards_debt: u64,
    reward_rate: u64,
    slots_elapsed: u64,
) -> u64 {
    if amount_staked == 0 || slots_elapsed == 0 {
        return rewards_debt;
    }

    // Calculate rewards: (staked_amount * apr * time_elapsed) / (100 * slots_per_year)
    let annual_rewards = amount_staked
        .checked_mul(reward_rate)
        .unwrap()
        .checked_div(10000)
        .unwrap(); // Convert basis points to percentage

    let slots_per_year = 63_072_000; // Approximately 400ms per slot * seconds per year
    let time_rewards = annual_rewards
        .checked_mul(slots_elapsed)
        .unwrap()
        .checked_div(slots_per_year)
        .unwrap();

    rewards_debt.checked_add(time_rewards).unwrap()
}

fn calculate_apr_tier(amount_staked: u64) -> u64 {
    let amount_tokens = amount_staked / 1_000_000; // Convert to token units (6 decimals)

    if amount_tokens >= 10000 {
        36900 // 369%
    } else if amount_tokens >= 5000 {
        24600 // 246%
    } else if amount_tokens >= 1000 {
        15300 // 153%
    } else if amount_tokens >= 500 {
        9800  // 98%
    } else {
        3690  // 36.9%
    }
}

// Account structs
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 1 + 8,
        seeds = [b"stake_pool"],
        bump
    )]
    pub stake_pool: Account<'info, StakePool>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8,
        seeds = [b"user_account", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        seeds = [b"stake_pool"],
        bump = stake_pool.bump
    )]
    pub stake_pool: Account<'info, StakePool>,
    
    #[account(
        mut,
        seeds = [b"user_account", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [b"stake_pool"],
        bump = stake_pool.bump
    )]
    pub stake_pool: Account<'info, StakePool>,
    
    #[account(
        mut,
        seeds = [b"user_account", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"stake_pool"],
        bump = stake_pool.bump
    )]
    pub stake_pool: Account<'info, StakePool>,
    
    #[account(
        mut,
        seeds = [b"user_account", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

// Data structs
#[account]
pub struct StakePool {
    pub authority: Pubkey,
    pub total_staked: u64,
    pub reward_rate: u64, // In basis points (e.g., 2460 = 24.6%)
    pub bump: u8,
    pub last_update_slot: u64,
}

#[account]
pub struct UserAccount {
    pub authority: Pubkey,
    pub amount_staked: u64,
    pub rewards_debt: u64,
    pub last_stake_slot: u64,
}

// Events
#[event]
pub struct StakeEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub total_staked: u64,
    pub apr: u64,
}

#[event]
pub struct UnstakeEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub total_staked: u64,
}

#[event]
pub struct ClaimRewardsEvent {
    pub user: Pubkey,
    pub amount: u64,
}

// Errors
#[error_code]
pub enum StakeError {
    #[msg("Insufficient amount to stake (minimum 100 VERM)")]
    InsufficientAmount,
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("No rewards available to claim")]
    NoRewards,
     #[msg("Overflow error occurred")]
    Overflow,
}
