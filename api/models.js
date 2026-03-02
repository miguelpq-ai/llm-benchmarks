/**
 * LLM Benchmarks API
 * Premium API endpoint for model routing & optimization
 */

const BenchmarkRunner = require('../src/benchmark');

let benchmarkCache = null;
let lastCacheTime = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

class ModelsAPI {
  constructor() {
    this.runner = new BenchmarkRunner();
  }

  async getBenchmarks(force = false) {
    // Return cached results if available and fresh
    if (!force && benchmarkCache && (Date.now() - lastCacheTime) < CACHE_TTL) {
      return benchmarkCache;
    }

    // Fetch fresh benchmarks
    const benchmarks = await this.runner.run();
    benchmarkCache = benchmarks;
    lastCacheTime = Date.now();
    return benchmarks;
  }

  /**
   * Find best model for a given task
   * GET /api/v1/best-model?task=json_generation&latency_target=50ms&budget=0.001
   */
  getBestModel(query = {}) {
    const { task, latency_target, budget } = query;
    const benchmarks = benchmarkCache?.models || [];

    // Filter by constraints
    let candidates = benchmarks;

    if (latency_target) {
      candidates = candidates.filter(m => m.ttft_ms <= parseInt(latency_target));
    }

    if (budget) {
      const budgetNum = parseFloat(budget);
      candidates = candidates.filter(m => m.cost_output_1m <= budgetNum);
    }

    if (task === 'json_generation') {
      candidates = candidates.filter(m => m.json_support);
    }

    // Score by latency + cost
    const scored = candidates.map(m => ({
      ...m,
      score: (100 - (m.ttft_ms / 10)) + (100 - (m.cost_output_1m * 10))
    }));

    const best = scored.sort((a, b) => b.score - a.score)[0];
    return best || null;
  }

  /**
   * Get all models ranked by latency
   * GET /api/v1/models?sort=latency&limit=10
   */
  getModelsRanked(sort = 'latency', limit = 10) {
    const models = benchmarkCache?.models || [];

    const ranked = [...models].sort((a, b) => {
      if (sort === 'latency') return a.ttft_ms - b.ttft_ms;
      if (sort === 'cost') return a.cost_output_1m - b.cost_output_1m;
      if (sort === 'throughput') return b.throughput_tps - a.throughput_tps;
      return 0;
    });

    return ranked.slice(0, limit);
  }

  /**
   * Get comparison between models
   * GET /api/v1/compare?models=claude,qwen
   */
  compareModels(modelNames = []) {
    const models = benchmarkCache?.models || [];
    return models.filter(m => modelNames.includes(m.name));
  }
}

module.exports = ModelsAPI;
