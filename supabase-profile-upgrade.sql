-- CampusX Provider Studio + Client Workspace + Hire + Messaging upgrade
-- SAFE MIGRATION VERSION for existing CampusX databases.
-- Run in Supabase > SQL Editor. It can be re-run safely.

create extension if not exists pgcrypto;

-- =========================================================
-- PROFILES
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  university text,
  department text,
  bio text,
  skills text,
  contact_info text,
  mobile text,
  email text,
  portfolio_url text,
  avatar_url text,
  cv_url text,
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists skills text;
alter table public.profiles add column if not exists contact_info text;
alter table public.profiles add column if not exists mobile text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists cv_url text;
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.profiles enable row level security;
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles for select using (true);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- =========================================================
-- SKILL LISTINGS
-- Add provider_id to old CampusX skill_listings tables.
-- =========================================================
do $$
begin
  if to_regclass('public.skill_listings') is not null then
    alter table public.skill_listings add column if not exists provider_id uuid references auth.users(id) on delete set null;
  end if;
end $$;

-- =========================================================
-- HIRE REQUESTS
-- create table if new, then add every required column if an older
-- version of the table already exists.
-- =========================================================
create table if not exists public.hire_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references auth.users(id) on delete cascade,
  client_id uuid references auth.users(id) on delete cascade,
  listing_id uuid,
  listing_title text,
  provider_name text,
  client_name text,
  request_title text,
  details text,
  budget text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.hire_requests add column if not exists provider_id uuid references auth.users(id) on delete cascade;
alter table public.hire_requests add column if not exists client_id uuid references auth.users(id) on delete cascade;
alter table public.hire_requests add column if not exists listing_id uuid;
alter table public.hire_requests add column if not exists listing_title text;
alter table public.hire_requests add column if not exists provider_name text;
alter table public.hire_requests add column if not exists client_name text;
alter table public.hire_requests add column if not exists request_title text;
alter table public.hire_requests add column if not exists details text;
alter table public.hire_requests add column if not exists budget text;
alter table public.hire_requests add column if not exists status text default 'pending';
alter table public.hire_requests add column if not exists created_at timestamptz default now();
alter table public.hire_requests add column if not exists updated_at timestamptz default now();

alter table public.hire_requests enable row level security;
drop policy if exists "Participants read hires" on public.hire_requests;
create policy "Participants read hires" on public.hire_requests for select to authenticated using (auth.uid() = provider_id or auth.uid() = client_id);
drop policy if exists "Clients create hires" on public.hire_requests;
create policy "Clients create hires" on public.hire_requests for insert to authenticated with check (auth.uid() = client_id and (provider_id is null or client_id <> provider_id));
drop policy if exists "Providers update hires" on public.hire_requests;
create policy "Providers update hires" on public.hire_requests for update to authenticated using (auth.uid() = provider_id) with check (auth.uid() = provider_id);

-- =========================================================
-- CLEAN UP LEGACY MESSAGING POLICIES
-- Older CampusX builds may have created conversation_members policies that
-- recursively reference conversations/conversation_members. The current app
-- uses provider_id/client_id directly, so lock that legacy table down and
-- remove stale policies before creating the current policies.
-- =========================================================
do $$
declare p record;
begin
  if to_regclass('public.conversation_members') is not null then
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = 'conversation_members'
    loop
      execute format('drop policy if exists %I on public.conversation_members', p.policyname);
    end loop;
    alter table public.conversation_members enable row level security;
    revoke all on table public.conversation_members from anon, authenticated;
  end if;

  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'conversations'
  loop
    execute format('drop policy if exists %I on public.conversations', p.policyname);
  end loop;

  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'messages'
  loop
    execute format('drop policy if exists %I on public.messages', p.policyname);
  end loop;
end $$;

-- =========================================================
-- CONVERSATIONS
-- =========================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references auth.users(id) on delete cascade,
  client_id uuid references auth.users(id) on delete cascade,
  listing_id uuid,
  provider_name text,
  client_name text,
  listing_title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.conversations add column if not exists provider_id uuid references auth.users(id) on delete cascade;
alter table public.conversations add column if not exists client_id uuid references auth.users(id) on delete cascade;
alter table public.conversations add column if not exists listing_id uuid;
alter table public.conversations add column if not exists provider_name text;
alter table public.conversations add column if not exists client_name text;
alter table public.conversations add column if not exists listing_title text;
alter table public.conversations add column if not exists created_at timestamptz default now();
alter table public.conversations add column if not exists updated_at timestamptz default now();

-- Prevent duplicate provider/client chat threads when possible.
create unique index if not exists conversations_provider_client_unique
  on public.conversations(provider_id, client_id)
  where provider_id is not null and client_id is not null;

