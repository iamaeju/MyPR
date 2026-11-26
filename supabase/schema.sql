-- MyPR public pages
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Each account has one page. Anyone can read pages; only the owner can change theirs.

create table if not exists public.mypr_pages (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  handle     text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  name       text not null default '',
  bio        text not null default '',
  avatar_url text,
  links      jsonb not null default '[]'::jsonb,
  cards      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.mypr_pages enable row level security;

drop policy if exists "Anyone can view pages" on public.mypr_pages;
create policy "Anyone can view pages"
  on public.mypr_pages for select
  using (true);

drop policy if exists "Owners can create their page" on public.mypr_pages;
create policy "Owners can create their page"
  on public.mypr_pages for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can update their page" on public.mypr_pages;
create policy "Owners can update their page"
  on public.mypr_pages for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can delete their page" on public.mypr_pages;
create policy "Owners can delete their page"
  on public.mypr_pages for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.mypr_pages to anon, authenticated;
grant insert, update, delete on public.mypr_pages to authenticated;
