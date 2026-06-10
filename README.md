# Shahd Markets PHP/MySQL

Shahd Markets is now a production-ready PHP 8 + MySQL storefront designed for InfinityFree shared hosting. It uses Bootstrap 5 RTL, vanilla JavaScript, PDO prepared statements, PHP sessions, local uploads and a small MVC-style structure.

## Quick deployment
1. Upload files to InfinityFree `htdocs`.
2. Create a MySQL database.
3. Import `database/schema.sql` in phpMyAdmin.
4. Edit `config/config.php` with your database credentials.
5. Create the first admin user using the instructions in `docs/deployment-guide.md`.
6. Visit the site and `/admin/login`.

## Key folders
- `controllers/` request handlers.
- `models/` PDO data access and business logic.
- `views/` Bootstrap RTL PHP templates.
- `database/schema.sql` MySQL schema and seed data.
- `uploads/` local file storage.
- `docs/` migration report, migration plan and deployment guide.
