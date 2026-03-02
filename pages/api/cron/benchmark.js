export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const BenchmarkRunner = require('../../../src/benchmark');
    const runner = new BenchmarkRunner();
    const results = await runner.run();

    res.status(200).json({
      success: true,
      modelsUpdated: results.models.length,
      timestamp: results.timestamp,
    });
  } catch (error) {
    console.error('Cron benchmark error:', error);
    res.status(500).json({ error: error.message });
  }
}
