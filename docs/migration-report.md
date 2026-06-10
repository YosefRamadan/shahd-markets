# Shahd Markets Migration Report

## Current architecture
The existing app is a React + TypeScript single-page/storefront application using TanStack Router/Start, Vite-era tooling, shadcn/ui-style components, Tailwind CSS, Supabase Auth, Supabase Postgres and Supabase Storage-style public image URLs.

## Routes/pages to migrate
- `/` home: hero, benefits, category grid, featured products.
- `/categories`: all active categories.
- `/categories/$slug`: products filtered by category.
- `/products/$slug`: product details, variants, weight-based price choices, add-to-cart.
- `/cart`: cart listing, quantity updates, removals, totals.
- `/checkout`: customer/address form and order creation.
- `/orders/$id`: order confirmation/details.
- `/account`, `/account/orders`: authenticated profile and order history.
- `/login`, `/register`, `/forgot-password`, `/reset-password`: customer authentication flows.
- `/admin/login`, `/admin`: staff authentication and dashboard.
- `/admin/products`, `/admin/products/$id`: product CRUD and inventory-facing editing.
- `/admin/categories`: category CRUD.
- `/admin/orders`, `/admin/orders/$id`, `/admin/orders/$id/invoice`: order management and invoice.
- `/admin/inventory`: low-stock and stock management.
- `/admin/settings`: public store settings.

## Components and UI behavior
- Site shell: RTL Arabic header, footer, mobile nav, logo, theme/contact affordances, WhatsApp floating action.
- Product cards: image, Arabic name, dynamic display price, stock state and category/product links.
- Admin frame: protected RTL admin navigation and stat cards/tables/forms.
- UI widgets: buttons, cards, tables, badges, forms, dialogs, alerts and responsive grid layouts.

## Authentication flows
- Supabase customer signup/sign-in creates auth user, profile and `customer` role.
- Admin route checks Supabase JWT and `user_roles` for `admin` or `manager`.
- Password reset is Supabase email/token based.
- Cart can be anonymous via cookie/session id or user-owned via auth user id.

## Database interactions and business logic
- `profiles`, `user_roles`, `settings` hold users, roles and public store configuration.
- `categories`, `products`, `product_variants` hold catalog data.
- `carts`, `cart_items` hold anonymous/authenticated carts.
- `orders`, `order_items` snapshot checkout data and line item prices.
- Order numbers use `SH-YYMMDD-XXXX`.
- Stock is deducted when orders are created/accepted and restored if cancelled.
- Weight-based products support gram choices and price-per-kg calculation.
- Variant products use variant price/stock instead of base product price.
- Delivery fee, minimum order, phones, WhatsApp, working hours and store naming come from settings.

## Supabase usage to remove
- Supabase browser client for public catalog queries.
- Supabase admin/server client for cart, checkout, order and admin operations.
- Supabase Auth JWT claims, signup, login and password reset.
- Supabase Postgres functions/triggers/RLS policies.
- Supabase migration files and generated TypeScript types.

## Admin features to preserve
- Dashboard revenue/orders/customers/low-stock metrics.
- Products CRUD including active state, weight options, per-kg pricing, images and variants.
- Categories CRUD with sorting, active state and images.
- Orders list/detail/status updates, notes and invoices.
- Inventory/low-stock adjustments.
- Users and roles management.
- Public settings management.

## User features to preserve
- Arabic RTL storefront, responsive UX and Bootstrap equivalent styling.
- Browse categories/products and product details.
- Add product, variant or weight-based lines to cart.
- Checkout with name, phone, address, city and notes.
- View order details and account order history.
- Register/login/logout/remember me/password reset.
