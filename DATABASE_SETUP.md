# Database Setup Guide for Claude Code

## What's Ready

✅ Database schema defined in `SCHEMA.md`
✅ Migration files in `db/migrations/`
✅ Database utility module in `src/db.js`
✅ Benchmark runner updated to save data (in `src/benchmark.js`)
✅ `better-sqlite3` added to package.json

## What Claude Code Needs to Do

### Task 1: Wire up the RSS parser to use the database
**File:** `src/benchmark.js`

Currently, `fetchLMSYSBenchmarks()` just logs that it fetched data. It needs to:
1. Parse the LMSYS RSS feed for model names and latency metrics
2. Extract benchmark data
3. Call `this.db.addBenchmark()` to save each result

**Example:**
```javascript
async fetchLMSYSBenchmarks() {
  const response = await axios.get(RSS_FEEDS.lmsys);
  // Parse XML (use xml2js or similar)
  // For each benchmark found:
  this.db.addBenchmark(modelId, 'latency', value, 'ms', 'lmsys');
  return benchmarks;
}
```

### Task 2: Create API routes to query the database
**File:** `pages/api/models.js`

Create an endpoint that returns the latest benchmarks:
```javascript
import Database from '../../src/db';

export default function handler(req, res) {
  const db = new Database();
  db.init();
  
  const models = db.getLatestBenchmarks('latency');
  res.status(200).json(models);
}
```

### Task 3: Update the dashboard to fetch from the API
**File:** `pages/index.js`

Replace mock data with real API calls:
```javascript
const [models, setModels] = useState([]);

useEffect(() => {
  fetch('/api/models')
    .then(r => r.json())
    .then(data => setModels(data));
}, []);
```

## How the Database Fits In

```
LMSYS RSS → fetchLMSYSBenchmarks() → db.addBenchmark() → SQLite
                                                           ↓
                                                      API routes
                                                           ↓
                                                      Dashboard UI
```

## Key Files

| File | Purpose |
|------|---------|
| `src/db.js` | Database class - use `new Database()` and call `db.getLatestBenchmarks()` |
| `db/migrations/` | SQL migrations - run automatically on `db.init()` |
| `SCHEMA.md` | Full schema reference |
| `src/benchmark.js` | Already updated to call `db.saveResultsToDatabase()` |

## Dependencies

Run this before starting:
```bash
npm install
```

`better-sqlite3` is already in package.json.

## Testing

```bash
# Run benchmarks and save to DB
npm run benchmark:run

# Verify data was saved
sqlite3 data/benchmarks.db "SELECT * FROM models;"
```

## Questions?

This is the foundation for Week 1. Once the parser saves real data, the dashboard will auto-populate and you can build the UI on top of actual metrics instead of mocks.
