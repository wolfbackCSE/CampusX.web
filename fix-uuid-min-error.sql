-- CampusX hotfix: PostgreSQL has no min(uuid) aggregate.
-- Safe to run after the previous migration failed with ERROR 42883.

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

    update public.hire_requests
    set provider_id = owner_id,
        status = case when status = 'awaiting_provider_link' then 'pending' else status end,
        updated_at = now()
    where listing_id = target_listing and provider_id is null;

    return owner_id;
  end if;

  return null;
end;
$$;

grant execute on function public.resolve_legacy_listing_provider(uuid) to authenticated;

do $$
declare r record;
begin
  if to_regclass('public.skill_listings') is not null then
    for r in select id from public.skill_listings where provider_id is null loop
      perform public.resolve_legacy_listing_provider(r.id);
    end loop;
  end if;
end $$;
