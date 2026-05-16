

-- ==========================================
-- NEW RELATIONAL SCHEMA
-- ==========================================

-- 1. Master Reports Table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  week_of date,
  period_covered text,
  generated_at timestamptz,
  update_version int,
  status text default 'live', -- e.g., 'live', 'archived', 'draft'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.reports enable row level security;
create policy "Service Role Full Access" on public.reports for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.reports for select to anon using (true);

create index if not exists idx_reports_status on public.reports (status);
create index if not exists idx_reports_week on public.reports (week_of desc);

-- 2. Report Narratives Table
create table if not exists public.report_narratives (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  narrative_id text not null, -- e.g., 'iran-hormuz-blockade'
  type text not null,         -- e.g., 'dominant_narrative_card', 'story_thread', 'story_thread_dominant'
  tag text,                   -- 'Geopolitical', 'Fed', 'Earnings', 'Energies', 'Metals & Commodities', 'Flows'
  headline text not null,
  summary text,
  body text,
  bullets jsonb,              -- Array of strings e.g. ["Point 1", "Point 2"]
  market_impact jsonb,        -- Object e.g. { "session": "All Week", "text": "..." }
  sources jsonb,              -- Array of objects e.g. [{ "label": "...", "url": "..." }]
  updates jsonb,              -- Array of updates for story_threads
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_narratives enable row level security;
create policy "Service Role Full Access" on public.report_narratives for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_narratives for select to anon using (true);

create index if not exists idx_report_narratives_report_id on public.report_narratives (report_id);
create index if not exists idx_report_narratives_order on public.report_narratives (report_id, sort_order);

-- 3. Report Catalysts Table
create table if not exists public.report_catalysts (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  date_str text,              -- e.g., '2026-05-04' or 'all_week'
  date_label text,            -- e.g., 'Monday May 4 — After Close'
  time_label text,            -- mapped from 'time', e.g., 'After Close', '10:00 ET', 'Continuous'
  event text not null,
  impact text,                -- e.g., 'high', 'medium'
  flag text,
  tags text[],                -- e.g., ARRAY['Earnings', 'Geopolitical']
  body text,
  updates jsonb,              -- In case of future updates for catalyst items
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_catalysts enable row level security;
create policy "Service Role Full Access" on public.report_catalysts for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_catalysts for select to anon using (true);

create index if not exists idx_report_catalysts_report_id on public.report_catalysts (report_id);
create index if not exists idx_report_catalysts_order on public.report_catalysts (report_id, sort_order);

-- 4. Report Market Snapshot Table
create table if not exists public.report_market_snapshot (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  as_of timestamptz,          -- mapped from market_snapshot.as_of
  category text not null,     -- e.g., 'indexes', 'macro_fed', 'energy_volatility'
  label text not null,
  value text,
  direction text,             -- e.g., 'up', 'down', 'neutral'
  note text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_market_snapshot enable row level security;
create policy "Service Role Full Access" on public.report_market_snapshot for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_market_snapshot for select to anon using (true);

create index if not exists idx_report_market_snapshot_report_id on public.report_market_snapshot (report_id);
create index if not exists idx_report_market_snapshot_category on public.report_market_snapshot (report_id, category);

-- 5. Report Stories to Track Table
create table if not exists public.report_stories_to_track (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  category text not null,     -- e.g., 'geopolitical_macro', 'sector_stock_signals'
  label text not null,
  status text,                -- e.g., 'UNRESOLVED', 'PENDING', 'STRONG BEAT'
  direction text,             -- e.g., 'up', 'down', 'neutral'
  updates jsonb,              -- In case of future updates for stories
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_stories_to_track enable row level security;
create policy "Service Role Full Access" on public.report_stories_to_track for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_stories_to_track for select to anon using (true);

create index if not exists idx_report_stories_report_id on public.report_stories_to_track (report_id);
create index if not exists idx_report_stories_category on public.report_stories_to_track (report_id, category);

-- 6. Report Scenarios Table
create table if not exists public.report_scenarios (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  scenario_id text not null,  -- e.g., 'bull', 'base', 'bear'
  label text,                 -- e.g., 'A', 'B', 'C'
  case_name text,             -- e.g., 'Bull', 'Base', 'Bear'
  color text,                 -- e.g., 'green', 'amber', 'red'
  headline text not null,
  body text not null,
  updates jsonb,              -- Array of updates e.g., [{ timestamp, label, text }]
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_scenarios enable row level security;
create policy "Service Role Full Access" on public.report_scenarios for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_scenarios for select to anon using (true);

create index if not exists idx_report_scenarios_report_id on public.report_scenarios (report_id);
create index if not exists idx_report_scenarios_order on public.report_scenarios (report_id, sort_order);

-- 7. Report Key Questions Table
create table if not exists public.report_key_questions (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  number int,
  question text not null,
  status text,                -- e.g., 'unanswered', 'answered', 'partially_answered'
  update_label text,          -- e.g., 'Answered — Talks Blocked'
  answer text,
  updates jsonb,              -- In case of future updates
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_key_questions enable row level security;
create policy "Service Role Full Access" on public.report_key_questions for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_key_questions for select to anon using (true);

create index if not exists idx_report_questions_report_id on public.report_key_questions (report_id);
create index if not exists idx_report_questions_order on public.report_key_questions (report_id, sort_order);

-- 8. Report Regimes Table
create table if not exists public.report_regimes (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  label text not null,
  color text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_regimes enable row level security;
create policy "Service Role Full Access" on public.report_regimes for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_regimes for select to anon using (true);
create index if not exists idx_report_regimes_report_id on public.report_regimes (report_id);

-- 9. Report Sources Table
create table if not exists public.report_sources (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports(id) on delete cascade not null,
  label text not null,
  url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.report_sources enable row level security;
create policy "Service Role Full Access" on public.report_sources for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_sources for select to anon using (true);
create index if not exists idx_report_sources_report_id on public.report_sources (report_id);
create index if not exists idx_report_sources_order on public.report_sources (report_id, sort_order);

-- ==========================================
-- ARCHIVE SNAPSHOTS SCHEMA
-- ==========================================

-- 10. Report Snapshots Table (For Mid-Week Versioning)
create table if not exists public.report_snapshots (
  id uuid default gen_random_uuid() primary key,
  original_report_id uuid references public.reports(id) on delete cascade not null,
  title text not null,
  week_of date not null,
  update_version int not null,
  generated_at timestamptz not null,
  report_json jsonb not null,
  created_at timestamptz default now()
);

alter table public.report_snapshots enable row level security;
create policy "Service Role Full Access" on public.report_snapshots for all to service_role using (true) with check (true);
create policy "Public Read Access" on public.report_snapshots for select to anon using (true);

create index if not exists idx_report_snapshots_original_id on public.report_snapshots (original_report_id);
create index if not exists idx_report_snapshots_week_of on public.report_snapshots (week_of desc);
create index if not exists idx_report_snapshots_generated_at on public.report_snapshots (generated_at desc);

-- ==========================================
-- USERS SCHEMA
-- ==========================================

create table if not exists public.users (
  id text primary key, -- This will hold the Clerk user_id (e.g., 'user_2...')
  email text,
  first_name text,
  last_name text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users enable row level security;
-- Allow the service role to do everything
create policy "Service Role Full Access" on public.users for all to service_role using (true) with check (true);
-- Optionally allow authenticated users to read their own profile
create policy "Users can read own profile" on public.users for select using (true);
