# Roadmap - LLM Benchmarks

## Phase 1: MVP (Weeks 1-2)

### Week 1 - DONE
- [x] GitHub repo setup
- [x] Core architecture design
- [x] Benchmark runner scaffold
- [x] Database setup (SQLite + migrations)
- [x] LMSYS RSS parser integration
- [x] Pricing data (hardcoded fallback + LiteLLM live fetch)
- [x] Next.js dashboard with charts and comparison table
- [x] API endpoints (`/api/v1/models`, `/api/v1/best-model`)
- [x] Cron endpoint for scheduled updates
- [x] Model list updated to current models (Claude 4, GPT-4.1, Gemini 2.5, etc.)

### Week 2 - DONE
- [x] Real latency measurement (streaming API calls, measure TTFT + throughput)
- [x] Docker local dev environment (Dockerfile, docker-compose.yml)
- [x] Add test coverage (51 tests across 7 suites)
- [x] Fix 6 bugs (auth bypass, LEFT JOIN, cold-start, chart props, etc.)
- [x] Dual database backend (Turso + better-sqlite3) for Vercel deploy
- [x] Cron endpoint supports CRON_SECRET (Vercel) + CRON_AUTH_TOKEN

## Phase 2: API & Monetization (Weeks 3-4) - DONE

### Week 3 - DONE
- [x] Rate limiting (100 req/min public, 1000 req/min premium, configurable via env)
- [x] API input validation (sort, limit, latency_target, budget)
- [x] `/api/v1/compare` endpoint
- [x] ESLint configuration
- [x] API docs (OpenAPI 3.0 spec + Swagger UI at `/docs`)

### Week 4 - DONE
- [x] Stripe integration (checkout session + webhook lifecycle)
- [x] API key generation (`llmb_` prefixed, stored in DB)
- [x] API key authentication (premium vs public rate limits)
- [x] Premium tier gating on all API routes

## Phase 3: Polish & Growth (Weeks 5+)

- [ ] Deploy to Vercel (set TURSO_DATABASE_URL, STRIPE keys, CRON_SECRET)
- [ ] Public dashboard live
- [ ] Webhooks for alerts
- [ ] Historical data trending charts
- [ ] Advanced filtering
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Blog posts & SEO

## Success Metrics

- **Month 1:** Public dashboard with 1,000+ views
- **Month 2:** 50+ API subscribers
- **Month 3:** $5,000 MRR from API sales
- **Month 6:** 500+ API subscribers, $50k MRR

## Known Issues & TODOs

- [x] ~~TTFT/throughput values are placeholder estimates~~ Real measurement implemented
- [x] ~~better-sqlite3 incompatible with Vercel serverless~~ Dual backend: Turso (remote) + better-sqlite3 (local)
- [x] ~~Cron writes to read-only filesystem on Vercel~~ saveResults() graceful on read-only FS
- [x] ~~Rate limiting not yet implemented~~ Done (in-memory, tiered)
- [x] ~~Stripe API not integrated~~ Checkout + webhook + API key gating done
- [x] ~~No user authentication yet~~ API key auth with premium/public tiers
- [x] ~~API documentation incomplete~~ OpenAPI 3.0 + Swagger UI
- [x] ~~Zero test coverage~~ 51 tests passing across 7 suites
- [ ] Stripe in test mode — needs production keys for launch
- [ ] Turso database not yet provisioned — need `turso db create` + set env vars
