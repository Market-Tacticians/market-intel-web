-- Create the html_reports table
create table if not exists public.html_reports (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  report_type text,           -- e.g. 'Daily Brief', 'Weekly Intel'
  calendar_date date not null,
  last_updated_at timestamptz not null,
  last_updated_display text,  -- e.g. "Fri Apr 24, 2026 | 4:30 PM ET"
  period_label text,          -- e.g. "Week of Apr 21–25, 2026"
  status_label text,          -- e.g. "Friday Close"
  file_path text not null,    -- Path in Supabase Storage bucket ('reports')
  metadata jsonb default '{}'::jsonb, -- To store extracted data
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.html_reports enable row level security;

-- Create policy to allow Service Role to do everything
create policy "Service Role Full Access" on public.html_reports
  for all to service_role using (true) with check (true);

-- Create policy to allow Anon users to read (assuming public access is desired for the web app)
-- If you want it private, we can skip this and use signed URLs
create policy "Public Read Access" on public.html_reports
  for select to anon using (true);

-- Indexes for performance
create index if not exists idx_html_reports_date on public.html_reports (calendar_date);
create index if not exists idx_html_reports_updated on public.html_reports (last_updated_at desc);
