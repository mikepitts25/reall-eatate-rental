-- ============================================================================
-- LeaseFlip — 0004_notifications_realtime.sql
--   1. Enable Supabase Realtime for live messaging + notifications.
--   2. Add a SECURITY DEFINER function so a user can create a notification for
--      their counterpart (the RLS INSERT policy only allows self-targeted rows).
-- Idempotent: safe to run more than once.
-- ============================================================================

-- 1. Realtime --------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- 2. Notification helper ---------------------------------------------------
-- Lets an authenticated user notify the other party they share a proposal with
-- (or any user, if the caller is an admin). Runs as definer to bypass the
-- self-only INSERT policy, but guards who may be notified to prevent spam.
create or replace function public.create_notification(
  p_user_id uuid,
  p_type    notification_type,
  p_title   text,
  p_body    text default null,
  p_link    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'not authenticated';
  end if;

  -- Allow: notifying yourself, admins, or a counterpart on a shared proposal.
  if v_actor <> p_user_id
     and not public.is_admin()
     and not exists (
       select 1 from public.proposals pr
       where (pr.owner_id = v_actor and pr.operator_id = p_user_id)
          or (pr.operator_id = v_actor and pr.owner_id = p_user_id)
     )
  then
    raise exception 'not allowed to notify this user';
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_notification(
  uuid, notification_type, text, text, text
) to authenticated;
