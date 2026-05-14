# Auth Templates, White-Label Region Selector & Language Switcher — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a config-driven auth template system (Template 1 = Flexprice default, Template 2 = white-label), migrate the region selector to be fully config-driven with backward compat, and add a Zustand-persisted locale switcher with Radix `DirectionProvider` for RTL.

**Architecture:** Auth template dispatch lives in `BrandTemplate.tsx` using a TypeScript discriminated union so template type narrows config type automatically. Region and allowed-locale config merge with backward-compat fallbacks in `branding.ts` parsers. Locale state lives in a Zustand `persist` store; `DirectionProvider` from `@radix-ui/react-direction` wraps the app so all Radix primitives flip for RTL without per-component props.

**Tech Stack:** React 18 + TypeScript, Zustand 5 (`persist` middleware), `@radix-ui/react-direction` (new direct dep), `country-flag-icons` (already installed), Vitest + Testing Library.

---

## File Map

### New files
| Path | Purpose |
|------|---------|
| `src/config/authTemplates.ts` | Auth template enum, Template1Config, Template2Config, discriminated union AuthPageConfig, RegionOption, RegionsConfig |
| `src/pages/auth/BrandTemplate.tsx` | Dispatches to Template1 or Template2 based on config |
| `src/pages/auth/templates/Template1/Template1.tsx` | Current two-column layout moved here, receives Template1Config as props |
| `src/pages/auth/templates/Template1/LandingSection.tsx` | Moved from `src/pages/auth/LandingSection.tsx`, receives Template1Config props |
| `src/pages/auth/templates/Template2/Template2.tsx` | Two-column layout; right panel = bg color/image, no testimonials |
| `src/utils/region/flagMap.ts` | countryCode → Radix flag component lookup |
| `src/store/useLocaleStore.ts` | Zustand persist store for locale + direction |
| `src/components/molecules/LocaleSelector/LocaleSelector.tsx` | Shared locale picker used on auth page and in-app |

### Modified files
| Path | What changes |
|------|-------------|
| `src/config/branding.ts` | Remove `LandingTheme`/`LandingContentAlign`/`AuthPageConfig` definitions (moved to authTemplates.ts); update `parseAuthPageConfig` to return discriminated union; add `parseRegionsConfig`, `parseAllowedLocales`, `SUPPORTED_LOCALES`; re-export moved types |
| `src/config/config.ts` | Add `regions: RegionsConfig` and `allowedLocales: Locale[]` to Config; update imports |
| `src/config/config.brand.test.ts` | Update `parseAuthPageConfig` tests for new discriminated union shape; add `parseRegionsConfig` tests |
| `src/pages/auth/Auth.tsx` | Remove layout — keep only tab state + auth redirect + `<BrandTemplate />` |
| `src/pages/auth/LandingSection.tsx` | Delete (moved to templates/Template1/) |
| `src/utils/region/regionUtils.ts` | Refactor `detectCurrentRegion`/`switchRegion` to use `RegionOption[]` |
| `src/components/molecules/RegionSelector/RegionSelector.tsx` | Use `config.regions`, `getFlagComponent`; remove hardcoded IN/US imports |
| `src/store/index.ts` | Export `useLocaleStore` |
| `src/main.tsx` | Use store locale for `initI18n`; wrap app in `DirectionProvider` |

---

## Phase 1: Auth Template Types & Config

### Task 1: Create `src/config/authTemplates.ts`

**Files:**
- Create: `src/config/authTemplates.ts`

- [ ] **Step 1: Create the file**

```ts
// src/config/authTemplates.ts

export enum AUTH_TEMPLATE {
	TEMPLATE_1 = 'template_1',
	TEMPLATE_2 = 'template_2',
}

// Moved from branding.ts — re-exported from there for backward compat
export enum LandingTheme {
	Light = 'light',
	Dark = 'dark',
}

export enum LandingContentAlign {
	Left = 'left',
	Center = 'center',
}

export interface Template1Config {
	tagline: string | null;
	supportEmail: string;
	loginBgImage: string | null;
	slackCommunityUrl: string | null;
	showTestimonials: boolean;
	landingTheme: LandingTheme;
	landingContentAlign: LandingContentAlign;
	showLogoOnLanding: boolean;
}

export interface Template2Config {
	tagline: string | null;
	supportEmail: string;
	loginBgImage: string | null;
	landingBgColor: string | null;
	showLogoOnLanding: boolean;
}

// Discriminated union — TypeScript narrows config type from template field, no casts needed
export type AuthPageConfig =
	| { template: AUTH_TEMPLATE.TEMPLATE_1; config: Template1Config }
	| { template: AUTH_TEMPLATE.TEMPLATE_2; config: Template2Config };

export interface RegionOption {
	key: string;        // e.g. "india", "us", "sa"
	label: string;      // e.g. "India", "United States"
	url: string;        // full dashboard URL
	countryCode: string; // ISO 3166-1 alpha-2, e.g. "IN", "US"
}

export interface RegionsConfig {
	enabled: boolean;
	regions: RegionOption[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/config/authTemplates.ts
git commit -m "feat(config): add auth template type contracts"
```

---

### Task 2: Update `src/config/branding.ts`

**Files:**
- Modify: `src/config/branding.ts`

