-- Restore EXECUTE on has_role to anon and authenticated.
-- Required because public RLS policies on categories/products/product_variants
-- call has_role() in their USING expression. Without EXECUTE, PostgREST
-- returns 401 "permission denied for function has_role" for anon browsing.
-- has_role is SECURITY DEFINER + STABLE and only reads user_roles by user_id,
-- so granting EXECUTE does not expose additional data.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
