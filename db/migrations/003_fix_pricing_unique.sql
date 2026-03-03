-- Migration 003: Add unique constraint to pricing for INSERT OR REPLACE

CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_model_provider_date
ON pricing(model_id, provider, effective_date);
