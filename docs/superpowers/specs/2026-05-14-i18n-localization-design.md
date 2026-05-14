# i18n Localization Architecture Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully localize the Flexprice frontend (English + Arabic) using a feature-namespace architecture with a hybrid automated-extraction + manual-review migration workflow.

**Architecture:** Eight i18next namespaces aligned to product areas, lazy-loaded per route via `i18next-resources-to-backend`. A scaffold extraction script generates draft JSON + replacement maps; developers review and rename keys; an apply script patches source files. The existing ESLint `i18next/no-literal-string` guard enforces compliance on all future commits.

**Tech Stack:** i18next v26, react-i18next v17, i18next-resources-to-backend, ESLint plugin i18next, Vite (dynamic import code-splitting), Node.js ESM scripts

---

## Current State

- ~407 `.tsx` files (96 pages, 311 components)
- ~900+ translatable strings across the product
- Only `auth` namespace is localized (20 files, 79 keys each language)
- Languages: English (`en`), Arabic (`ar`, RTL)
- Infrastructure: i18next already initialized; ESLint guard already active on pre-commit

---

## 1. Namespace Structure

### Namespaces

| Namespace | Owns strings from | Files |
|---|---|---|
| `common` | Shared strings used in ≥2 namespaces: buttons, status labels, validation errors, pagination, empty states, toast templates | `src/components/atoms/**`, shared molecules |
| `auth` | Auth pages and templates | `src/pages/auth/**` ✅ already complete |
| `billing` | Invoices, payments, credit notes, subscriptions | `src/pages/billing/**`, `*Invoice*`, `*Payment*`, `*CreditNote*`, `*Subscription*` |
| `catalog` | Features, plans, coupons, addons, price units, groups, cost sheets | `src/pages/features/**`, `src/pages/plan/**`, `*Coupon*`, `*Addon*`, `*CostSheet*`, `*PriceUnit*`, `*Group*` |
| `customers` | Customer list, customer detail, usage analytics | `src/pages/customers/**`, `*Customer*` molecules |
| `developers` | Events debugger, API keys, service accounts, webhooks, workflows | `src/pages/developers/**`, `*Events*`, `*SecretKey*`, `*ServiceAccount*`, `*Webhook*`, `*Workflow*` |
| `settings` | Org settings, team members, integrations, imports, exports | `src/pages/settings/**`, `*Tenant*`, `*Integration*`, `*Import*`, `*Export*` |
| `customer-portal` | Customer-facing portal (white-label surface) | `src/components/customer-portal/**`, `src/pages/customer-portal/**` |

### File Layout

```
src/i18n/
  index.ts                    ← updated to use lazy backend
  locales/
    en/
      common.json
      auth.json               ← exists, complete
      billing.json
      catalog.json
      customers.json
      developers.json
      settings.json
      customer-portal.json
    ar/
      common.json             ← mirrors en/ structure
      auth.json               ← exists, complete
      billing.json
      catalog.json
      customers.json
      developers.json
      settings.json
      customer-portal.json
```

---

## 2. Key Naming Convention

### Structure

`section.subsection.key` — max 3 levels, always camelCase segments.

```json
// billing.json
{
  "invoices": {
    "title": "Invoices",
    "empty": "No invoices found",
    "columns": {
      "invoiceId": "Invoice ID",
      "amount": "Amount due",
      "status": "Status",
      "dueDate": "Due date"
    },
    "actions": {
      "download": "Download PDF",
      "void": "Void invoice"
    },
    "toast": {
      "voidSuccess": "Invoice voided successfully",
      "downloadError": "Failed to download invoice"
    }
  },
  "subscriptions": {
    "title": "Subscriptions",
    "addSuccess": "Subscription created successfully",
    "archiveConfirm": "Are you sure you want to archive this subscription?"
  }
}
```

### common.json Structure

