# Centralized Environment Config — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all scattered `import.meta.env` reads with a single typed `config` object exported from `src/config/index.ts`.

**Architecture:** Create `src/config/index.ts` with domain-scoped interfaces and a single `config` export. All 20 call-site files are migrated to import `config` instead. `src/types/common/Environment.ts` (old `NodeEnv` enum) is deleted and its consumers updated. Backward-compat fallback chains keep existing `.env` files working unchanged.

**Tech Stack:** TypeScript, Vite (`import.meta.env`), Vitest (`vi.stubEnv`, `vi.resetModules`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `src/config/index.ts` | Single source of truth for all env vars |
| **Create** | `src/config/index.test.ts` | Tests for fallback logic and `isProd` |
| **Delete** | `src/types/common/Environment.ts` | Old `NodeEnv` enum — replaced by `APP_ENV` |
| **Modify** | `src/types/common/index.ts` | Remove `NodeEnv`/`NODE_ENV` barrel export |
| **Modify** | `src/main.tsx` | `NODE_ENV === NodeEnv.PROD` → `config.app.isProd` |
| **Modify** | `src/core/auth/AuthService.ts` | `NODE_ENV != NodeEnv.SELF_HOSTED` → `config.app.env !== APP_ENV.SelfHosted` |
| **Modify** | `src/core/axios/config.ts` | `import.meta.env.VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/core/services/supbase/config.ts` | All `VITE_SUPABASE_*` + self-hosted guard → `config.auth.*` |
| **Modify** | `src/core/services/sentry/SentryProvider.tsx` | `isProd` + DSN → `config.sentry.enabled` + `config.sentry.dsn` |
| **Modify** | `src/core/services/posthog/PosthogProvider.tsx` | `isProd` + key/host → `config.posthog.enabled` + `config.posthog.*` |
| **Modify** | `src/core/paddle/PaddleProvider.tsx` | `VITE_PADDLE_CLIENT_TOKEN` + isProd → `config.paddle.*` |
| **Modify** | `src/core/services/error/ErrorLoggingService.ts` | `VITE_APP_ENVIRONMENT === NodeEnv.PROD` → `config.app.isProd` |
| **Modify** | `src/utils/common/Logger.ts` | `NodeEnv[]` array → `APP_ENV[]`; `NODE_ENV` → `config.app.env` |
| **Modify** | `src/hooks/useVersionCheck.tsx` | `NODE_ENV === NodeEnv.PROD` → `config.app.isProd` |
| **Modify** | `src/components/atoms/ErrorBoundary/ErrorBoundary.tsx` | `NODE_ENV === NodeEnv.PROD` → `config.app.isProd` |
| **Modify** | `src/pages/auth/LoginForm.tsx` | `NODE_ENV != NodeEnv.SELF_HOSTED` → `config.app.env !== APP_ENV.SelfHosted` |
| **Modify** | `src/pages/auth/SignupForm.tsx` | `NODE_ENV != NodeEnv.SELF_HOSTED` → `config.app.env !== APP_ENV.SelfHosted` |
| **Modify** | `src/api/InvoiceApi.ts` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/api/OnboardingApi.ts` | `VITE_GOOGLE_SHEETS_WEB_APP_URL` → `config.integrations.googleSheetsWebAppUrl` |
| **Modify** | `src/utils/region/regionUtils.ts` | `VITE_DASHBOARD_URL_*` → `config.region.*` |
| **Modify** | `src/hooks/useRestrictedEnvs.ts` | `VITE_RESTRICTED_ENVS` → `config.restrictions.rawEnvs` |
| **Modify** | `src/layouts/MainLayout.tsx` | `VITE_APP_ENVIRONMENT === 'prod'` → `config.app.isProd` |
| **Modify** | `src/components/molecules/StripeConnectionDrawer/StripeConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/components/molecules/HubSpotConnectionDrawer/HubSpotConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/components/molecules/RazorpayConnectionDrawer/RazorpayConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/components/molecules/NomodConnectionDrawer/NomodConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `src/components/molecules/ChargebeeConnectionDrawer/ChargebeeConnectionDrawer.tsx` | `VITE_API_URL` → `config.api.baseUrl` |
| **Modify** | `.env.example` | Document new vars; mark deprecated vars with fallback note |

---

## Task 1: Create `src/config/index.ts` with tests

**Files:**
- Create: `src/config/index.ts`
- Create: `src/config/index.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/config/index.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe('app.env — fallback chain', () => {
    it('uses VITE_APP_ENV when set', async () => {
      vi.stubEnv('VITE_APP_ENV', 'production');
      const { config } = await import('./index');
      expect(config.app.env).toBe('production');
    });

    it('normalizes legacy "prod" value to production', async () => {
      vi.stubEnv('VITE_APP_ENVIRONMENT', 'prod');
      const { config } = await import('./index');
      expect(config.app.env).toBe('production');
    });

    it('normalizes legacy "dev" value to development', async () => {
      vi.stubEnv('VITE_APP_ENVIRONMENT', 'dev');
      const { config } = await import('./index');
      expect(config.app.env).toBe('development');
    });

    it('falls back to VITE_ENVIRONMENT when VITE_APP_ENV not set', async () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'self-hosted');
      const { config } = await import('./index');
      expect(config.app.env).toBe('self-hosted');
    });

    it('defaults to local when no var set', async () => {
      const { config } = await import('./index');
      expect(config.app.env).toBe('local');
    });
  });

  describe('app.isProd', () => {
    it('returns true when env is production', async () => {
      vi.stubEnv('VITE_APP_ENV', 'production');
      const { config } = await import('./index');
      expect(config.app.isProd).toBe(true);
    });

    it('returns false when env is not production', async () => {
      vi.stubEnv('VITE_APP_ENV', 'development');
      const { config } = await import('./index');
      expect(config.app.isProd).toBe(false);
    });
  });

  describe('auth.enabled fallback', () => {
    it('reads VITE_AUTH_ENABLED', async () => {
      vi.stubEnv('VITE_AUTH_ENABLED', 'true');
      const { config } = await import('./index');
      expect(config.auth.enabled).toBe(true);
    });

    it('falls back to VITE_SUPABASE_ENABLED', async () => {
      vi.stubEnv('VITE_SUPABASE_ENABLED', 'true');
      const { config } = await import('./index');
      expect(config.auth.enabled).toBe(true);
    });

    it('defaults to false', async () => {
      const { config } = await import('./index');
      expect(config.auth.enabled).toBe(false);
    });
  });

  describe('auth.provider', () => {
    it('defaults to supabase', async () => {
      const { config } = await import('./index');
      expect(config.auth.provider).toBe('supabase');
    });

    it('reads VITE_AUTH_PROVIDER', async () => {
      vi.stubEnv('VITE_AUTH_PROVIDER', 'flexprice');
      const { config } = await import('./index');
      expect(config.auth.provider).toBe('flexprice');
    });
  });

  describe('sentry.dsn fallback', () => {
    it('prefers VITE_SENTRY_DSN over legacy var', async () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'new-dsn');
      vi.stubEnv('VITE_APP_PUBLIC_SENTRY_DSN', 'old-dsn');
      const { config } = await import('./index');
      expect(config.sentry.dsn).toBe('new-dsn');
    });

    it('falls back to VITE_APP_PUBLIC_SENTRY_DSN', async () => {
      vi.stubEnv('VITE_APP_PUBLIC_SENTRY_DSN', 'old-dsn');
      const { config } = await import('./index');
      expect(config.sentry.dsn).toBe('old-dsn');
    });
  });

  describe('posthog fallbacks', () => {
    it('prefers VITE_POSTHOG_KEY over legacy var', async () => {
      vi.stubEnv('VITE_POSTHOG_KEY', 'new-key');
      vi.stubEnv('VITE_APP_PUBLIC_POSTHOG_KEY', 'old-key');
      const { config } = await import('./index');
      expect(config.posthog.key).toBe('new-key');
    });

    it('falls back to VITE_APP_PUBLIC_POSTHOG_KEY', async () => {
      vi.stubEnv('VITE_APP_PUBLIC_POSTHOG_KEY', 'old-key');
      const { config } = await import('./index');
      expect(config.posthog.key).toBe('old-key');
    });
  });

  describe('intercom.appId fallback', () => {
    it('falls back to VITE_APP_INTERCOM_APP_ID', async () => {
      vi.stubEnv('VITE_APP_INTERCOM_APP_ID', 'old-id');
      const { config } = await import('./index');
      expect(config.intercom.appId).toBe('old-id');
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/config/index.test.ts
```

Expected: FAIL — "Cannot find module './index'"

- [ ] **Step 3: Implement `src/config/index.ts`**

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

function parseAppEnv(): APP_ENV {
  const raw =
    import.meta.env.VITE_APP_ENV ??
    import.meta.env.VITE_ENVIRONMENT ??
    import.meta.env.VITE_APP_ENVIRONMENT;

  if (!raw) return APP_ENV.Local;
  if (raw === 'prod') return APP_ENV.Production;
  if (raw === 'dev') return APP_ENV.Development;
  return raw as APP_ENV;
}

const appEnv = parseAppEnv();

export const config: Config = {
  app: {
    env: appEnv,
    get isProd() { return this.env === APP_ENV.Production; },
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1',
  },
  auth: {
    enabled:  import.meta.env.VITE_AUTH_ENABLED === 'true' ||
              import.meta.env.VITE_SUPABASE_ENABLED === 'true',
    provider: (import.meta.env.VITE_AUTH_PROVIDER ?? AUTH_PROVIDER.Supabase) as AUTH_PROVIDER,
    url:      import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey:  import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
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

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/config/index.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/index.ts src/config/index.test.ts
git commit -m "feat(config): add centralized env config module with typed Config object"
```

---

## Task 2: Remove `src/types/common/Environment.ts` and update the barrel

**Files:**
- Delete: `src/types/common/Environment.ts`
- Modify: `src/types/common/index.ts`

- [ ] **Step 1: Remove the barrel export**

In `src/types/common/index.ts`, delete this line:

```ts
// Environment types
export { NodeEnv, NODE_ENV } from './Environment';
```

- [ ] **Step 2: Delete the file**

```bash
rm src/types/common/Environment.ts
```

- [ ] **Step 3: Verify TypeScript finds all broken imports**

```bash
npx tsc --noEmit 2>&1 | grep "NodeEnv\|NODE_ENV\|Environment"
```

Expected: A list of files with broken `NodeEnv`/`NODE_ENV` imports — these are all fixed in subsequent tasks. The errors are expected now; they confirm which files need updating.

- [ ] **Step 4: Commit the barrel change and deletion**

```bash
git add src/types/common/index.ts src/types/common/Environment.ts
git commit -m "refactor(config): remove NodeEnv/NODE_ENV — replaced by APP_ENV in src/config"
```

---

## Task 3: Migrate `src/main.tsx` and `src/core/auth/AuthService.ts`

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/core/auth/AuthService.ts`

- [ ] **Step 1: Update `src/main.tsx`**

Replace:
```ts
import { NODE_ENV, NodeEnv } from './types/index.ts';

const isProd = NODE_ENV === NodeEnv.PROD;
```

With:
```ts
import { config } from './config';
```

And replace the `isProd` usage in the render:
```tsx
{isProd ? (
```
with:
```tsx
{config.app.isProd ? (
```

The full updated file:
```tsx
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import PosthogProvider from './core/services/posthog/PosthogProvider.tsx';
import SentryProvider from './core/services/sentry/SentryProvider.tsx';
import VercelSpeedInsights from './core/services/vercel/vercel.tsx';
import { config } from './config';
import { registerWebMCPTools } from './agent/webmcp.ts';

registerWebMCPTools();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <div>
    {config.app.isProd ? (
      <SentryProvider>
        <PosthogProvider>
          <App />
          <VercelSpeedInsights />
        </PosthogProvider>
      </SentryProvider>
    ) : (
      <App />
    )}
  </div>,
);
```

- [ ] **Step 2: Update `src/core/auth/AuthService.ts`**

Replace:
```ts
import { NODE_ENV, NodeEnv } from '@/types';
```
With:
```ts
import { config, APP_ENV } from '@/config';
```

Replace all three occurrences of:
```ts
if (NODE_ENV != NodeEnv.SELF_HOSTED) {
```
With:
```ts
if (config.app.env !== APP_ENV.SelfHosted) {
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "AuthService\|main.tsx"
```

Expected: No errors for these two files.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx src/core/auth/AuthService.ts
git commit -m "refactor(config): migrate main.tsx and AuthService to use config"
```

---

## Task 4: Migrate `src/core/axios/config.ts`

**Files:**
- Modify: `src/core/axios/config.ts`

- [ ] **Step 1: Update the file**

Replace:
```ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```
With:
```ts
import { config } from '@/config';
```
(add this import at the top of the file, alongside the existing imports)

And replace the `axiosClient` creation:
```ts
const axiosClient: AxiosInstance = axios.create({
  baseURL: API_URL,
```
With:
```ts
const axiosClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
```

Remove the now-unused `API_URL` const line entirely.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "axios/config"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/axios/config.ts
git commit -m "refactor(config): migrate axios baseURL to config.api.baseUrl"
```

---

## Task 5: Migrate `src/core/services/supbase/config.ts`

**Files:**
- Modify: `src/core/services/supbase/config.ts`

- [ ] **Step 1: Update the file**

Replace the entire file content with:

```ts
import { config, APP_ENV } from '@/config';
import { createClient } from '@supabase/supabase-js';

const isSelfHosted = config.app.env === APP_ENV.SelfHosted;

const createMockClient = () => {
  return {
    auth: {
      signIn: async () => ({ user: null, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: null, error: null }),
      getSession: async () => ({ data: null, error: null }),
    },
    from: () => ({
      select: async () => [],
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    }),
  };
};

const supabase = isSelfHosted
  ? (createMockClient() as any)
  : createClient(config.auth.url, config.auth.anonKey);

export default supabase;
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "supbase"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/services/supbase/config.ts
git commit -m "refactor(config): migrate supabase config to config.auth"
```

---

## Task 6: Migrate Sentry and PostHog providers

**Files:**
- Modify: `src/core/services/sentry/SentryProvider.tsx`
- Modify: `src/core/services/posthog/PosthogProvider.tsx`

- [ ] **Step 1: Update `SentryProvider.tsx`**

Replace the entire file content with:

```tsx
import React from 'react';
import * as Sentry from '@sentry/react';
import { config } from '@/config';

interface Props {
  children: React.ReactNode;
}

if (config.sentry.enabled) {
  Sentry.init({
    dsn: config.sentry.dsn,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

const SentryProvider = ({ children }: Props) => {
  return <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>{children}</Sentry.ErrorBoundary>;
};

export default SentryProvider;
```

- [ ] **Step 2: Update `PosthogProvider.tsx`**

Replace the entire file content with:

```tsx
import React, { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import PosthogErrorBoundary from './PosthogErrorBoundary';
import { config } from '@/config';

interface Props {
  children: ReactNode;
}

if (config.posthog.enabled) {
  posthog.init(config.posthog.key, {
    api_host: config.posthog.host,
    capture_pageview: true,
  });

  posthog.sessionRecording?.startIfEnabledOrStop();
}

const PosthogWrapper: React.FC<Props> = ({ children }) => {
  if (config.posthog.enabled) {
    return (
      <PostHogProvider client={posthog}>
        <PosthogErrorBoundary>{children}</PosthogErrorBoundary>
      </PostHogProvider>
    );
  }
  return <>{children}</>;
};

export default PosthogWrapper;
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "SentryProvider\|PosthogProvider"
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/core/services/sentry/SentryProvider.tsx src/core/services/posthog/PosthogProvider.tsx
git commit -m "refactor(config): migrate Sentry and PostHog providers to config"
```

---

## Task 7: Migrate Paddle provider and ErrorLoggingService

**Files:**
- Modify: `src/core/paddle/PaddleProvider.tsx`
- Modify: `src/core/services/error/ErrorLoggingService.ts`

- [ ] **Step 1: Update `PaddleProvider.tsx`**

Remove:
```ts
const PADDLE_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
```

Add at the top (with other imports):
```ts
import { config } from '@/config';
```

Replace all three uses of `PADDLE_TOKEN` in the file with `config.paddle.clientToken`:

```tsx
// line 38 — guard
if (!config.paddle.clientToken || initialized.current) return;

// line 47 — sandbox detection
Paddle.Environment.set(config.paddle.clientToken.startsWith('test_') ? 'sandbox' : 'production');

// line 49 — initialize
Paddle.Initialize({
  token: config.paddle.clientToken,
```

- [ ] **Step 2: Update `ErrorLoggingService.ts`**

Remove:
```ts
import { NodeEnv } from '@/types';
```

Add at the top:
```ts
import { config } from '@/config';
```

Replace:
```ts
private isProd = import.meta.env.VITE_APP_ENVIRONMENT === NodeEnv.PROD;
```
With:
```ts
private get isProd() { return config.app.isProd; }
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "PaddleProvider\|ErrorLoggingService"
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/core/paddle/PaddleProvider.tsx src/core/services/error/ErrorLoggingService.ts
git commit -m "refactor(config): migrate Paddle provider and ErrorLoggingService to config"
```

---

## Task 8: Migrate Logger, useVersionCheck, and ErrorBoundary

**Files:**
- Modify: `src/utils/common/Logger.ts`
- Modify: `src/hooks/useVersionCheck.tsx`
- Modify: `src/components/atoms/ErrorBoundary/ErrorBoundary.tsx`

- [ ] **Step 1: Update `Logger.ts`**

Replace:
```ts
import { NODE_ENV, NodeEnv } from '@/types';
```
With:
```ts
import { config, APP_ENV } from '@/config';
```

Replace the `LoggerConfig` interface:
```ts
interface LoggerConfig {
  enabledEnvironments: NodeEnv[];
  showTimestamp?: boolean;
  showLogLevel?: boolean;
}
```
With:
```ts
interface LoggerConfig {
  enabledEnvironments: APP_ENV[];
  showTimestamp?: boolean;
  showLogLevel?: boolean;
}
```

Replace the default config in the constructor:
```ts
enabledEnvironments: [NodeEnv.LOCAL, NodeEnv.DEV, NodeEnv.PROD],
```
With:
```ts
enabledEnvironments: [APP_ENV.Local, APP_ENV.Development, APP_ENV.Production],
```

Replace in `checkIfEnabled`:
```ts
return this.config.enabledEnvironments.includes(NODE_ENV);
```
With:
```ts
return this.config.enabledEnvironments.includes(config.app.env);
```

- [ ] **Step 2: Update `useVersionCheck.tsx`**

Replace:
```ts
import { NODE_ENV, NodeEnv } from '@/types';
```
With:
```ts
import { config } from '@/config';
```

Replace:
```ts
const isProd = NODE_ENV === NodeEnv.PROD;
```
With:
```ts
const isProd = config.app.isProd;
```

Replace the console.log:
```ts
console.log(`[VersionCheck] Skipped in dev mode mode mode is ${NODE_ENV}`);
```
With:
```ts
console.log(`[VersionCheck] Skipped in dev mode — env is ${config.app.env}`);
```

- [ ] **Step 3: Update `ErrorBoundary.tsx`**

Replace:
```ts
import { NODE_ENV, NodeEnv } from '@/types';
```
With:
```ts
import { config } from '@/config';
```

Replace:
```ts
const isProd = NODE_ENV === NodeEnv.PROD;
```
With:
```ts
const isProd = config.app.isProd;
```

Replace:
```ts
const isDev = NODE_ENV !== NodeEnv.PROD;
```
With:
```ts
const isDev = !config.app.isProd;
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "Logger\|useVersionCheck\|ErrorBoundary"
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/utils/common/Logger.ts src/hooks/useVersionCheck.tsx src/components/atoms/ErrorBoundary/ErrorBoundary.tsx
git commit -m "refactor(config): migrate Logger, useVersionCheck, ErrorBoundary to config"
```

---

## Task 9: Migrate API files

**Files:**
- Modify: `src/api/InvoiceApi.ts`
- Modify: `src/api/OnboardingApi.ts`

- [ ] **Step 1: Update `InvoiceApi.ts`**

Add at the top:
```ts
import { config } from '@/config';
```

Find and replace:
```ts
import.meta.env.VITE_API_URL
```
With:
```ts
config.api.baseUrl
```

- [ ] **Step 2: Update `OnboardingApi.ts`**

Add at the top:
```ts
import { config } from '@/config';
```

Find and replace:
```ts
import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL
```
With:
```ts
config.integrations.googleSheetsWebAppUrl
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "InvoiceApi\|OnboardingApi"
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/api/InvoiceApi.ts src/api/OnboardingApi.ts
git commit -m "refactor(config): migrate InvoiceApi and OnboardingApi to config"
```

---

## Task 10: Migrate region utils and restricted envs hook

**Files:**
- Modify: `src/utils/region/regionUtils.ts`
- Modify: `src/hooks/useRestrictedEnvs.ts`

- [ ] **Step 1: Update `regionUtils.ts`**

Add at the top:
```ts
import { config } from '@/config';
```

Replace the `getDashboardUrls` function:
```ts
export const getDashboardUrls = (): DashboardUrls => {
  return {
    india: import.meta.env.VITE_DASHBOARD_URL_INDIA,
    us:    import.meta.env.VITE_DASHBOARD_URL_US,
  };
};
```
With:
```ts
export const getDashboardUrls = (): DashboardUrls => {
  return {
    india: config.region.indiaUrl || undefined,
    us:    config.region.usUrl || undefined,
  };
};
```

- [ ] **Step 2: Update `useRestrictedEnvs.ts`**

Add at the top:
```ts
import { config } from '@/config';
```

Replace inside `parseRestrictedEnvsConfig`:
```ts
const raw = import.meta.env.VITE_RESTRICTED_ENVS;
```
With:
```ts
const raw = config.restrictions.rawEnvs;
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "regionUtils\|useRestrictedEnvs"
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/region/regionUtils.ts src/hooks/useRestrictedEnvs.ts
git commit -m "refactor(config): migrate region utils and useRestrictedEnvs to config"
```

---

## Task 11: Migrate auth pages and MainLayout

**Files:**
- Modify: `src/layouts/MainLayout.tsx`
- Modify: `src/pages/auth/LoginForm.tsx`
- Modify: `src/pages/auth/SignupForm.tsx`

- [ ] **Step 1: Update `MainLayout.tsx`**

Replace:
```ts
const isProd = import.meta.env.VITE_APP_ENVIRONMENT === 'prod';
```
With:
```ts
import { config } from '@/config';
```
(add to imports at the top)

Replace all uses of `isProd` in the file with `config.app.isProd`.

- [ ] **Step 2: Update `LoginForm.tsx`**

Replace:
```ts
import { NODE_ENV, NodeEnv } from '@/types';
```
With:
```ts
import { config, APP_ENV } from '@/config';
```

Replace all occurrences of:
```ts
NODE_ENV != NodeEnv.SELF_HOSTED
```
With:
```ts
config.app.env !== APP_ENV.SelfHosted
```

- [ ] **Step 3: Update `SignupForm.tsx`**

Replace:
```ts
import { NODE_ENV, NodeEnv } from '@/types';
```
With:
```ts
import { config, APP_ENV } from '@/config';
```

Replace all occurrences of:
```ts
NODE_ENV != NodeEnv.SELF_HOSTED
```
With:
```ts
config.app.env !== APP_ENV.SelfHosted
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "MainLayout\|LoginForm\|SignupForm"
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/MainLayout.tsx src/pages/auth/LoginForm.tsx src/pages/auth/SignupForm.tsx
git commit -m "refactor(config): migrate auth pages and MainLayout to config"
```

---

## Task 12: Migrate 9 connector drawers

**Files:**
- Modify: `src/components/molecules/StripeConnectionDrawer/StripeConnectionDrawer.tsx`
- Modify: `src/components/molecules/HubSpotConnectionDrawer/HubSpotConnectionDrawer.tsx`
- Modify: `src/components/molecules/RazorpayConnectionDrawer/RazorpayConnectionDrawer.tsx`
- Modify: `src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx`
- Modify: `src/components/molecules/NomodConnectionDrawer/NomodConnectionDrawer.tsx`
- Modify: `src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx`
- Modify: `src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx`
- Modify: `src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx`
- Modify: `src/components/molecules/ChargebeeConnectionDrawer/ChargebeeConnectionDrawer.tsx`

Each of these files has the same pattern to fix.

- [ ] **Step 1: In each of the 9 files, apply this change**

Remove:
```ts
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/v1';
```

Add at the top of the file (with the other imports):
```ts
import { config } from '@/config';
```

Replace all uses of `apiUrl` in the file body with `config.api.baseUrl`.

Apply to all 9 files:
- `StripeConnectionDrawer.tsx`
- `HubSpotConnectionDrawer.tsx`
- `RazorpayConnectionDrawer.tsx`
- `MoyasarConnectionDrawer.tsx`
- `NomodConnectionDrawer.tsx`
- `PaddleConnectionDrawer.tsx`
- `QuickBooksConnectionDrawer.tsx`
- `ZohoBooksConnectionDrawer.tsx`
- `ChargebeeConnectionDrawer.tsx`

- [ ] **Step 2: Type-check all drawers**

```bash
npx tsc --noEmit 2>&1 | grep "ConnectionDrawer"
```

Expected: No errors.

- [ ] **Step 3: Full type-check (all files clean)**

```bash
npx tsc --noEmit
```

Expected: Zero errors. If any remain, they will point to missed `NodeEnv`/`import.meta.env` references — fix them before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/components/molecules/StripeConnectionDrawer/StripeConnectionDrawer.tsx \
        src/components/molecules/HubSpotConnectionDrawer/HubSpotConnectionDrawer.tsx \
        src/components/molecules/RazorpayConnectionDrawer/RazorpayConnectionDrawer.tsx \
        src/components/molecules/MoyasarConnectionDrawer/MoyasarConnectionDrawer.tsx \
        src/components/molecules/NomodConnectionDrawer/NomodConnectionDrawer.tsx \
        src/components/molecules/PaddleConnectionDrawer/PaddleConnectionDrawer.tsx \
        src/components/molecules/QuickBooksConnectionDrawer/QuickBooksConnectionDrawer.tsx \
        src/components/molecules/ZohoBooksConnectionDrawer/ZohoBooksConnectionDrawer.tsx \
        src/components/molecules/ChargebeeConnectionDrawer/ChargebeeConnectionDrawer.tsx
git commit -m "refactor(config): migrate all connector drawers to config.api.baseUrl"
```

---

## Task 13: Update `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Replace the full file content**

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
# Note: VITE_SUPABASE_ENABLED deprecated — use VITE_AUTH_ENABLED (still works as fallback)

# Sentry
# Replaces: VITE_APP_PUBLIC_SENTRY_DSN (deprecated — still works as fallback)
VITE_SENTRY_ENABLED=false
VITE_SENTRY_DSN=your-sentry-dsn-here

# PostHog
# Replaces: VITE_APP_PUBLIC_POSTHOG_KEY, VITE_APP_PUBLIC_POSTHOG_HOST (deprecated — still work as fallbacks)
VITE_POSTHOG_ENABLED=false
VITE_POSTHOG_KEY=your-posthog-key-here
VITE_POSTHOG_HOST=https://app.posthog.com

# Paddle
VITE_PADDLE_ENABLED=false
VITE_PADDLE_CLIENT_TOKEN=your-paddle-token-here

# Intercom
# Replaces: VITE_APP_INTERCOM_APP_ID (deprecated — still works as fallback)
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

- [ ] **Step 2: Verify no stray `import.meta.env` reads remain in src/**

```bash
grep -r "import\.meta\.env" src/ --include="*.ts" --include="*.tsx"
```

Expected: No output. If any appear, they are missed call sites — fix them before continuing.

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass including `src/config/index.test.ts`.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "docs(config): update .env.example with new canonical var names and deprecation notes"
```
