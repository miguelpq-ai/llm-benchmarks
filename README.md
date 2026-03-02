# LLM Benchmarks - Real-time Model Performance & Cost Analytics

> **Live dashboard + API for LLM latency, throughput, and cost optimization**

## Overview

Real-time benchmarks for LLM models (Claude, Qwen, DeepSeek, etc.) focused on:
- **Latency** (TTFT - Time to First Token)
- **Throughput** (tokens/second)
- **Cost** ($/1M tokens)
- **JSON output** support

## Features

✅ **Public Dashboard** - See live benchmarks at a glance
✅ **Premium API** - Programmatic access to model rankings & recommendations  
✅ **Auto-updated** - Benchmarks refresh 6x daily
✅ **Model Routing** - "Which model should I use for this task?"
✅ **Cost Optimization** - Find the best latency/cost tradeoff

## Getting Started

### Development

```bash
# Clone
git clone https://github.com/cristianpq/llm-benchmarks.git
cd llm-benchmarks

# Install deps
npm install

# Run dashboard locally
npm run dev

# Run tests
npm test
```

### API Usage (Premium)

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.llm-benchmarks.io/v1/best-model?task=json_generation&latency_target=50ms
```

Response:
```json
{
  "model": "qwen",
  "ttft_ms": 45,
  "throughput_tps": 120,
  "cost_per_1m_tokens": 0.002,
  "json_support": true,
  "recommendation_score": 95
}
```

## Roadmap

- [x] Core benchmarking pipeline
- [ ] Public dashboard launch (Week 2)
- [ ] API v1 (Week 3)
- [ ] Stripe integration (Week 4)
- [ ] Webhooks & alerts (Week 5)

## Pricing

- **Dashboard**: Free
- **API**: $99/month (includes 10k requests/month)

## License

MIT
