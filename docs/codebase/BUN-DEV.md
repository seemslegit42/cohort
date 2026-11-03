# Bun-backed dev workflow (lxv CRM)

This repo uses [Bun](https://bun.com) as the runtime. **We do not use `ng serve`** for default dev — that is Angular’s separate “simple server” for debugging, not Bun.

## Default: `bun run dev`

Runs **in parallel** (no waiting for the first Angular build before :3000 is live):

1. **`node …/ng.js build --watch --configuration development`** → **`dist/app/browser`**
2. **`bun --hot scripts/dev-server.ts`** on **127.0.0.1:3000** — [Bun fullstack dev server](https://bun.com/docs/bundler/fullstack) with **`development: { hmr: true, console: true }`**, static Angular output, **embedded Express** `/api/*`.

Until `index.html` exists, Bun serves a short “building…” page (auto-refresh). When watch writes new chunks, Bun’s dev server applies **[HMR / live reload](https://bun.com/docs/bundler/hmr)** to the served assets (full reload is normal for prebuilt Angular chunks unless you add `import.meta.hot` boundaries in Bun-bundled entries).

Orchestration: `scripts/dev.ts`.

Angular is too large for Bun’s HTML-import bundling path as the **compiler**; **`ng build --watch`** still produces the browser bundle. SSR remains production `ng build` + optional **`bun compile`**.

### Optional: `bun run dev:angular`

`ng serve` on :3000 + `bun --hot` API on :3001 — **faster TypeScript iteration**, but **not** Bun’s `import.meta.hot` pipeline for the UI.

## Other scripts

| Script | Use |
|--------|-----|
| `bun run dev:angular` | `ng serve` + Bun hot API (faster UI edits, not Bun HMR) |
| `bun run dev:ui` | Fullstack `Bun.serve` (needs `dist/app/browser`; embeds API unless `API_ORIGIN` is set) |
| `bun run dev:api` | Standalone hot API on :3001 (`api-main.ts`; for tests or split debugging) |
| `bun run build:fast` | One-off static browser build (no server bundle) |
| `bun run build` | Production SSR (`dist/app`) — slow; for CI/release |
| `bun run compile:ssr` | **`bun compile`** on `dist/app/server/*.mjs` + `--asset` browser/server dirs ([Bun Angular note](https://bun.com/docs/compiler/aot)) |
| `bun run serve:ssr:app` | Run built `server.mjs` with Bun (uncompiled) |
| `bun run test:server` | `bun test ./src/server` |

## Production / compile

Angular resolves routes at **runtime** on the server bundle. For **`bun compile`**, pass **all page `.mjs` chunks** beside `server.mjs` as entry points and embed assets:

```bash
bun run build
bun run compile:ssr   # → dist/lxv-crm
```

## `bunfig.toml`

- `[install] auto = "disable"`, `prefer = "offline"`
- `[run] bun = true` — app scripts run on Bun; **Angular CLI** is invoked via **Node** (`package.json` `ng` script) because Bun’s runner breaks Angular SSR route extraction (`memory:` import).

## Zoneless Angular

This app uses **zoneless** change detection (required for Bun AOT compatibility — no `zone.js` patching).