```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "add": "Add",
    "edit": "Edit",
    "archive": "Archive",
    "delete": "Delete",
    "confirm": "Confirm",
    "close": "Close",
    "search": "Search",
    "export": "Export",
    "import": "Import",
    "viewAll": "View all",
    "back": "Back",
    "create": "Create",
    "update": "Update"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "draft": "Draft",
    "cancelled": "Cancelled",
    "loading": "Loading..."
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be at most {{max}} characters"
  },
  "table": {
    "noResults": "No results found",
    "empty": "No data yet",
    "loading": "Loading..."
  },
  "pagination": {
    "showing": "Showing {{from}}–{{to}} of {{total}}",
    "previous": "Previous",
    "next": "Next"
  },
  "toast": {
    "createSuccess": "{{entity}} created successfully",
    "updateSuccess": "{{entity}} updated successfully",
    "archiveSuccess": "{{entity}} archived successfully",
    "deleteSuccess": "{{entity}} deleted successfully",
    "genericError": "Something went wrong. Please try again."
  },
  "confirm": {
    "archiveTitle": "Archive {{entity}}?",
    "archiveDescription": "This action can be undone from the settings page.",
    "deleteTitle": "Delete {{entity}}?",
    "deleteDescription": "This action cannot be undone."
  }
}
```

### Rules

1. `common` owns any string used in 2+ namespaces — "Cancel" is never `billing.actions.cancel`
2. Max 3 key levels — `invoices.columns.amount` ✓, `invoices.table.columns.cells.amount` ✗
3. Toast messages use `{{entity}}` interpolation instead of one key per entity type
4. No component name in key — `invoices.title` not `invoicesPage.invoicesPageTitle`
5. Feature-specific strings stay in their namespace even if used by a shared component (e.g. an `InvoiceDrawer` used only in billing gets keys in `billing`, not `common`)

---

## 3. i18n Infrastructure

### Updated `src/i18n/index.ts`

Replace the current hardcoded `Promise.all` import pattern with a lazy backend:

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { Direction } from '@/config/branding';

export const NAMESPACES = [
  'auth', 'common', 'billing', 'catalog',
  'customers', 'developers', 'settings', 'customer-portal',
] as const;

export type Namespace = typeof NAMESPACES[number];

export async function initI18n(locale: string, direction: Direction): Promise<void> {
  if (i18n.isInitialized) {
    await i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    return;
  }

  await i18n
    .use(resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    ))
    .use(initReactI18next)
    .init({
      lng: locale,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: NAMESPACES,
      partialBundledLanguages: true,
      interpolation: { escapeValue: false },
    });

  document.documentElement.lang = locale;
  document.documentElement.dir = direction;
}
```

**Key behaviors:**
- Vite code-splits each locale JSON into its own chunk — no bundle bloat
- Namespaces load on demand the first time `useTranslation('billing')` is called
- `fallbackLng: 'en'` means missing Arabic keys silently fall back to English — no crashes
- `defaultNS: 'common'` means `t('actions.save')` in any component resolves from `common` without an explicit prefix
- New namespace = create JSON files + add to `NAMESPACES` array — no other init changes

### Install

```bash
npm install i18next-resources-to-backend
```

### useTranslation Patterns

```tsx
// Single namespace (most components)
const { t } = useTranslation('billing');
t('invoices.title')
t('invoices.columns.amount')

// Multiple namespaces (component needs both feature + common strings)
const { t } = useTranslation(['billing', 'common']);
t('invoices.title')            // billing (first namespace, no prefix needed)
t('common:actions.cancel')     // explicit prefix for common

