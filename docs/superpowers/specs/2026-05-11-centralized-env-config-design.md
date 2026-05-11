# Centralized Environment Config

**Date:** 2026-05-11
**Status:** Approved

## Problem

`import.meta.env` reads are scattered across ~20 files. Two overlapping env vars (`VITE_ENVIRONMENT`, `VITE_APP_ENVIRONMENT`) represent the same concept with different value sets. The same var (e.g. `VITE_API_URL`) is read independently in 9+ connector drawers. No single place to see what env vars the app needs.

## Goal

All `import.meta.env` access consolidated into `src/config/index.ts`. Every caller imports `config` instead of reading env vars directly. Backward-compatible — existing `.env` files continue to work unchanged.

---

## Config Module

**File:** `src/config/index.ts`

### Enums

```ts
export enum APP_ENV {
  Local       = 'local',
  Development = 'development',
  Production  = 'production',
  SelfHosted  = 'self-hosted',
}

export enum AUTH_PROVIDER {
  Flexprice = 'flexprice',
  Supabase  = 'supabase',
}
```

### Interfaces

One named interface per domain — keeps the top-level `Config` interface readable and allows consumers to import only the slice they need.

```ts
interface AppConfig          { env: APP_ENV; isProd: boolean }
interface ApiConfig          { baseUrl: string }
interface AuthConfig         { enabled: boolean; provider: AUTH_PROVIDER; url: string; anonKey: string }
interface SentryConfig       { enabled: boolean; dsn: string }
interface PosthogConfig      { enabled: boolean; key: string; host: string }
interface PaddleConfig       { enabled: boolean; clientToken: string }
interface IntercomConfig     { enabled: boolean; appId: string }
interface RegionConfig       { indiaUrl: string; usUrl: string }
interface IntegrationsConfig { googleSheetsWebAppUrl: string }
interface RestrictionsConfig { rawEnvs: string }

export interface Config {
  app:          AppConfig;
  api:          ApiConfig;
  auth:         AuthConfig;
  sentry:       SentryConfig;
  posthog:      PosthogConfig;
  paddle:       PaddleConfig;
  intercom:     IntercomConfig;
  region:       RegionConfig;
  integrations: IntegrationsConfig;
  restrictions: RestrictionsConfig;
}
```

### Config object

New var names are read first; old names are fallbacks for backward compatibility.

```ts
export const config: Config = {
  app: {
    env: (
      import.meta.env.VITE_APP_ENV ??
      import.meta.env.VITE_ENVIRONMENT ??
      import.meta.env.VITE_APP_ENVIRONMENT ??
      APP_ENV.Local
    ) as APP_ENV,
    get isProd() { return this.env === APP_ENV.Production; },
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1',
  },
  auth: {
    enabled:  import.meta.env.VITE_AUTH_ENABLED === 'true' ||
              import.meta.env.VITE_SUPABASE_ENABLED === 'true',  // old fallback
    provider: (
      import.meta.env.VITE_AUTH_PROVIDER ??
      AUTH_PROVIDER.Supabase
    ) as AUTH_PROVIDER,
    url:     import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
  sentry: {
    enabled: import.meta.env.VITE_SENTRY_ENABLED === 'true',
    dsn:     import.meta.env.VITE_SENTRY_DSN ??
             import.meta.env.VITE_APP_PUBLIC_SENTRY_DSN ?? '',
  },
  posthog: {
    enabled: import.meta.env.VITE_POSTHOG_ENABLED === 'true',
    key:     import.meta.env.VITE_POSTHOG_KEY ??
             import.meta.env.VITE_APP_PUBLIC_POSTHOG_KEY ?? '',
    host:    import.meta.env.VITE_POSTHOG_HOST ??
             import.meta.env.VITE_APP_PUBLIC_POSTHOG_HOST ?? '',
  },
  paddle: {
    enabled:     import.meta.env.VITE_PADDLE_ENABLED === 'true',
    clientToken: import.meta.env.VITE_PADDLE_CLIENT_TOKEN ?? '',
  },
  intercom: {
    enabled: import.meta.env.VITE_INTERCOM_ENABLED === 'true',
    appId:   import.meta.env.VITE_INTERCOM_APP_ID ??
             import.meta.env.VITE_APP_INTERCOM_APP_ID ?? '',
  },
  region: {
    indiaUrl: import.meta.env.VITE_DASHBOARD_URL_INDIA ?? '',
    usUrl:    import.meta.env.VITE_DASHBOARD_URL_US ?? '',
  },
  integrations: {
    googleSheetsWebAppUrl: import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL ?? '',
  },
  restrictions: {
    rawEnvs: import.meta.env.VITE_RESTRICTED_ENVS ?? '',
  },
};
```

### Auth provider usage

Callers use `config.auth.provider` to branch auth UI:

```ts
// example — login page
if (config.auth.provider === AUTH_PROVIDER.Supabase) {
  // render Supabase login
} else {
  // render Flexprice-native login
}
```

`config.auth.url` and `config.auth.anonKey` are only meaningful when `provider === AUTH_PROVIDER.Supabase`. The self-hosted mock-client guard in `src/core/services/supbase/config.ts` changes from `NODE_ENV === NodeEnv.SELF_HOSTED` to `config.app.env === APP_ENV.SelfHosted`.

