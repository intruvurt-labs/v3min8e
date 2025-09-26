-- =========================================
-- NimRev Scanner Database Migration; Supabase Ready
-- Safe to run in Supabase SQL editor
-- =========================================

-- Extensions
create extension if not exists "pgcrypto";          -- for gen_random_uuid
create extension if not exists "uuid-ossp";         -- retain compatibility
create extension if not exists "pg_trgm";
create extension if not exists "btree_gin";

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('pending','verified','premium','banned');
  end if;
  if not exists (select 1 from pg_type where typname = 'blockchain_type') then
    create type blockchain_type as enum ('solana','ethereum','base','blast','polygon','avalanche','arbitrum','optimism');
  end if;
  if not exists (select 1 from pg_type where typname = 'alert_type') then
    create type alert_type as enum ('rug_pull','honeypot','high_fees','mint_authority','social_red_flag','liquidity_drain','cross_chain_scam');
  end if;
  if not exists (select 1 from pg_type where typname = 'scan_status') then
    create type scan_status as enum ('pending','processing','completed','failed');
  end if;
end $$;

-- Users verified; tied to Supabase auth.users
create table if not exists verified_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  telegram_id bigint unique,
  discord_id bigint unique,
  wallet_address text,
  verification_status verification_status not null default 'pending',
  subscription_tier text not null default 'free',
  api_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  scan_credits integer not null default 100 check (scan_credits >= 0),
  premium_expires timestamptz,
  reputation_score integer not null default 0 check (reputation_score >= 0)
);

comment on table verified_users is 'Stores user verification status, subscription tier, and auth linkage';

