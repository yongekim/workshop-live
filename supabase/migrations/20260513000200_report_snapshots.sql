create table if not exists public.report_snapshots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  report_json jsonb not null default '{}'::jsonb,
  report_markdown text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists report_snapshots_event_id_idx
on public.report_snapshots(event_id);

grant select, insert, update, delete on public.report_snapshots to anon, authenticated;

alter table public.report_snapshots enable row level security;

create policy "mvp public read report snapshots"
on public.report_snapshots for select
using (true);

create policy "mvp public insert report snapshots"
on public.report_snapshots for insert
with check (true);

create policy "mvp public update report snapshots"
on public.report_snapshots for update
using (true)
with check (true);

create policy "mvp public delete report snapshots"
on public.report_snapshots for delete
using (true);