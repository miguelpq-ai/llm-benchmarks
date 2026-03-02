# Architecture

## System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Data Sources                          │
│  LMSYS RSS │ Together AI │ OpenAI Docs │ DeepSeek     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│          Benchmark Runner (src/benchmark.js)            │
│  - Fetch latency, throughput, cost from sources        │
│  - Aggregate & normalize data                          │
│  - Cache results (6h TTL)                              │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐        ┌──────────────────┐
│  Public Dash    │        │  Premium API     │
│  (Free)         │        │  (Paid)          │
│  /dashboard     │        │  /api/v1/*       │
│  - Charts       │        │  - Best model    │
│  - Comparisons  │        │  - Rankings      │
│  - History      │        │  - Comparisons   │
└─────────────────┘        └──────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  Stripe Billing  │
                         │  API Keys        │
                         │  Usage Tracking  │
                         └──────────────────┘
```

## Components

### `src/benchmark.js`
- **BenchmarkRunner class**
  - `collectLatencyData()` - Parses LMSYS, Together, etc. for TTFT metrics
  - `collectCostData()` - Fetches current pricing
  - `formatResults()` - Normalizes data into standard schema
  - `run()` - Main orchestrator

### `api/models.js`
- **ModelsAPI class**
  - `getBenchmarks()` - Returns cached benchmark data
  - `getBestModel(query)` - Recommends model based on constraints
  - `getModelsRanked(sort)` - Returns models sorted by metric
  - `compareModels(names)` - Compares specific models

### Frontend (Next.js)
- `pages/index.js` - Dashboard homepage
- `pages/api/v1/best-model` - API endpoint
- `pages/api/v1/models` - List all models
- `components/ModelCard.js` - Model display component
- `components/BenchmarkChart.js` - Latency/cost charts

## Data Schema

```json
{
  "timestamp": "2026-03-02T13:30:00Z",
  "models": [
    {
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "ttft_ms": 120,
      "throughput_tps": 80,
      "cost_input_1m": 3,
      "cost_output_1m": 15,
      "json_support": true,
      "last_updated": "2026-03-02",
      "sources": ["LMSYS", "OpenAI Docs"]
    }
  ]
}
```

## Deployment

- **Frontend**: Vercel
- **API**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL
- **Billing**: Stripe
- **Benchmarks**: Cron job (every 6 hours)

## Update Frequency

- Benchmarks: Every 6 hours
- Dashboard cache: 1 hour
- API responses: Real-time (cached, max 6h old)

## Security

- API keys via Stripe
- Rate limiting: 100 requests/minute (free), unlimited (paid)
- Auth: JWT tokens from Supabase
