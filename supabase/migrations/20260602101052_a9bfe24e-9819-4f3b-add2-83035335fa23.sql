-- ============ carts ============
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text,
  status text not null default 'active' check (status in ('active','merged','converted','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_chk check ((user_id is not null) or (session_id is not null))
);

create unique index carts_active_user_idx
  on public.carts (user_id)
  where status = 'active' and user_id is not null;

create unique index carts_active_session_idx
  on public.carts (session_id)
  where status = 'active' and session_id is not null;

create index carts_user_idx on public.carts (user_id);
create index carts_session_idx on public.carts (session_id);

grant select, insert, update, delete on public.carts to authenticated;
grant all on public.carts to service_role;

alter table public.carts enable row level security;

create policy "Users view own cart"
  on public.carts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own cart"
  on public.carts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own cart"
  on public.carts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own cart"
  on public.carts for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Staff view all carts"
  on public.carts for select
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'manager'));

create trigger carts_touch_updated_at
before update on public.carts
for each row execute function public.touch_updated_at();

-- ============ cart_items ============
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  weight_grams integer check (weight_grams is null or weight_grams > 0),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index cart_items_unique_idx on public.cart_items (
  cart_id,
  product_id,
  coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(weight_grams, 0)
);

create index cart_items_cart_idx on public.cart_items (cart_id);

grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;

alter table public.cart_items enable row level security;

create policy "Users view own cart items"
  on public.cart_items for select
  to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = auth.uid()
  ));

create policy "Users modify own cart items - insert"
  on public.cart_items for insert
  to authenticated
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = auth.uid()
  ));

create policy "Users modify own cart items - update"
  on public.cart_items for update
  to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = auth.uid()
  ));

create policy "Users modify own cart items - delete"
  on public.cart_items for delete
  to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = auth.uid()
  ));

create policy "Staff view all cart items"
  on public.cart_items for select
  to authenticated
  using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'manager'));

create trigger cart_items_touch_updated_at
before update on public.cart_items
for each row execute function public.touch_updated_at();
