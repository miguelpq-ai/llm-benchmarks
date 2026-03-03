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

### Week 2 - IN PROGRESS
- [ ] Real latency measurement (send prompts to provider APIs, measure TTFT)
- [ ] Deploy to Vercel
- [ ] Replace better-sqlite3 with Vercel-compatible storage
- [ ] Fix cron data flow for serverless (read-only filesystem)
- [ ] Add test coverage
- [ ] Public dashboard live

## Phase 2: API & Monetization (Weeks 3-4)

### Week 3
- [ ] API docs (Swagger/OpenAPI)
- [ ] Rate limiting
- [ ] API input validation
- [ ] `/api/v1/compare` endpoint

### Week 4
- [ ] Stripe integration
- [ ] API key generation
- [ ] Usage tracking & billing
- [ ] Premium tier launch

## Phase 3: Polish & Growth (Weeks 5+)

- [ ] Webhooks for alerts
- [ ] Historical data trending charts
- [ ] Advanced filtering
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Blog posts & SEO

## Current Priorities

1. **URGENT:** Real latency measurement
   - Send standardized prompts to provider APIs
   - Measure TTFT and throughput via streaming
   - Replace static seed data with actual measurements

2. **URGENT:** Vercel deployment
   - Replace better-sqlite3 (native addon incompatible with serverless)
   - Fix cron to write to remote storage instead of filesystem
   - Fix ISR data flow for `getStaticProps`

3. **HIGH:** Test coverage
   - Benchmark runner tests (RSS parsing, model matching, formatResults)
   - Database CRUD tests
   - API endpoint tests

4. **MEDIUM:** API hardening
   - Input validation on query parameters
   - Rate limiting
   - ESLint configuration

## Success Metrics

- **Month 1:** Public dashboard with 1,000+ views
- **Month 2:** 50+ API subscribers
- **Month 3:** $5,000 MRR from API sales
- **Month 6:** 500+ API subscribers, $50k MRR

## Known Issues & TODOs

- [ ] TTFT/throughput values are placeholder estimates, not measured
- [ ] better-sqlite3 incompatible with Vercel serverless
- [ ] Cron writes to read-only filesystem on Vercel
- [ ] Rate limiting not yet implemented
- [ ] Stripe API not integrated
- [ ] No user authentication yet
- [ ] API documentation incomplete
- [ ] Zero test coverage
