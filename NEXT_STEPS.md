# NEXT STEPS - Detailed Development Plan

## Status: Ready for Week 1 Development

**What's done:** Project structure, scaffold, documentation
**What's missing:** Data pipeline, dashboard UI, integration
**Estimated time:** ~40 hours to get to launch

---

## 🎯 WEEK 1: Data Pipeline + Dashboard MVP

### PRIORITY 1: Benchmark Data Pipeline Integration
**Goal:** Make `npm run benchmark:run` collect REAL data from LMSYS RSS + pricing APIs

#### Task 1.1: LMSYS RSS Parser
**File to modify:** `src/benchmark.js`

**What it should do:**
```
Input: https://lmsys.org/rss
Output: Array of articles with titles about latency/performance
Parse: Extract metrics from titles like:
  - "Optimizing GLM4-MoE for Production: 65% Faster TTFT with SGLang"
    → Extract: model=GLM4-MoE, metric=TTFT, value=65% faster
```

**Libraries to add:**
- `xml2js` (parse RSS XML)
- `cheerio` (parse HTML content from blog posts)

**Implementation steps:**
1. Add `xml2js` and `cheerio` to package.json
2. Create function `parseRSSFeed(url)` that:
   - Fetches RSS
   - Parses XML
   - Extracts title + link
   - Returns array of articles
3. Create function `extractLatencyMetrics(articles)` that:
   - Looks for keywords: "latency", "ttft", "faster", "ms"
   - Extracts numbers (45ms, 120ms, etc)
   - Maps to model names
4. In `BenchmarkRunner.collectLatencyData()`, call these functions

**Expected output:**
```javascript
[
  {
    model: "GLM4-MoE",
    ttft_ms: 65, // extracted as "65% faster" → baseline is ~100ms
    source: "LMSYS",
    article: "Optimizing GLM4-MoE...",
    url: "https://..."
  },
  // ... more models
]
```

---

#### Task 1.2: Pricing Data Collection
**File to modify:** `src/benchmark.js`

**What it should do:**
```
Fetch current prices from:
  - OpenAI API (Claude via API)
  - Anthropic API docs
  - Together AI pricing
  - DeepSeek pricing
  
Map to: cost_input_1m, cost_output_1m
```

**Implementation steps:**
1. Create function `fetchPricingData()` that:
   - Hardcodes known pricing OR
   - Fetches from public pricing pages (Stripe checkout, etc)
   
2. Return object:
   ```javascript
   {
     "Claude 3.5 Sonnet": { input: 3, output: 15 },
     "Qwen2.5 72B": { input: 0.14, output: 0.28 },
     // ...
   }
   ```

3. Update `BenchmarkRunner.formatResults()` to merge latency + pricing

**Where to get prices:**
- Anthropic: https://www.anthropic.com/pricing
- OpenAI: https://openai.com/pricing
- Together: https://www.together.ai/pricing
- DeepSeek: https://platform.deepseek.com/pricing

---

#### Task 1.3: Data Persistence
**File to create:** `src/data.json` (or Supabase if you want)

**What it should do:**
- Save benchmarks to `data.json` after each run
- Include timestamp + all model data
- Used by frontend to display

**For now:** Simple JSON file is fine. Later we can upgrade to Supabase.

---

### PRIORITY 2: Public Dashboard (Next.js)
**Goal:** Create `/pages/index.js` that displays live benchmarks

#### Task 2.1: Dashboard Page
**File to create:** `pages/index.js`

**What it should show:**
```
┌─────────────────────────────────────┐
│     LLM BENCHMARKS - Live           │
│  Last updated: 2 hours ago          │
├─────────────────────────────────────┤
│                                     │
│  FASTEST MODELS (by TTFT)          │
│  1. Qwen2.5 72B     45ms  $0.0003  │
│  2. DeepSeek-V3     85ms  $0.0011  │
│  3. Claude Opus    120ms  $0.0075  │
│                                     │
│  CHEAPEST MODELS (by cost)         │
│  1. Qwen2.5 72B           $0.0003  │
│  2. DeepSeek-V3           $0.0011  │
│  ...                               │
│                                     │
│  [Detailed Comparison Table]       │
│  [JSON Output Support Status]      │
│                                     │
└─────────────────────────────────────┘
```

**Libraries:**
- `recharts` - Charts (already in package.json)
- `tailwindcss` - Styling (already in package.json)

**Data flow:**
1. Load `data.json` at build time (getStaticProps)
2. Revalidate every 1 hour (ISR)
3. Display top 3 models by latency
4. Display top 3 models by cost
5. Show full table with all models
6. Last updated timestamp

---

#### Task 2.2: Model Card Component
**File to create:** `components/ModelCard.js`

**What it displays:**
```
┌──────────────────────────────┐
│ Claude 3.5 Sonnet            │
├──────────────────────────────┤
│ TTFT:     120 ms             │
│ TPT:      80 tokens/sec      │
│ Cost:     $15 / 1M tokens    │
│ JSON:     ✅ Supported       │
│ Source:   LMSYS, Anthropic   │
└──────────────────────────────┘
```

