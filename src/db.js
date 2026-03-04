/**
 * Database module - Dual backend: Turso (libSQL) for remote, better-sqlite3 for local
 *
 * Usage:
 *   // Local (default):
 *   const db = new Database('./data/benchmarks.db');
 *   // Or in-memory for tests:
 *   const db = new Database(':memory:');
 *   // Remote (when TURSO_DATABASE_URL is set):
 *   const db = new Database(); // auto-detects from env
 *
 *   await db.init();
 *   await db.addModel({ id: 'gpt-4', name: 'GPT-4', provider: 'openai' });
 *   const latencies = await db.getLatestBenchmarks('latency');
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class Database {
  constructor(dbPath = './data/benchmarks.db') {
    this.dbPath = dbPath;
    this.db = null;
    this.client = null;
    this.isRemote = !!(process.env.TURSO_DATABASE_URL) && dbPath !== ':memory:';
  }

  async init() {
    if (this.isRemote) {
      await this._initRemote();
    } else {
      await this._initLocal();
    }
  }

  async _initRemote() {
    const { createClient } = require('@libsql/client');
    this.client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    await this._runMigrationsRemote();
    console.log('Database initialized (Turso remote)');
  }

  async _initLocal() {
    const sqlite3 = require('better-sqlite3');
    const dir = path.dirname(this.dbPath);
    if (this.dbPath !== ':memory:' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new sqlite3(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    await this._runMigrationsLocal();
    console.log(`Database initialized at ${this.dbPath}`);
  }

  async _runMigrationsLocal() {
    const migrationsDir = path.join(__dirname, '../db/migrations');
    if (!fs.existsSync(migrationsDir)) return;
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      this.db.exec(sql);
    }
  }

  async _runMigrationsRemote() {
    const migrationsDir = path.join(__dirname, '../db/migrations');
    if (!fs.existsSync(migrationsDir)) return;
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      // Split multi-statement SQL and execute each (libSQL doesn't support multi-statement in execute)
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        await this.client.execute(stmt);
      }
    }
  }

  // ─── Model Operations ─────────────────────────────────────────────

  async addModel(model) {
    const sql = `INSERT OR REPLACE INTO models
      (id, name, provider, context_window, max_output_tokens, training_data_cutoff, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    const args = [
      model.id, model.name, model.provider,
      model.contextWindow || null, model.maxOutputTokens || null, model.trainingDataCutoff || null
    ];
    if (this.isRemote) {
      return this.client.execute({ sql, args });
    }
    return this.db.prepare(sql).run(...args);
  }

  async addBenchmark(modelId, metricType, value, unit, source = 'internal') {
    const sql = `INSERT INTO benchmarks
      (model_id, metric_type, value, unit, source, measured_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    const args = [modelId, metricType, value, unit, source];
    if (this.isRemote) {
      return this.client.execute({ sql, args });
    }
    return this.db.prepare(sql).run(...args);
  }

  async addPricing(modelId, provider, priceInputPer1M, priceOutputPer1M, effectiveDate) {
    const sql = `INSERT OR REPLACE INTO pricing
      (model_id, provider, price_per_1m_input, price_per_1m_output, effective_date)
      VALUES (?, ?, ?, ?, ?)`;
    const args = [modelId, provider, priceInputPer1M, priceOutputPer1M, effectiveDate];
    if (this.isRemote) {
      return this.client.execute({ sql, args });
    }
    return this.db.prepare(sql).run(...args);
  }

  // ─── Query Operations ─────────────────────────────────────────────

  async getLatestBenchmarks(metricType) {
    const sql = `SELECT
        m.id, m.name, m.provider,
        b.metric_type, b.value, b.unit, b.measured_at,
        p.price_per_1m_input, p.price_per_1m_output
      FROM models m
      LEFT JOIN benchmarks b
        ON m.id = b.model_id
        AND b.metric_type = ?
        AND b.measured_at = (
          SELECT MAX(b2.measured_at) FROM benchmarks b2
          WHERE b2.model_id = m.id AND b2.metric_type = ?
        )
      LEFT JOIN pricing p ON m.id = p.model_id
        AND p.effective_date = (
          SELECT MAX(p2.effective_date) FROM pricing p2 WHERE p2.model_id = m.id
        )
      ORDER BY COALESCE(b.value, 9999999) ASC`;
    const args = [metricType, metricType];
    if (this.isRemote) {
      const result = await this.client.execute({ sql, args });
      return result.rows;
    }
    return this.db.prepare(sql).all(...args);
  }

  async getAllModels() {
    const sql = `SELECT DISTINCT m.* FROM models m ORDER BY m.provider, m.name`;
    if (this.isRemote) {
      const result = await this.client.execute(sql);
      return result.rows;
    }
    return this.db.prepare(sql).all();
  }

  async getBenchmarkHistory(modelId, metricType, days = 30) {
    const sql = `SELECT metric_type, value, unit, measured_at
      FROM benchmarks
      WHERE model_id = ? AND metric_type = ?
      AND measured_at > datetime('now', '-' || ? || ' days')
      ORDER BY measured_at ASC`;
    const args = [modelId, metricType, days];
    if (this.isRemote) {
      const result = await this.client.execute({ sql, args });
      return result.rows;
    }
    return this.db.prepare(sql).all(...args);
  }

  async updateFeedStatus(feedName, url = '', status = 'active') {
    const insertSql = `INSERT OR IGNORE INTO feeds (name, url, status) VALUES (?, ?, ?)`;
    const updateSql = `UPDATE feeds SET last_fetched = CURRENT_TIMESTAMP, url = COALESCE(NULLIF(?, ''), url), status = ? WHERE name = ?`;

    if (this.isRemote) {
      await this.client.execute({ sql: insertSql, args: [feedName, url, status] });
      await this.client.execute({ sql: updateSql, args: [url, status, feedName] });
      return;
    }
    const upsert = this.db.transaction((name, feedUrl, st) => {
      this.db.prepare(insertSql).run(name, feedUrl, st);
      this.db.prepare(updateSql).run(feedUrl, st, name);
    });
    return upsert(feedName, url, status);
  }

  // ─── API Key Operations ───────────────────────────────────────────

  async createApiKey(email, stripeCustomerId = null, plan = 'premium') {
    const key = 'llmb_' + crypto.randomBytes(24).toString('hex');
    const sql = `INSERT INTO api_keys (key, customer_email, stripe_customer_id, plan)
      VALUES (?, ?, ?, ?)`;
    const args = [key, email, stripeCustomerId, plan];
    if (this.isRemote) {
      await this.client.execute({ sql, args });
    } else {
      this.db.prepare(sql).run(...args);
    }
    return key;
  }

  async validateApiKey(key) {
    const sql = `SELECT * FROM api_keys WHERE key = ? AND active = 1`;
    if (this.isRemote) {
      const result = await this.client.execute({ sql, args: [key] });
      return result.rows[0] || null;
    }
    return this.db.prepare(sql).get(key) || null;
  }

  async getApiKeyByStripeCustomer(customerId) {
    const sql = `SELECT * FROM api_keys WHERE stripe_customer_id = ?`;
    if (this.isRemote) {
      const result = await this.client.execute({ sql, args: [customerId] });
      return result.rows[0] || null;
    }
    return this.db.prepare(sql).get(customerId) || null;
  }

  async deactivateApiKeyByStripeCustomer(customerId) {
    const sql = `UPDATE api_keys SET active = 0 WHERE stripe_customer_id = ?`;
    if (this.isRemote) {
      return this.client.execute({ sql, args: [customerId] });
    }
    return this.db.prepare(sql).run(customerId);
  }

  // ─── Full Model Data Query (for API/dashboard) ────────────────────

  async getModelsWithBenchmarks() {
    const sql = `SELECT
        m.id, m.name, m.provider,
        MAX(CASE WHEN b.metric_type = 'latency' THEN b.value END) as ttft_ms,
        MAX(CASE WHEN b.metric_type = 'throughput' THEN b.value END) as throughput_tps,
        p.price_per_1m_input as cost_input_1m,
        p.price_per_1m_output as cost_output_1m
      FROM models m
      LEFT JOIN benchmarks b ON m.id = b.model_id
      LEFT JOIN pricing p ON m.id = p.model_id
        AND p.effective_date = (
          SELECT MAX(p2.effective_date) FROM pricing p2 WHERE p2.model_id = m.id
        )
      GROUP BY m.id, m.name, m.provider, p.price_per_1m_input, p.price_per_1m_output
      ORDER BY COALESCE(MAX(CASE WHEN b.metric_type = 'latency' THEN b.value END), 9999999) ASC`;
    if (this.isRemote) {
      const result = await this.client.execute(sql);
      return result.rows;
    }
    return this.db.prepare(sql).all();
  }

  // ─── Connection Management ─────────────────────────────────────────

  close() {
    if (this.db) {
      this.db.close();
    }
    // Remote client doesn't need explicit close (HTTP-based)
  }
}

module.exports = Database;
