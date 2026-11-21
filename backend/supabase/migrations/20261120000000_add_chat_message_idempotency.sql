alter table public.messages
  add column submission_id uuid,
  add column provider text;

create unique index messages_submission_role_unique
  on public.messages (user_id, submission_id, role)
  where submission_id is not null;

create function public.save_user_message_once(
  p_user_id uuid,
  p_conversation_id uuid,
  p_submission_id uuid,
  p_content text
)
returns table (conversation_id uuid, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_content text;
begin
  if p_submission_id is null or p_content is null or pg_catalog.char_length(p_content) = 0 then
    raise exception 'A submission ID and non-empty content are required.'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_submission_id::text, 0)
  );

  select m.conversation_id, m.content
    into v_conversation_id, v_content
    from public.messages as m
    where m.user_id = p_user_id
      and m.submission_id = p_submission_id
      and m.role = 'user';

  if found then
    if v_content is distinct from p_content then
      raise exception 'The submission ID has already been used with different content.'
        using errcode = '22023';
    end if;

    return query select v_conversation_id, true;
    return;
  end if;

  if p_conversation_id is null then
    insert into public.conversations (user_id)
      values (p_user_id)
      returning id into v_conversation_id;
  else
    select c.id
      into v_conversation_id
      from public.conversations as c
      where c.id = p_conversation_id
        and c.user_id = p_user_id;

    if not found then
      raise exception 'Conversation not found.'
        using errcode = 'P0002';
    end if;
  end if;

  insert into public.messages (
    conversation_id,
    user_id,
    submission_id,
    role,
    content
  ) values (
    v_conversation_id,
    p_user_id,
    p_submission_id,
    'user',
    p_content
  );

  return query select v_conversation_id, false;
end;
$$;

revoke all on function public.save_user_message_once(uuid, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.save_user_message_once(uuid, uuid, uuid, text)
  to service_role;