alter table public.conversations enable row level security;
drop policy if exists "Participants read conversations" on public.conversations;
create policy "Participants read conversations" on public.conversations for select to authenticated using (auth.uid() = provider_id or auth.uid() = client_id);
drop policy if exists "Clients create conversations" on public.conversations;
create policy "Clients create conversations" on public.conversations for insert to authenticated with check (auth.uid() = client_id and client_id <> provider_id);
drop policy if exists "Participants update conversations" on public.conversations;
create policy "Participants update conversations" on public.conversations for update to authenticated using (auth.uid() = provider_id or auth.uid() = client_id) with check (auth.uid() = provider_id or auth.uid() = client_id);

-- =========================================================
-- MESSAGES
-- =========================================================
create table if not exists public.messages (
  id bigint generated by default as identity primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  sender_name text,
  body text,
  created_at timestamptz default now()
);

alter table public.messages add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;
alter table public.messages add column if not exists sender_id uuid references auth.users(id) on delete cascade;
alter table public.messages add column if not exists sender_name text;
alter table public.messages add column if not exists body text;
-- Legacy CampusX databases used a required `message` column. Keep both
-- columns in sync so old data and new clients can coexist safely.
alter table public.messages add column if not exists message text;
alter table public.messages add column if not exists created_at timestamptz default now();

update public.messages
set body = message
where body is null and message is not null;

update public.messages
set message = body
where message is null and body is not null;

create or replace function public.sync_campusx_message_text()
returns trigger
language plpgsql
as $$
begin
  if new.body is null or btrim(new.body) = '' then
    new.body := new.message;
  end if;
  if new.message is null or btrim(new.message) = '' then
    new.message := new.body;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_campusx_message_text on public.messages;
create trigger trg_sync_campusx_message_text
before insert or update of body, message on public.messages
for each row execute function public.sync_campusx_message_text();

alter table public.messages enable row level security;
drop policy if exists "Participants read messages" on public.messages;
create policy "Participants read messages" on public.messages for select to authenticated using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.provider_id = auth.uid() or c.client_id = auth.uid())
  )
);
drop policy if exists "Participants send messages" on public.messages;
create policy "Participants send messages" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.provider_id = auth.uid() or c.client_id = auth.uid())
  )
);

-- =========================================================
-- PROFILE REVIEWS
-- =========================================================
create table if not exists public.profile_reviews (
  id bigint generated by default as identity primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_name text,
  rating int,
  message text,
  created_at timestamptz default now()
);

alter table public.profile_reviews add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
alter table public.profile_reviews add column if not exists reviewer_id uuid references auth.users(id) on delete set null;
alter table public.profile_reviews add column if not exists reviewer_name text;
alter table public.profile_reviews add column if not exists rating int;
alter table public.profile_reviews add column if not exists message text;
alter table public.profile_reviews add column if not exists created_at timestamptz default now();

alter table public.profile_reviews enable row level security;
drop policy if exists "Reviews are publicly readable" on public.profile_reviews;
create policy "Reviews are publicly readable" on public.profile_reviews for select using (true);
drop policy if exists "Completed clients can review" on public.profile_reviews;
create policy "Completed clients can review" on public.profile_reviews for insert to authenticated with check (
  auth.uid() = reviewer_id
  and exists (
    select 1 from public.hire_requests h
    where h.client_id = auth.uid()
      and h.provider_id = profile_id
      and h.status = 'completed'
  )
);
drop policy if exists "Authenticated users can review" on public.profile_reviews;

-- =========================================================
-- STORAGE FOR PROFILE PHOTO + CV
-- =========================================================
insert into storage.buckets (id, name, public)
values ('profile-files', 'profile-files', true)
on conflict (id) do update set public = true;

