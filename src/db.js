/**
 * Database module - SQLite wrapper for benchmarks
 * 
 * Usage:
 * const db = new Database('./data/benchmarks.db');
 * await db.init(); // Run migrations
 * await db.addModel({ id: 'gpt-4', name: 'GPT-4', provider: 'openai' });
 * const latencies = await db.getLatestBenchmarks('latency');
 */

const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class Database {
  constructor(dbPath = './data/benchmarks.db') {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize database and run migrations
   */
  async init() {
    // Ensure data directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open database
    this.db = new sqlite3(this.dbPath);
    this.db.pragma('journal_mode = WAL');

    // Run migrations
    await this.runMigrations();
    console.log(`✓ Database initialized at ${this.dbPath}`);
  }

  /**
   * Run all migration files in /db/migrations
   */
  async runMigrations() {
    const migrationsDir = path.join(__dirname, '../db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      this.db.exec(sql);
      console.log(`✓ Migration: ${file}`);
    }
  }

  /**
   * Add or update a model
   */
  addModel(model) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO models 
      (id, name, provider, context_window, max_output_tokens, training_data_cutoff, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(
      model.id,
      model.name,
      model.provider,
      model.contextWindow || null,
      model.maxOutputTokens || null,
      model.trainingDataCutoff || null
    );
  }

  /**
   * Record a benchmark result
   */
  addBenchmark(modelId, metricType, value, unit, source = 'internal') {
    const stmt = this.db.prepare(`
      INSERT INTO benchmarks 
      (model_id, metric_type, value, unit, source, measured_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(modelId, metricType, value, unit, source);
  }

  /**
   * Update pricing for a model
   */
  addPricing(modelId, provider, priceInputPer1M, priceOutputPer1M, effectiveDate) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO pricing
      (model_id, provider, price_per_1m_input, price_per_1m_output, effective_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(modelId, provider, priceInputPer1M, priceOutputPer1M, effectiveDate);
  }

  /**
   * Get latest benchmark for each model (by metric type)
   */
  getLatestBenchmarks(metricType) {
    const stmt = this.db.prepare(`
      SELECT 
        m.id, m.name, m.provider,
        b.metric_type, b.value, b.unit, b.measured_at,
        p.price_per_1m_input, p.price_per_1m_output
      FROM models m
      LEFT JOIN benchmarks b ON m.id = b.model_id AND b.metric_type = ?
      LEFT JOIN pricing p ON m.id = p.model_id AND p.effective_date = CURRENT_DATE
      WHERE b.measured_at = (
        SELECT MAX(measured_at) FROM benchmarks 
        WHERE model_id = m.id AND metric_type = ?
      )
      ORDER BY b.value ASC
    `);
    return stmt.all(metricType, metricType);
  }

  /**
   * Get all models with their latest metrics
   */
  getAllModels() {
    const stmt = this.db.prepare(`
      SELECT DISTINCT m.* FROM models m
      ORDER BY m.provider, m.name
    `);
    return stmt.all();
  }

  /**
   * Get benchmark history for a model (for charts)
   */
  getBenchmarkHistory(modelId, metricType, days = 30) {
    const stmt = this.db.prepare(`
      SELECT metric_type, value, unit, measured_at
      FROM benchmarks
      WHERE model_id = ? AND metric_type = ?
      AND measured_at > datetime('now', '-' || ? || ' days')
      ORDER BY measured_at ASC
    `);
    return stmt.all(modelId, metricType, days);
  }

  /**
   * Update feed's last_fetched timestamp
   */
  updateFeedStatus(feedName, status = 'active') {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO feeds (name, url, status)
      VALUES (?, '', ?)
      UNION ALL
      UPDATE feeds SET last_fetched = CURRENT_TIMESTAMP, status = ?
      WHERE name = ?
    `);
    return stmt.run(feedName, status, status, feedName);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = Database;
