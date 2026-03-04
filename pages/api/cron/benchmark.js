// Vercel Pro: allow up to 60s for benchmark collection
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Support both Vercel's CRON_SECRET and our CRON_AUTH_TOKEN
  const secret = process.env.CRON_SECRET || process.env.CRON_AUTH_TOKEN;
  if (!secret) {
    return res.status(500).json({ error: 'Cron secret not configured' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const ModelsAPI = require('../../../api/models');
    const api = new ModelsAPI();
    const results = await api.runBenchmarks();

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
