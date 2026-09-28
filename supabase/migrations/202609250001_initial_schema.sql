begin;

create sequence if not exists public.ticket_number_seq;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique check (ticket_number ~ '^IT-[0-9]{3,}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  legacy_id text,
  customer text not null check (length(btrim(customer)) > 0),
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  category text not null check (category in (
    'Account / Login', 'Nail360 / POS', 'Clover / Payment', 'Printer / Hardware',
    'Network', 'Appointment / Booking', 'Kiosk', 'Report', 'Configuration',
    'Bug', 'How-to / Training', 'Other'
  )),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'new' check (status in ('new', 'investigating', 'waiting', 'resolved', 'closed')),
  investigation text not null default '',
  root_cause text not null default '',
  solution text not null default '',
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tickets_user_legacy_id_unique
  on public.tickets (user_id, legacy_id)
  where legacy_id is not null;

create index if not exists tickets_user_updated_at_idx
  on public.tickets (user_id, updated_at desc);

create table if not exists public.ticket_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'status_changed', 'priority_changed', 'resolved', 'reopened')),
  field_name text,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists ticket_history_ticket_created_idx
  on public.ticket_history (ticket_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

create or replace function public.assign_ticket_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(1949051741, 1);

  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  if new.user_id is distinct from auth.uid() then
    raise exception 'Ticket owner must match the authenticated user' using errcode = '42501';
  end if;

  if new.ticket_number is null or btrim(new.ticket_number) = '' then
    loop
      new.ticket_number := 'IT-' || lpad(nextval('public.ticket_number_seq')::text, 3, '0');
      exit when not exists (
        select 1 from public.tickets t where t.ticket_number = new.ticket_number
      );
    end loop;
  elsif new.ticket_number !~ '^IT-[0-9]{3,}$' then
    raise exception 'Ticket number has an invalid format' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger tickets_assign_number
  before insert on public.tickets
  for each row execute function public.assign_ticket_number();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

create or replace function public.write_ticket_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
begin
  actor_id := coalesce(auth.uid(), new.user_id);

  if tg_op = 'INSERT' then
    insert into public.ticket_history (ticket_id, user_id, action)
    values (new.id, actor_id, 'created');
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (
      new.id,
      actor_id,
      case
        when new.status = 'resolved' then 'resolved'
        when old.status in ('resolved', 'closed') and new.status in ('new', 'investigating', 'waiting') then 'reopened'
        else 'status_changed'
      end,
      'status', old.status, new.status
    );
  end if;

  if new.priority is distinct from old.priority then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'priority_changed', 'priority', old.priority, new.priority);
  end if;

  if new.customer is distinct from old.customer then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'updated', 'customer', old.customer, new.customer);
  end if;
  if new.title is distinct from old.title then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'updated', 'title', old.title, new.title);
  end if;
  if new.description is distinct from old.description then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'updated', 'description', old.description, new.description);
  end if;
  if new.category is distinct from old.category then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'updated', 'category', old.category, new.category);
  end if;
  if new.investigation is distinct from old.investigation then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'updated', 'investigation', old.investigation, new.investigation);
  end if;
  if new.root_cause is distinct from old.root_cause then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'updated', 'root_cause', old.root_cause, new.root_cause);
  end if;
  if new.solution is distinct from old.solution then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'updated', 'solution', old.solution, new.solution);
  end if;
  if new.internal_notes is distinct from old.internal_notes then
    insert into public.ticket_history (ticket_id, user_id, action, field_name, old_value, new_value)
    values (new.id, actor_id, 'updated', 'internal_notes', old.internal_notes, new.internal_notes);
  end if;

  return new;
end;
$$;

create trigger tickets_write_history
  after insert or update on public.tickets
  for each row execute function public.write_ticket_history();

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_history enable row level security;

revoke all on public.profiles, public.tickets, public.ticket_history from anon, authenticated;
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.tickets to authenticated;
grant select on public.ticket_history to authenticated;
revoke all on sequence public.ticket_number_seq from public, anon, authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists tickets_select_own on public.tickets;
create policy tickets_select_own on public.tickets
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists tickets_insert_own on public.tickets;
create policy tickets_insert_own on public.tickets
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists tickets_update_own on public.tickets;
create policy tickets_update_own on public.tickets
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists tickets_delete_own on public.tickets;
create policy tickets_delete_own on public.tickets
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists ticket_history_select_own on public.ticket_history;
create policy ticket_history_select_own on public.ticket_history
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_history.ticket_id and t.user_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'it-ticket-attachments',
  'it-ticket-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'text/x-log', 'application/octet-stream']
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists ticket_attachments_select_own on storage.objects;
create policy ticket_attachments_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'it-ticket-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.tickets t
      where t.id::text = (storage.foldername(name))[2]
        and t.user_id = (select auth.uid())
    )
  );

drop policy if exists ticket_attachments_insert_own on storage.objects;
create policy ticket_attachments_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'it-ticket-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~* '\.(jpg|jpeg|png|webp|pdf|txt|log)$'
    and exists (
      select 1 from public.tickets t
      where t.id::text = (storage.foldername(name))[2]
        and t.user_id = (select auth.uid())
    )
  );

drop policy if exists ticket_attachments_delete_own on storage.objects;
create policy ticket_attachments_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'it-ticket-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.tickets t
      where t.id::text = (storage.foldername(name))[2]
        and t.user_id = (select auth.uid())
    )
  );

commit;
