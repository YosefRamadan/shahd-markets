# أسواق شهد الفيوم — Architecture & Database Design

Arabic-first (RTL) grocery store web app. Currency: EGP. Delivery: 20 EGP (configurable). Contact/WhatsApp: 01008336388. Soft yellow palette.

This document covers architecture, database schema, relationships, data models, and business logic only. No application code will be generated yet.

---

## 1. Tech Architecture

**Frontend**
- TanStack Start (React 19 + Vite) — already scaffolded
- RTL by default (`<html dir="rtl" lang="ar">`)
- Tailwind v4 design tokens in `src/styles.css` — soft yellow palette
- Arabic fonts: Cairo (headings) + Tajawal (body)
- Route structure:
  - `/` home, `/category/$slug`, `/product/$slug`
  - `/cart`, `/checkout`, `/order/$id` (track)
  - `/login`, `/register`, `/account`, `/account/orders`
  - `/admin/*` (protected) — dashboard, products, categories, orders, inventory, settings

**Backend** — Lovable Cloud (Supabase)
- Postgres + RLS for data isolation
- Supabase Auth for registered customers & admins
- `user_roles` table + `has_role()` security-definer function for admin checks
- Server functions (`createServerFn`) for cart merge, checkout, stock decrement
- Public server route for WhatsApp order summary link (optional)

**Color palette (soft yellow, eye-friendly)** — to define in `src/styles.css`
- `--primary`: warm honey yellow (oklch ~0.85 0.13 90)
- `--primary-foreground`: deep brown (~0.25 0.04 70)
- `--accent`: soft cream (~0.96 0.04 95)
- `--background`: off-white cream (~0.99 0.01 95)
- `--muted`: pale sand
- `--destructive`: muted terracotta

---

## 2. Domain Model Overview

```text
auth.users ──┐
             ├── profiles (1:1)         registered customers
             └── user_roles (1:N)       admin / customer roles

categories ──< products ──< product_variants ──< inventory
                  │              │
                  │              └──< cart_items, order_items (variant_id FK)
                  └── product_images

carts ──< cart_items
  │
  ├── user_id (nullable, for guests)
  └── session_id (nullable, for guests)

orders ──< order_items
  │
  ├── customer info snapshot (name, phone, address) — works for guest & registered
  └── status history (embedded enum + updated_at)

inventory_movements   audit log of stock changes
settings              key/value app config (delivery fee, contact, hours)
```

---

## 3. Database Schema

All tables in `public`. Every table gets `GRANT`s and RLS. `created_at`/`updated_at` `timestamptz default now()` on every table (omitted below for brevity).

### 3.1 Roles & users

```sql
create type app_role as enum ('admin', 'manager', 'customer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,                       -- Egyptian mobile, validated
  default_address text,
  city text default 'الفيوم',
  created_at timestamptz default now()
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
-- has_role(_user_id, _role) security-definer function
```

Admin users = any row in `user_roles` with role `'admin'` or `'manager'`. No separate admin table — single source of truth, RLS-safe.

### 3.2 Catalog

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  slug text not null unique,
  description_ar text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  sort_order int default 0,
  is_active boolean default true
);

