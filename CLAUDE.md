# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`ledger` is a personal income/expenses/wishlist tracker shipped as an installable PWA.
Today only the **Wishlist** tab is implemented; Income and Expenses are "Coming soon" stub
panels in `src/main.ts`. The app is **framework-free**: vanilla TypeScript with direct DOM
manipulation, no React/Vue/Svelte and no runtime dependencies. All user data lives in the
browser's `localStorage` — there is no backend.

## Commands

```bash
npm run dev        # Vite dev server (service worker is disabled in dev)
npm run build      # tsc --noEmit && vite build  → outputs to dist/
npm run typecheck  # tsc --noEmit  (type check only)
npm run preview    # serve the production build from dist/
npm run gen:icons  # regenerate PWA icons + favicon into public/ via scripts/generate-icons.mjs
```

There is **no test runner and no linter/formatter** configured. `npm run build` is the only
gate — and because it runs `tsc --noEmit` first, type errors fail the build. Run
`npm run typecheck` after changes to catch them quickly. The project uses npm
(`package-lock.json`); CI runs `npm ci`.

## Architecture

Entry: `index.html` mounts `<div id="app">`, and `src/main.ts` builds the whole UI
imperatively — it registers the service worker, constructs the header/tabs/footer, and wires
tab switching by toggling `panel.hidden`. There is no router; tabs are pure UI state.

The wishlist feature lives in `src/wishlist/`:
- `types.ts` — `WishlistItem` / `WishlistDraft` and the `CURRENCIES` union.
- `store.ts` — `WishlistStore`: in-memory `WishlistItem[]` persisted to `localStorage`
  under key `ledger.wishlist.v1`. On first run it seeds from `seed.ts`. Mutations
  (`add`/`update`/`remove`/`toggleAcquired`) call `commit()` which persists then notifies
  `subscribe()` listeners — a minimal observer pattern that drives re-renders.
- `view.ts` — `mountWishlist(panel, store)` renders the form, per-currency totals, and the
  item list, re-rendering on store updates.
- `totals.ts` — aggregation (`totalsByCurrency`) and `Intl.NumberFormat` money formatting.

Data flow: **store mutation → persist to localStorage → notify subscribers → view re-renders**.
The store is the single source of truth; the view holds no state of its own.

## Conventions & gotchas

- **Imports use explicit `.ts` extensions** (e.g. `import { h } from './dom.ts'`). This is
  intentional and required by the `tsconfig` `"moduleResolution": "bundler"` setup — match it
  in new files.
- **Build DOM with `h()` from `src/dom.ts`**, not raw `document.createElement` or innerHTML.
  `h(tag, props, children)` is a typed hyperscript factory; `clear(node)` empties an element.
  Set text via the `text` prop and listeners via the `on` prop. Adding a new HTML attribute
  may require extending the `Props` type in `dom.ts`.
- **Currency is RON-only right now.** The model supports a `Currency` union, but the form
  hardcodes RON and `store.ts#parseItem` coerces any unknown/legacy currency (e.g. old EUR
  data) to `RON`. Add new currencies to `CURRENCIES` in `types.ts` before using them.
- **`tsconfig.json` is strict** (strict mode + `noUnusedLocals`/`noUnusedParameters` +
  `exactOptionalPropertyTypes`). Unused vars and loose optional props fail the build.
- **Persistence is defensive**: all `localStorage` access is wrapped in try/catch so the app
  keeps working in-memory when storage is unavailable (private mode / quota). Preserve this.

## Deployment

`vite.config.ts` sets `base: '/ledger/'` because the site is served from a GitHub Pages
project path (`https://<user>.github.io/ledger/`); the PWA manifest `scope`/`start_url` and
Workbox `navigateFallback` all derive from this base — keep them in sync if it changes.
`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main`
(also manually dispatchable), so merging to `main` ships to production. The service worker
uses `registerType: 'autoUpdate'`.
