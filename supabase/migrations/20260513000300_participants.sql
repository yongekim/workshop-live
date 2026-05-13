create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  group_id uuid references public.workshop_groups(id) on delete set null,
  participant_session_id text not null,
  name text not null,
  company text not null,
  email text not null,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, participant_session_id)
);

create index if not exists participants_event_id_idx
on public.participants(event_id);

create index if not exists participants_group_id_idx
on public.participants(group_id);

create trigger set_participants_updated_at
before update on public.participants
for each row
execute function public.set_updated_at();

grant select, insert, update, delete on public.participants to anon, authenticated;

alter table public.participants enable row level security;

create policy "mvp public read participants"
on public.participants for select
using (true);

create policy "mvp public insert participants"
on public.participants for insert
with check (true);

create policy "mvp public update participants"
on public.participants for update
using (true)
with check (true);

create policy "mvp public delete participants"
on public.participants for delete
using (true);

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'participants'
    ) then
      alter publication supabase_realtime add table public.participants;
    end if;
  end if;
end;
$$;