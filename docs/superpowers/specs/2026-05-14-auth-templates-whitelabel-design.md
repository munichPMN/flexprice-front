# Auth Templates, White-Label Region Selector & Language Switcher

**Date:** 2026-05-14  
**Branch:** feat/auth-templates  
**Status:** Approved

---

## Overview

Three coordinated subsystems to support complete white-labelling of the auth page and runtime language switching:

1. **Auth Template System** — config-driven layout dispatch; Template 1 = Flexprice default (minimal config), Template 2+ = white-label brands
2. **Config-driven Region Selector** — regions defined in `VITE_AUTH_CONFIG` with full backward compatibility for existing env vars
3. **Language Switcher + DirectionProvider** — Zustand-persisted locale store + Radix `DirectionProvider` for RTL support

---

## Subsystem 1: Auth Template System

### Enums & Config Contracts

**File:** `src/config/authTemplates.ts`

```ts
export enum AUTH_TEMPLATE {
  TEMPLATE_1 = 'template_1',
  TEMPLATE_2 = 'template_2',
}

// Template 1 — Flexprice default, minimal config (no new fields added)
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

// Template 2 — white-label brands, the customisable layout
export interface Template2Config {
  tagline: string | null;
  supportEmail: string;
  loginBgImage: string | null;
  landingBgColor: string | null;   // fallback if no image
  showLogoOnLanding: boolean;
}

// Discriminated union — template field narrows config type, no casts needed
export type AuthPageConfig =
  | { template: AUTH_TEMPLATE.TEMPLATE_1; config: Template1Config }
  | { template: AUTH_TEMPLATE.TEMPLATE_2; config: Template2Config }
```

### Parser

`parseAuthPageConfig()` in `branding.ts` reads `VITE_AUTH_CONFIG`, inspects the `template` field (defaults to `TEMPLATE_1` if absent or unrecognised), then parses the matching config shape with safe defaults. The existing `AuthPageConfig` interface in `branding.ts` is replaced by the discriminated union above.

Default `VITE_AUTH_CONFIG` for Flexprice (template 1, all fields optional):
```json
{
  "template": "template_1",
  "tagline": null,
  "supportEmail": "support@flexprice.io",
  "slackCommunityUrl": "https://join.slack.com/...",
  "showTestimonials": true,
  "landingTheme": "light",
  "landingContentAlign": "center",
  "showLogoOnLanding": false
}
```

### Component Structure

```
src/pages/auth/
├── Auth.tsx                          ← thin shell: auth redirect, tab state, renders <BrandTemplate />
├── BrandTemplate.tsx                 ← switch on template, renders Template1 or Template2
├── templates/
│   ├── Template1/
│   │   ├── Template1.tsx             ← current Auth.tsx layout (two-col + LandingSection), zero behaviour change
│   │   └── LandingSection.tsx        ← moved here from pages/auth/, receives Template1Config
│   └── Template2/
│       └── Template2.tsx             ← two-col: form left, styled bg right (color/image + optional logo/tagline)
└── forms/                            ← shared across all templates, unchanged
    ├── LoginForm.tsx
    ├── SignupForm.tsx
    ├── ForgotPasswordForm.tsx
    └── ResetPasswordForm.tsx
```

**Auth.tsx** owns tab routing and auth redirect (unchanged logic). It renders `<BrandTemplate currentTab={currentTab} switchTab={switchTab} />`.

**BrandTemplate.tsx:**
```tsx
switch (authPageConfig.template) {
  case AUTH_TEMPLATE.TEMPLATE_1:
    return <Template1 config={authPageConfig.config} currentTab={currentTab} switchTab={switchTab} />;
  case AUTH_TEMPLATE.TEMPLATE_2:
    return <Template2 config={authPageConfig.config} currentTab={currentTab} switchTab={switchTab} />;
}
```

**Template1** is a direct relocation of the current `Auth.tsx` two-column layout + `LandingSection`. No behaviour changes. Slack banner and `RegionSelector` stay inside the form column.

**Template2** renders the same form column on the left. The right panel is a full-height div with `background-color: landingBgColor` or `background-image: url(loginBgImage)`, plus an optional centered logo and tagline. No testimonials.

---

## Subsystem 2: Config-driven Region Selector

### Config Contract

