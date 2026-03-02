/**
 * Publish benchmark results
 * Reads latest results from data/models.json and outputs summary
 * In production: could push to Supabase, send webhooks, etc.
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'models.json');

function publish() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error('No data file found. Run `npm run benchmark:run` first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  console.log(`Published ${data.models.length} models (last updated: ${data.timestamp})`);

  return data;
}

if (require.main === module) {
  publish();
}

module.exports = publish;
