const ModelsAPI = require('../../../api/models');
const { validateSort, validateLimit, ValidationError } = require('../../../src/validate');
const { rateLimit } = require('../../../src/rate-limit');
const { authenticateApiKey } = require('../../../src/api-auth');

const api = new ModelsAPI();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticateApiKey(req, res);
  if (!auth) return; // invalid key — response already sent

  if (!rateLimit(req, res, auth.rateLimit)) return;

  let sort, limit;
  try {
    sort = validateSort(req.query.sort);
    limit = validateLimit(req.query.limit);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }

  await api.getBenchmarks();
  const models = api.getModelsRanked(sort, limit);

  res.status(200).json({ models });
}
