
-- =========================================================
-- CATEGORIES
-- =========================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  slug text not null unique,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;

alter table public.categories enable row level security;

create policy "Active categories viewable by everyone"
  on public.categories for select
  using (is_active = true or has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins/managers manage categories - insert"
  on public.categories for insert to authenticated
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins/managers manage categories - update"
  on public.categories for update to authenticated
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins manage categories - delete"
  on public.categories for delete to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.touch_updated_at();

create index idx_categories_active_sort on public.categories (is_active, sort_order);

-- =========================================================
-- PRODUCTS
-- =========================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name_ar text not null,
  slug text not null unique,
  description_ar text,
  image_url text,
  base_price numeric(10,2) not null default 0 check (base_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_weight_based boolean not null default false,
  weight_options_grams integer[] not null default '{}',
  price_per_kg numeric(10,2) check (price_per_kg is null or price_per_kg >= 0),
  unit_label_ar text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;

create policy "Active products viewable by everyone"
  on public.products for select
  using (is_active = true or has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins/managers manage products - insert"
  on public.products for insert to authenticated
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins/managers manage products - update"
  on public.products for update to authenticated
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins manage products - delete"
  on public.products for delete to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

create index idx_products_category on public.products (category_id);
create index idx_products_active on public.products (is_active);

-- =========================================================
-- PRODUCT VARIANTS
-- =========================================================
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name_ar text not null,
  sku text,
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;

alter table public.product_variants enable row level security;

create policy "Active variants viewable by everyone"
  on public.product_variants for select
  using (is_active = true or has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins/managers manage variants - insert"
  on public.product_variants for insert to authenticated
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins/managers manage variants - update"
  on public.product_variants for update to authenticated
  using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));

create policy "Admins manage variants - delete"
  on public.product_variants for delete to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create trigger trg_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.touch_updated_at();

create index idx_variants_product on public.product_variants (product_id);