create type product_unit as enum ('piece', 'kg', 'gram', 'liter', 'pack');

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name_ar text not null,
  slug text not null unique,
  description_ar text,
  brand text,
  base_unit product_unit not null default 'piece',
  is_weight_based boolean default false,   -- true => price applies per kg/gram
  step_quantity numeric(10,3) default 1,   -- e.g. 0.25 kg increments
  min_quantity numeric(10,3) default 1,
  is_active boolean default true,
  is_featured boolean default false,
  tags text[]
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_ar text,
  sort_order int default 0
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name_ar text not null,                   -- e.g. "1 كجم", "500 جم", "عبوة 12"
  sku text unique,
  barcode text,
  unit product_unit not null,
  unit_amount numeric(10,3) not null,      -- 1.000, 0.500, 12
  price_egp numeric(10,2) not null,        -- price per variant (or per kg if weight-based)
  compare_at_price_egp numeric(10,2),      -- "was" price
  is_default boolean default false,
  is_active boolean default true
);
create unique index on product_variants (product_id) where is_default;
```

Weight-based example: product "طماطم" with `is_weight_based=true`, variant `name_ar='1 كجم'`, `unit='kg'`, `price_egp=15.00`. Cart quantity stored as numeric (e.g. 0.5 kg).

### 3.3 Inventory

```sql
create table inventory (
  variant_id uuid primary key references product_variants(id) on delete cascade,
  stock_quantity numeric(12,3) not null default 0,
  reserved_quantity numeric(12,3) not null default 0,  -- in active carts/pending orders
  low_stock_threshold numeric(12,3) default 5,
  track_inventory boolean default true,
  updated_at timestamptz default now()
);

create type inventory_reason as enum (
  'purchase', 'sale', 'return', 'adjustment', 'reservation', 'release', 'damage'
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  delta numeric(12,3) not null,           -- signed
  reason inventory_reason not null,
  order_id uuid,                          -- nullable FK to orders
  note text,
  performed_by uuid references auth.users(id),
  created_at timestamptz default now()
);
```

Available stock = `stock_quantity - reserved_quantity`. Decrement on order confirmation; release on cancel.

### 3.4 Cart

```sql
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- null for guest
  session_id text,                                           -- null for registered
  status text not null default 'active',                     -- active | merged | abandoned | converted
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check ((user_id is not null) or (session_id is not null))
);
create unique index on carts (user_id) where status = 'active' and user_id is not null;
create unique index on carts (session_id) where status = 'active' and session_id is not null;

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete restrict,
  quantity numeric(10,3) not null check (quantity > 0),
  unit_price_egp numeric(10,2) not null,   -- snapshot at add-time
  unique (cart_id, variant_id)
);
```

Guest → registered: on login, server fn merges `session_id` cart into the user's active cart (sum quantities, prefer latest price).

### 3.5 Orders

```sql
create type order_status as enum (
  'pending',         -- awaiting confirmation
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded'
);
create type payment_method as enum ('cod', 'wallet', 'card');  -- cod default
create type payment_status as enum ('unpaid', 'paid', 'refunded');

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,        -- human readable, e.g. SH-2026-000123
  user_id uuid references auth.users(id) on delete set null,  -- null for guest

  -- Customer snapshot (works for guest & registered)
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  customer_city text not null default 'الفيوم',
  customer_notes text,

  -- Money
  subtotal_egp numeric(10,2) not null,
  delivery_fee_egp numeric(10,2) not null default 20,
  discount_egp numeric(10,2) not null default 0,
  total_egp numeric(10,2) not null,

  status order_status not null default 'pending',
  payment_method payment_method not null default 'cod',
  payment_status payment_status not null default 'unpaid',

  placed_at timestamptz default now(),
  confirmed_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  product_name_ar text not null,           -- snapshot
  variant_name_ar text not null,           -- snapshot
  unit product_unit not null,
  quantity numeric(10,3) not null,
  unit_price_egp numeric(10,2) not null,
  line_total_egp numeric(10,2) not null
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references auth.users(id),
  note text,
  created_at timestamptz default now()
);
```

### 3.6 Settings

```sql
create table settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

