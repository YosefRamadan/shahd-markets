-- Invoice historical snapshot + document fields on orders.
-- Additive only: nullable column + NOT NULL columns with defaults.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS seller_snapshot jsonb;

COMMENT ON COLUMN public.orders.seller_snapshot IS
  'Immutable copy of store/seller details (name, address, phones, tax + commercial registration) as they were when the order was placed. NULL for orders created before this column existed; the invoice then falls back to current settings.';
COMMENT ON COLUMN public.orders.payment_method IS 'cod = cash on delivery.';
