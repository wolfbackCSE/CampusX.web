
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