This task: remove `LandingTheme`, `LandingContentAlign`, `AuthPageConfig` definitions (they're now in `authTemplates.ts`); re-export them for backward compat; update `parseAuthPageConfig` to return the discriminated union; add `parseRegionsConfig`, `SUPPORTED_LOCALES`, `parseAllowedLocales`.

- [ ] **Step 1: Replace the file content**

```ts
// src/config/branding.ts
import {
	AUTH_TEMPLATE,
	AuthPageConfig,
	LandingContentAlign,
	LandingTheme,
	RegionOption,
	RegionsConfig,
	Template1Config,
} from './authTemplates';

// Re-export for backward compat — all existing imports from branding.ts continue to work
export { AUTH_TEMPLATE, AuthPageConfig, LandingTheme, LandingContentAlign };
export type { Template1Config, RegionOption, RegionsConfig };

export enum Locale {
	En = 'en',
	Ar = 'ar',
	He = 'he',
	Fa = 'fa',
	Ur = 'ur',
}

export enum Direction {
	LTR = 'ltr',
	RTL = 'rtl',
}

export interface BrandConfig {
	name: string;
	logo: string;
	primaryColor: string;
	favicon: string;
}

export interface I18nConfig {
	locale: Locale;
	direction: Direction;
}

export const SUPPORTED_LOCALES: Locale[] = [Locale.En, Locale.Ar];

const RTL_LOCALES = new Set<Locale>([Locale.Ar, Locale.He, Locale.Fa, Locale.Ur]);

const DEFAULT_SLACK_URL = 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ';

export function parseBrandConfig(): BrandConfig {
	try {
		const raw = JSON.parse(import.meta.env.VITE_BRAND_CONFIG ?? '{}');
		return {
			name: raw.name ?? 'Flexprice',
			logo: raw.logo ?? '/comicon.png',
			primaryColor: raw.primaryColor ?? '#7C3AED',
			favicon: raw.favicon ?? '/favicon.ico',
		};
	} catch {
		return { name: 'Flexprice', logo: '/comicon.png', primaryColor: '#7C3AED', favicon: '/favicon.ico' };
	}
}

export function parseAuthPageConfig(): AuthPageConfig {
	try {
		const raw = JSON.parse(import.meta.env.VITE_AUTH_CONFIG ?? '{}');
		const template = (Object.values(AUTH_TEMPLATE) as string[]).includes(raw.template)
			? (raw.template as AUTH_TEMPLATE)
			: AUTH_TEMPLATE.TEMPLATE_1;

		if (template === AUTH_TEMPLATE.TEMPLATE_2) {
			return {
				template: AUTH_TEMPLATE.TEMPLATE_2,
				config: {
					tagline: 'tagline' in raw ? raw.tagline : null,
					supportEmail: raw.supportEmail ?? 'support@flexprice.io',
					loginBgImage: 'loginBgImage' in raw ? raw.loginBgImage : null,
					landingBgColor: raw.landingBgColor ?? null,
					showLogoOnLanding: raw.showLogoOnLanding ?? false,
				},
			};
		}

		return {
			template: AUTH_TEMPLATE.TEMPLATE_1,
			config: {
				tagline: 'tagline' in raw ? raw.tagline : null,
				supportEmail: raw.supportEmail ?? 'support@flexprice.io',
				loginBgImage: 'loginBgImage' in raw ? raw.loginBgImage : null,
				slackCommunityUrl: 'slackCommunityUrl' in raw ? raw.slackCommunityUrl : DEFAULT_SLACK_URL,
				showTestimonials: raw.showTestimonials ?? true,
				landingTheme: (Object.values(LandingTheme) as string[]).includes(raw.landingTheme)
					? (raw.landingTheme as LandingTheme)
					: LandingTheme.Light,
				landingContentAlign: (Object.values(LandingContentAlign) as string[]).includes(raw.landingContentAlign)
					? (raw.landingContentAlign as LandingContentAlign)
					: LandingContentAlign.Center,
				showLogoOnLanding: raw.showLogoOnLanding ?? false,
			},
		};
	} catch {
		return {
			template: AUTH_TEMPLATE.TEMPLATE_1,
			config: {
				tagline: null,
				supportEmail: 'support@flexprice.io',
				loginBgImage: null,
				slackCommunityUrl: DEFAULT_SLACK_URL,
				showTestimonials: true,
				landingTheme: LandingTheme.Light,
				landingContentAlign: LandingContentAlign.Center,
				showLogoOnLanding: false,
			},
		};
	}
}

export function parseRegionsConfig(): RegionsConfig {
	try {
		const raw = JSON.parse(import.meta.env.VITE_AUTH_CONFIG ?? '{}');
		if (Array.isArray(raw.regions?.regions) && raw.regions.regions.length > 0) {
			return {
				enabled: raw.regions.enabled ?? true,
				regions: raw.regions.regions as RegionOption[],
			};
		}
	} catch {
		// fall through to legacy
	}

	// Backward-compat: build RegionOption[] from old env vars
	const regions: RegionOption[] = [];
	if (import.meta.env.VITE_DASHBOARD_URL_INDIA) {
		regions.push({ key: 'india', label: 'India', url: import.meta.env.VITE_DASHBOARD_URL_INDIA, countryCode: 'IN' });
	}
	if (import.meta.env.VITE_DASHBOARD_URL_US) {
		regions.push({ key: 'us', label: 'United States', url: import.meta.env.VITE_DASHBOARD_URL_US, countryCode: 'US' });
	}
	return {
		enabled: import.meta.env.VITE_DATA_REGION_SELECTION_ENABLED === 'true' && regions.length > 0,
		regions,
	};
}

export function parseAllowedLocales(): Locale[] {
	try {
		const raw = JSON.parse(import.meta.env.VITE_AUTH_CONFIG ?? '{}');
		if (Array.isArray(raw.allowedLocales) && raw.allowedLocales.length > 0) {
			return raw.allowedLocales.filter((l: string): l is Locale => (Object.values(Locale) as string[]).includes(l));
		}
	} catch {
		// fall through
	}
	return SUPPORTED_LOCALES;
}

export function parseI18nConfig(): I18nConfig {
	const rawLocale = import.meta.env.VITE_DEFAULT_LOCALE ?? Locale.En;
	const locale = (Object.values(Locale) as string[]).includes(rawLocale) ? (rawLocale as Locale) : Locale.En;
	return { locale, direction: RTL_LOCALES.has(locale) ? Direction.RTL : Direction.LTR };
}

export const brandConfig: BrandConfig = parseBrandConfig();
export const authPageConfig: AuthPageConfig = parseAuthPageConfig();
export const regionsConfig: RegionsConfig = parseRegionsConfig();
export const allowedLocalesConfig: Locale[] = parseAllowedLocales();
export const i18nConfig: I18nConfig = parseI18nConfig();

/** Returns the app's active brand config. Not a React hook — safe to call anywhere. */
export function useBrand(): BrandConfig {
	return brandConfig;
}

/** Injects --brand-primary CSS var and swaps the favicon. Call once before first render. */
export function initBranding(): void {
	document.documentElement.style.setProperty('--brand-primary', brandConfig.primaryColor);
	const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
	if (faviconEl) {
		faviconEl.href = brandConfig.favicon;
	}
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only in files that haven't been updated yet (config.ts, LandingSection.tsx). No errors in branding.ts or authTemplates.ts.

- [ ] **Step 3: Commit**

```bash
git add src/config/branding.ts
git commit -m "feat(config): update branding parsers for discriminated union auth config"
```

---

### Task 3: Update `src/config/config.ts` and tests

**Files:**
- Modify: `src/config/config.ts`
- Modify: `src/config/config.brand.test.ts`

- [ ] **Step 1: Update `config.ts`**

```ts
// src/config/config.ts
import {
	BrandConfig,
	AuthPageConfig,
	I18nConfig,
	brandConfig,
	authPageConfig,
	i18nConfig,
	regionsConfig,
	allowedLocalesConfig,
	Locale,
} from './branding';
import { RegionsConfig } from './authTemplates';

export type { BrandConfig, AuthPageConfig, I18nConfig };

export enum APP_ENV {
	Local = 'local',
	Development = 'development',
	Production = 'production',
	SelfHosted = 'self-hosted',
}

export enum AUTH_PROVIDER {
	Flexprice = 'flexprice',
	Supabase = 'supabase',
}

interface AppConfig {
	env: APP_ENV;
	isProd: boolean;
}
interface ApiConfig {
	baseUrl: string;
}
interface AuthConfig {
	enabled: boolean;
	provider: AUTH_PROVIDER;
	url: string;
	anonKey: string;
}
interface SentryConfig {
	enabled: boolean;
	dsn: string;
}
interface PosthogConfig {
	enabled: boolean;
	key: string;
	host: string;
}
interface PaddleConfig {
	enabled: boolean;
	clientToken: string;
}
interface IntercomConfig {
	enabled: boolean;
	appId: string;
}
interface RegionConfig {
	indiaUrl: string;
	usUrl: string;
	dataRegionSelectionEnabled: boolean;
}
interface IntegrationsConfig {
	googleSheetsWebAppUrl: string;
}
interface RestrictionsConfig {
	rawEnvs: string;
}

export interface Config {
	app: AppConfig;
	api: ApiConfig;
	auth: AuthConfig;
	sentry: SentryConfig;
	posthog: PosthogConfig;
	paddle: PaddleConfig;
	intercom: IntercomConfig;
	region: RegionConfig;
	integrations: IntegrationsConfig;
	restrictions: RestrictionsConfig;
	brand: BrandConfig;
	authPage: AuthPageConfig;
	i18n: I18nConfig;
	regions: RegionsConfig;
	allowedLocales: Locale[];
}

function parseAppEnv(): APP_ENV {
	const raw = import.meta.env.VITE_APP_ENV ?? import.meta.env.VITE_APP_ENVIRONMENT ?? import.meta.env.VITE_ENVIRONMENT;
	if (!raw) return APP_ENV.Local;
	if (raw === 'prod') return APP_ENV.Production;
	if (raw === 'dev') return APP_ENV.Development;
	return raw as APP_ENV;
}

const appEnv = parseAppEnv();

export const config: Config = {
	app: {
		env: appEnv,
		isProd: appEnv === APP_ENV.Production,
	},
	api: {
		baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/v1',
	},
	auth: {
		enabled: import.meta.env.VITE_AUTH_ENABLED === 'true' || import.meta.env.VITE_SUPABASE_ENABLED === 'true',
		provider: (import.meta.env.VITE_AUTH_PROVIDER ?? AUTH_PROVIDER.Supabase) as AUTH_PROVIDER,
		url: import.meta.env.VITE_SUPABASE_URL ?? '',
		anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
	},
	sentry: {
		enabled: import.meta.env.VITE_SENTRY_ENABLED === 'true',
		dsn: import.meta.env.VITE_SENTRY_DSN ?? import.meta.env.VITE_APP_PUBLIC_SENTRY_DSN ?? '',
	},
	posthog: {
		enabled: import.meta.env.VITE_POSTHOG_ENABLED === 'true',
		key: import.meta.env.VITE_POSTHOG_KEY ?? import.meta.env.VITE_APP_PUBLIC_POSTHOG_KEY ?? '',
		host: import.meta.env.VITE_POSTHOG_HOST ?? import.meta.env.VITE_APP_PUBLIC_POSTHOG_HOST ?? '',
	},
	paddle: {
		enabled: import.meta.env.VITE_PADDLE_ENABLED === 'true',
		clientToken: import.meta.env.VITE_PADDLE_CLIENT_TOKEN ?? '',
	},
	intercom: {
		enabled: import.meta.env.VITE_INTERCOM_ENABLED === 'true',
		appId: import.meta.env.VITE_INTERCOM_APP_ID ?? import.meta.env.VITE_APP_INTERCOM_APP_ID ?? '',
	},
	region: {
		indiaUrl: import.meta.env.VITE_DASHBOARD_URL_INDIA ?? '',
		usUrl: import.meta.env.VITE_DASHBOARD_URL_US ?? '',
		dataRegionSelectionEnabled: import.meta.env.VITE_DATA_REGION_SELECTION_ENABLED === 'true',
	},
	integrations: {
		googleSheetsWebAppUrl: import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL ?? '',
	},
	restrictions: {
		rawEnvs: import.meta.env.VITE_RESTRICTED_ENVS ?? '',
	},
	brand: brandConfig,
	authPage: authPageConfig,
	i18n: i18nConfig,
	regions: regionsConfig,
	allowedLocales: allowedLocalesConfig,
};
```

- [ ] **Step 2: Write failing tests for new parsers**

Add to `src/config/config.brand.test.ts`:

```ts
describe('parseAuthPageConfig — template dispatch', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('defaults to template_1 when template field is absent', async () => {
		const { parseAuthPageConfig } = await importBranding();
		const result = parseAuthPageConfig();
		expect(result.template).toBe('template_1');
		expect(result.config.supportEmail).toBe('support@flexprice.io');
		expect(result.config.tagline).toBeNull();
	});

	it('returns template_1 shape for template_1 config', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ template: 'template_1', tagline: 'Build fast' }));
		const { parseAuthPageConfig } = await importBranding();
		const result = parseAuthPageConfig();
		expect(result.template).toBe('template_1');
		if (result.template === 'template_1') {
			expect(result.config.tagline).toBe('Build fast');
			expect(result.config.showTestimonials).toBe(true);
		}
	});

	it('returns template_2 shape for template_2 config', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ template: 'template_2', landingBgColor: '#1a1a2e' }));
		const { parseAuthPageConfig } = await importBranding();
		const result = parseAuthPageConfig();
		expect(result.template).toBe('template_2');
		if (result.template === 'template_2') {
			expect(result.config.landingBgColor).toBe('#1a1a2e');
			expect(result.config.showLogoOnLanding).toBe(false);
		}
	});

	it('falls back to template_1 on malformed JSON', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', '{bad}');
		const { parseAuthPageConfig } = await importBranding();
		const result = parseAuthPageConfig();
		expect(result.template).toBe('template_1');
	});
});

