-- === Extensions you will use ===
create extension if not exists "citext";
create extension if not exists "pg_trgm";
create extension if not exists "pgcrypto";

-- === ENUMs to replace varchar checks ===
do $$
begin
  if not exists (select 1 from pg_type where typname='user_tier') then
    create type user_tier as enum ('basic','premium','enterprise','elite');
  end if;
  if not exists (select 1 from pg_type where typname='scan_type') then
    create type scan_type as enum ('basic','comprehensive','elite');
  end if;
  if not exists (select 1 from pg_type where typname='scan_status') then
    create type scan_status as enum ('pending','running','completed','error','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname='risk_level') then
    create type risk_level as enum ('safe','low','medium','high','critical');
  end if;
  if not exists (select 1 from pg_type where typname='severity_level') then
    create type severity_level as enum ('low','medium','high','critical');
  end if;
  if not exists (select 1 from pg_type where typname='notify_priority') then
    create type notify_priority as enum ('low','normal','high','urgent');
  end if;
end $$;

-- === Tighten users table ===
alter table users
  alter column email type citext,
  alter column tier type user_tier using tier::user_tier,
  add column if not exists api_key_hash text,
  add column if not exists api_key_last4 text,
  add constraint users_email_ck check (email ~* '^[^@]+@[^@]+\.[^@]+$');

-- stop storing api_key raw; keep only hash + last4
update users set api_key_last4 = right(api_key, 4)
where api_key is not null and api_key_last4 is null;

-- optional: drop plain api_key if you’re ready
-- alter table users drop column api_key;

-- === security_scans: move to enums; add generated band; add useful FKs/indexes ===
alter table security_scans
  alter column scan_type type scan_type using scan_type::scan_type,
  alter column status type scan_status using status::scan_status,
  alter column risk_level type risk_level using risk_level::risk_level;

-- Generated risk band (helps dashboards)
do $$ begin
  alter table security_scans drop column if exists risk_band;
  exception when undefined_column then null;
end $$;

alter table security_scans
  add column risk_band text generated always as (
    case
      when score is null then null
      when score <= 20 then 'safe'
      when score <= 40 then 'low'
      when score <= 70 then 'medium'
      when score <= 90 then 'high'
      else 'critical'
    end
  ) stored;

-- === security_findings enums ===
alter table security_findings
  alter column severity type severity_level using severity::severity_level;

-- === threat_intelligence enums and integrity ===
alter table threat_intelligence
  alter column severity type severity_level using severity::severity_level;

-- === notifications enums ===
alter table notifications
  alter column priority type notify_priority using priority::notify_priority;

-- === Create indexes (moved out of CREATE TABLE) ===
-- security_scans
create index if not exists idx_security_scans_user_id on security_scans(user_id);
create index if not exists idx_security_scans_status on security_scans(status);
create index if not exists idx_security_scans_network on security_scans(network);
create index if not exists idx_security_scans_risk_level on security_scans(risk_level);
create index if not exists idx_security_scans_created_at on security_scans(created_at desc);
create index if not exists idx_security_scans_address on security_scans(address);
create index if not exists idx_security_scans_score on security_scans(score);
create index if not exists idx_security_scans_band on security_scans(risk_band);
create index if not exists idx_security_scans_findings_gin on security_scans using gin (findings jsonb_path_ops);
create index if not exists idx_security_scans_report_gin on security_scans using gin (report jsonb_path_ops);

-- security_findings
create index if not exists idx_security_findings_scan_id on security_findings(scan_id);
create index if not exists idx_security_findings_severity on security_findings(severity);
create index if not exists idx_security_findings_type on security_findings(type);
create index if not exists idx_security_findings_confidence on security_findings(confidence);

-- notifications
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_type on notifications(type);
create index if not exists idx_notifications_priority on notifications(priority);
create index if not exists idx_notifications_read on notifications(read);
create index if not exists idx_notifications_created_at on notifications(created_at desc);

-- threat_intelligence
create index if not exists idx_threat_intelligence_address on threat_intelligence(address);
create index if not exists idx_threat_intelligence_network on threat_intelligence(network);
create index if not exists idx_threat_intelligence_severity on threat_intelligence(severity);
create index if not exists idx_threat_intelligence_type on threat_intelligence(threat_type);
create index if not exists idx_threat_intelligence_status on threat_intelligence(status);
create index if not exists idx_threat_intelligence_verified on threat_intelligence(verified);
create index if not exists idx_threat_intel_indicators_gin on threat_intelligence using gin (indicators jsonb_path_ops);

-- api_usage
create index if not exists idx_api_usage_user_id on api_usage(user_id);
create index if not exists idx_api_usage_endpoint on api_usage(endpoint);
create index if not exists idx_api_usage_created_at on api_usage(created_at desc);
create index if not exists idx_api_usage_rate_limit_key on api_usage(rate_limit_key);
create index if not exists idx_api_usage_ip_address on api_usage(ip_address);

-- contract_metadata
create index if not exists idx_contract_metadata_trust_score on contract_metadata(trust_score);
create index if not exists idx_contract_metadata_verified on contract_metadata(verified);
create index if not exists idx_contract_metadata_last_updated on contract_metadata(last_updated);
create index if not exists idx_contract_metadata_data_sources_gin on contract_metadata using gin (data_sources);

-- FTS (you already added one for findings); add for scans.report titles if needed
create index if not exists idx_threat_intelligence_description_fts 
  on threat_intelligence using gin (to_tsvector('english', description));

-- === Quota Enforcement ===
create or replace function can_consume_scan(p_user uuid, p_daily int, p_monthly int)
returns boolean language plpgsql as $$
declare ok boolean;
begin
  update user_scan_quotas uq
     set daily_scans_used = daily_scans_used + 1,
         monthly_scans_used = monthly_scans_used + 1,
         total_scans_used = total_scans_used + 1,
         last_daily_reset = case when last_daily_reset < current_date then current_date else last_daily_reset end,
         last_monthly_reset = case when last_monthly_reset < date_trunc('month', current_date) then date_trunc('month', current_date)::date else last_monthly_reset end,
         updated_at = now()
   where uq.user_id = p_user
     and (daily_scans_used < coalesce(p_daily, uq.daily_scan_limit)
          or overage_allowed = true)
     and (monthly_scans_used < coalesce(p_monthly, uq.monthly_scan_limit)
          or overage_allowed = true)
  returning true into ok;
  return coalesce(ok,false);
end $$;

-- BEFORE INSERT trigger to block when over quota
create or replace function tg_block_when_over_quota()
returns trigger language plpgsql as $$
declare allowed boolean;
begin
  -- ensure quota row exists
  insert into user_scan_quotas (user_id, daily_scan_limit, monthly_scan_limit)
  values (new.user_id, 10, 100)
  on conflict (user_id) do nothing;

  allowed := can_consume_scan(new.user_id, null, null);
  if not allowed then
    raise exception 'Scan quota exceeded for user %', new.user_id using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists trg_scans_quota_guard on security_scans;
create trigger trg_scans_quota_guard
before insert on security_scans
for each row execute function tg_block_when_over_quota();

-- === RLS (Row Level Security) ===
alter table users enable row level security;
alter table security_scans enable row level security;
alter table security_findings enable row level security;
alter table user_scan_quotas enable row level security;
alter table notifications enable row level security;
alter table api_usage enable row level security;
alter table audit_log enable row level security;
alter table threat_intelligence enable row level security;

-- Policies (Supabase style: auth.uid() present)
do $$
begin
  -- Users: self read/update
  if not exists (select 1 from pg_policies where tablename='users' and policyname='users_self_read') then
    create policy users_self_read on users for select using (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='users' and policyname='users_self_update') then
    create policy users_self_update on users for update using (id = auth.uid()) with check (id = auth.uid());
  end if;

  -- security_scans: owner full; allow public read of completed SAFE rows via view instead
  if not exists (select 1 from pg_policies where tablename='security_scans' and policyname='scans_owner_all') then
    create policy scans_owner_all on security_scans
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  -- security_findings: via parent scan ownership
  if not exists (select 1 from pg_policies where tablename='security_findings' and policyname='findings_owner_read') then
    create policy findings_owner_read on security_findings
      for select using (scan_id in (select id from security_scans where user_id = auth.uid()));
  end if;

  -- quotas: owner read
  if not exists (select 1 from pg_policies where tablename='user_scan_quotas' and policyname='quotas_owner_read') then
    create policy quotas_owner_read on user_scan_quotas for select using (user_id = auth.uid());
  end if;

  -- notifications: owner
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notif_owner_all') then
    create policy notif_owner_all on notifications
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  -- api_usage: owner read
  if not exists (select 1 from pg_policies where tablename='api_usage' and policyname='api_owner_read') then
    create policy api_owner_read on api_usage for select using (user_id = auth.uid());
  end if;

  -- threat_intelligence: read for authenticated only (writes by backend service role)
  if not exists (select 1 from pg_policies where tablename='threat_intelligence' and policyname='ti_read_auth') then
    create policy ti_read_auth on threat_intelligence for select using (auth.role() = 'authenticated');
  end if;
end $$;

-- === Safer public views ===
drop view if exists public_scan_results;
create view public_scan_results with (security_barrier = true) as
select id, address, network, score, risk_level, created_at
from security_scans
where status = 'completed'::scan_status
order by created_at desc;

drop view if exists user_scan_summary;
create or replace view user_scan_summary as
select 
  u.id as user_id,
  u.email,
  u.tier,
  count(ss.id) as total_scans,
  count(*) filter (where ss.status = 'completed') as completed_scans,
  count(*) filter (where ss.risk_level = 'critical') as critical_threats_found,
  avg(ss.score) as average_security_score,
  max(ss.created_at) as last_scan_date
from users u
left join security_scans ss on u.id = ss.user_id
group by u.id, u.email, u.tier;