-- Seed:
-- ('delivery_fee_egp', '20')
-- ('free_delivery_threshold_egp', '300')
-- ('contact_phone', '"01008336388"')
-- ('whatsapp_number', '"01008336388"')
-- ('store_name_ar', '"أسواق شهد الفيوم"')
-- ('store_city_ar', '"الفيوم"')
-- ('working_hours_ar', '"يوميًا من 9 صباحًا حتى 12 منتصف الليل"')
-- ('min_order_egp', '50')
-- ('currency', '"EGP"')
```

---

## 4. Relationships Summary

- `auth.users 1—1 profiles`, `1—N user_roles`
- `categories 1—N categories` (self, optional sub-categories)
- `categories 1—N products`
- `products 1—N product_variants`, `1—N product_images`
- `product_variants 1—1 inventory`, `1—N inventory_movements`
- `carts 1—N cart_items`, `cart_items N—1 product_variants`
- `orders 1—N order_items`, `1—N order_status_history`
- `orders N—1 auth.users` (nullable → guest support)
- `settings` standalone key/value

---

## 5. RLS Policy Sketch

- **profiles**: user reads/updates own row; admins read all.
- **user_roles**: user reads own; only admins insert/update/delete (via `has_role`).
- **categories, products, product_variants, product_images**: public `select` where `is_active=true`; write restricted to admin/manager.
- **inventory, inventory_movements**: admin/manager only.
- **carts, cart_items**:
  - registered: `user_id = auth.uid()`
  - guest: enforced at server-fn layer (cart looked up by `session_id` cookie); no anon RLS access to these tables — all guest cart ops go through server functions using `supabaseAdmin`.
- **orders, order_items, order_status_history**:
  - customer reads own (`user_id = auth.uid()`)
  - guest reads via signed `order_number + phone` lookup through a server function
  - admin/manager full access
- **settings**: public `select` for whitelisted keys (contact, hours, delivery fee); admin write.

Every `CREATE TABLE` ships with explicit `GRANT`s to `authenticated` and `service_role` (and `anon` only on truly public catalog/settings).

---

## 6. Business Logic Overview

**Pricing**
- Line total = `unit_price_egp * quantity` (quantity may be fractional for weight-based)
- Subtotal = sum(line totals)
- Delivery fee = `settings.delivery_fee_egp`, waived if subtotal ≥ `free_delivery_threshold_egp`
- Total = subtotal + delivery_fee − discount
- Minimum order enforced from `settings.min_order_egp`

**Cart**
- Guest cart keyed by `session_id` cookie (httpOnly, 30-day)
- Server fn `addToCart`, `updateCartItem`, `removeCartItem`, `getCart`
- On login: `mergeGuestCart(session_id)` merges into user's active cart, marks guest cart `merged`

**Checkout**
- Server fn `placeOrder`:
  1. Validate cart not empty & meets min order
  2. Re-price from current variant prices (don't trust client)
  3. Check inventory availability per item
  4. Create `orders` + `order_items` (snapshot names/prices/units)
  5. Insert `inventory_movements` (reason `sale`), decrement `inventory.stock_quantity`
  6. Mark cart `converted`
  7. Generate `order_number` (e.g. `SH-{YY}-{seq}`)
  8. Return order; client can deep-link to WhatsApp with order summary to `01008336388`

**Inventory**
- `track_inventory=false` skips stock checks (e.g. service items)
- Weight-based stock measured in same `base_unit` (e.g. kg)
- Admin adjustments always write an `inventory_movements` row (audit)
- Low-stock dashboard view: `stock_quantity - reserved_quantity <= low_stock_threshold`

**Order lifecycle**
- `pending → confirmed → preparing → out_for_delivery → delivered`
- Any state → `cancelled` (releases reserved stock, logs `inventory_movements` with `reason='release'` or `'return'`)
- Every transition writes `order_status_history`

**Guest order tracking**
- Public route `/order/track` → server fn checks `(order_number, customer_phone)` pair, returns sanitized order

**Admin**
- Gated by `has_role(auth.uid(), 'admin' | 'manager')` in `beforeLoad`
- CRUD for categories, products, variants, images, inventory
- Orders board (kanban by status)
- Settings editor (delivery fee, hours, contact, thresholds)

---

## 7. Next Steps (after you approve)

1. Enable Lovable Cloud
2. Run migration: enums, tables, indexes, GRANTs, RLS, `has_role`, seed settings
3. Build Arabic RTL design system in `src/styles.css` (soft yellow palette + Cairo/Tajawal)
4. Scaffold routes (storefront + admin) and server functions in the order: catalog → cart → checkout → orders → admin