describe('parseRegionsConfig', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('returns disabled with empty regions when nothing is configured', async () => {
		const { parseRegionsConfig } = await importBranding();
		const result = parseRegionsConfig();
		expect(result.enabled).toBe(false);
		expect(result.regions).toHaveLength(0);
	});

	it('uses VITE_AUTH_CONFIG regions when configured', async () => {
		vi.stubEnv(
			'VITE_AUTH_CONFIG',
			JSON.stringify({
				regions: {
					enabled: true,
					regions: [{ key: 'sa', label: 'Saudi Arabia', url: 'https://sa.brand.com', countryCode: 'SA' }],
				},
			}),
		);
		const { parseRegionsConfig } = await importBranding();
		const result = parseRegionsConfig();
		expect(result.enabled).toBe(true);
		expect(result.regions).toHaveLength(1);
		expect(result.regions[0].countryCode).toBe('SA');
	});

	it('falls back to legacy env vars when regions array is absent', async () => {
		vi.stubEnv('VITE_DASHBOARD_URL_INDIA', 'https://in.flexprice.io');
		vi.stubEnv('VITE_DASHBOARD_URL_US', 'https://us.flexprice.io');
		vi.stubEnv('VITE_DATA_REGION_SELECTION_ENABLED', 'true');
		const { parseRegionsConfig } = await importBranding();
		const result = parseRegionsConfig();
		expect(result.enabled).toBe(true);
		expect(result.regions).toHaveLength(2);
		expect(result.regions.find((r) => r.key === 'india')?.countryCode).toBe('IN');
		expect(result.regions.find((r) => r.key === 'us')?.countryCode).toBe('US');
	});

	it('legacy fallback is disabled when VITE_DATA_REGION_SELECTION_ENABLED is not true', async () => {
		vi.stubEnv('VITE_DASHBOARD_URL_INDIA', 'https://in.flexprice.io');
		const { parseRegionsConfig } = await importBranding();
		const result = parseRegionsConfig();
		expect(result.enabled).toBe(false);
	});
});

