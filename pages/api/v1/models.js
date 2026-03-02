const ModelsAPI = require('../../../api/models');

const api = new ModelsAPI();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await api.getBenchmarks();

  const sort = req.query.sort || 'latency';
  const limit = parseInt(req.query.limit) || 10;
  const models = api.getModelsRanked(sort, limit);

  res.status(200).json({ models });
}
