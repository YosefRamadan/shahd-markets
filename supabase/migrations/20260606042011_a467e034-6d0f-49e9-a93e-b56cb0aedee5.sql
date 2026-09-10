-- 1. Tighten staff orders UPDATE policy
drop policy if exists "Staff update orders" on public.orders;

create policy "Staff update orders"
  on public.orders
  for update
  to authenticated
  using  (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role))
  with check (
    has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role)
  );

-- 2. Revoke EXECUTE on SECURITY DEFINER helpers from public/anon/authenticated.
-- has_role is invoked from RLS policies (which run with table-owner rights), so
-- removing direct EXECUTE does not affect policy evaluation.
revoke execute on function public.has_role(uuid, app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.generate_order_number() from public, anon, authenticated;
revoke execute on function public.apply_order_stock(uuid) from public, anon, authenticated;
revoke execute on function public.restore_order_stock(uuid) from public, anon, authenticated;