# Claude Code Guide - How to Continue Development

You're set up to use **Claude Code (ACP Harness)** to implement the remaining features. Here's exactly how.

---

## 📖 Read These First (In Order)

1. **NEXT_STEPS.md** (what to build) ← You should have this already
2. **ARCHITECTURE.md** (how it fits together)
3. **This file** (how to use Claude Code)

---

## 🎯 Week 1 Tasks (Use Claude Code For These)

### TASK 1: LMSYS RSS Parser
**Goal:** Extract real latency data from blog articles

**Start Claude Code with:**
```
/claude-code implement-lmsys-parser

"Your task:
Modify src/benchmark.js to:
1. Install xml2js in package.json
2. Create parseRSSFeed(url) function
   - Fetch https://lmsys.org/rss
   - Parse XML
   - Return articles with title, link, date
3. Create extractLatencyMetrics(articles) function
   - Search titles for keywords: latency, ttft, faster, ms
   - Extract numbers (45ms, 120ms, etc)
   - Map to model names
4. Call these in BenchmarkRunner.collectLatencyData()

Reference:
- Article example: 'Optimizing GLM4-MoE for Production: 65% Faster TTFT'
- Expected output: {model: 'GLM4-MoE', ttft_ms: 45, source: 'LMSYS'}
"
```

**What to expect:**
- Claude Code creates/modifies files
- Shows you diffs
- You review & approve
- Files auto-push to GitHub

**Time:** 2-3 hours

---

### TASK 2: Dashboard Page
**Goal:** Create `/pages/index.js` with working UI

**Start Claude Code with:**
```
/claude-code create-dashboard

"Your task:
Create pages/index.js with:
1. Import data from src/data.json
2. Display top 3 models by TTFT (latency)
3. Display top 3 models by cost
4. Show full comparison table
5. Use Tailwind CSS for styling
6. Display last updated timestamp

Components needed:
- ModelCard (show individual model stats)
- BenchmarkChart (scatter plot of latency vs cost)

Use:
- Next.js getStaticProps with ISR (revalidate: 3600)
- Recharts for charts
- Tailwind for layout

Reference ARCHITECTURE.md for data schema
"
```

**What to expect:**
- Creates pages/index.js
- Creates components/ModelCard.js
- Creates components/BenchmarkChart.js
- Dashboard ready to view

**Time:** 3-4 hours

---

### TASK 3: Setup & Integration
**Goal:** Wire everything together

**Start Claude Code with:**
```
/claude-code setup-integration

"Your task:
1. Create next.config.js
2. Create .env.local template
3. Create pages/api/cron/benchmark.js (Vercel Cron)
4. Update package.json with missing deps:
   - xml2js
   - cheerio
   - recharts (already there)
5. Test: 'npm run dev' should work

The cron endpoint should:
- Accept POST from Vercel
- Run BenchmarkRunner
- Save results to data.json
- Return success status
"
```

**What to expect:**
- Config files created
- All dependencies installed
- npm run dev works locally

**Time:** 2-3 hours

---

## 🛠️ How to Start Each Task

### Option A: Use OpenClaw CLI (Recommended)
```bash
# Start an ACP session for the task
openclaw sessions_spawn \
  --task "Implement LMSYS RSS parser - see NEXT_STEPS.md Task 1.1" \
  --runtime acp \
  --mode session \
  --thread true
```

### Option B: Use Claude Code directly
If you have Claude's Code Interpreter:
1. Open Claude Code
2. Say: "Clone repo from github.com/miguelpq-ai/llm-benchmarks"
3. Say: "Read NEXT_STEPS.md and ARCHITECTURE.md"
4. Say: "[Give the task description above]"
5. Let Claude create/modify files
6. Review changes
7. Run `git push` to commit

---

## ✅ Workflow For Each Task

1. **Start:** Create Claude Code session with task description
2. **Implement:** Claude Code writes code, shows diffs
3. **Test:** Run `npm run dev` locally to see if it works
4. **Review:** Check git diffs, ensure quality
5. **Commit:** `git add -A && git commit -m "message" && git push`
6. **Next:** I'll see on GitHub, provide feedback if needed

---

## 📂 Key Files to Know

**READ FIRST:**
- `README.md` - Project overview
- `ARCHITECTURE.md` - System design
- `NEXT_STEPS.md` - Detailed task breakdown

**MODIFY (via Claude Code):**
- `src/benchmark.js` - Data collection
- `package.json` - Dependencies
- `pages/index.js` - Dashboard
- `components/ModelCard.js` - Card UI
- `components/BenchmarkChart.js` - Chart UI
- `pages/api/cron/benchmark.js` - Background job

**CREATE (via Claude Code):**
- `next.config.js` - Next.js config
- `.env.local` - Environment variables
- `public/` - Static files if needed
- `styles/` - Global CSS if needed

---

## 🔍 Data Flow (For Reference)

```
1. BenchmarkRunner.run() [src/benchmark.js]
   ↓ fetches LMSYS RSS
   ↓ extracts latency data
   ↓ fetches pricing
   ↓ merges data
   ↓ returns {models: [...]}

2. Save to src/data.json [api/cron/benchmark.js]
   ↓ Vercel Cron triggers every 6 hours
   ↓ Runs benchmark runner
   ↓ Saves to data.json

3. Dashboard loads data [pages/index.js]
   ↓ Uses getStaticProps
   ↓ Renders ModelCards
   ↓ Shows BenchmarkChart
   ↓ User sees live benchmark data
```

---

## 🚨 Common Issues & Solutions

**Issue:** "Cannot find module xml2js"
**Solution:** Run `npm install xml2js` or let Claude Code add it to package.json

**Issue:** Dashboard shows no data
**Solution:** Check that src/data.json exists and has model data

**Issue:** Pages not found
**Solution:** Create pages/index.js (not src/pages/)

**Issue:** Tailwind classes not working
**Solution:** Ensure tailwindcss.config.js exists (create if missing)

---

## 📊 Progress Tracking

After each task, you should have:

**After Task 1 (RSS Parser):**
- `npm run benchmark:run` extracts data from LMSYS
- `src/data.json` is created with model data
- Tests pass

**After Task 2 (Dashboard):**
- `npm run dev` works
- http://localhost:3000 shows dashboard
- Models ranked by latency & cost visible
- Charts display correctly

**After Task 3 (Setup):**
- All configs in place
- Ready for Vercel deployment
- `npm run build` succeeds

---

## 🚀 Next Steps After Week 1

Once dashboard is live:
1. Deploy to Vercel (instructions below)
2. Test the live URL
3. Share it (Twitter, HN, etc)
4. Start Week 2: Premium API + Stripe

### Quick Vercel Deploy
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 💬 Questions?

- Check **NEXT_STEPS.md** for detailed task descriptions
- Open a GitHub Issue if stuck
- I'll see commits and can help unblock

---

## 🎯 Success Looks Like

By end of Week 1:
- ✅ Repository updated with complete code
- ✅ Dashboard live at vercel.app
- ✅ Real benchmark data showing
- ✅ Auto-updates every 6 hours
- ✅ Ready for monetization (Week 2)

You've got this! Go build it 🚀
