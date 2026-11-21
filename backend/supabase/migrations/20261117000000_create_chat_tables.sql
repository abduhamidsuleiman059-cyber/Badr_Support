create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, user_id)
    references public.conversations (id, user_id)
    on delete cascade
);

create index conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create index messages_conversation_user_created_idx
  on public.messages (conversation_id, user_id, created_at, id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Users can read their conversations"
  on public.conversations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their conversations"
  on public.conversations for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their conversations"
  on public.conversations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their conversations"
  on public.conversations for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their messages"
  on public.messages for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their messages"
  on public.messages for insert to authenticated
  with check ((select auth.uid()) = user_id);

create function public.touch_conversation_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.conversations
  set updated_at = pg_catalog.now()
  where id = new.conversation_id;

  return new;
end;
$$;

create trigger messages_touch_conversation_updated_at
  after insert on public.messages
  for each row execute function public.touch_conversation_updated_at();
