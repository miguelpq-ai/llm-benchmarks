/**
 * API key authentication middleware.
 * If a Bearer token is present, validate it against the database.
 * Public access is allowed without a key (with lower rate limits).
 */

const Database = require('./db');

const PREMIUM_RATE_LIMIT = parseInt(process.env.PREMIUM_RATE_LIMIT_PER_MINUTE, 10) || 1000;
const PUBLIC_RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10) || 100;

/**
 * Authenticate an API request.
 * Returns { authenticated: true, plan, rateLimit } if key is valid,
 * { authenticated: false, rateLimit } for public access,
 * or null if an invalid key was provided (response already sent).
 */
async function authenticateApiKey(req, res) {
  const authHeader = req.headers.authorization;

  // No auth header → public access
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, rateLimit: PUBLIC_RATE_LIMIT };
  }

  const key = authHeader.slice(7).trim();
  if (!key) {
    return { authenticated: false, rateLimit: PUBLIC_RATE_LIMIT };
  }

  try {
    const db = new Database();
    await db.init();
    const apiKey = await db.validateApiKey(key);
    db.close();

    if (!apiKey) {
      res.status(401).json({ error: 'Invalid or inactive API key' });
      return null;
    }

    return {
      authenticated: true,
      plan: apiKey.plan,
      email: apiKey.customer_email,
      rateLimit: PREMIUM_RATE_LIMIT,
    };
  } catch (err) {
    console.error('API key validation error:', err.message);
    // Fail open for DB errors — allow public access
    return { authenticated: false, rateLimit: PUBLIC_RATE_LIMIT };
  }
}

module.exports = { authenticateApiKey, PREMIUM_RATE_LIMIT, PUBLIC_RATE_LIMIT };
