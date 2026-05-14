# i18n multi-agent coordination

Operational guide for splitting localization work across multiple agents without merge conflicts.

## Roles

### Assignment record (fill before parallel runs)

| Role | Owner / handle | Notes |
|------|----------------|-------|
| Common shepherd | _assign one person_ | Exclusive merge for `common.json` (EN + AR); others propose keys only |
| `billing` lead | _assign one agent_ | Branch `i18n/billing`; owns `billing.json` + billing replacement map |
| `catalog` lead | _assign one agent_ | Branch `i18n/catalog` |
| `customers` lead | _assign one agent_ | Branch `i18n/customers` |
| `developers` lead | _assign one agent_ | Branch `i18n/developers` |
| `settings` lead | _assign one agent_ | Branch `i18n/settings` |
| `customer-portal` lead | _assign one agent_ | Branch `i18n/customer-portal` |

Replace `_assign …_` with names or GitHub handles at sprint start; keeps merges predictable across Claude/Codex workers.

### Common shepherd (required)

Pick **one owner** per merge window who has exclusive rights to **`src/i18n/locales/en/common.json`** and **`src/i18n/locales/ar/common.json`**.

- **Purpose:** Strings used in **two or more product namespaces** must live under `common` (see [`2026-05-14-i18n-localization-design.md`](specs/2026-05-14-i18n-localization-design.md)).
- **Feature-agent rule:** Prefer adding keys **only** to `<namespace>.json` on feature branches; if you notice a dup (e.g. “Cancel”), note it or use `common:…` prefixed keys in the replacement map (`scripts/i18n-replacements/<namespace>.json`) and let the shepherd merge the corresponding key into **common EN/AR JSON** once, centrally.
- **Conflict prevention:** Avoid multiple open PRs that each edit **common**.

## Namespace ownership (parallel work)

- **Exactly one branch per actively migrated namespace.** Example: `i18n/billing`, `i18n/catalog`.
- **Authoritative globs:** Only `NAMESPACE_GLOBS` inside [`scripts/extract-i18n.mjs`](../../scripts/extract-i18n.mjs). That map defines which `.tsx` files belong to extract/apply runs for each namespace — not informal path lists elsewhere.
- **Do not migrate the same `.tsx` from two namespaces in parallel.**

**Migration order (design spec):** common → customers → billing → catalog → developers → settings → customer-portal. The implementation plan’s task numbers may list namespaces differently; use this order when scheduling parallel agent work.

## Branch workflow

1. Cut `i18n/<namespace>` off current `main`.
2. Extract → Review JSON → Align replacement map keys → Apply (see [`plans/2026-05-14-i18n-localization.md`](plans/2026-05-14-i18n-localization.md)).
3. Run ESLint/typecheck scopes listed in that plan task for `<namespace>` and smoke EN/AR in the UI.
4. Prefer **one namespace per merged PR.**

## Replacement maps (`common:` keys)

Strings hoisted into **common** from a **feature** extraction should use **`suggestedKey` values prefixed with `common:`** (example: `common:actions.cancel`).

After merging:

- **`apply-i18n.mjs` does not automatically add `'common'` to the `useTranslation` hook.** If `suggestedKey` uses `common:…`, either run apply and then **hand-fix** hooks to `useTranslation(['<namespace>', 'common'])`, or add that hook when editing manually.
- Hand-edited files should use **`useTranslation([namespace, 'common'])`** whenever the component calls **`t('common:…')`**.

## Repo hygiene

Generated replacement maps (`scripts/i18n-replacements/`) can be regenerated from extract; `.gitignore` ignores that directory (implementation plan Task 12). Prefer **committed** authoritative locale JSON (`src/i18n/locales/**/*.json`), not scaffold maps.

## ESLint baseline (full codebase)

The plan’s final regression check is counting **remaining** [`i18next/no-literal-string`](../../eslint.config.js) hits under `src/pages` / `src/components`. Run periodically while migrations land:

```bash
npx eslint src/pages src/components --max-warnings 0 2>&1 | rg "i18next/no-literal-string" || true
```

Expect the count to move toward zero as namespaces complete; suppression lines should stay rare.
