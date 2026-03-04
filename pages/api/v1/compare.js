const ModelsAPI = require('../../../api/models');
const { rateLimit } = require('../../../src/rate-limit');
const { authenticateApiKey } = require('../../../src/api-auth');

const api = new ModelsAPI();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticateApiKey(req, res);
  if (!auth) return;

  if (!rateLimit(req, res, auth.rateLimit)) return;

  const { models: modelsParam } = req.query;
  if (!modelsParam) {
    return res.status(400).json({ error: 'models parameter is required (comma-separated model names)' });
  }

  const modelNames = modelsParam.split(',').map(n => n.trim()).filter(Boolean);
  if (modelNames.length < 2) {
    return res.status(400).json({ error: 'At least 2 model names are required for comparison' });
  }

  await api.getBenchmarks();
  const compared = api.compareModels(modelNames);

  if (compared.length === 0) {
    return res.status(404).json({ error: 'No matching models found', available: (await api.getBenchmarks()).models?.map(m => m.name) || [] });
  }

  res.status(200).json({ models: compared });
}