describe('parseAllowedLocales', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('returns SUPPORTED_LOCALES when allowedLocales is absent', async () => {
		const { parseAllowedLocales, SUPPORTED_LOCALES } = await importBranding();
		expect(parseAllowedLocales()).toEqual(SUPPORTED_LOCALES);
	});

	it('returns filtered subset when allowedLocales is configured', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ allowedLocales: ['en'] }));
		const { parseAllowedLocales } = await importBranding();
		expect(parseAllowedLocales()).toEqual(['en']);
	});

	it('filters out invalid locale values', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ allowedLocales: ['en', 'zz'] }));
		const { parseAllowedLocales } = await importBranding();
		expect(parseAllowedLocales()).toEqual(['en']);
	});
});
```

Also update the old `parseAuthPageConfig` tests to use the new shape (the existing four tests at lines 43–79 of `config.brand.test.ts` will break because `result.supportEmail` no longer exists — it's now `result.config.supportEmail`). Replace the existing `describe('parseAuthPageConfig', ...)` block with:

```ts
describe('parseAuthPageConfig — legacy tests updated for discriminated union', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('returns defaults when env var is absent', async () => {
		const { parseAuthPageConfig } = await importBranding();
		const result = parseAuthPageConfig();
		expect(result.template).toBe('template_1');
		expect(result.config.supportEmail).toBe('support@flexprice.io');
		expect(result.config.tagline).toBeNull();
		expect(result.config.loginBgImage).toBeNull();
	});

	it('sets slackCommunityUrl to null when explicitly nulled', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ slackCommunityUrl: null }));
		const { parseAuthPageConfig } = await importBranding();
		const result = parseAuthPageConfig();
		if (result.template === 'template_1') {
			expect(result.config.slackCommunityUrl).toBeNull();
		}
	});

	it('applies partial overrides while keeping other defaults', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', JSON.stringify({ supportEmail: 'support@tirdad.com', tagline: 'Custom tagline' }));
		const { parseAuthPageConfig } = await importBranding();
		const result = parseAuthPageConfig();
		expect(result.config.supportEmail).toBe('support@tirdad.com');
		expect(result.config.tagline).toBe('Custom tagline');
	});

	it('silently falls back to defaults on malformed JSON', async () => {
		vi.stubEnv('VITE_AUTH_CONFIG', '{bad json}');
		const { parseAuthPageConfig } = await importBranding();
		const result = parseAuthPageConfig();
		expect(result.template).toBe('template_1');
		expect(result.config.supportEmail).toBe('support@flexprice.io');
	});
});
```

And update the `config object` test:

```ts
describe('config object', () => {
	it('includes brand, authPage, i18n, regions, and allowedLocales keys', async () => {
		const { config } = await importConfig();
		expect(config.brand).toBeDefined();
		expect(config.authPage).toBeDefined();
		expect(config.authPage.template).toBe('template_1');
		expect(config.i18n).toBeDefined();
		expect(config.regions).toBeDefined();
		expect(Array.isArray(config.allowedLocales)).toBe(true);
	});
});
```

- [ ] **Step 3: Run tests — expect all to pass**

```bash
npx vitest run src/config/config.brand.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
```

Expected: zero errors in Phase 1 files.

- [ ] **Step 5: Commit**

```bash
git add src/config/config.ts src/config/config.brand.test.ts
git commit -m "feat(config): add regions and allowedLocales to config; update tests"
```

---

## Phase 2: Config-driven Region Selector

### Task 4: Create `src/utils/region/flagMap.ts`

**Files:**
- Create: `src/utils/region/flagMap.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/region/flagMap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getFlagComponent } from './flagMap';

describe('getFlagComponent', () => {
	it('returns a component for a known country code', () => {
		const Component = getFlagComponent('IN');
		expect(Component).not.toBeNull();
	});

	it('is case-insensitive', () => {
		const upper = getFlagComponent('US');
		const lower = getFlagComponent('us');
		expect(upper).not.toBeNull();
		expect(upper).toBe(lower);
	});

	it('returns null for unknown country code', () => {
		expect(getFlagComponent('ZZ')).toBeNull();
	});
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/utils/region/flagMap.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/utils/region/flagMap.ts
import * as Flags from 'country-flag-icons/react/3x2';
import React from 'react';

type FlagComponent = React.ComponentType<{ className?: string }>;

export function getFlagComponent(countryCode: string): FlagComponent | null {
	return (Flags as Record<string, FlagComponent>)[countryCode.toUpperCase()] ?? null;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/utils/region/flagMap.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/region/flagMap.ts src/utils/region/flagMap.test.ts
git commit -m "feat(region): add countryCode to flag component lookup"
```

---

### Task 5: Refactor `src/utils/region/regionUtils.ts`

**Files:**
- Modify: `src/utils/region/regionUtils.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/region/regionUtils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { detectCurrentRegion } from './regionUtils';
import { RegionOption } from '@/config/authTemplates';

const regions: RegionOption[] = [
	{ key: 'india', label: 'India', url: 'https://in.flexprice.io', countryCode: 'IN' },
	{ key: 'us', label: 'United States', url: 'https://us.flexprice.io', countryCode: 'US' },
];

describe('detectCurrentRegion', () => {
	it('returns the matching region when origin matches', () => {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, origin: 'https://in.flexprice.io' },
			writable: true,
		});
		const result = detectCurrentRegion(regions);
		expect(result?.key).toBe('india');
	});

	it('returns null when no region URL matches current origin', () => {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, origin: 'http://localhost:3000' },
			writable: true,
		});
		const result = detectCurrentRegion(regions);
		expect(result).toBeNull();
	});

	it('returns null for empty regions array', () => {
		expect(detectCurrentRegion([])).toBeNull();
	});
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/utils/region/regionUtils.test.ts
```

Expected: FAIL — `detectCurrentRegion` does not accept `RegionOption[]`.

- [ ] **Step 3: Replace `regionUtils.ts`**

```ts
// src/utils/region/regionUtils.ts
import { RegionOption } from '@/config/authTemplates';

// Keep legacy types/functions for backward compat — not used by RegionSelector anymore
import { config } from '@/config/config';
import { Region } from '@/types/enums/Region';

export interface DashboardUrls {
	india: string | undefined;
	us: string | undefined;
}

/** @deprecated Use detectCurrentRegion(regions) with config.regions.regions */
export const getDashboardUrls = (): DashboardUrls => ({
	india: config.region.indiaUrl || undefined,
	us: config.region.usUrl || undefined,
});

/** @deprecated Use getRegionUrl(region) */
export const getRegionDashboardUrl = (region: Region): string | null => {
	const urls = getDashboardUrls();
	if (region === Region.INDIA) return urls.india || null;
	if (region === Region.US) return urls.us || null;
	return null;
};

/**
 * Finds the region whose URL origin matches window.location.origin.
 * Returns null if no match.
 */
export const detectCurrentRegion = (regions: RegionOption[]): RegionOption | null => {
	const currentOrigin = window.location.origin;
	return (
		regions.find((r) => {
			try {
				return new URL(r.url).origin === currentOrigin;
			} catch {
				return false;
			}
		}) ?? null
	);
};

/**
 * Navigates to the region's dashboard URL, preserving current pathname + search.
 */
