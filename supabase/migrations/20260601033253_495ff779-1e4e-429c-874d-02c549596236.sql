
-- Set search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Lock down trigger-only functions
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- has_role is called from RLS policies — only authenticated users need EXECUTE
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant  execute on function public.has_role(uuid, public.app_role) to authenticated;
