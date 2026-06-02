-- has_role is invoked by RLS USING clauses on public catalog tables.
-- Anon and authenticated roles must be able to execute it.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- Public read access for the storefront catalog (RLS still filters by is_active).
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_variants TO anon;

-- Make sure store-wide public settings are flagged readable.
UPDATE public.settings
SET is_public = true
WHERE key IN (
  'delivery_fee_egp',
  'free_delivery_threshold_egp',
  'min_order_egp',
  'contact_phone',
  'whatsapp_number',
  'store_name_ar',
  'store_city_ar',
  'working_hours_ar',
  'currency'
);
