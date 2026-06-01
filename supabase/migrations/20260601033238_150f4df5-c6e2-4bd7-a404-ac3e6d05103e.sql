
-- ============== ENUM: app_role ==============
create type public.app_role as enum ('admin', 'manager', 'customer');

-- ============== PROFILES ==============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  phone text unique,
  default_address text,
  city text default 'الفيوم',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Length / format guards (server-side defense in depth)
alter table public.profiles
  add constraint profiles_full_name_len check (full_name is null or char_length(full_name) <= 120),
  add constraint profiles_username_format check (
    username is null or username ~ '^[a-zA-Z0-9_\.]{3,32}$'
  ),
  add constraint profiles_phone_format check (
    phone is null or phone ~ '^01[0-9]{9}$'
  );

create index profiles_username_lower_idx on public.profiles (lower(username));
create index profiles_phone_idx on public.profiles (phone);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

-- Trigger to keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

-- ============== USER ROLES ==============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

-- Security-definer role check (avoids recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- ============== RLS POLICIES: profiles ==============
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Admins/managers can view all profiles"
on public.profiles for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Profiles are inserted by the signup trigger (service-definer), so no INSERT policy needed.

-- ============== RLS POLICIES: user_roles ==============
create policy "Users can view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
on public.user_roles for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- ============== SIGNUP TRIGGER ==============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============== SETTINGS ==============
create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

grant select on public.settings to anon, authenticated;
grant all on public.settings to service_role;

alter table public.settings enable row level security;

create policy "Public settings readable by all"
on public.settings for select
to anon, authenticated
using (is_public = true);

create policy "Admins can read all settings"
on public.settings for select
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager'));

create policy "Admins can modify settings"
on public.settings for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create trigger settings_touch_updated_at
before update on public.settings
for each row execute function public.touch_updated_at();

-- Seed defaults
insert into public.settings (key, value, is_public, description) values
  ('store_name_ar',        '"أسواق شهد الفيوم"'::jsonb, true,  'اسم المتجر'),
  ('store_city_ar',        '"الفيوم"'::jsonb,           true,  'مدينة المتجر'),
  ('contact_phone',        '"01008336388"'::jsonb,      true,  'رقم الهاتف'),
  ('whatsapp_number',      '"01008336388"'::jsonb,      true,  'رقم واتساب'),
  ('working_hours_ar',     '"يوميًا من 9 صباحًا حتى 12 منتصف الليل"'::jsonb, true, 'مواعيد العمل'),
  ('currency',             '"EGP"'::jsonb,              true,  'العملة'),
  ('delivery_fee_egp',     '20'::jsonb,                  true,  'رسوم التوصيل'),
  ('free_delivery_threshold_egp', '300'::jsonb,         true,  'حد التوصيل المجاني'),
  ('min_order_egp',        '50'::jsonb,                  true,  'الحد الأدنى للطلب')
on conflict (key) do nothing;