drop policy if exists "Profile files are publicly readable" on storage.objects;
create policy "Profile files are publicly readable" on storage.objects for select using (bucket_id = 'profile-files');
drop policy if exists "Users upload own profile files" on storage.objects;
create policy "Users upload own profile files" on storage.objects for insert to authenticated with check (
  bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "Users update own profile files" on storage.objects;
create policy "Users update own profile files" on storage.objects for update to authenticated using (
  bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "Users delete own profile files" on storage.objects;
create policy "Users delete own profile files" on storage.objects for delete to authenticated using (
  bucket_id = 'profile-files' and (storage.foldername(name))[1] = auth.uid()::text
);

-- =========================================================
-- REALTIME MESSAGES
-- =========================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
  end;
end $$;

-- Optional indexes used by the app.
create index if not exists hire_requests_provider_idx on public.hire_requests(provider_id);
create index if not exists hire_requests_client_idx on public.hire_requests(client_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id);
create index if not exists profile_reviews_profile_idx on public.profile_reviews(profile_id);

-- =========================================================
-- LEGACY LISTING OWNERSHIP FIX (v3)
-- Resolves old listings using normalized provider name, profile email,
-- auth email and user metadata. If an old listing still cannot be resolved,
-- clients may queue a hire request; it is attached automatically when the
-- provider later claims the listing.
-- =========================================================
create or replace function public.norm_campusx_text(v text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(coalesce(v,'')), '[^a-z0-9]+', '', 'g');
$$;

create or replace function public.resolve_legacy_listing_provider(target_listing uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  owner_id uuid;
  match_count bigint;
  listing_name text;
  listing_contact text;
begin
  if target_listing is null or to_regclass('public.skill_listings') is null then
    return null;
  end if;

  select provider_id, student_name, contact_info
    into owner_id, listing_name, listing_contact
  from public.skill_listings
  where id = target_listing;

  if owner_id is not null then
    return owner_id;
  end if;

  with candidates as (
    select distinct u.id
    from auth.users u
    left join public.profiles p on p.id = u.id
    where
      (
        public.norm_campusx_text(listing_name) <> '' and
        public.norm_campusx_text(listing_name) in (
          public.norm_campusx_text(p.full_name),
          public.norm_campusx_text(u.raw_user_meta_data ->> 'full_name'),
          public.norm_campusx_text(u.raw_user_meta_data ->> 'name')
        )
      )
      or (
        coalesce(trim(listing_contact),'') <> '' and (
          (coalesce(trim(p.email),'') <> '' and listing_contact ilike '%' || trim(p.email) || '%') or
          (coalesce(trim(u.email),'') <> '' and listing_contact ilike '%' || trim(u.email) || '%') or
          (coalesce(trim(p.mobile),'') <> '' and public.norm_campusx_text(listing_contact) like '%' || public.norm_campusx_text(p.mobile) || '%')
        )
      )
  )
  select count(*), (array_agg(id order by id::text))[1]
    into match_count, owner_id
  from candidates;

  if match_count = 1 and owner_id is not null then
    update public.skill_listings set provider_id = owner_id
    where id = target_listing and provider_id is null;

    update public.hire_requests set provider_id = owner_id, status = case when status = 'awaiting_provider_link' then 'pending' else status end, updated_at = now()
    where listing_id = target_listing and provider_id is null;

    return owner_id;
  end if;

  return null;
end;
$$;

grant execute on function public.resolve_legacy_listing_provider(uuid) to authenticated;

do $$
begin
  if to_regclass('public.skill_listings') is not null then
    alter table public.skill_listings enable row level security;

    drop policy if exists "Skill listings are publicly readable" on public.skill_listings;
    create policy "Skill listings are publicly readable" on public.skill_listings for select using (true);

    drop policy if exists "Providers create own listings" on public.skill_listings;
    create policy "Providers create own listings" on public.skill_listings for insert to authenticated with check (provider_id = auth.uid());

    drop policy if exists "Providers update own listings" on public.skill_listings;
    create policy "Providers update own listings" on public.skill_listings for update to authenticated using (provider_id = auth.uid()) with check (provider_id = auth.uid());

    drop policy if exists "Providers delete own listings" on public.skill_listings;
    create policy "Providers delete own listings" on public.skill_listings for delete to authenticated using (provider_id = auth.uid());
  end if;
end $$;

create or replace function public.claim_my_legacy_listings()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := auth.uid();
  my_name text;
  my_email text;
  my_mobile text;
  auth_email text;
  meta_name text;
  changed integer := 0;
begin
  if me is null or to_regclass('public.skill_listings') is null then return 0; end if;

  select p.full_name, p.email, p.mobile, u.email,
         coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
    into my_name, my_email, my_mobile, auth_email, meta_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = me;

  update public.skill_listings
  set provider_id = me
  where provider_id is null
    and (
      (public.norm_campusx_text(student_name) <> '' and public.norm_campusx_text(student_name) in (
        public.norm_campusx_text(my_name), public.norm_campusx_text(meta_name)
      ))
      or (coalesce(trim(my_email),'') <> '' and coalesce(contact_info,'') ilike '%' || trim(my_email) || '%')
      or (coalesce(trim(auth_email),'') <> '' and coalesce(contact_info,'') ilike '%' || trim(auth_email) || '%')
      or (coalesce(trim(my_mobile),'') <> '' and public.norm_campusx_text(contact_info) like '%' || public.norm_campusx_text(my_mobile) || '%')
    );

  get diagnostics changed = row_count;

  update public.hire_requests h
  set provider_id = me, status = case when h.status = 'awaiting_provider_link' then 'pending' else h.status end, updated_at = now()
  from public.skill_listings sl
  where h.listing_id = sl.id and h.provider_id is null and sl.provider_id = me;

  return changed;
end;
$$;

grant execute on function public.claim_my_legacy_listings() to authenticated;

-- Try to resolve all legacy listings immediately when this migration runs.
do $$
declare r record;
begin
  if to_regclass('public.skill_listings') is not null then
    for r in select id from public.skill_listings where provider_id is null loop
      perform public.resolve_legacy_listing_provider(r.id);
    end loop;
  end if;
end $$;


-- =========================================================
-- MESSAGE NOTIFICATIONS + SAFE MESSAGE DELETION
-- =========================================================
-- A message is unread until the receiving participant opens that conversation.
alter table public.messages add column if not exists read_at timestamptz;

-- A sender may delete only their own messages. The delete is visible to both
-- participants because both read the same conversation row.
drop policy if exists "Senders delete own messages" on public.messages;
create policy "Senders delete own messages" on public.messages
for delete to authenticated
using (sender_id = auth.uid());

-- Mark only incoming messages as read. SECURITY DEFINER is used so recipients
-- do not need broad UPDATE permission on message body/content columns.
create or replace function public.mark_conversation_messages_read(target_conversation uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  affected integer := 0;
begin
  if me is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.conversations c
    where c.id = target_conversation
      and (c.provider_id = me or c.client_id = me)
  ) then
    raise exception 'Not a participant in this conversation';
  end if;

  update public.messages m
  set read_at = now()
  where m.conversation_id = target_conversation
    and m.sender_id is distinct from me
    and m.read_at is null;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.mark_conversation_messages_read(uuid) from public;
grant execute on function public.mark_conversation_messages_read(uuid) to authenticated;

create index if not exists messages_unread_idx
  on public.messages(conversation_id, read_at, created_at desc);


-- CampusX final persistent message deletion fix
-- Safe to run more than once.
create or replace function public.delete_own_message(target_message text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  affected integer := 0;
begin
  if me is null then
    raise exception 'Authentication required';
  end if;

  delete from public.messages m
  where m.id::text = target_message
    and m.sender_id::text = me::text;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke all on function public.delete_own_message(text) from public;
grant execute on function public.delete_own_message(text) to authenticated;

-- Keep a normal RLS DELETE policy too, for direct client deletes and future compatibility.
alter table public.messages enable row level security;
drop policy if exists "Senders delete own messages" on public.messages;
create policy "Senders delete own messages" on public.messages
for delete to authenticated
using (sender_id::text = auth.uid()::text);
-- CampusX final notification read-state fix
-- Safe to run more than once.

alter table public.messages add column if not exists read_at timestamptz;

create or replace function public.mark_conversation_messages_read(target_conversation uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  affected integer := 0;
begin
  if me is null then raise exception 'Authentication required'; end if;

  if not exists (
    select 1 from public.conversations c
    where c.id = target_conversation
      and (c.provider_id = me or c.client_id = me)
  ) then
    raise exception 'Not a participant in this conversation';
  end if;

  update public.messages m
     set read_at = now()
   where m.conversation_id = target_conversation
     and m.sender_id is distinct from me
     and m.read_at is null;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.mark_all_my_messages_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  affected integer := 0;
begin
  if me is null then raise exception 'Authentication required'; end if;

  update public.messages m
     set read_at = now()
   where m.sender_id is distinct from me
     and m.read_at is null
     and exists (
       select 1
       from public.conversations c
       where c.id = m.conversation_id
         and (c.provider_id = me or c.client_id = me)
     );

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.mark_conversation_messages_read(uuid) from public;
grant execute on function public.mark_conversation_messages_read(uuid) to authenticated;
revoke all on function public.mark_all_my_messages_read() from public;
grant execute on function public.mark_all_my_messages_read() to authenticated;

create index if not exists messages_unread_idx
  on public.messages(conversation_id, read_at, created_at desc);
-- CampusX final notification read-state fix
-- Safe to run more than once.
alter table public.messages add column if not exists read_at timestamptz;

create or replace function public.mark_conversation_messages_read(target_conversation uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  affected integer := 0;
begin
  if me is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.conversations c
    where c.id = target_conversation
      and (c.provider_id = me or c.client_id = me)
  ) then raise exception 'Not a participant in this conversation'; end if;
  update public.messages m
     set read_at = now()
   where m.conversation_id = target_conversation
     and m.sender_id is distinct from me
     and m.read_at is null;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.mark_all_my_messages_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  affected integer := 0;
begin
  if me is null then raise exception 'Authentication required'; end if;
  update public.messages m
     set read_at = now()
   where m.sender_id is distinct from me
     and m.read_at is null
     and exists (
       select 1 from public.conversations c
       where c.id = m.conversation_id
         and (c.provider_id = me or c.client_id = me)
     );
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.mark_conversation_messages_read(uuid) from public;
grant execute on function public.mark_conversation_messages_read(uuid) to authenticated;
revoke all on function public.mark_all_my_messages_read() from public;
grant execute on function public.mark_all_my_messages_read() to authenticated;
create index if not exists messages_unread_idx on public.messages(conversation_id, read_at, created_at desc);