Regions are defined inside `VITE_AUTH_CONFIG`:

```ts
export interface RegionOption {
  key: string;         // e.g. "india", "us", "sa"
  label: string;       // e.g. "India", "United States", "Saudi Arabia"
  url: string;         // full dashboard URL for this region
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "IN", "US", "SA"
}

export interface RegionsConfig {
  enabled: boolean;
  regions: RegionOption[];
}
```

Example `VITE_AUTH_CONFIG` for a brand with Saudi Arabia + US:
```json
{
  "template": "template_2",
  "regions": {
    "enabled": true,
    "regions": [
      { "key": "sa", "label": "Saudi Arabia", "url": "https://sa.brand.com", "countryCode": "SA" },
      { "key": "us", "label": "United States", "url": "https://us.brand.com", "countryCode": "US" }
    ]
  }
}
```

### Backward Compatibility

`parseRegionsConfig()` applies this fallback chain:

1. If `VITE_AUTH_CONFIG` contains `regions.regions` with at least one entry → use it
2. Otherwise → construct `RegionOption[]` from legacy env vars:
   - `VITE_DASHBOARD_URL_INDIA` → `{ key: 'india', label: 'India', countryCode: 'IN', url: ... }`
   - `VITE_DASHBOARD_URL_US` → `{ key: 'us', label: 'United States', countryCode: 'US', url: ... }`
   - `enabled` derived from `VITE_DATA_REGION_SELECTION_ENABLED === 'true'`
3. If neither → `{ enabled: false, regions: [] }` → `RegionSelector` renders nothing

**Nothing is removed.** Old env vars (`VITE_DASHBOARD_URL_INDIA`, `VITE_DASHBOARD_URL_US`, `VITE_DATA_REGION_SELECTION_ENABLED`) and `config.region.*` fields remain in place. Existing deployments require zero changes.

### Runtime Flag Resolution

```ts
// src/utils/region/flagMap.ts
import * as Flags from 'country-flag-icons/react/3x2';

export function getFlagComponent(countryCode: string): React.ComponentType<{ className?: string }> | null {
  return (Flags as Record<string, React.ComponentType<{ className?: string }>>)[countryCode.toUpperCase()] ?? null;
}
```

`RegionSelector` calls `getFlagComponent(region.countryCode)` at render time. The hardcoded `IN`/`US` imports are removed from `RegionSelector.tsx`.

### Region Detection

`detectCurrentRegion()` in `regionUtils.ts` is refactored to accept `RegionOption[]` and return the entry whose URL origin matches `window.location.origin`, or `null`. `switchRegion()` navigates to `region.url` + current pathname + search params (same behaviour as today).

The hardcoded `Region` enum stays in `src/types/enums/Region.ts` — it is not removed (backward compatibility), but `RegionSelector` no longer references it.

---

## Subsystem 3: Language Switcher + DirectionProvider

### How `@radix-ui/react-direction` helps

Radix UI primitives (`Select`, `DropdownMenu`, `Dialog`, `Popover`, etc.) call `useDirection()` internally to flip their open/close positioning and internal layout for RTL. Wrapping the app in `<DirectionProvider dir={...}>` means all Radix components automatically mirror for RTL — no per-component props needed. This is complementary to `document.documentElement.dir` (which handles Tailwind `rtl:` variants and native HTML).

`@radix-ui/react-direction` is already a transitive dependency. It needs to be added as a direct dependency.

### Zustand Locale Store

**File:** `src/store/useLocaleStore.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Locale, Direction } from '@/config/branding';
import i18n from 'i18next';

const RTL_LOCALES = new Set<Locale>([Locale.Ar, Locale.He, Locale.Fa, Locale.Ur]);
const SUPPORTED_LOCALES: Locale[] = [Locale.En, Locale.Ar]; // grows as locales are added to i18n bundle

interface LocaleState {
  locale: Locale;
  direction: Direction;
  allowedLocales: Locale[];   // subset configured by brand, or SUPPORTED_LOCALES if not set
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: config.i18n.locale,              // VITE_DEFAULT_LOCALE → 'en' fallback (already parsed)
      direction: config.i18n.direction,        // derived from locale via RTL_LOCALES set
      allowedLocales: parsedAllowedLocales,    // from VITE_AUTH_CONFIG.allowedLocales or SUPPORTED_LOCALES
      setLocale: (locale) => {
        const direction = RTL_LOCALES.has(locale) ? Direction.RTL : Direction.LTR;
        i18n.changeLanguage(locale);
        document.documentElement.lang = locale;
        document.documentElement.dir = direction;
        set({ locale, direction });
      },
    }),
    { name: 'flexprice_locale', partialize: (s) => ({ locale: s.locale }) }
  )
);
```