---

## Call-site Migration

| File | Change |
|------|--------|
| `src/core/axios/config.ts` | `import.meta.env.VITE_API_URL` → `config.api.baseUrl` |
| `src/api/InvoiceApi.ts` | `import.meta.env.VITE_API_URL` → `config.api.baseUrl` |
| `src/api/OnboardingApi.ts` | `import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL` → `config.integrations.googleSheetsWebAppUrl` |
| `src/core/services/supbase/config.ts` | All `VITE_SUPABASE_*` → `config.auth.*`; self-hosted guard → `config.app.env === APP_ENV.SelfHosted` |
| `src/core/services/sentry/SentryProvider.tsx` | `isProd` check + DSN → `config.sentry.enabled` + `config.sentry.dsn` |
| `src/core/services/posthog/PosthogProvider.tsx` | `isProd` check + key/host → `config.posthog.enabled` + key/host |
| `src/core/services/error/ErrorLoggingService.ts` | `import.meta.env.VITE_APP_ENVIRONMENT === NodeEnv.PROD` → `config.app.isProd` |
| `src/core/paddle/PaddleProvider.tsx` | Token + isProd → `config.paddle.enabled` + `config.paddle.clientToken` |
| `src/utils/region/regionUtils.ts` | `VITE_DASHBOARD_URL_*` → `config.region.*` |
| `src/hooks/useRestrictedEnvs.ts` | `VITE_RESTRICTED_ENVS` → `config.restrictions.rawEnvs` |
| `src/layouts/MainLayout.tsx` | `VITE_APP_ENVIRONMENT` → `config.app.env` |
| 9 connector drawers (`Stripe`, `HubSpot`, `Razorpay`, `Moyasar`, `Nomod`, `Paddle`, `QuickBooks`, `ZohoBooks`, `Chargebee`) | `import.meta.env.VITE_API_URL` → `config.api.baseUrl` |
| `src/types/common/Environment.ts` | **Deleted** — `NodeEnv` enum and `NODE_ENV` export replaced by `APP_ENV` + `config.app.env` |

---

## `.env.example` Updates

```bash
# App Environment (local | development | production | self-hosted)
# Replaces: VITE_ENVIRONMENT, VITE_APP_ENVIRONMENT (deprecated — still work as fallbacks)
VITE_APP_ENV=local

# API
VITE_API_URL=http://localhost:8080/v1

# Auth
VITE_AUTH_ENABLED=false
VITE_AUTH_PROVIDER=supabase              # flexprice | supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
# Note: VITE_SUPABASE_ENABLED deprecated — use VITE_AUTH_ENABLED

# Sentry — replaces VITE_APP_PUBLIC_SENTRY_DSN (deprecated, still works as fallback)
VITE_SENTRY_ENABLED=false
VITE_SENTRY_DSN=your-sentry-dsn-here

# PostHog — replaces VITE_APP_PUBLIC_POSTHOG_KEY/HOST (deprecated, still work as fallbacks)
VITE_POSTHOG_ENABLED=false
VITE_POSTHOG_KEY=your-posthog-key-here
VITE_POSTHOG_HOST=https://app.posthog.com

# Paddle
VITE_PADDLE_ENABLED=false
VITE_PADDLE_CLIENT_TOKEN=your-paddle-token-here

# Intercom — replaces VITE_APP_INTERCOM_APP_ID (deprecated, still works as fallback)
VITE_INTERCOM_ENABLED=false
VITE_INTERCOM_APP_ID=your-intercom-app-id-here

# Region URLs
VITE_DASHBOARD_URL_INDIA=
VITE_DASHBOARD_URL_US=

# Integrations
VITE_GOOGLE_SHEETS_WEB_APP_URL=

# Restricted Envs (JSON: { [tenant_id]: { [env_id]: ISO date | "suspended" } })
VITE_RESTRICTED_ENVS=
```

---

## Backward Compatibility

Existing `.env` files require **no changes**. The config reads new var names first and falls back to old names:

| New name | Old fallback(s) |
|----------|----------------|
| `VITE_APP_ENV` | `VITE_ENVIRONMENT`, `VITE_APP_ENVIRONMENT` |
| `VITE_AUTH_ENABLED` | `VITE_SUPABASE_ENABLED` |
| `VITE_SENTRY_DSN` | `VITE_APP_PUBLIC_SENTRY_DSN` |
| `VITE_POSTHOG_KEY` | `VITE_APP_PUBLIC_POSTHOG_KEY` |
| `VITE_POSTHOG_HOST` | `VITE_APP_PUBLIC_POSTHOG_HOST` |
| `VITE_INTERCOM_APP_ID` | `VITE_APP_INTERCOM_APP_ID` |

All other var names are unchanged (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`, `VITE_PADDLE_CLIENT_TOKEN`, `VITE_DASHBOARD_URL_*`, `VITE_GOOGLE_SHEETS_WEB_APP_URL`, `VITE_RESTRICTED_ENVS`).

---

## Files Changed Summary

- **Created:** `src/config/index.ts`
- **Deleted:** `src/types/common/Environment.ts`
- **Modified:** 15 files (see migration table above) + `.env.example`
- **No new dependencies**