**Props:**
```javascript
<ModelCard
  name="Claude 3.5 Sonnet"
  ttft_ms={120}
  throughput_tps={80}
  cost={15}
  json_support={true}
  sources={["LMSYS", "Anthropic"]}
/>
```

---

#### Task 2.3: Benchmark Chart Component
**File to create:** `components/BenchmarkChart.js`

**What it shows:**
- Scatter plot: X=latency, Y=cost
- Each dot = one model
- Color = json support (green/red)
- Hover = model name

**Library:** `recharts` ScatterChart

---

### PRIORITY 3: Setup + Configuration

#### Task 3.1: Next.js Configuration
**File to create:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // ISR: revalidate every hour
  staticProps: {
    revalidate: 3600
  }
};

module.exports = nextConfig;
```

#### Task 3.2: Environment Variables
**File to create:** `.env.local`

```env
# For local development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Later: Supabase
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Later: Stripe
# STRIPE_SECRET_KEY=...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

#### Task 3.3: Cron Job (Benchmark Runner)
**For Vercel deployment:** Use Vercel Cron

**File to create:** `pages/api/cron/benchmark.js`

```javascript
/**
 * Called every 6 hours by Vercel Cron
 * Runs BenchmarkRunner and saves results to file
 */

export default async function handler(req, res) {
  // Verify cron secret token
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_AUTH_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const BenchmarkRunner = require('../../../src/benchmark');
    const runner = new BenchmarkRunner();
    const results = await runner.run();
    
    // Save to data.json or Supabase
    // ...
    
    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 📋 Summary: Files to Create/Modify

### NEW FILES (Week 1)
```
pages/
├── index.js                    ← Dashboard homepage
└── api/
    └── cron/
        └── benchmark.js        ← Background job

components/
├── ModelCard.js                ← Model display card
└── BenchmarkChart.js           ← Latency vs Cost chart

next.config.js                  ← Next.js config
.env.local                       ← Environment variables
src/data.json                    ← Benchmark data (auto-generated)
```

### MODIFY FILES
```
src/benchmark.js                ← Add LMSYS parser + pricing fetch
package.json                    ← Add xml2js, cheerio
```

---

## 🚀 How to Use Claude Code (ACP)

### Step 1: Start Claude Code Session
```bash
# In OpenClaw or CLI:
/claude-code llm-benchmarks

# Or using sessions:
openclaw sessions_spawn \
  --task "Implement LMSYS RSS parser for benchmark runner" \
  --runtime acp \
  --mode session \
  --thread true
```

### Step 2: Give Instructions
Tell Claude Code exactly what to do:

**Example prompt:**
```
Task: Implement LMSYS RSS parser in src/benchmark.js

Requirements:
1. Use xml2js to parse https://lmsys.org/rss
2. Extract article titles and look for latency metrics
3. Map extracted metrics to model names
4. Return array of {model, ttft_ms, source, url}

Expected output:
[
  { model: "Qwen2.5", ttft_ms: 45, source: "LMSYS", url: "..." },
  { model: "Claude", ttft_ms: 120, source: "LMSYS", url: "..." }
]

Files to modify:
- src/benchmark.js: Add parseRSSFeed() and extractLatencyMetrics()
- package.json: Add xml2js dependency
```

### Step 3: Review + Merge
- Claude Code will create files/changes
- Review the diffs
- Commit and push to GitHub
- I can see updates in real-time

---

## ✅ Checklist for Week 1

- [ ] Task 1.1: LMSYS RSS Parser (2-3 hours)
- [ ] Task 1.2: Pricing Data Collection (1-2 hours)
- [ ] Task 1.3: Data Persistence (1 hour)
- [ ] Task 2.1: Dashboard Page (3-4 hours)
- [ ] Task 2.2: ModelCard Component (2 hours)
- [ ] Task 2.3: BenchmarkChart Component (2 hours)
- [ ] Task 3.1: Next.js Config (1 hour)
- [ ] Task 3.2: Environment Setup (30 min)
- [ ] Task 3.3: Cron Job (2 hours)
- [ ] **Test locally:** `npm run dev` → http://localhost:3000
- [ ] **Deploy to Vercel**

**Total estimate:** 16-18 hours

---

## 💬 Communication

**After each Claude Code session:**
1. I'll see commits on GitHub
2. I'll review + provide feedback
3. Next task will be clear based on progress

**Feel free to:**
- Ask questions in GitHub Issues
- Request clarifications
- Pivot if something isn't working

**I'll:**
- Monitor repo for updates
- Review PRs/commits
- Unblock you with infrastructure help
- Handle later phases (Stripe, API, etc)

---

## 🎯 Success Criteria

**By end of Week 1:**
- ✅ Dashboard live at llm-benchmarks.vercel.app
- ✅ Shows real benchmark data from LMSYS
- ✅ Benchmarks auto-update every 6 hours
- ✅ Clean UI with latency + cost rankings
- ✅ At least 100+ lines of new code

**Then Week 2:** API endpoints
**Then Week 3:** Stripe integration
**Then Week 4+:** Launch + marketing
