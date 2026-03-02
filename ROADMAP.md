# Roadmap - LLM Benchmarks

## Phase 1: MVP (Weeks 1-2) - IN PROGRESS

### Week 1
- [x] GitHub repo setup
- [x] Core architecture design
- [x] Benchmark runner scaffold
- [ ] **Database setup** (SQLite + migrations)
- [ ] **Integrate LMSYS RSS parser**
- [ ] **Integrate pricing data sources**
- [ ] Test benchmark collection

### Week 2
- [ ] Next.js setup
- [ ] Dashboard skeleton
- [ ] Data visualization (Recharts)
- [ ] Deploy to Vercel
- [ ] Public dashboard live

## Phase 2: API & Monetization (Weeks 3-4)

### Week 3
- [ ] API v1 endpoints
  - [ ] `/api/v1/models` (list all)
  - [ ] `/api/v1/best-model` (recommend)
  - [ ] `/api/v1/compare` (compare models)
- [ ] API docs (Swagger/OpenAPI)
- [ ] Rate limiting

### Week 4
- [ ] Stripe integration
- [ ] API key generation
- [ ] Usage tracking & billing
- [ ] Premium tier launch

## Phase 3: Polish & Growth (Weeks 5+)

- [ ] Webhooks for alerts
- [ ] Historical data retention
- [ ] Advanced filtering
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Blog posts & SEO

## Current Priorities

1. **URGENT:** Database foundation
   - SQLite schema for models, benchmarks, pricing
   - Migration system (sql files in `/db/migrations`)
   - Connection pooling in benchmark runner

2. **URGENT:** Get benchmark data pipeline working
   - Parse LMSYS RSS reliably
   - Fetch real pricing from providers
   - Store results in DB, not memory
   - Test data freshness

3. **HIGH:** Dashboard MVP
   - Show top 5 models by latency
   - Cost comparison table
   - Query data from DB
   - Last updated timestamp

4. **MEDIUM:** API design
   - Define request/response schemas
   - Rate limiting strategy
   - Error handling

## Success Metrics

- **Month 1:** Public dashboard with 1,000+ views
- **Month 2:** 50+ API subscribers
- **Month 3:** $5,000 MRR from API sales
- **Month 6:** 500+ API subscribers, $50k MRR

## Known Issues & TODOs

- [ ] **Database schema design & migrations needed**
- [ ] LMSYS RSS parsing needs XML parser + DB writes
- [ ] Data persistence strategy (currently in-memory)
- [ ] Rate limiting not yet implemented
- [ ] Stripe API not integrated
- [ ] No user authentication yet
- [ ] API documentation incomplete
