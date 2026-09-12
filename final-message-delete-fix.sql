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
