# NEXT STEPS - Remaining Development Work

## Status: Week 1 MVP Complete, Week 2 In Progress

**What's done:** Dashboard, data pipeline (RSS + live pricing via LiteLLM), database layer, API endpoints, model list updated to current models.
**What's missing:** Real latency measurement, Vercel deployment, tests.

---

## PRIORITY 1: Real Latency Measurement

**Goal:** Replace placeholder TTFT/throughput values with actual API measurements.

### Task 1.1: Implement Latency Measurement
**File to modify:** `src/benchmark.js`

Add a method that sends a small standardized prompt to each provider's streaming API and measures:
- **TTFT** (Time to First Token): time from request to first streamed chunk
- **Throughput** (tokens/sec): total tokens / total time

**Required env vars:**
```
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
TOGETHER_API_KEY=...
DEEPSEEK_API_KEY=...
GOOGLE_AI_API_KEY=...
```

**Implementation:**
1. Add `measureModelLatency(provider, modelId)` — sends "Write a haiku about technology" via streaming, measures timing
2. Add `measureAllModels()` — iterates MODELS, calls measure for each
3. Update `formatResults()` to overwrite seed values with measured data
4. Keep `models.json` as fallback for when API keys are unavailable

---

## PRIORITY 2: Vercel Deployment

### Task 2.1: Replace better-sqlite3
**File:** `src/db.js`

`better-sqlite3` is a native C addon — incompatible with Vercel serverless.

**Options (pick one):**
- **JSON-only for MVP:** Skip DB in serverless, read/write from remote storage
- **Turso (libSQL):** Edge-compatible SQLite, drop-in replacement
- **Supabase PostgreSQL:** Already in package.json

### Task 2.2: Fix Cron Endpoint
**File:** `pages/api/cron/benchmark.js`

- Vercel filesystem is read-only after build
- Switch to Vercel Blob/KV for data storage
- Fix auth header: use `CRON_SECRET` (Vercel convention), not `CRON_AUTH_TOKEN`

### Task 2.3: Fix ISR Data Flow
**File:** `pages/index.js`

- `getStaticProps` reads `models.json` from disk — won't update on Vercel
- Switch to reading from remote storage, or use on-demand ISR revalidation

---

## PRIORITY 3: Quality

### Task 3.1: Add Tests
- Create `jest.config.js` with Next.js transform support
- `__tests__/benchmark.test.js` — RSS parsing, model matching, formatResults
- `__tests__/db.test.js` — Database CRUD operations
- `__tests__/api/models.test.js` — Ranking, filtering, best-model

### Task 3.2: ESLint Config
- Add `.eslintrc.json` with `next/core-web-vitals`
- Add `eslint-config-next` to devDependencies

### Task 3.3: API Input Validation
- `sort` must be one of `['latency', 'cost', 'throughput']`
- `limit` must be 1-100
- `latency_target` and `budget` must be positive numbers

---

## Files Overview

### To Modify
```
src/benchmark.js          <- Add real latency measurement
src/db.js                 <- Replace better-sqlite3 for Vercel
pages/api/cron/benchmark.js <- Fix for Vercel serverless
pages/index.js            <- Fix data flow for ISR on Vercel
```

### To Create
```
jest.config.js            <- Jest configuration
.eslintrc.json            <- ESLint configuration
__tests__/benchmark.test.js
__tests__/db.test.js
__tests__/api/models.test.js
```