// defaultNS shortcut — in components that only need common strings
const { t } = useTranslation();  // resolves from 'common'
t('actions.save')
```

### TypeScript Key Safety (Phase 2)

After all JSON files are finalized and stable, add declaration merging to get autocomplete and catch missing keys at compile time:

```ts
// src/i18n/types.d.ts
import en from './locales/en/common.json';
import billing from './locales/en/billing.json';
// ... etc

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof en;
      billing: typeof billing;
      // ...
    };
  }
}
```

This is a follow-up task — do not implement until key names are stable.

---

## 4. Migration Workflow

### Three Phases Per Namespace

#### Phase 1 — Extract (automated)

Script: `scripts/extract-i18n.mjs`

**What it does:**
1. Runs `eslint --format json` scoped to the namespace's file path globs
2. Reads every `i18next/no-literal-string` violation
3. Slugifies the string content + component name into a candidate key name
4. Deduplicates: identical strings get the same key
5. Outputs two files:
   - `src/i18n/locales/en/<namespace>.json` — draft English keys
   - `scripts/i18n-replacements/<namespace>.json` — replacement map: `{ file, line, col, originalString, suggestedKey, namespace }`

```bash
node scripts/extract-i18n.mjs --namespace billing
```

**Script internals:**
- Accepts `--namespace <name>` and resolves file globs from a hardcoded namespace→paths map
- Uses `eslint` Node API (not subprocess) for clean JSON output
- Key generation: lowercase, strip punctuation, max 4 words → `invoiceIdColumnHeader` → reviewer renames to `invoices.columns.invoiceId`

#### Phase 2 — Review (manual, ~1–2 hours per namespace)

Developer opens `src/i18n/locales/en/<namespace>.json` and:

1. Renames auto-generated keys to follow the 3-level convention
2. Moves any string that belongs to `common` (used in multiple namespaces) to `common.json` and updates the replacement map
3. Merges duplicates — multiple occurrences of "No results found" all point to `common:table.noResults`
4. Creates `src/i18n/locales/ar/<namespace>.json` as a copy of `en/` with values set to `""` (empty) — translator fills these in
5. Updates `scripts/i18n-replacements/<namespace>.json` with finalized key names

#### Phase 3 — Apply (automated)

Script: `scripts/apply-i18n.mjs`

**What it does:**
1. Reads `scripts/i18n-replacements/<namespace>.json`
2. For each file in the map:
   - Checks if `useTranslation` is already imported; adds it if not
   - Adds `const { t } = useTranslation('namespace')` to component body if missing
   - Replaces each hardcoded string at the specified line/col with `t('key')`
   - Handles JSX text nodes: `Documentation` → `{t('sidebar.documentation')}`
   - Handles string attributes: `placeholder="Search..."` → `placeholder={t('common:actions.search')}`
   - Handles ternary strings in JSX: `{isLoading ? 'Loading...' : 'Submit'}` → `{isLoading ? t('common:status.loading') : t('form.submit')}`

```bash
node scripts/apply-i18n.mjs --namespace billing
npx eslint src/pages/billing --fix   # clean up formatting
npx tsc --noEmit                      # catch type errors
```

After apply: `git diff` for review, fix anything the script got wrong, commit.

### Recommended Namespace Order

| Order | Namespace | Reason |
|---|---|---|
| 1 | `common` | Unblocks everything else; shared strings referenced first |
| 2 | `customers` | High-traffic, high-visibility |
| 3 | `billing` | Core product value |
| 4 | `catalog` | Large but mostly static labels |
| 5 | `developers` | Power users, lower urgency |
| 6 | `settings` | Low frequency |
| 7 | `customer-portal` | Isolated surface, easiest to test end-to-end |

### Arabic Translation Workflow

For each namespace after Phase 3:
1. `ar/<namespace>.json` has empty values `""`
2. Translator fills in Arabic translations directly in the JSON file
3. PR review by a native Arabic speaker
4. `fallbackLng: 'en'` ensures empty/missing values don't break the UI during translation

---

## 5. Ongoing Enforcement

The ESLint `i18next/no-literal-string` rule is already configured in `eslint.config.js` and runs via `lint-staged` on every commit. Any new `.tsx` file staged for commit with a hardcoded JSX string or a user-facing attribute (`placeholder`, `aria-label`, `title`, `alt`) will fail the pre-commit hook.

To suppress a known exception (e.g. a debug-only component):
```tsx
// eslint-disable-next-line i18next/no-literal-string
<span>Debug: raw value</span>
```

---

## 6. Out of Scope

- **TypeScript key safety** — deferred to Phase 2 after keys are stable
- **Pluralization** — not required for current en/ar scope; i18next supports it natively when needed
- **Number/date formatting** — handled separately via `Intl` where needed; not part of this design
- **External TMS sync** — manual JSON files in git is the chosen workflow
