-- Foreningen Custorian member dashboard (transparency/members.html).
-- NOT APPLIED. Review, then run against project trvbspdqonajtsiivxwl.
--
-- Access model: a member signs in by magic link (sign-ups are disabled from the page:
-- shouldCreateUser = false), so an auth user must be created for them first, then a
-- `members` row linking it. A member can read only their own row. Documents and
-- votes are readable by any member whose status is 'active'. Nothing is writable
-- from the browser: all inserts and updates happen with the service role.

create table if not exists public.members (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  full_name         text,
  category          text not null check (category in ('Individual','Trust & Safety Expert','Organisation','For-profit Organisation')),
  status            text not null default 'active' check (status in ('applied','active','lapsed','resigned')),
  member_since      date,
  dues_paid_through date,
  created_at        timestamptz not null default now()
);

create table if not exists public.member_documents (
  id           bigint generated always as identity primary key,
  title        text not null,
  url          text not null,            -- a link (Drive, site); never an upload
  kind         text,                     -- e.g. 'Minutes', 'Accounts', 'Policy'
  published_on date not null default current_date
);

create table if not exists public.member_votes (
  id          bigint generated always as identity primary key,
  title       text not null,
  meeting     text,                      -- e.g. 'Annual general assembly 2027'
  held_on     date,
  status      text not null default 'upcoming' check (status in ('upcoming','open','closed')),
  result      text,
  url         text
);

alter table public.members          enable row level security;
alter table public.member_documents enable row level security;
alter table public.member_votes     enable row level security;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.user_id = auth.uid() and m.status = 'active');
$$;
revoke all on function public.is_active_member() from public;
grant execute on function public.is_active_member() to authenticated;

drop policy if exists "member reads own row" on public.members;
create policy "member reads own row" on public.members
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "active members read documents" on public.member_documents;
create policy "active members read documents" on public.member_documents
  for select to authenticated using (public.is_active_member());

drop policy if exists "active members read votes" on public.member_votes;
create policy "active members read votes" on public.member_votes
  for select to authenticated using (public.is_active_member());

-- No insert/update/delete policies: anon and authenticated cannot write.
revoke insert, update, delete on public.members, public.member_documents, public.member_votes from anon, authenticated;