-- Scan results
create table if not exists scan_results (
  id uuid primary key default gen_random_uuid(),
  token_address text not null,
  blockchain blockchain_type not null,
  contract_hash text,
  token_symbol text,
  token_name text,
  creator_address text,
  risk_score integer check (risk_score between 0 and 100),
  threat_categories text[],      -- detected threats
  scan_status scan_status not null default 'pending',
  bytecode_analysis jsonb,
  social_analysis jsonb,
  liquidity_analysis jsonb,
  fee_analysis jsonb,
  scanner_version text not null default '1.0.0',
  scan_duration_ms integer check (scan_duration_ms is null or scan_duration_ms >= 0),
  community_votes_up integer not null default 0 check (community_votes_up >= 0),
  community_votes_down integer not null default 0 check (community_votes_down >= 0),
  is_public boolean not null default true,
  ipfs_hash text,
  signature text,
  scanned_by uuid references verified_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table scan_results is 'Immutable style log of token or contract security scans';

-- Recurring bot messages
create table if not exists recurring_messages (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  platform text not null check (platform in ('telegram','discord')),
  message_templates text[] not null default '{}'::text[],
  interval_minutes integer not null default 60 check (interval_minutes between 1 and 10_080),
  risk_threshold integer not null default 30 check (risk_threshold between 0 and 100),
  is_active boolean not null default true,
  last_sent timestamptz,
  total_sent integer not null default 0 check (total_sent >= 0),
  created_by uuid references verified_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Watched addresses
create table if not exists watched_addresses (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  blockchain blockchain_type not null,
  watcher_id uuid references verified_users(id) on delete cascade,
  watch_type text not null default 'full',     -- full; liquidity_only; transfers_only
  alert_threshold numeric(38,8),               -- high precision threshold
  is_active boolean not null default true,
  alert_channels text[] not null default '{}'::text[],   -- e.g. telegram:123, discord:456
  last_activity timestamptz,
  total_alerts_sent integer not null default 0 check (total_alerts_sent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (address, blockchain, watcher_id)
);

-- Alerts log
create table if not exists alerts_log (
  id uuid primary key default gen_random_uuid(),
  alert_type alert_type not null,
  target_address text not null,
  blockchain blockchain_type not null,
  risk_score integer check (risk_score is null or (risk_score between 0 and 100)),
  alert_data jsonb,
  recipients text[],
  delivery_status jsonb,
  scan_result_id uuid references scan_results(id) on delete set null,
  watched_address_id uuid references watched_addresses(id) on delete set null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

-- Chain monitor state
create table if not exists blockchain_monitor_state (
  id uuid primary key default gen_random_uuid(),
  blockchain blockchain_type not null unique,
  last_block_number bigint,
  last_processed_at timestamptz not null default now(),
  rpc_endpoints text[] not null default '{}'::text[],
  is_healthy boolean not null default true,
  error_count integer not null default 0 check (error_count >= 0),
  last_error text,
  updated_at timestamptz not null default now()
);

-- Cross chain threat correlations
create table if not exists threat_correlations (
  id uuid primary key default gen_random_uuid(),
  primary_address text not null,
  primary_blockchain blockchain_type not null,
  related_addresses text[] not null default '{}'::text[],
  related_blockchains blockchain_type[] not null default '{}'::blockchain_type[],
  correlation_type text,
  confidence_score numeric(3,2) check (confidence_score between 0 and 1),
  evidence jsonb,
  created_at timestamptz not null default now()
);

-- Scanner metrics
create table if not exists scanner_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value numeric,
  metadata jsonb,
  recorded_at timestamptz not null default now()
);

-- Helpful generated column for banding risk
alter table scan_results
  drop column if exists risk_band;
alter table scan_results
  add column risk_band text generated always as (
    case
      when risk_score is null then null
      when risk_score <= 20 then 'critical'
      when risk_score <= 40 then 'high'
      when risk_score <= 70 then 'medium'
      else 'low'
    end
  ) stored;

-- Indexes
create index if not exists idx_scan_results_token_blockchain on scan_results(token_address, blockchain);
create index if not exists idx_scan_results_risk_score on scan_results(risk_score);
create index if not exists idx_scan_results_created_at on scan_results(created_at desc);
create index if not exists idx_scan_results_band on scan_results(risk_band);
create index if not exists idx_scan_results_threat_gin on scan_results using gin (threat_categories);
create index if not exists idx_scan_results_json_gin on scan_results using gin (bytecode_analysis jsonb_path_ops);
create index if not exists idx_watched_addresses_active on watched_addresses(address, blockchain) where is_active = true;
create index if not exists idx_alerts_log_created_at on alerts_log(created_at desc);
create index if not exists idx_alerts_log_target on alerts_log(target_address, blockchain);
create index if not exists idx_verified_users_telegram on verified_users(telegram_id) where telegram_id is not null;
create index if not exists idx_verified_users_discord on verified_users(discord_id) where discord_id is not null;
create index if not exists idx_threat_correlations_primary on threat_correlations(primary_address, primary_blockchain);
create index if not exists idx_scan_results_search on scan_results using gin (
  to_tsvector('simple',
    coalesce(token_symbol,'') || ' ' || coalesce(token_name,'') || ' ' || coalesce(token_address,'')
  )
);

-- Unique when ipfs_hash exists
create unique index if not exists uq_scan_results_ipfs on scan_results(ipfs_hash) where ipfs_hash is not null;

-- Updated at trigger
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_verified_users_updated on verified_users;
create trigger trg_verified_users_updated before update on verified_users
for each row execute function update_updated_at_column();

drop trigger if exists trg_scan_results_updated on scan_results;
create trigger trg_scan_results_updated before update on scan_results
for each row execute function update_updated_at_column();

drop trigger if exists trg_recurring_messages_updated on recurring_messages;
create trigger trg_recurring_messages_updated before update on recurring_messages
for each row execute function update_updated_at_column();

drop trigger if exists trg_watched_addresses_updated on watched_addresses;
create trigger trg_watched_addresses_updated before update on watched_addresses
for each row execute function update_updated_at_column();

drop trigger if exists trg_blockchain_monitor_updated on blockchain_monitor_state;
create trigger trg_blockchain_monitor_updated before update on blockchain_monitor_state
for each row execute function update_updated_at_column();

-- Seed monitor endpoints if empty
insert into blockchain_monitor_state (blockchain, rpc_endpoints)
select * from (
  values
    ('solana',    array['https://api.mainnet-beta.solana.com','https://rpc.ankr.com/solana']),
    ('ethereum',  array['https://eth.llamarpc.com','https://rpc.ankr.com/eth']),
    ('base',      array['https://mainnet.base.org','https://rpc.ankr.com/base']),
    ('blast',     array['https://rpc.blast.io','https://rpc.ankr.com/blast']),
    ('polygon',   array['https://polygon-rpc.com','https://rpc.ankr.com/polygon']),
    ('avalanche', array['https://api.avax.network/ext/bc/C/rpc','https://rpc.ankr.com/avalanche']),
    ('arbitrum',  array['https://arb1.arbitrum.io/rpc','https://rpc.ankr.com/arbitrum']),
    ('optimism',  array['https://mainnet.optimism.io','https://rpc.ankr.com/optimism'])
) as x(blockchain, rpc_endpoints)
where not exists (select 1 from blockchain_monitor_state);

-- Views with security barrier
drop view if exists public_scan_results cascade;
create view public_scan_results with (security_barrier = true) as
select
  id, token_address, blockchain, token_symbol, token_name, risk_score, risk_band,
  threat_categories, scanner_version, community_votes_up, community_votes_down,
  ipfs_hash, signature, created_at
from scan_results
where is_public = true and scan_status = 'completed'
order by created_at desc;

drop view if exists live_threat_feed cascade;
create view live_threat_feed with (security_barrier = true) as
select
  sr.id,
  sr.token_address,
  sr.blockchain,
  sr.token_symbol,
  sr.risk_score,
  sr.risk_band,
  sr.threat_categories,
  sr.created_at,
  count(al.id) as alert_count
from scan_results sr
left join alerts_log al on sr.id = al.scan_result_id
where sr.scan_status = 'completed'
  and sr.risk_score <= 30
  and sr.created_at >= now() - interval '24 hours'
group by sr.id
order by sr.risk_score asc, sr.created_at desc;

-- =========================
-- Row Level Security
-- =========================
alter table verified_users enable row level security;
alter table scan_results enable row level security;
alter table recurring_messages enable row level security;
alter table watched_addresses enable row level security;
alter table alerts_log enable row level security;
alter table threat_correlations enable row level security;
alter table blockchain_monitor_state enable row level security;
alter table scanner_metrics enable row level security;

-- Helper: link auth user to verified_users
create or replace view me as
select vu.*
from verified_users vu
where vu.auth_user_id = auth.uid();

-- Policies
do $$
begin
  -- verified_users
  if not exists (select 1 from pg_policies where tablename='verified_users' and policyname='vu_owner_select') then
    create policy vu_owner_select on verified_users
      for select using (auth.uid() = auth_user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='verified_users' and policyname='vu_owner_update') then
    create policy vu_owner_update on verified_users
      for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
  end if;

  -- scan_results; public may read limited rows when is_public
  if not exists (select 1 from pg_policies where tablename='scan_results' and policyname='sr_public_read') then
    create policy sr_public_read on scan_results
      for select using (is_public = true);
  end if;
  if not exists (select 1 from pg_policies where tablename='scan_results' and policyname='sr_scanner_owner_write') then
    create policy sr_scanner_owner_write on scan_results
      for insert with check (scanned_by = auth.uid())
      using (scanned_by = auth.uid());
  end if;
  -- owners may read their private scans
  if not exists (select 1 from pg_policies where tablename='scan_results' and policyname='sr_owner_read') then
    create policy sr_owner_read on scan_results
      for select using (scanned_by = auth.uid());
  end if;

  -- recurring_messages
  if not exists (select 1 from pg_policies where tablename='recurring_messages' and policyname='rm_owner_all') then
    create policy rm_owner_all on recurring_messages
      using (created_by = auth.uid()) with check (created_by = auth.uid());
  end if;

  -- watched_addresses
  if not exists (select 1 from pg_policies where tablename='watched_addresses' and policyname='wa_owner_all') then
    create policy wa_owner_all on watched_addresses
      using (watcher_id = auth.uid()) with check (watcher_id = auth.uid());
  end if;

  -- alerts_log; read own alerts; public none
  if not exists (select 1 from pg_policies where tablename='alerts_log' and policyname='al_owner_read') then
    create policy al_owner_read on alerts_log
      for select using (
        watched_address_id in (select id from watched_addresses where watcher_id = auth.uid())
        or scan_result_id in (select id from scan_results where scanned_by = auth.uid())
      );
  end if;

  -- threat_correlations; read only for authenticated users
  if not exists (select 1 from pg_policies where tablename='threat_correlations' and policyname='tc_auth_read') then
    create policy tc_auth_read on threat_correlations
      for select using (auth.role() = 'authenticated');
  end if;

  -- blockchain_monitor_state and scanner_metrics; read for authenticated
  if not exists (select 1 from pg_policies where tablename='blockchain_monitor_state' and policyname='cms_auth_read') then
    create policy cms_auth_read on blockchain_monitor_state
      for select using (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename='scanner_metrics' and policyname='sm_auth_read') then
    create policy sm_auth_read on scanner_metrics
      for select using (auth.role() = 'authenticated');
  end if;
end $$;

-- Optional helper to safely decrement credits
create or replace function consume_scan_credit(p_user uuid, p_amount int default 1)
returns boolean language plpgsql as $$
declare ok boolean := false;
begin
  update verified_users
     set scan_credits = scan_credits - p_amount,
         last_active = now()
   where id = p_user
     and scan_credits >= p_amount
  returning true into ok;
  return coalesce(ok,false);
end $$;

-- Done
