# Getting Started - For Contributors

Welcome! This is the **LLM Benchmarks** project. Here's what's set up and what's next.

## Current Status (March 2, 2026)

✅ **Initialized**
- Repository structure created
- Core benchmark runner scaffold
- API models class with routing logic
- Architecture documented
- Roadmap defined

⏳ **In Progress**
- Data pipeline integration (LMSYS RSS, pricing APIs)
- Dashboard UI
- Stripe integration

## Quick Setup

```bash
# Clone the repo
git clone https://github.com/miguelpq-ai/llm-benchmarks.git
cd llm-benchmarks

# Install dependencies
npm install

# Run benchmark collector
npm run benchmark:run

# Start dashboard dev server
npm run dev
```

## Key Files to Know

- `README.md` - Project overview
- `ARCHITECTURE.md` - System design & components
- `ROADMAP.md` - Phase-by-phase plan
- `src/benchmark.js` - Data collection logic
- `api/models.js` - API endpoint handlers
- `package.json` - Dependencies & scripts

## Next Steps (Priority Order)

### 1. **Benchmark Data Pipeline** (This Week)
   - Integrate LMSYS RSS parser properly
   - Fetch real cost data from providers
   - Test with actual models

   **File:** `src/benchmark.js`

### 2. **Dashboard MVP** (Week 2)
   - Create Next.js pages/components
   - Show top models by latency
   - Display cost comparisons
   - Deploy to Vercel

   **Files to create:**
   - `pages/index.js`
   - `components/ModelCard.js`
   - `components/BenchmarkChart.js`

### 3. **API & Monetization** (Week 3-4)
   - Complete API endpoints
   - Stripe integration
   - Usage tracking

   **Files:** `pages/api/v1/*`

## Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Stripe
STRIPE_SECRET_KEY=your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key

# External APIs (if needed)
LMSYS_API_KEY=optional
```

## Testing

```bash
npm run benchmark:run    # Run benchmarks locally
npm run dev              # Start dev server
npm test                 # Run unit tests
```

## Questions?

Check the issues tab or open a new issue for blockers.

---

**Remember:** This is a passive income project. Goal is to automate everything so there's zero manual work after launch.
