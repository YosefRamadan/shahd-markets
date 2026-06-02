
-- Order status enum (English internal values; Arabic labels resolved in UI)
create type public.order_status as enum (
  'placed',          -- تم الطلب
  'preparing',       -- تم التجهيز
  'out_for_delivery',-- مع الطيار
  'delivered',       -- تم التسليم
  'cancelled'        -- ملغي
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid,
  session_id text,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  customer_city text not null default 'الفيوم',
  notes text,
  status public.order_status not null default 'placed',
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  stock_deducted boolean not null default false,
  cancelled_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

create policy "Users view own orders" on public.orders
  for select to authenticated using (auth.uid() = user_id);
create policy "Staff view all orders" on public.orders
  for select to authenticated using (
    public.has_role(auth.uid(),'admin'::app_role) or public.has_role(auth.uid(),'manager'::app_role)
  );
create policy "Staff update orders" on public.orders
  for update to authenticated using (
    public.has_role(auth.uid(),'admin'::app_role) or public.has_role(auth.uid(),'manager'::app_role)
  ) with check (true);
create policy "Admins delete orders" on public.orders
  for delete to authenticated using (public.has_role(auth.uid(),'admin'::app_role));

create index orders_user_id_idx on public.orders(user_id);
create index orders_session_id_idx on public.orders(session_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

create trigger orders_touch_updated
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- Order items (snapshot of product at order time)
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null,
  variant_id uuid,
  weight_grams integer,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null,
  product_name text not null,
  variant_name text,
  is_weight_based boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;

alter table public.order_items enable row level security;

create policy "Users view items of own orders" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "Staff view all order items" on public.order_items
  for select to authenticated using (
    public.has_role(auth.uid(),'admin'::app_role) or public.has_role(auth.uid(),'manager'::app_role)
  );
create policy "Staff modify order items" on public.order_items
  for all to authenticated using (
    public.has_role(auth.uid(),'admin'::app_role) or public.has_role(auth.uid(),'manager'::app_role)
  ) with check (
    public.has_role(auth.uid(),'admin'::app_role) or public.has_role(auth.uid(),'manager'::app_role)
  );

create index order_items_order_id_idx on public.order_items(order_id);

-- Order number generator: SH-YYMMDD-XXXX
create or replace function public.generate_order_number()
returns text language plpgsql security definer set search_path=public as $$
declare
  v_seq int;
  v_date text := to_char(now(),'YYMMDD');
begin
  select count(*)+1 into v_seq from public.orders
    where created_at::date = current_date;
  return 'SH-' || v_date || '-' || lpad(v_seq::text, 4, '0');
end;
$$;

-- Apply stock deduction for an order (idempotent via stock_deducted flag)
create or replace function public.apply_order_stock(p_order_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare
  r record;
  v_already boolean;
begin
  select stock_deducted into v_already from public.orders where id = p_order_id for update;
  if v_already then return; end if;

  for r in select * from public.order_items where order_id = p_order_id loop
    if r.variant_id is not null then
      update public.product_variants
        set stock = greatest(stock - r.quantity, 0)
        where id = r.variant_id;
    elsif r.is_weight_based and r.weight_grams is not null then
      -- products.stock is treated as kilograms for weight-based items
      update public.products
        set stock = greatest(stock - ceil(((r.weight_grams * r.quantity)::numeric / 1000))::int, 0)
        where id = r.product_id;
    else
      update public.products
        set stock = greatest(stock - r.quantity, 0)
        where id = r.product_id;
    end if;
  end loop;

  update public.orders set stock_deducted = true where id = p_order_id;
end;
$$;

-- Restore stock for an order (idempotent)
create or replace function public.restore_order_stock(p_order_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare
  r record;
  v_deducted boolean;
begin
  select stock_deducted into v_deducted from public.orders where id = p_order_id for update;
  if not v_deducted then return; end if;

  for r in select * from public.order_items where order_id = p_order_id loop
    if r.variant_id is not null then
      update public.product_variants set stock = stock + r.quantity where id = r.variant_id;
    elsif r.is_weight_based and r.weight_grams is not null then
      update public.products
        set stock = stock + ceil(((r.weight_grams * r.quantity)::numeric / 1000))::int
        where id = r.product_id;
    else
      update public.products set stock = stock + r.quantity where id = r.product_id;
    end if;
  end loop;

  update public.orders set stock_deducted = false where id = p_order_id;
end;
$$;

revoke all on function public.apply_order_stock(uuid) from public;
revoke all on function public.restore_order_stock(uuid) from public;
grant execute on function public.apply_order_stock(uuid) to service_role;
grant execute on function public.restore_order_stock(uuid) to service_role;
grant execute on function public.generate_order_number() to service_role;
