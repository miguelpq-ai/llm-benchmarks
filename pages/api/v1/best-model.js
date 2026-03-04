const ModelsAPI = require('../../../api/models');
const { validatePositiveNumber, ValidationError } = require('../../../src/validate');
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

  let latency_target, budget;
  try {
    latency_target = validatePositiveNumber(req.query.latency_target, 'latency_target');
    budget = validatePositiveNumber(req.query.budget, 'budget');
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }

  await api.getBenchmarks();
  const best = api.getBestModel({ ...req.query, latency_target, budget });

  if (!best) {
    return res.status(404).json({ error: 'No model matches constraints' });
  }

  res.status(200).json(best);
}
