-- CampusX messaging compatibility hotfix
-- Fixes: null value in column "message" of relation "messages" violates not-null constraint

begin;

alter table public.messages add column if not exists body text;
alter table public.messages add column if not exists message text;

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

commit;
