-- CampusX messaging RLS recursion repair
-- Run this once in Supabase SQL Editor if you see:
-- "infinite recursion detected in policy for relation conversation_members"

begin;

-- The current CampusX app does not use conversation_members.
-- Remove any old recursive policies and keep the legacy table locked down.
do $$
declare p record;
begin
  if to_regclass('public.conversation_members') is not null then
    for p in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'conversation_members'
    loop
      execute format('drop policy if exists %I on public.conversation_members', p.policyname);
    end loop;

    alter table public.conversation_members enable row level security;
    revoke all on table public.conversation_members from anon, authenticated;
  end if;
end $$;

-- Ensure the columns used by the current direct participant model exist.
alter table public.conversations add column if not exists provider_id uuid references auth.users(id) on delete cascade;
alter table public.conversations add column if not exists client_id uuid references auth.users(id) on delete cascade;
alter table public.conversations add column if not exists listing_id uuid;
alter table public.conversations add column if not exists provider_name text;
alter table public.conversations add column if not exists client_name text;
alter table public.conversations add column if not exists listing_title text;
alter table public.conversations add column if not exists created_at timestamptz default now();
alter table public.conversations add column if not exists updated_at timestamptz default now();

alter table public.messages add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;
alter table public.messages add column if not exists sender_id uuid references auth.users(id) on delete cascade;
alter table public.messages add column if not exists sender_name text;
alter table public.messages add column if not exists body text;
alter table public.messages add column if not exists created_at timestamptz default now();

-- Remove every old conversation/message policy, including policies left by older CampusX builds.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'conversations'
  loop
    execute format('drop policy if exists %I on public.conversations', p.policyname);
  end loop;

  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'messages'
  loop
    execute format('drop policy if exists %I on public.messages', p.policyname);
  end loop;
end $$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

-- Non-recursive policies: participation is checked directly on conversations.
create policy "CampusX participants read conversations"
on public.conversations
for select
to authenticated
using (auth.uid() = provider_id or auth.uid() = client_id);

create policy "CampusX clients create conversations"
on public.conversations
for insert
to authenticated
with check (
  auth.uid() = client_id
  and provider_id is not null
  and client_id is not null
  and client_id <> provider_id
);

create policy "CampusX participants update conversations"
on public.conversations
for update
to authenticated
using (auth.uid() = provider_id or auth.uid() = client_id)
with check (auth.uid() = provider_id or auth.uid() = client_id);

create policy "CampusX participants read messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.provider_id = auth.uid() or c.client_id = auth.uid())
  )
);

create policy "CampusX participants send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (c.provider_id = auth.uid() or c.client_id = auth.uid())
  )
);

commit;
