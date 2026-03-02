const ModelsAPI = require('../../../api/models');

const api = new ModelsAPI();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await api.getBenchmarks();
  const best = api.getBestModel(req.query);

  if (!best) {
    return res.status(404).json({ error: 'No model matches constraints' });
  }

  res.status(200).json(best);
}
