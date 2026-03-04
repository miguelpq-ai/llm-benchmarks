const Database = require('../src/db');

describe('Database', () => {
  let db;

  beforeEach(async () => {
    db = new Database(':memory:');
    await db.init();
  });

  afterEach(() => {
    db.close();
  });

  test('addModel inserts a model', async () => {
    await db.addModel({ id: 'test/model', name: 'Test Model', provider: 'test' });
    const models = await db.getAllModels();
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('Test Model');
  });

  test('addModel upserts on duplicate id', async () => {
    await db.addModel({ id: 'test/model', name: 'Test Model', provider: 'test' });
    await db.addModel({ id: 'test/model', name: 'Updated Model', provider: 'test' });
    const models = await db.getAllModels();
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('Updated Model');
  });

  test('addBenchmark records a benchmark', async () => {
    await db.addModel({ id: 'test/model', name: 'Test Model', provider: 'test' });
    await db.addBenchmark('test/model', 'latency', 100, 'ms', 'test');
    const results = await db.getLatestBenchmarks('latency');
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe(100);
  });

  test('getLatestBenchmarks includes models with no benchmarks', async () => {
    await db.addModel({ id: 'model-a', name: 'Model A', provider: 'test' });
    await db.addModel({ id: 'model-b', name: 'Model B', provider: 'test' });
    await db.addBenchmark('model-a', 'latency', 50, 'ms', 'test');
    // model-b has no benchmarks

    const results = await db.getLatestBenchmarks('latency');
    expect(results).toHaveLength(2);

    const modelB = results.find(r => r.name === 'Model B');
    expect(modelB).toBeDefined();
    expect(modelB.value).toBeNull();
  });

  test('getLatestBenchmarks returns only results from latest timestamp', async () => {
    await db.addModel({ id: 'test/model', name: 'Test Model', provider: 'test' });
    // Insert old benchmark with explicit past timestamp
    db.db.prepare(`
      INSERT INTO benchmarks (model_id, metric_type, value, unit, source, measured_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '-1 hour'))
    `).run('test/model', 'latency', 200, 'ms', 'test');
    // Insert new benchmark with current timestamp
    await db.addBenchmark('test/model', 'latency', 100, 'ms', 'test');

    const results = await db.getLatestBenchmarks('latency');
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe(100);
  });

  test('models without benchmarks sort after models with benchmarks', async () => {
    await db.addModel({ id: 'model-a', name: 'Model A', provider: 'test' });
    await db.addModel({ id: 'model-b', name: 'Model B', provider: 'test' });
    await db.addBenchmark('model-a', 'latency', 50, 'ms', 'test');

    const results = await db.getLatestBenchmarks('latency');
    expect(results[0].name).toBe('Model A');
    expect(results[1].name).toBe('Model B');
  });

  test('addPricing works with INSERT OR REPLACE', async () => {
    await db.addModel({ id: 'test/model', name: 'Test Model', provider: 'test' });
    await db.addPricing('test/model', 'test', 1.0, 5.0, '2026-03-01');
    await db.addPricing('test/model', 'test', 2.0, 10.0, '2026-03-01');
    // Should not throw
  });

  test('updateFeedStatus works for multiple feeds', async () => {
    await db.updateFeedStatus('lmsys', 'https://lmsys.org/rss', 'active');
    await db.updateFeedStatus('together', 'https://together.ai/blog/rss.xml', 'active');
    await db.updateFeedStatus('huggingface', 'https://huggingface.co/feed', 'active');
    // Should not throw
  });

  test('getBenchmarkHistory returns entries for model', async () => {
    await db.addModel({ id: 'test/model', name: 'Test Model', provider: 'test' });
    await db.addBenchmark('test/model', 'latency', 100, 'ms', 'test');
    await db.addBenchmark('test/model', 'latency', 90, 'ms', 'test');

    const history = await db.getBenchmarkHistory('test/model', 'latency', 30);
    expect(history).toHaveLength(2);
  });

  test('getAllModels returns all models ordered by provider and name', async () => {
    await db.addModel({ id: 'z/model', name: 'Zebra', provider: 'zoo' });
    await db.addModel({ id: 'a/model', name: 'Alpha', provider: 'alpha' });

    const models = await db.getAllModels();
    expect(models).toHaveLength(2);
    expect(models[0].provider).toBe('alpha');
    expect(models[1].provider).toBe('zoo');
  });
});
