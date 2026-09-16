-- has_role is only used inside RLS policies.  It must not be callable through
-- the public RPC API, where SECURITY DEFINER would expose role membership.
revoke execute on function public.has_role(uuid, public.app_role) from public;
revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated;