export const switchRegion = (region: RegionOption): void => {
	const currentPath = window.location.pathname;
	const currentSearch = window.location.search;
	window.location.replace(`${region.url}${currentPath}${currentSearch}`);
};
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/utils/region/regionUtils.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/region/regionUtils.ts src/utils/region/regionUtils.test.ts
git commit -m "feat(region): refactor regionUtils to accept RegionOption[]"
```

---

### Task 6: Update `RegionSelector`

**Files:**
- Modify: `src/components/molecules/RegionSelector/RegionSelector.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// src/components/molecules/RegionSelector/RegionSelector.tsx
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Tooltip from '@/components/atoms/Tooltip/Tooltip';
import RegionInfoDialog from './RegionInfoDialog';
import { RegionOption } from '@/config/authTemplates';
import { detectCurrentRegion, switchRegion } from '@/utils/region/regionUtils';
import { getFlagComponent } from '@/utils/region/flagMap';
import { Info } from 'lucide-react';
import { config } from '@/config/config';

const RegionSelectorImpl: React.FC = () => {
	const { regions } = config.regions;
	const [selectedRegion, setSelectedRegion] = useState<RegionOption | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	useEffect(() => {
		setSelectedRegion(detectCurrentRegion(regions));
	}, [regions]);

	const handleRegionChange = (key: string) => {
		const region = regions.find((r) => r.key === key);
		if (!region) return;
		setSelectedRegion(region);
		switchRegion(region);
	};

	return (
		<div className='space-y-2'>
			<div className='flex items-center gap-1'>
				<label className='block text-sm font-medium text-gray-700'>Data region</label>
				<Tooltip content='Click to learn more about regions'>
					<button type='button' onClick={() => setIsDialogOpen(true)} className='text-sm text-[#0E5AC9] cursor-pointer'>
						<Info size={16} className='text-grey' />
					</button>
				</Tooltip>
			</div>
			<Select value={selectedRegion?.key ?? ''} onValueChange={handleRegionChange} disabled={regions.length === 0}>
				<SelectTrigger className='w-full'>
					{selectedRegion ? (
						(() => {
							const FlagIcon = getFlagComponent(selectedRegion.countryCode);
							return (
								<div className='flex items-center gap-2'>
									{FlagIcon && <FlagIcon className='h-4 w-5' />}
									<span>{selectedRegion.label}</span>
								</div>
							);
						})()
					) : (
						<SelectValue placeholder='Select a region' />
					)}
				</SelectTrigger>
				<SelectContent>
					{regions.map((region) => {
						const FlagIcon = getFlagComponent(region.countryCode);
						return (
							<SelectItem key={region.key} value={region.key}>
								<div className='flex items-center gap-2'>
									{FlagIcon && <FlagIcon className='h-4 w-5' />}
									<span>{region.label}</span>
								</div>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
			<RegionInfoDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
		</div>
	);
};

const RegionSelector: React.FC = () => {
	if (!config.regions.enabled) return null;
	return <RegionSelectorImpl />;
};

export default RegionSelector;
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: no errors in RegionSelector or region utils.

- [ ] **Step 3: Commit**

```bash
git add src/components/molecules/RegionSelector/RegionSelector.tsx
git commit -m "feat(region): migrate RegionSelector to config-driven RegionOption[]"
```

---

## Phase 3: Auth Template Components

### Task 7: Create `BrandTemplate.tsx`

**Files:**
- Create: `src/pages/auth/BrandTemplate.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/pages/auth/BrandTemplate.tsx
import React from 'react';
import { config } from '@/config/config';
import { AUTH_TEMPLATE } from '@/config/authTemplates';
import { AuthTab } from './authTabs';
import Template1 from './templates/Template1/Template1';
import Template2 from './templates/Template2/Template2';

interface BrandTemplateProps {
	currentTab: AuthTab;
	switchTab: (tab: AuthTab) => void;
}

const BrandTemplate: React.FC<BrandTemplateProps> = ({ currentTab, switchTab }) => {
	const { authPage } = config;

	switch (authPage.template) {
		case AUTH_TEMPLATE.TEMPLATE_2:
			// TypeScript narrows authPage.config to Template2Config here
			return <Template2 config={authPage.config} currentTab={currentTab} switchTab={switchTab} />;
		case AUTH_TEMPLATE.TEMPLATE_1:
		default:
			// TypeScript narrows authPage.config to Template1Config here
			return <Template1 config={authPage.config} currentTab={currentTab} switchTab={switchTab} />;
	}
};

export default BrandTemplate;
```

Note: `Template1` and `Template2` don't exist yet — TypeScript will error until Tasks 8–10 are complete.

- [ ] **Step 2: Commit**

```bash
git add src/pages/auth/BrandTemplate.tsx
git commit -m "feat(auth): add BrandTemplate dispatch component"
```

---

### Task 8: Create `Template1` and move `LandingSection`

**Files:**
- Create: `src/pages/auth/templates/Template1/Template1.tsx`
- Create: `src/pages/auth/templates/Template1/LandingSection.tsx` (moved from `src/pages/auth/LandingSection.tsx`)

- [ ] **Step 1: Create `templates/Template1/LandingSection.tsx`**

This is the current `LandingSection.tsx` with two changes: receives `Template1Config` as props instead of reading from `config.authPage`, and the asset import path is adjusted for the new location.

```tsx
// src/pages/auth/templates/Template1/LandingSection.tsx
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TestimonialCard } from '@/components/molecules';
import { Testimonial } from '@/types';
import authBg from '../../../../assets/toolright.jpg';
import { LandingContentAlign, LandingTheme, useBrand } from '@/config/branding';
import { Template1Config } from '@/config/authTemplates';

const testimonials: Testimonial[] = [
	{
		dpUrl: '/assets/company-founders/krutrim.png',
		logoUrl: '/assets/company-logo/krutrim logo.png',
		testimonial:
			'Flexprice helped us roll out usage-based plans without any heavy lifting. We finally stopped patching together internal hacks and team bandwidth to just charge customers properly.',
		name: 'Raguraman Barathalwar',
		designation: 'Vice President',
		companyName: 'KRUTRIM',
		label: 'Series B',
	},
	{
		dpUrl: '/assets/company-founders/1747891553125.jpeg',
		logoUrl: '/assets/company-logo/Clueso Logo.png',
		testimonial:
			'Flexprice made it super easy for us to create and sell custom plans based on usage in minutes & has eliminated our reliance on our in-house hacks.',
		name: 'Prajwal Prakash',
		designation: 'Co-Founder & CTO (YC 23)',
		companyName: 'Clueso',
		labelImageUrl: '/assets/company-logo/Y_Combinator_logo.svg.png',
	},
	{
		dpUrl: '/assets/company-founders/1732115195410.jpeg',
		logoUrl: '/assets/company-logo/aftershoot copy.png',
		testimonial:
			"Flexprice streamlined our entire pricing workflow. We went from messy internal scripts to clean, configurable usage plans in no time, and it's been a huge relief for our team.",
		name: 'Justin Benson',
		designation: 'Co-Founder',
		companyName: 'Aftershoot',
		label: 'Series A',
	},
	{
		dpUrl: '/assets/company-founders/wizcommerce.webp',
		logoUrl: '/assets/svg/wizcommerce.svg',
		testimonial:
			'We had to launch our new product and needed a billing solution that could handle billions of events without any latency issues or downtime. Flexprice delivered exactly that.',
		name: 'Divyanshu Makkar',
		designation: 'Founder and CEO',
		companyName: 'WizCommerce',
		label: 'Series A',
	},
	{
		dpUrl: '/assets/company-founders/simplismart.png',
		logoUrl: '/assets/svg/simplismart_logo.svg',
		testimonial:
			'Flexprice has completely transformed how we handle billing. Setting up usage-based pricing was a breeze, and their SDKs fit right into our stack.',
		name: 'Shubhendu Shishir',
		designation: 'Head of Engineering',
		companyName: 'Simplismart',
		label: 'Series A',
	},
	{
		dpUrl: '/assets/company-founders/truffleai.png',
		logoUrl: '/assets/company-logo/Truffle AI Logo.png',
		testimonial:
			'Flexprice saved us thousands of development hours that we would have spent building in-house. Managing pricing plans and experimenting with models is now effortless.',
		name: 'Shaunak Srivastava',
		designation: 'Co-founder (YC 25)',
		companyName: 'Truffle AI',
		labelImageUrl: '/assets/company-logo/Y_Combinator_logo.svg.png',
	},
];

const customerLogos = [
	'/assets/svg/simplismart_logo.svg',
	'/assets/svg/goodmeetings_logo.svg',
	'/assets/svg/aftershoot_logo.svg',
	'/assets/svg/wizcommerce_logo.svg',
	'/assets/svg/digibee-logo-dark 1.svg',
	'/assets/svg/supervity_logo.svg',
];

const ANIMATION_DURATION = 90;

interface LandingSectionProps {
	config: Template1Config;
}

const LandingSection: React.FC<LandingSectionProps> = ({ config }) => {
	const { t } = useTranslation('auth');
	const brand = useBrand();
	const bgImage = config.loginBgImage ?? authBg;
	const { showTestimonials, landingTheme, landingContentAlign, showLogoOnLanding } = config;
	const isDark = landingTheme === LandingTheme.Dark;
	const isLeft = landingContentAlign === LandingContentAlign.Left;
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const scrollContainer = scrollRef.current;
		if (!scrollContainer) return;
		let animationFrame: number;
		let start: number | null = null;
		const scrollWidth = scrollContainer.scrollWidth / 2;

		function step(timestamp: number) {
			if (!start) start = timestamp;
			const elapsed = (timestamp - start) / 1000;
			const distance = (elapsed * scrollWidth) / ANIMATION_DURATION;
			if (scrollContainer) {
				scrollContainer.scrollLeft = distance % scrollWidth;
			}
			animationFrame = requestAnimationFrame(step);
		}
		animationFrame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(animationFrame);
	}, []);

	const cards = testimonials.concat(testimonials);

	return (
		<section
			className={`w-full min-h-full flex-1 pt-14 pb-12 flex flex-col ${isLeft ? 'items-start justify-center pl-16 pr-8' : 'items-center justify-center'}`}
			style={{
				backgroundImage: `url(${bgImage})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
			}}>
			{showLogoOnLanding && <img src={brand.logo} alt={brand.name} className='mb-12 max-h-10 object-contain' />}
			<h2
				className={
					isDark
						? `text-5xl font-bold text-white leading-tight mb-[44px] max-w-xl ${isLeft ? 'text-start' : 'text-center'}`
						: `text-[28px] font-normal text-zinc-950 mb-[44px] ${isLeft ? 'text-start' : 'text-center'}`
				}>
				{config.tagline ?? t('landing.defaultTagline')}
			</h2>
			{showTestimonials && (
				<>
					<div className='relative flex justify-center items-center w-full max-w-7xl h-[340px] mb-10'>
						<div ref={scrollRef} className='w-full overflow-x-hidden' style={{ height: 320 }}>
							<div className='flex gap-x-7 w-max'>
								{cards.map((card, idx) => (
									<TestimonialCard
										key={idx}
										testimonial={card}
										logoHeightClass={
											card.companyName === 'Clueso'
												? 'max-h-4'
												: card.companyName === 'Aftershoot'
													? 'max-h-7'
													: card.companyName === 'KRUTRIM'
														? 'max-h-5'
														: card.companyName === 'Truffle AI'
															? 'max-h-4'
															: 'max-h-6'
										}
									/>
								))}
							</div>
						</div>
					</div>
					<div className='w-full flex flex-col items-center mt-8'>
						<div className='text-center font-inter text-black font-medium mb-14 text-lg'>{t('landing.trustedBy')}</div>
						<div className='w-full max-w-3xl grid grid-cols-3 grid-rows-2 gap-y-12 gap-x-12 justify-items-center items-center'>
							{customerLogos.map((logo, idx) => (
								<div key={idx} className='flex items-center justify-center'>
									<img src={logo} alt='customer logo' className='max-h-10 object-contain transition-all duration-200' style={{ maxWidth: 140 }} />
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</section>
	);
};

export default LandingSection;
```

- [ ] **Step 2: Create `templates/Template1/Template1.tsx`**

```tsx
// src/pages/auth/templates/Template1/Template1.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/config/branding';
import { Template1Config } from '@/config/authTemplates';
import { AuthTab } from '../../authTabs';
import LandingSection from './LandingSection';
import RegionSelector from '@/components/molecules/RegionSelector/RegionSelector';
import LocaleSelector from '@/components/molecules/LocaleSelector/LocaleSelector';
import LoginForm from '../../LoginForm';
import SignupForm from '../../SignupForm';
import ForgotPasswordForm from '../../ForgotPasswordForm';
import ResetPasswordForm from '../../ResetPasswordForm';

interface Template1Props {
	config: Template1Config;
	currentTab: AuthTab;
	switchTab: (tab: AuthTab) => void;
}

const Template1: React.FC<Template1Props> = ({ config, currentTab, switchTab }) => {
	const { t } = useTranslation('auth');
	const { logo, name } = useBrand();

	const renderForm = () => {
		switch (currentTab) {
			case AuthTab.SIGNUP:
				return <SignupForm switchTab={switchTab} />;
			case AuthTab.FORGOT_PASSWORD:
				return <ForgotPasswordForm switchTab={switchTab} />;
			case AuthTab.RESET_PASSWORD:
				return <ResetPasswordForm switchTab={switchTab} />;
			default:
				return <LoginForm switchTab={switchTab} />;
		}
	};

	return (
		<div className='flex w-full min-h-screen bg-white page !p-0 !flex-row'>
			<div className='w-[45%] flex flex-col'>
				{config.slackCommunityUrl && (
					<a
						href={config.slackCommunityUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='w-full h-[48px] flex items-center justify-center gap-2.5 cursor-pointer border-y border-gray-100 hover:opacity-90 transition-opacity'
						style={{ background: 'linear-gradient(to right, #F7F7F7, #EDEDED, #F7F7F7)' }}>
						<span className='text-[15px] font-medium text-gray-700'>{t('slackBanner', { brandName: name })}</span>
						<img src='/assets/logo/slack-logo.png' alt='Slack Logo' className='h-4 w-auto' />
					</a>
				)}
				<div className='flex-1 flex justify-center items-center pt-[10px]'>
					<div className='flex flex-col justify-center max-w-xl w-[55%] mx-auto'>
						<div className='flex justify-center mb-4'>
							<img src={logo} alt={`${name} Logo`} className='h-12' />
						</div>
						{currentTab === AuthTab.SIGNUP && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('createAccount.heading')}</h2>
								<p className='text-center text-gray-600 mb-10'>{t('createAccount.subheading', { brandName: name })}</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.LOGIN && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-3'>{t('login.heading')}</h2>
								<p className='text-center text-gray-600 mb-10'>{t('login.subheading')}</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.FORGOT_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('forgotPassword.heading')}</h2>
								<p className='text-center text-gray-600 mb-8'>{t('forgotPassword.subheading')}</p>
							</>
						)}
						{currentTab === AuthTab.RESET_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('resetPassword.heading')}</h2>
								<p className='text-center text-gray-600 mb-8'>{t('resetPassword.subheading')}</p>
							</>
						)}
						{renderForm()}
						<div className='mt-6 flex justify-start'>
							<LocaleSelector />
						</div>
					</div>
				</div>
			</div>
			<div className='w-[55%] min-h-screen flex'>
				<LandingSection config={config} />
			</div>
		</div>
	);
};

export default Template1;
```

Note: `LocaleSelector` doesn't exist yet — it's created in Task 14. TypeScript will error until then.

- [ ] **Step 3: Commit**

```bash
git add src/pages/auth/templates/
git commit -m "feat(auth): add Template1 components (LandingSection moved + receives props)"
```

---

### Task 9: Create `Template2`

**Files:**
- Create: `src/pages/auth/templates/Template2/Template2.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/pages/auth/templates/Template2/Template2.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/config/branding';
import { Template2Config } from '@/config/authTemplates';
import { AuthTab } from '../../authTabs';
import RegionSelector from '@/components/molecules/RegionSelector/RegionSelector';
import LocaleSelector from '@/components/molecules/LocaleSelector/LocaleSelector';
import LoginForm from '../../LoginForm';
import SignupForm from '../../SignupForm';
import ForgotPasswordForm from '../../ForgotPasswordForm';
import ResetPasswordForm from '../../ResetPasswordForm';

interface Template2Props {
	config: Template2Config;
	currentTab: AuthTab;
	switchTab: (tab: AuthTab) => void;
}

const Template2: React.FC<Template2Props> = ({ config, currentTab, switchTab }) => {
	const { t } = useTranslation('auth');
	const { logo, name } = useBrand();

	const renderForm = () => {
		switch (currentTab) {
			case AuthTab.SIGNUP:
				return <SignupForm switchTab={switchTab} />;
			case AuthTab.FORGOT_PASSWORD:
				return <ForgotPasswordForm switchTab={switchTab} />;
			case AuthTab.RESET_PASSWORD:
				return <ResetPasswordForm switchTab={switchTab} />;
			default:
				return <LoginForm switchTab={switchTab} />;
		}
	};

	const rightPanelStyle: React.CSSProperties = config.loginBgImage
		? { backgroundImage: `url(${config.loginBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
		: { backgroundColor: config.landingBgColor ?? '#f4f4f5' };

	return (
		<div className='flex w-full min-h-screen bg-white page !p-0 !flex-row'>
			<div className='w-[45%] flex flex-col'>
				<div className='flex-1 flex justify-center items-center'>
					<div className='flex flex-col justify-center max-w-xl w-[55%] mx-auto'>
						<div className='flex justify-center mb-4'>
							<img src={logo} alt={`${name} Logo`} className='h-12' />
						</div>
						{currentTab === AuthTab.SIGNUP && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('createAccount.heading')}</h2>
								<p className='text-center text-gray-600 mb-10'>{t('createAccount.subheading', { brandName: name })}</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.LOGIN && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-3'>{t('login.heading')}</h2>
								<p className='text-center text-gray-600 mb-10'>{t('login.subheading')}</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.FORGOT_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('forgotPassword.heading')}</h2>
								<p className='text-center text-gray-600 mb-8'>{t('forgotPassword.subheading')}</p>
							</>
						)}
						{currentTab === AuthTab.RESET_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('resetPassword.heading')}</h2>
								<p className='text-center text-gray-600 mb-8'>{t('resetPassword.subheading')}</p>
							</>
						)}
						{renderForm()}
						<div className='mt-6 flex justify-start'>
							<LocaleSelector />
						</div>
					</div>
				</div>
			</div>
			<div className='w-[55%] min-h-screen' style={rightPanelStyle}>
				{config.showLogoOnLanding && (
					<div className='flex items-center justify-center h-full'>
						<div className='text-center px-8'>
							<img src={logo} alt={name} className='max-h-16 object-contain mx-auto mb-6' />
							{config.tagline && <p className='text-xl font-medium'>{config.tagline}</p>}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Template2;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/auth/templates/Template2/Template2.tsx
git commit -m "feat(auth): add Template2 component"
```

---

### Task 10: Slim down `Auth.tsx` and delete old `LandingSection.tsx`

**Files:**
- Modify: `src/pages/auth/Auth.tsx`
- Delete: `src/pages/auth/LandingSection.tsx`

- [ ] **Step 1: Replace `Auth.tsx`**

```tsx
// src/pages/auth/Auth.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import AuthService from '@/core/auth/AuthService';
import BrandTemplate from './BrandTemplate';
import { AuthTab } from './authTabs';

const AuthPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [currentTab, setCurrentTab] = useState<AuthTab>(AuthTab.LOGIN);

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		if (searchParams.get('tab') === AuthTab.RESET_PASSWORD) return;
		const fetchUser = async () => {
			const tokenStr = await AuthService.getAcessToken();
			if (tokenStr) navigate('/');
		};
		fetchUser();
	}, [location.search, navigate]);

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const tab = searchParams.get('tab');
		if (tab === AuthTab.SIGNUP || tab === AuthTab.FORGOT_PASSWORD || tab === AuthTab.RESET_PASSWORD) {
			setCurrentTab(tab as AuthTab);
		} else {
			setCurrentTab(AuthTab.LOGIN);
		}
	}, [location]);

	const switchTab = (tab: AuthTab) => {
		navigate(`/auth?tab=${tab}`);
	};

	return <BrandTemplate currentTab={currentTab} switchTab={switchTab} />;
};

export default AuthPage;
```

- [ ] **Step 2: Delete the old LandingSection**

```bash
rm src/pages/auth/LandingSection.tsx
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -30
```

Expected: errors only for `LocaleSelector` (not yet created). No other errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/Auth.tsx
git rm src/pages/auth/LandingSection.tsx
git commit -m "feat(auth): slim Auth.tsx to tab state only; render via BrandTemplate"
```

---

## Phase 4: Locale Store & DirectionProvider

### Task 11: Create `useLocaleStore`

**Files:**
- Create: `src/store/useLocaleStore.ts`
- Modify: `src/store/index.ts`

- [ ] **Step 1: Write failing test**

Create `src/store/useLocaleStore.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// Reset store and i18n mock between tests
beforeEach(() => {
	vi.resetModules();
	localStorage.clear();
});

vi.mock('i18next', () => ({
	default: { changeLanguage: vi.fn() },
}));

vi.mock('@/config/config', () => ({
	config: {
		i18n: { locale: 'en', direction: 'ltr' },
		allowedLocales: ['en', 'ar'],
	},
}));

async function importStore() {
	const { useLocaleStore } = await import('./useLocaleStore');
	return useLocaleStore;
}

describe('useLocaleStore', () => {
	it('initialises with config default locale', async () => {
		const useLocaleStore = await importStore();
		const state = useLocaleStore.getState();
		expect(state.locale).toBe('en');
		expect(state.direction).toBe('ltr');
	});

	it('setLocale updates locale and direction', async () => {
		const useLocaleStore = await importStore();
		act(() => useLocaleStore.getState().setLocale('ar' as never));
		const state = useLocaleStore.getState();
		expect(state.locale).toBe('ar');
		expect(state.direction).toBe('rtl');
	});

	it('setLocale updates document direction', async () => {
		const useLocaleStore = await importStore();
		act(() => useLocaleStore.getState().setLocale('ar' as never));
		expect(document.documentElement.dir).toBe('rtl');
	});

	it('allowedLocales comes from config', async () => {
		const useLocaleStore = await importStore();
		expect(useLocaleStore.getState().allowedLocales).toEqual(['en', 'ar']);
	});
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/store/useLocaleStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `useLocaleStore.ts`**

```ts
// src/store/useLocaleStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Locale, Direction } from '@/config/branding';
import { config } from '@/config/config';
import i18n from 'i18next';

const RTL_LOCALES = new Set<Locale>([Locale.Ar, Locale.He, Locale.Fa, Locale.Ur]);

function deriveDirection(locale: Locale): Direction {
	return RTL_LOCALES.has(locale) ? Direction.RTL : Direction.LTR;
}

interface LocaleState {
	locale: Locale;
	direction: Direction;
	allowedLocales: Locale[];
	setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
	persist(
		(set) => ({
			locale: config.i18n.locale,
			direction: config.i18n.direction,
			allowedLocales: config.allowedLocales,
			setLocale: (locale: Locale) => {
				const direction = deriveDirection(locale);
				document.documentElement.lang = locale;
				document.documentElement.dir = direction;
				i18n.changeLanguage(locale);
				set({ locale, direction });
			},
		}),
		{
			name: 'flexprice_locale',
			// Only persist locale — direction is derived, allowedLocales comes from config
			partialize: (state) => ({ locale: state.locale }),
			onRehydrateStorage: () => (state) => {
				if (!state) return;
				// Recompute direction from rehydrated locale
				state.direction = deriveDirection(state.locale);
			},
		},
	),
);
```

- [ ] **Step 4: Update `src/store/index.ts`**

```ts
export { useApiDocsStore } from './useApiDocsStore';
export { useBreadcrumbsStore } from './useBreadcrumbsStore';
export { useLocaleStore } from './useLocaleStore';
```

- [ ] **Step 5: Run test — expect PASS**

```bash
npx vitest run src/store/useLocaleStore.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/store/useLocaleStore.ts src/store/useLocaleStore.test.ts src/store/index.ts
git commit -m "feat(locale): add Zustand persist locale store"
```

---

### Task 12: Install `@radix-ui/react-direction` and wire `main.tsx`

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/main.tsx`

- [ ] **Step 1: Install the package**

```bash
npm install @radix-ui/react-direction
```

- [ ] **Step 2: Update `main.tsx`**

```tsx
// src/main.tsx
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import PosthogProvider from './core/services/posthog/PosthogProvider.tsx';
import SentryProvider from './core/services/sentry/SentryProvider.tsx';
import VercelSpeedInsights from './core/services/vercel/vercel.tsx';
import { config } from './config/config.ts';
import { registerWebMCPTools } from './agent/webmcp.ts';
import { initBranding } from './config/branding.ts';
import { initI18n } from './i18n/index.ts';
import { DirectionProvider } from '@radix-ui/react-direction';
import { useLocaleStore } from './store/useLocaleStore.ts';
import React from 'react';

registerWebMCPTools();

// Reads direction from Zustand store — subscribes so Radix primitives re-render on locale change
function DirectionWrapper({ children }: { children: React.ReactNode }) {
	const direction = useLocaleStore((s) => s.direction);
	return <DirectionProvider dir={direction}>{children}</DirectionProvider>;
}

(async () => {
	initBranding();

	// Use persisted locale (from localStorage via Zustand) rather than the config default
	const { locale, direction } = useLocaleStore.getState();

	try {
		await initI18n(locale, direction);
	} catch (err) {
		console.error('[main] i18n initialization failed, rendering without translations:', err);
	}

	ReactDOM.createRoot(document.getElementById('root')!).render(
		<div>
			{config.app.isProd ? (
				<SentryProvider>
					<PosthogProvider>
						<DirectionWrapper>
							<App />
						</DirectionWrapper>
						<VercelSpeedInsights />
					</PosthogProvider>
				</SentryProvider>
			) : (
				<DirectionWrapper>
					<App />
				</DirectionWrapper>
			)}
		</div>,
	);
})();
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: no errors in main.tsx. Only remaining error should be `LocaleSelector` not found.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx package.json package-lock.json
git commit -m "feat(locale): wire DirectionProvider from @radix-ui/react-direction"
```

---

### Task 13: Create `LocaleSelector` component

**Files:**
- Create: `src/components/molecules/LocaleSelector/LocaleSelector.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/molecules/LocaleSelector/LocaleSelector.tsx
import React from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Locale } from '@/config/branding';

const LOCALE_LABELS: Record<Locale, string> = {
	[Locale.En]: 'English',
	[Locale.Ar]: 'العربية',
	[Locale.He]: 'עברית',
	[Locale.Fa]: 'فارسی',
	[Locale.Ur]: 'اردو',
};

const LocaleSelector: React.FC = () => {
	const { locale, allowedLocales, setLocale } = useLocaleStore();

	// No point rendering if there's only one language option
	if (allowedLocales.length <= 1) return null;

	return (
		<Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
			<SelectTrigger className='w-auto gap-1.5 border-none shadow-none text-sm text-gray-500 hover:text-gray-700 px-0'>
				<Globe size={14} />
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{allowedLocales.map((l) => (
					<SelectItem key={l} value={l}>
						{LOCALE_LABELS[l] ?? l}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

export default LocaleSelector;
```

- [ ] **Step 2: Run full TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules"
```

Expected: zero errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/molecules/LocaleSelector/LocaleSelector.tsx
git commit -m "feat(locale): add LocaleSelector component"
```

---

## Final verification

- [ ] **Start dev server and verify auth page renders correctly**

```bash
npm run dev
```

Open `http://localhost:3000/auth`. Verify:
1. Login page renders (Template 1 — two columns, testimonials on right)
2. No console errors
3. Locale selector appears at bottom-left of form column
4. Region selector hidden (no URLs configured locally)

- [ ] **Run full test suite one final time**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(auth): complete auth template + region + locale systems"
```
