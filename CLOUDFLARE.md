# Cloudflare Pages Deployment

This project is configured for **Cloudflare Pages**, not a standalone
Cloudflare Workers deployment.

## Why `wrangler deploy` failed

`wrangler deploy` is the Workers deploy command. It expects a Worker `main`
entry point or a Workers `[assets]` directory. This app uses the Pages output
from the TanStack Start/Nitro build, so the correct command is
`wrangler pages deploy`.

Do **not** set a Cloudflare deploy command to `wrangler deploy` for this repo.
That command causes the warning/error shown in the failed deployment log:

- warning that a Pages project is being deployed with `wrangler deploy`
- missing Worker entry-point or assets directory

## GitHub-connected Cloudflare Pages settings

Use these settings in the Cloudflare Pages dashboard:

- Framework preset: `None` / custom
- Build command: `bun run build`
- Build output directory: `.output/public`
- Deploy command: leave blank / do not use `wrangler deploy`

Cloudflare Pages deploys the build output automatically after the build step.
No VPS, cPanel, InfinityFree, or traditional hosting is required.

## Manual CLI deployment

After configuring the Cloudflare Pages project and environment variables, run:

```bash
bun run deploy:cloudflare
```

The script builds the app and then runs:

```bash
bunx wrangler pages deploy .output/public --project-name shahd-markets
```

## Required environment variables

Configure these in Cloudflare Pages project settings. Use production values,
not placeholders.

| Variable | Secret? | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | No | Browser/SSR Supabase project URL. |
| `VITE_SUPABASE_PROJECT_ID` | No | Supabase project ref/id used by generated metadata. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | No | Browser Supabase anon/publishable key. |
| `SUPABASE_URL` | No | Runtime Supabase URL for Pages server functions. |
| `SUPABASE_PUBLISHABLE_KEY` | No | Runtime anon/publishable key for JWT validation in server functions. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key for trusted server-side admin operations. Never expose as `VITE_`. |

For CLI configuration of the service-role secret:

```bash
bunx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name shahd-markets
```

## Wrangler configuration notes

`wrangler.toml` intentionally uses `pages_build_output_dir` only. It does not
include a Workers `main` entry or Workers `[assets]` block because adding those
would convert the deployment target to a Workers-style deployment and can
recreate the same Pages/Workers mismatch.
