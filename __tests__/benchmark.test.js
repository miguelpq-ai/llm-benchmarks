const BenchmarkRunner = require('../src/benchmark');

describe('BenchmarkRunner', () => {
  let runner;

  beforeEach(async () => {
    runner = new BenchmarkRunner(':memory:');
    await runner.initDatabase();
  });

  afterEach(() => {
    runner.db.close();
  });

  test('_getFallbackCosts returns all 11 models', () => {
    const costs = runner._getFallbackCosts();
    expect(Object.keys(costs)).toHaveLength(11);
    expect(costs['Claude Sonnet 4']).toHaveProperty('input');
    expect(costs['Claude Sonnet 4']).toHaveProperty('output');
  });

  test('extractArticleMentions matches known patterns', () => {
    const articles = [
      { title: 'Claude Sonnet beats GPT-4', description: 'New benchmark results', link: 'http://example.com', pubDate: '' },
      { title: 'DeepSeek-R1 performance analysis', description: '', link: 'http://example2.com', pubDate: '' }
    ];
    const mentions = runner.extractArticleMentions(articles);
    const modelNames = mentions.map(m => m.model);
    expect(modelNames).toContain('Claude Sonnet 4');
    expect(modelNames).toContain('DeepSeek-R1');
  });

  test('extractArticleMentions returns empty for no matches', () => {
    const articles = [
      { title: 'Unrelated article', description: 'No model names here', link: '', pubDate: '' }
    ];
    const mentions = runner.extractArticleMentions(articles);
    expect(mentions).toHaveLength(0);
  });

  test('formatResults produces valid structure with seed data', () => {
    runner.costs = runner._getFallbackCosts();
    runner.latencyMeasurements = {};
    runner.articleMentions = [];
    const results = runner.formatResults();
    expect(results.timestamp).toBeDefined();
    expect(results.models.length).toBeGreaterThan(0);
    for (const model of results.models) {
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('provider');
      expect(model).toHaveProperty('ttft_ms');
      expect(model).toHaveProperty('throughput_tps');
      expect(model).toHaveProperty('cost_input_1m');
      expect(model).toHaveProperty('cost_output_1m');
    }
  });

  test('formatResults applies measured latency values', () => {
    runner.costs = runner._getFallbackCosts();
    runner.latencyMeasurements = {
      'Claude Sonnet 4': { ttft_ms: 42, throughput_tps: 120, measured: true }
    };
    runner.articleMentions = [];
    const results = runner.formatResults();
    const claude = results.models.find(m => m.name === 'Claude Sonnet 4');
    expect(claude.ttft_ms).toBe(42);
    expect(claude.throughput_tps).toBe(120);
    expect(claude.data_source).toBe('measured');
  });

  test('formatResults marks unmeasured models as estimates', () => {
    runner.costs = runner._getFallbackCosts();
    runner.latencyMeasurements = {};
    runner.articleMentions = [];
    const results = runner.formatResults();
    for (const model of results.models) {
      expect(model.data_source).toBe('estimate');
    }
  });

  test('measureModelLatency returns null when API key is absent', async () => {
    const origKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = await runner.measureModelLatency('anthropic', 'claude-sonnet-4-20250514');
    expect(result).toBeNull();

    if (origKey) process.env.ANTHROPIC_API_KEY = origKey;
  });

  test('measureModelLatency returns null for unknown provider', async () => {
    const result = await runner.measureModelLatency('unknown', 'some-model');
    expect(result).toBeNull();
  });

  test('saveResultsToDatabase persists models and benchmarks', async () => {
    const results = {
      timestamp: new Date().toISOString(),
      models: [{
        name: 'Test Model',
        provider: 'test',
        ttft_ms: 100,
        throughput_tps: 80,
        cost_input_1m: 1,
        cost_output_1m: 5
      }]
    };
    await runner.saveResultsToDatabase(results);
    const models = await runner.db.getAllModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].name).toBe('Test Model');
  });
});
