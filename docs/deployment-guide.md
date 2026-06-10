# InfinityFree Deployment Guide

## Requirements
- InfinityFree hosting account with PHP 8+ enabled.
- MySQL database from the InfinityFree control panel.
- No Node.js, npm, Vite, Docker, Vercel or Supabase is required.

## Upload
1. Upload the repository files to `htdocs`.
2. Keep `index.php`, `.htaccess`, `config`, `controllers`, `models`, `views`, `helpers`, `middleware`, `assets`, `uploads` and `database/schema.sql`.
3. Ensure `uploads/products`, `uploads/categories` and `uploads/users` are writable by PHP.

## Database
1. Create a MySQL database in InfinityFree.
2. Open phpMyAdmin.
3. Import `database/schema.sql`.
4. Confirm tables use `utf8mb4_unicode_ci`.

## Configuration
Edit `config/config.php`:

```php
'db' => [
  'host' => 'sqlXXX.infinityfree.com',
  'database' => 'if0_XXXX_shahd',
  'username' => 'if0_XXXX',
  'password' => 'YOUR_PASSWORD',
  'charset' => 'utf8mb4',
],
```

Set `app.base_url` only if the app is installed in a subfolder. Leave it empty for domain root.

## Admin credentials setup
Recommended: create the first admin manually in phpMyAdmin after importing the schema.

1. Generate a password hash using any PHP 8 environment:
   ```php
   echo password_hash('CHANGE_THIS_PASSWORD', PASSWORD_DEFAULT);
   ```
2. Insert the admin user:
   ```sql
   INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
   VALUES ('مدير المتجر', 'admin@example.com', '01000000000', 'PASTE_HASH_HERE', 'admin', 1);
   INSERT INTO admins (user_id) VALUES (LAST_INSERT_ID());
   ```
3. Visit `/admin/login` and sign in.

For local setup with CLI PHP, you may run:

```bash
php database/create_admin.php "مدير المتجر" admin@example.com "CHANGE_THIS_PASSWORD" 01000000000
```

Delete `database/create_admin.php` after use on any production copy if you uploaded it.

## Production readiness checklist
- [ ] Database credentials changed in `config/config.php`.
- [ ] `database/schema.sql` imported successfully.
- [ ] First admin account created and password stored securely.
- [ ] `uploads/*` directories writable and directory listing disabled.
- [ ] HTTPS enabled in hosting panel.
- [ ] Store settings updated from `/admin/settings`.
- [ ] Default seed categories/products replaced or extended.
- [ ] Test registration, login, cart, checkout, admin order status and uploads.

## Removed Supabase/Node dependencies
The PHP app does not use:
- React
- TypeScript
- Vite
- TanStack Router/Start
- Supabase Auth
- Supabase Database/RLS/functions
- Supabase Storage
- npm/bun/wrangler/cloudflare deployment tooling
