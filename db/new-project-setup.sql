-- Run this ONCE against the NEW Supabase project (nfzcpxdwbswkigqveocw)
-- via the SQL Editor, or:
--   supabase db execute --file db/new-project-setup.sql
--
-- Why: the public catalog policies on categories / products / product_variants
-- call public.has_role(...) inside their USING clause, so the calling role must
-- be allowed to execute that function. Without this, anonymous visitors get:
--   42501: permission denied for function has_role
--
-- Safe and non-destructive: grants only. No schema or data changes.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
