/**
 * LLM Benchmark Runner
 * Collects real-time latency, throughput, and cost data from multiple providers
 * Persists data to SQLite database
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');
const Database = require('./db');

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'models.json');

const MODELS = {
  anthropic: [
    { name: 'Claude Sonnet 4', provider: 'anthropic', id: 'claude-sonnet-4-20250514' },
    { name: 'Claude Opus 4', provider: 'anthropic', id: 'claude-opus-4-20250514' }
  ],
  openai: [
    { name: 'GPT-4.1', provider: 'openai', id: 'gpt-4.1' },
    { name: 'GPT-4.1 mini', provider: 'openai', id: 'gpt-4.1-mini' },
    { name: 'o4-mini', provider: 'openai', id: 'o4-mini' }
  ],
  google: [
    { name: 'Gemini 2.5 Pro', provider: 'google', id: 'gemini-2.5-pro' },
    { name: 'Gemini 2.5 Flash', provider: 'google', id: 'gemini-2.5-flash' }
  ],
  deepseek: [
    { name: 'DeepSeek-V3', provider: 'deepseek', id: 'deepseek-chat' },
    { name: 'DeepSeek-R1', provider: 'deepseek', id: 'deepseek-reasoner' }
  ],
  together: [
    { name: 'Qwen3 235B', provider: 'together', id: 'Qwen/Qwen3-235B-A22B-FP8' },
    { name: 'Llama 4 Maverick', provider: 'together', id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8' }
  ]
};

const RSS_FEEDS = {
  lmsys: 'https://lmsys.org/rss',
  together: 'https://www.together.ai/blog/rss.xml',
  huggingface: 'https://huggingface.co/feed'
};

// Known model name patterns for RSS article matching
const MODEL_PATTERNS = [
  { pattern: /claude.*sonnet/i, model: 'Claude Sonnet 4' },
  { pattern: /claude.*opus/i, model: 'Claude Opus 4' },
  { pattern: /claude/i, model: 'Claude Sonnet 4' },
  { pattern: /gpt-?4\.1\b/i, model: 'GPT-4.1' },
  { pattern: /o4-?mini/i, model: 'o4-mini' },
  { pattern: /gemini.*2\.5.*pro/i, model: 'Gemini 2.5 Pro' },
  { pattern: /gemini.*2\.5.*flash/i, model: 'Gemini 2.5 Flash' },
  { pattern: /gemini/i, model: 'Gemini 2.5 Pro' },
  { pattern: /deepseek.*r1/i, model: 'DeepSeek-R1' },
  { pattern: /deepseek/i, model: 'DeepSeek-V3' },
  { pattern: /qwen3/i, model: 'Qwen3 235B' },
  { pattern: /qwen/i, model: 'Qwen3 235B' },
  { pattern: /llama.*4/i, model: 'Llama 4 Maverick' },
  { pattern: /llama/i, model: 'Llama 4 Maverick' }
];

const BENCHMARK_PROMPT = "Say exactly: 'pong'";
const API_KEY_MAP = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_AI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  together: 'TOGETHER_API_KEY'
};

class BenchmarkRunner {
  constructor(dbPath = './data/benchmarks.db') {
    this.results = [];
    this.articleMentions = [];
    this.latencyMeasurements = {};
    this.costs = null;
    this.lastUpdated = null;
    this.db = new Database(dbPath);
  }

  async initDatabase() {
    await this.db.init();
  }

  // ─── RSS Feed Parsing ───────────────────────────────────────────────

  async parseRSSFeed(url) {
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const parsed = await parseStringPromise(response.data, { explicitArray: false });

      const channel = parsed.rss?.channel || parsed.feed;
      if (!channel) return [];

      const items = Array.isArray(channel.item) ? channel.item :
                    channel.item ? [channel.item] : [];

      return items.map(item => ({
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || item.published || '',
        description: (item.description || '').substring(0, 200)
      }));
    } catch (error) {
      console.warn(`Could not parse RSS from ${url}:`, error.message);
      return [];
    }
  }

  extractArticleMentions(articles) {
    const mentions = [];

    for (const article of articles) {
      const text = `${article.title} ${article.description}`;
      for (const { pattern, model } of MODEL_PATTERNS) {
        if (pattern.test(text)) {
          mentions.push({
            model,
            articleTitle: article.title,
            articleUrl: article.link,
            pubDate: article.pubDate
          });
        }
      }
    }

    return mentions;
  }

  // ─── Real Latency Measurement ──────────────────────────────────────

  async measureModelLatency(provider, modelId) {
    const apiKeyVar = API_KEY_MAP[provider];
    if (!apiKeyVar || !process.env[apiKeyVar]) {
      return null;
    }

    const start = Date.now();

    try {
      switch (provider) {
        case 'anthropic':
          return await this._measureAnthropic(modelId, start);
        case 'openai':
          return await this._measureOpenAI(modelId, start);
        case 'google':
          return await this._measureGoogle(modelId, start);
        case 'deepseek':
          return await this._measureDeepSeek(modelId, start);
        case 'together':
          return await this._measureTogether(modelId, start);
        default:
          return null;
      }
    } catch (err) {
      console.warn(`Could not measure ${provider}/${modelId}: ${err.message}`);
      return null;
    }
  }

  async _measureAnthropic(modelId, start) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: modelId,
        max_tokens: 50,
        stream: true,
        messages: [{ role: 'user', content: BENCHMARK_PROMPT }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        responseType: 'stream',
        timeout: 30000
      }
    );
    return this._parseSSEStream(response.data, start);
  }

  async _measureOpenAI(modelId, start) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: modelId,
        max_tokens: 50,
        stream: true,
        messages: [{ role: 'user', content: BENCHMARK_PROMPT }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'content-type': 'application/json'
        },
        responseType: 'stream',
        timeout: 30000
      }
    );
    return this._parseSSEStream(response.data, start);
  }

  async _measureGoogle(modelId, start) {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        contents: [{ role: 'user', parts: [{ text: BENCHMARK_PROMPT }] }],
        generationConfig: { maxOutputTokens: 50 }
      },
      {
        headers: { 'content-type': 'application/json' },
        responseType: 'stream',
        timeout: 30000
      }
    );
    return this._parseSSEStream(response.data, start);
  }

  async _measureDeepSeek(modelId, start) {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: modelId,
        max_tokens: 50,
        stream: true,
        messages: [{ role: 'user', content: BENCHMARK_PROMPT }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'content-type': 'application/json'
        },
        responseType: 'stream',
        timeout: 30000
      }
    );
    return this._parseSSEStream(response.data, start);
  }

  async _measureTogether(modelId, start) {
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: modelId,
        max_tokens: 50,
        stream: true,
        messages: [{ role: 'user', content: BENCHMARK_PROMPT }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'content-type': 'application/json'
        },
        responseType: 'stream',
        timeout: 30000
      }
    );
    return this._parseSSEStream(response.data, start);
  }

  _parseSSEStream(stream, start) {
    return new Promise((resolve, reject) => {
      let ttft = null;
      let tokenCount = 0;
      let buffer = '';

      stream.on('data', (chunk) => {
        if (ttft === null) {
          ttft = Date.now() - start;
        }
        buffer += chunk.toString();

        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep partial line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            // OpenAI / DeepSeek / Together format
            const delta = parsed.choices?.[0]?.delta?.content;
            // Google Gemini format
            const googleText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            // Anthropic format
            const anthropicDelta = parsed.delta?.text;

            const text = delta || googleText || anthropicDelta || '';
            // Approximate: 1 token per 4 chars
            tokenCount += Math.max(1, Math.ceil(text.length / 4));
          } catch (_) {
            // Skip non-JSON lines (e.g. event: type)
          }
        }
      });

      stream.on('end', () => {
        const end = Date.now();
        const totalMs = end - start;
        const generationMs = end - (start + (ttft || 0));
        const throughput = generationMs > 0 ? (tokenCount / (generationMs / 1000)) : 0;

        resolve({
          ttft_ms: ttft || totalMs,
          throughput_tps: Math.round(throughput),
          measured: true
        });
      });

      stream.on('error', reject);

      // Safety timeout
      setTimeout(() => {
        stream.destroy();
        if (ttft !== null) {
          resolve({
            ttft_ms: ttft,
            throughput_tps: 0,
            measured: true
          });
        } else {
          reject(new Error('Stream timeout'));
        }
      }, 35000);
    });
  }

  async measureAllModels() {
    const results = {};

    // Run all providers in parallel, models within each provider sequentially
    const providerTasks = Object.entries(MODELS).map(async ([provider, models]) => {
      const apiKeyVar = API_KEY_MAP[provider];
      if (!process.env[apiKeyVar]) {
        console.log(`Skipping ${provider}: ${apiKeyVar} not set`);
        return;
      }

      for (const model of models) {
        console.log(`Measuring ${model.name}...`);
        await new Promise(r => setTimeout(r, 300 + Math.random() * 300));

        const result = await this.measureModelLatency(provider, model.id);
        if (result) {
          results[model.name] = result;
          console.log(`  TTFT: ${result.ttft_ms}ms, Throughput: ${result.throughput_tps} tok/s`);
        }
      }
    });

    await Promise.all(providerTasks);
    return results;
  }

  // ─── Data Collection ───────────────────────────────────────────────

  async collectLatencyData() {
    console.log('Collecting latency benchmarks...');

    // Measure real latency for providers with API keys
    this.latencyMeasurements = await this.measureAllModels();
    console.log(`Measured ${Object.keys(this.latencyMeasurements).length} models`);

    // Also fetch article mentions for metadata
    try {
      const lmsysArticles = await this.parseRSSFeed(RSS_FEEDS.lmsys);
      console.log(`Fetched ${lmsysArticles.length} LMSYS articles`);
      this.articleMentions = this.extractArticleMentions(lmsysArticles);
      console.log(`Found ${this.articleMentions.length} model mentions in articles`);
    } catch (error) {
      console.warn('RSS fetch failed:', error.message);
      this.articleMentions = [];
    }
  }

  async collectCostData() {
    console.log('Collecting cost data...');

    // Try fetching live pricing from LiteLLM's maintained pricing database
    try {
      const response = await axios.get(
        'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json',
        { timeout: 10000 }
      );
      const litellmPricing = response.data;
      const costs = {};

      const litellmKeyMap = {
        'Claude Sonnet 4': 'claude-sonnet-4-20250514',
        'Claude Opus 4': 'claude-opus-4-20250514',
        'GPT-4.1': 'gpt-4.1',
        'GPT-4.1 mini': 'gpt-4.1-mini',
        'o4-mini': 'o4-mini',
        'Gemini 2.5 Pro': 'gemini/gemini-2.5-pro',
        'Gemini 2.5 Flash': 'gemini/gemini-2.5-flash',
        'DeepSeek-V3': 'deepseek/deepseek-chat',
        'DeepSeek-R1': 'deepseek/deepseek-reasoner',
        'Qwen3 235B': 'together_ai/Qwen/Qwen3-235B-A22B-FP8',
        'Llama 4 Maverick': 'together_ai/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8'
      };

      for (const [modelName, litellmKey] of Object.entries(litellmKeyMap)) {
        const pricing = litellmPricing[litellmKey];
        if (pricing && pricing.input_cost_per_token && pricing.output_cost_per_token) {
          costs[modelName] = {
            input: pricing.input_cost_per_token * 1_000_000,
            output: pricing.output_cost_per_token * 1_000_000
          };
        }
      }

      if (Object.keys(costs).length > 0) {
        console.log(`Fetched live pricing for ${Object.keys(costs).length} models from LiteLLM`);
        return { ...this._getFallbackCosts(), ...costs };
      }
    } catch (error) {
      console.warn('Could not fetch live pricing, using fallback:', error.message);
    }

    return this._getFallbackCosts();
  }

  _getFallbackCosts() {
    return {
      'Claude Sonnet 4': { input: 3, output: 15 },
      'Claude Opus 4': { input: 15, output: 75 },
      'GPT-4.1': { input: 2, output: 8 },
      'GPT-4.1 mini': { input: 0.4, output: 1.6 },
      'o4-mini': { input: 1.1, output: 4.4 },
      'Gemini 2.5 Pro': { input: 1.25, output: 10 },
      'Gemini 2.5 Flash': { input: 0.3, output: 2.5 },
      'DeepSeek-V3': { input: 0.14, output: 0.28 },
      'DeepSeek-R1': { input: 0.55, output: 2.19 },
      'Qwen3 235B': { input: 0.2, output: 0.6 },
      'Llama 4 Maverick': { input: 0.27, output: 0.85 }
    };
  }

  // ─── Results Formatting ────────────────────────────────────────────

  formatResults() {
    // Read existing seed data as base
    let data;
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      data = JSON.parse(raw);
    } catch {
      data = {
        timestamp: new Date().toISOString(),
        models: Object.values(MODELS).flat().map(m => ({
          name: m.name,
          provider: m.provider,
          ttft_ms: 100,
          throughput_tps: 80,
          cost_input_1m: 1,
          cost_output_1m: 5,
          json_support: true,
          last_updated: new Date().toISOString().split('T')[0],
          sources: []
        }))
      };
    }

    data.timestamp = new Date().toISOString();

    // Apply cost data
    if (this.costs) {
      for (const model of data.models) {
        const cost = this.costs[model.name];
        if (cost) {
          model.cost_input_1m = cost.input;
          model.cost_output_1m = cost.output;
        }
      }
    }

    // Apply real latency measurements (overwrite seed estimates)
    for (const model of data.models) {
      const measured = this.latencyMeasurements[model.name];
      if (measured) {
        model.ttft_ms = measured.ttft_ms;
        model.throughput_tps = measured.throughput_tps;
        model.data_source = 'measured';
      } else {
        model.data_source = 'estimate';
      }
    }

    // Attach recent article mentions
    for (const model of data.models) {
      const mentions = this.articleMentions.filter(m => m.model === model.name);
      if (mentions.length > 0) {
        model.recent_articles = mentions.map(m => ({
          title: m.articleTitle,
          url: m.articleUrl,
          date: m.pubDate
        }));
      }
    }

    return data;
  }

  // ─── Persistence ───────────────────────────────────────────────────

  saveResults(results) {
    try {
      const dir = path.dirname(DATA_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_PATH, JSON.stringify(results, null, 2));
      console.log(`Saved results to ${DATA_PATH}`);
    } catch (error) {
      console.warn('Could not write to filesystem (read-only?):', error.message);
    }
  }

  async saveResultsToDatabase(results) {
    try {
      for (const model of results.models) {
        const modelId = model.provider + '/' + model.name.toLowerCase().replace(/\s+/g, '-');

        await this.db.addModel({
          id: modelId,
          name: model.name,
          provider: model.provider
        });

        await this.db.addBenchmark(modelId, 'latency', model.ttft_ms, 'ms', 'benchmark-runner');
        await this.db.addBenchmark(modelId, 'throughput', model.throughput_tps, 'tokens/sec', 'benchmark-runner');
        await this.db.addPricing(modelId, model.provider, model.cost_input_1m, model.cost_output_1m, new Date().toISOString().split('T')[0]);
      }
      console.log('Results saved to database');
    } catch (error) {
      console.error('Error saving to database:', error.message);
    }
  }

  // ─── Main Pipeline ─────────────────────────────────────────────────

  async run() {
    console.log('\nRunning LLM Benchmarks...\n');

    await this.initDatabase();
    await this.collectLatencyData();
    this.costs = await this.collectCostData();

    const results = this.formatResults();
    this.lastUpdated = results.timestamp;

    this.saveResults(results);
    await this.saveResultsToDatabase(results);

    console.log('\nBenchmarks complete');
    return results;
  }
}

module.exports = BenchmarkRunner;

// Run if executed directly
if (require.main === module) {
  const runner = new BenchmarkRunner();
  runner.run().then(results => {
    console.log(JSON.stringify(results, null, 2));
    runner.db.close();
  }).catch(error => {
    console.error('Fatal error:', error);
    runner.db.close();
    process.exit(1);
  });
}
