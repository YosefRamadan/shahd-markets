# PHP + MySQL Migration Plan

## New architecture
The migrated app is a PHP 8+ MVC-style application with no build step. `index.php` bootstraps configuration, sessions, helpers and a small router. Controllers orchestrate requests, models use PDO prepared statements, and views render Bootstrap 5 RTL templates.

## Folder structure
- `index.php`: front controller and route table.
- `.htaccess`: Apache rewrites and upload/PHP hardening.
- `config/`: database, app constants and bootstrap.
- `controllers/`: storefront, auth, cart, checkout, account and admin controllers.
- `models/`: PDO-backed data models.
- `views/`: layouts and pages.
- `middleware/`: authentication/authorization helpers.
- `helpers/`: escaping, CSRF, upload, formatting and redirect helpers.
- `admin/`: compatibility entry for `/admin` on shared hosts.
- `uploads/`: local image storage for products/categories/users.
- `assets/`: Bootstrap-facing custom CSS and vanilla JS.
- `database/`: MySQL schema and seed data.

## Database schema
MySQL uses UTF8MB4 everywhere for Arabic. The schema includes users, admins, categories, products, product images, variants, cart items, orders, order items, settings, inventory and password resets. Numeric prices are `DECIMAL(10,2)`. Foreign keys use InnoDB.

## Authentication replacement
Supabase Auth is replaced with PHP sessions, `password_hash()`, `password_verify()`, remember-me tokens, CSRF checks, password reset tokens and role checks (`customer`, `manager`, `admin`). Session IDs regenerate on login/logout.

## Storage replacement
Supabase Storage URLs are replaced with local uploads under `uploads/products`, `uploads/categories` and `uploads/users`. Upload helper validates size, MIME type and extension, then writes random unique filenames.

## Routing strategy
Apache rewrites all non-file requests to `index.php`. The PHP router matches `GET`/`POST` methods and path patterns, including `/products/{slug}`, `/categories/{slug}`, `/orders/{id}` and admin routes. The `admin/index.php` file delegates to the front controller for shared hosting compatibility.
