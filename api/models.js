/**
 * LLM Benchmarks API
 * Premium API endpoint for model routing & optimization
 */

const fs = require('fs');
const path = require('path');
const Database = require('../src/db');

let benchmarkCache = null;
let lastCacheTime = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const SEED_DATA_PATH = path.join(process.cwd(), 'src', 'data', 'models.json');

class ModelsAPI {
  /**
   * Load benchmarks from cache, DB, or seed data
   */
  async getBenchmarks(force = false) {
    if (!force && benchmarkCache && (Date.now() - lastCacheTime) < CACHE_TTL) {
      return benchmarkCache;
    }

    // Try loading from database first (works with both local and remote backends)
    try {
      const data = await this._loadFromDatabase();
      if (data && data.models.length > 0) {
        benchmarkCache = data;
        lastCacheTime = Date.now();
        return benchmarkCache;
      }
    } catch (_) {
      // DB not available or empty, fall through to seed data
    }

    // Fallback: read seed JSON file (available at build time)
    try {
      const raw = fs.readFileSync(SEED_DATA_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data.models && data.models.length > 0) {
        benchmarkCache = data;
        lastCacheTime = Date.now();
        return benchmarkCache;
      }
    } catch (_) {}

    benchmarkCache = { timestamp: new Date().toISOString(), models: [] };
    lastCacheTime = Date.now();
    return benchmarkCache;
  }

  /**
   * Load model data from database, assemble into frontend-compatible format
   */
  async _loadFromDatabase() {
    const db = new Database();
    await db.init();
    const rows = await db.getModelsWithBenchmarks();
    db.close();

    if (!rows || rows.length === 0) return null;

    const models = rows.map(row => ({
      name: row.name,
      provider: row.provider,
      id: row.id,
      ttft_ms: row.ttft_ms || 100,
      throughput_tps: row.throughput_tps || 80,
      cost_input_1m: row.cost_input_1m || 1,
      cost_output_1m: row.cost_output_1m || 5,
      json_support: true,
      last_updated: new Date().toISOString().split('T')[0],
      sources: [],
      data_source: row.ttft_ms ? 'measured' : 'estimate'
    }));

    return { timestamp: new Date().toISOString(), models };
  }

  /**
   * Force a full benchmark run (used only by cron endpoint)
   */
  async runBenchmarks() {
    const BenchmarkRunner = require('../src/benchmark');
    const runner = new BenchmarkRunner();
    const benchmarks = await runner.run();
    runner.db.close();
    benchmarkCache = benchmarks;
    lastCacheTime = Date.now();
    return benchmarks;
  }

  getBestModel(query = {}) {
    const { task, latency_target, budget } = query;
    const benchmarks = benchmarkCache?.models || [];
    let candidates = benchmarks;

    if (latency_target) {
      const target = typeof latency_target === 'number' ? latency_target : parseInt(latency_target);
      candidates = candidates.filter(m => m.ttft_ms <= target);
    }

    if (budget) {
      const budgetNum = typeof budget === 'number' ? budget : parseFloat(budget);
      candidates = candidates.filter(m => m.cost_output_1m <= budgetNum);
    }

    if (task === 'json_generation') {
      candidates = candidates.filter(m => m.json_support);
    }

    const scored = candidates.map(m => ({
      ...m,
      score: (100 - (m.ttft_ms / 10)) + (100 - (m.cost_output_1m * 10))
    }));

    return scored.sort((a, b) => b.score - a.score)[0] || null;
  }

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

  compareModels(modelNames = []) {
    const models = benchmarkCache?.models || [];
    return models.filter(m => modelNames.includes(m.name));
  }
}

module.exports = ModelsAPI;
