create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text,
  description text not null,
  event_date date,
  status text not null default 'draft',
  moderator_questions text[] not null default '{}',
  common_themes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create table public.workshop_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  slug text not null,
  name text not null,
  access_code text not null,
  topic_title text not null,
  topic_description text not null,
  status text not null default 'Inte startad'
    check (status in ('Inte startad', 'Aktiv', 'Redo för sammanfattning')),
  participants integer not null default 0,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  last_saved_at timestamptz,
  ready_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, slug),
  unique(event_id, access_code)
);

create trigger set_workshop_groups_updated_at
before update on public.workshop_groups
for each row
execute function public.set_updated_at();

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  response_key text not null
    check (response_key in ('currentState', 'friction', 'improvements')),
  title text not null,
  description text not null,
  placeholder text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(event_id, response_key)
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.workshop_groups(id) on delete cascade,
  response_key text not null
    check (response_key in ('currentState', 'friction', 'improvements')),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id, response_key)
);

create trigger set_responses_updated_at
before update on public.responses
for each row
execute function public.set_updated_at();

create table public.insight_cards (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.workshop_groups(id) on delete cascade,
  title text not null,
  problem text not null default '',
  consequence text not null default '',
  root_cause text not null default '',
  idea text not null default '',
  impact text not null default 'Medel'
    check (impact in ('Låg', 'Medel', 'Hög')),
  difficulty text not null default 'Medel'
    check (difficulty in ('Låg', 'Medel', 'Hög')),
  suggested_owner text not null default '',
  next_step text not null default '',
  votes integer not null default 0 check (votes >= 0),
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_insight_cards_updated_at
before update on public.insight_cards
for each row
execute function public.set_updated_at();

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  insight_card_id uuid not null references public.insight_cards(id) on delete cascade,
  voter_session_id text not null,
  created_at timestamptz not null default now(),
  unique(insight_card_id, voter_session_id)
);

create or replace function public.increment_insight_votes(insight_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.insight_cards
  set votes = votes + 1
  where id = insight_id;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on function public.increment_insight_votes(uuid) to anon, authenticated;

alter table public.events enable row level security;
alter table public.workshop_groups enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.insight_cards enable row level security;
alter table public.votes enable row level security;

create policy "public read events"
on public.events for select
using (true);

create policy "public insert events"
on public.events for insert
with check (true);

create policy "public update events"
on public.events for update
using (true)
with check (true);

create policy "public delete events"
on public.events for delete
using (true);

create policy "public read workshop groups"
on public.workshop_groups for select
using (true);

create policy "public insert workshop groups"
on public.workshop_groups for insert
with check (true);

create policy "public update workshop groups"
on public.workshop_groups for update
using (true)
with check (true);

create policy "public delete workshop groups"
on public.workshop_groups for delete
using (true);

create policy "public read questions"
on public.questions for select
using (true);

create policy "public insert questions"
on public.questions for insert
with check (true);

create policy "public update questions"
on public.questions for update
using (true)
with check (true);

create policy "public delete questions"
on public.questions for delete
using (true);

create policy "public read responses"
on public.responses for select
using (true);

create policy "public insert responses"
on public.responses for insert
with check (true);

create policy "public update responses"
on public.responses for update
using (true)
with check (true);

create policy "public delete responses"
on public.responses for delete
using (true);

create policy "public read insight cards"
on public.insight_cards for select
using (true);

create policy "public insert insight cards"
on public.insight_cards for insert
with check (true);

create policy "public update insight cards"
on public.insight_cards for update
using (true)
with check (true);

create policy "public delete insight cards"
on public.insight_cards for delete
using (true);

create policy "public read votes"
on public.votes for select
using (true);

create policy "public insert votes"
on public.votes for insert
with check (true);

create policy "public update votes"
on public.votes for update
using (true)
with check (true);

create policy "public delete votes"
on public.votes for delete
using (true);