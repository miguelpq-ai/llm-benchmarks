# Database Schema - LLM Benchmarks

## Overview
SQLite database to persist benchmark data, model metadata, and pricing over time.

## Tables

### `models`
Core model information.
```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  context_window INTEGER,
  max_output_tokens INTEGER,
  training_data_cutoff TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `benchmarks`
Latency and throughput measurements.
```sql
CREATE TABLE benchmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'latency' | 'throughput' | 'json_support'
  value REAL NOT NULL,
  unit TEXT NOT NULL, -- 'ms' | 'tokens/sec' | 'bool'
  source TEXT, -- 'lmsys' | 'internal' | 'provider'
  measured_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);

CREATE INDEX idx_benchmarks_model_metric ON benchmarks(model_id, metric_type);
CREATE INDEX idx_benchmarks_measured_at ON benchmarks(measured_at DESC);
```

### `pricing`
Cost per 1M tokens input/output.
```sql
CREATE TABLE pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  price_per_1m_input REAL, -- USD
  price_per_1m_output REAL, -- USD
  effective_date TEXT NOT NULL, -- YYYY-MM-DD
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);

CREATE INDEX idx_pricing_model_date ON pricing(model_id, effective_date DESC);
```

### `feeds`
RSS/API feed metadata for tracking updates.
```sql
CREATE TABLE feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, -- 'lmsys' | 'openai' | 'together'
  url TEXT NOT NULL UNIQUE,
  last_fetched TIMESTAMP,
  last_updated TIMESTAMP,
  status TEXT DEFAULT 'active', -- 'active' | 'error' | 'disabled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

```sql
CREATE INDEX idx_models_provider ON models(provider);
CREATE INDEX idx_benchmarks_created ON benchmarks(created_at DESC);
CREATE INDEX idx_pricing_effective ON pricing(effective_date DESC);
```

## Migrations

Store migrations in `/db/migrations/` with numbered filenames:
- `001_init.sql` — Create all tables
- `002_add_indexes.sql` — Add performance indexes
- Example: Run all `.sql` files in sequence at startup

## Usage

The benchmark runner should:
1. Query `models` to check if model exists
2. Insert/update `benchmarks` after each run
3. Fetch `pricing` on demand for comparisons
4. Update `feeds` after each source sync

The dashboard should:
1. Join `models`, `benchmarks`, `pricing` for the latest view
2. Filter by `measured_at` for time-series charts
3. Compare costs using `price_per_1m_input + price_per_1m_output`
