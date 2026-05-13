alter table public.questions
drop constraint if exists questions_response_key_check;

alter table public.responses
drop constraint if exists responses_response_key_check;

alter table public.questions
add column if not exists is_required boolean not null default true;

alter table public.questions
add column if not exists helper_text text not null default '';

create index if not exists events_slug_idx
on public.events(slug);

create index if not exists questions_event_sort_order_idx
on public.questions(event_id, sort_order);