# Testing

## Core Sections (Required)

### 1) Frameworks

| Layer | Runner | Evidence |
|-------|--------|----------|
| Angular app | Vitest via `@angular/build:unit-test` | `angular.json`, `package.json` `vitest` devDependency |
| Node server (`src/server`) | Bun test (`bun:test`) | `package.json` `test:server`, `src/server/*.spec.ts` |

### 2) Test files (server)

| File | Focus |
|------|--------|
| `src/server/appwrite-mapper.spec.ts` | Typed Appwrite map/unmap, legacy `dataPayload`, notification `isRead` |
| `src/server/agentfs.spec.ts` | Tenant key sanitization, `.agentfs` DB path |

### 3) Test files (client)

| File | Focus |
|------|--------|
| `src/app/app.spec.ts` | Smoke: `App` creates in TestBed |

No broad component/integration suite detected in scan beyond `app.spec.ts`. [TODO: e2e config if planned]

### 4) Commands

```bash
bun run test          # ng test
bun run test:server   # bun test ./src/server
```

### 5) Mocking / isolation

- Server specs are pure unit tests (no live Appwrite in mapper spec)
- [TODO: document Appwrite/Gemini mocking strategy for Angular tests if used]

### 6) CI

GitHub Actions workflow `.github/workflows/ci.yml`: `bun install --frozen-lockfile`, `bun test ./src/server`, `bun run build` on push and pull_request.

### 7) Evidence

- `package.json`
- `angular.json` (`test` target)
- `src/server/appwrite-mapper.spec.ts`
- `src/server/agentfs.spec.ts`
- `src/app/app.spec.ts`
- `tsconfig.spec.json`
- `docs/codebase/.codebase-scan.txt`

## Extended Sections (Optional)

Not added.