**Initial locale priority:** `localStorage ('flexprice_locale')` → `VITE_DEFAULT_LOCALE` config → `'en'`

`allowedLocales` is not persisted — it comes from brand config at parse time. `SUPPORTED_LOCALES` is the source of truth for "all supported locales"; brands can optionally restrict via `allowedLocales` in `VITE_AUTH_CONFIG`:

```json
{ "allowedLocales": ["en", "ar"] }
```

If absent → `allowedLocales` = `SUPPORTED_LOCALES`.

### DirectionProvider Wiring

**File:** `src/main.tsx`

```tsx
import { DirectionProvider } from '@radix-ui/react-direction';
import { useLocaleStore } from './store/useLocaleStore';

// Inside render — reads initial direction from store (already hydrated from localStorage)
const direction = useLocaleStore.getState().direction;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <DirectionProvider dir={direction}>
    <App />
  </DirectionProvider>
);
```

Because `setLocale` updates `document.documentElement.dir` reactively, Tailwind RTL variants respond immediately. For `DirectionProvider` to re-render with the new direction on locale change, `App.tsx` (or a thin wrapper) subscribes to `useLocaleStore` and re-passes `dir` to `DirectionProvider`. (Alternative: move `DirectionProvider` into a component that reads from the store via the hook.)

### LocaleSelector Component

**File:** `src/components/molecules/LocaleSelector/LocaleSelector.tsx`

- Reads `locale`, `allowedLocales` from `useLocaleStore`
- Calls `setLocale()` on selection
- Renders a compact `<Select>` with globe icon + locale label
- No knowledge of localStorage, i18n, or direction internals

**Auth page placement:** bottom-left corner of the form column, inside each template's form column (Template1 and Template2 both include it).

**In-app placement:** user profile / settings section — same component, no duplication.

---

## Files Changed Summary

| File | Action |
|------|--------|
| `src/config/authTemplates.ts` | New — enums, interfaces, discriminated union |
| `src/config/branding.ts` | Update — `parseAuthPageConfig` uses new union; add `parseRegionsConfig`; `AuthPageConfig` replaced |
| `src/config/config.ts` | Update — `authPage` type updated; `regionsConfig` added |
| `src/pages/auth/Auth.tsx` | Slim down — remove layout, only tab state + auth redirect + `<BrandTemplate />` |
| `src/pages/auth/BrandTemplate.tsx` | New — template dispatch switch |
| `src/pages/auth/templates/Template1/Template1.tsx` | New — current Auth.tsx layout relocated |
| `src/pages/auth/templates/Template1/LandingSection.tsx` | Moved — from `src/pages/auth/LandingSection.tsx` |
| `src/pages/auth/templates/Template2/Template2.tsx` | New — simple two-col with styled right panel |
| `src/utils/region/flagMap.ts` | New — countryCode → flag component lookup |
| `src/utils/region/regionUtils.ts` | Update — `detectCurrentRegion` and `switchRegion` use `RegionOption[]` |
| `src/components/molecules/RegionSelector/RegionSelector.tsx` | Update — use `RegionOption[]` from config, call `getFlagComponent` |
| `src/store/useLocaleStore.ts` | New — Zustand persist store for locale + direction |
| `src/store/index.ts` | Update — export `useLocaleStore` |
| `src/main.tsx` | Update — add `DirectionProvider` wrapper |
| `src/components/molecules/LocaleSelector/LocaleSelector.tsx` | New — shared locale picker component |
| `package.json` | Add `@radix-ui/react-direction` as direct dependency |

---

## Out of Scope

- Adding new locale translation files (separate task per locale)
- Template 3+ (added when a new brand requires a distinct layout)
- Removing legacy `Region` enum or old `config.region.*` fields
- In-app settings page UI (just the `LocaleSelector` placement, not the full settings page build)
