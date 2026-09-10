# Moving Shahd Markets to your own Supabase project

Target project: `nfzcpxdwbswkigqveocw` (schema already deployed from `supabase/migrations`).
The old project stays untouched as a backup.

## 1. Environment variables

All Supabase configuration is read from environment variables — nothing is hardcoded.
See `.env.example`. Set these in your host (Vercel / Netlify / Cloudflare / Docker):

| Variable | Scope | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | `https://nfzcpxdwbswkigqveocw.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | your publishable key |
| `VITE_SUPABASE_PROJECT_ID` | client | `nfzcpxdwbswkigqveocw` |
| `SUPABASE_URL` | server | same URL |
| `SUPABASE_PUBLISHABLE_KEY` | server | same publishable key |
| `SUPABASE_PROJECT_ID` | server | `nfzcpxdwbswkigqveocw` |
| `SUPABASE_SERVICE_ROLE_KEY` | server, **secret** | Supabase Dashboard → Settings → API → `service_role` |

The service role key is required: guest carts, guest checkout, order creation,
stock apply/restore and all admin server functions use it. Never expose it to the browser.

## 2. Database grant

Run `db/new-project-setup.sql` once against the new project (see the file header).

## 3. Auth

Auth users are **not** copied. In the new project's dashboard:

- Enable Email/Password sign-in; keep email confirmation as you want it.
- Set Site URL and Redirect URLs to your new domain (needed for password reset).
- Create your admin account by signing up, then run:
  `insert into public.user_roles (user_id, role) values ('<uuid>', 'admin');`

## 4. Storage

The app does not use Supabase Storage. Product/category images are external URLs
(Unsplash or whatever you enter in the admin), and the store logo is a static file at
`public/shahd-logo.png`. No buckets or storage policies are needed.

## 5. Build & run

```
bun install    # or npm install
npm run build
npm run dev
```
