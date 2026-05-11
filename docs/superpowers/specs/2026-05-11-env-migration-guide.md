# Env Var Migration Guide

Companion to the [Centralized Environment Config spec](./2026-05-11-centralized-env-config-design.md).

---

## Pre-deployment: vars to ADD

Add these to your `.env` / deployment secrets **before** deploying the new code.
Old vars are kept alongside — the app falls back to them automatically during the transition.

| New var | Value | Notes |
|---------|-------|-------|
| `VITE_APP_ENV` | `local` \| `development` \| `production` \| `self-hosted` | Replaces `VITE_ENVIRONMENT` + `VITE_APP_ENVIRONMENT` |
| `VITE_AUTH_ENABLED` | `true` \| `false` | Replaces `VITE_SUPABASE_ENABLED` |
| `VITE_AUTH_PROVIDER` | `supabase` \| `flexprice` | **New** — set to `supabase` for existing deployments |
| `VITE_SENTRY_ENABLED` | `true` \| `false` | Replaces implicit `isProd` gate |
| `VITE_SENTRY_DSN` | your DSN | Replaces `VITE_APP_PUBLIC_SENTRY_DSN` |
| `VITE_POSTHOG_ENABLED` | `true` \| `false` | Replaces implicit `isProd` gate |
| `VITE_POSTHOG_KEY` | your key | Replaces `VITE_APP_PUBLIC_POSTHOG_KEY` |
| `VITE_POSTHOG_HOST` | your host | Replaces `VITE_APP_PUBLIC_POSTHOG_HOST` |
| `VITE_INTERCOM_ENABLED` | `true` \| `false` | New explicit flag |
| `VITE_INTERCOM_APP_ID` | your app ID | Replaces `VITE_APP_INTERCOM_APP_ID` |
| `VITE_PADDLE_ENABLED` | `true` \| `false` | New explicit flag |

**Vars with unchanged names — no action needed:**
`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PADDLE_CLIENT_TOKEN`, `VITE_DASHBOARD_URL_INDIA`, `VITE_DASHBOARD_URL_US`, `VITE_GOOGLE_SHEETS_WEB_APP_URL`, `VITE_RESTRICTED_ENVS`

---

## Post-deployment: vars to REMOVE

Once the new code is live and stable, remove these deprecated vars from your `.env` / deployment secrets.

> **Wait at least one full release cycle before removing.** Rollbacks will fail if old vars are gone.

| Var to remove | Replaced by |
|---------------|-------------|
| `VITE_ENVIRONMENT` | `VITE_APP_ENV` |
| `VITE_APP_ENVIRONMENT` | `VITE_APP_ENV` |
| `VITE_SUPABASE_ENABLED` | `VITE_AUTH_ENABLED` |
| `VITE_APP_PUBLIC_SENTRY_DSN` | `VITE_SENTRY_DSN` |
| `VITE_APP_PUBLIC_POSTHOG_KEY` | `VITE_POSTHOG_KEY` |
| `VITE_APP_PUBLIC_POSTHOG_HOST` | `VITE_POSTHOG_HOST` |
| `VITE_APP_INTERCOM_APP_ID` | `VITE_INTERCOM_APP_ID` |

After removing the vars above, run the backward-compat cleanup (see cleanup prompt below).

---

## Cleanup prompt (run after post-deployment removal)

Once deprecated vars are removed from all environments, give this prompt to Claude Code to strip the fallback chains from `src/config/index.ts`:

```
The centralized env config (src/config/index.ts) was deployed and all deprecated env vars have
been removed from every environment. Remove all backward-compat fallback chains from the config.

Specifically:
- app.env: remove ?? import.meta.env.VITE_ENVIRONMENT and ?? import.meta.env.VITE_APP_ENVIRONMENT fallbacks
- auth.enabled: remove || import.meta.env.VITE_SUPABASE_ENABLED === 'true' fallback
- sentry.dsn: remove ?? import.meta.env.VITE_APP_PUBLIC_SENTRY_DSN fallback
- posthog.key: remove ?? import.meta.env.VITE_APP_PUBLIC_POSTHOG_KEY fallback
- posthog.host: remove ?? import.meta.env.VITE_APP_PUBLIC_POSTHOG_HOST fallback
- intercom.appId: remove ?? import.meta.env.VITE_APP_INTERCOM_APP_ID fallback

Also update .env.example: remove all deprecation comments mentioning old var names.
Update the Backward Compatibility section in docs/superpowers/specs/2026-05-11-centralized-env-config-design.md
to say "Backward compat fallbacks removed on <date>. All environments use new var names."
```
