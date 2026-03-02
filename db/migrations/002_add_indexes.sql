-- Migration 002: Add performance indexes

CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
CREATE INDEX IF NOT EXISTS idx_benchmarks_model_metric ON benchmarks(model_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_benchmarks_measured_at ON benchmarks(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_benchmarks_created ON benchmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_model_date ON pricing(model_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_effective ON pricing(effective_date DESC);
