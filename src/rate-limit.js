/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window per IP address.
 */

const DEFAULT_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10) || 100;
const WINDOW_MS = 60 * 1000; // 1 minute

// Map of IP -> { count, resetAt }
const store = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Rate limit middleware for Next.js API routes.
 * Returns true if the request is allowed, false if rate limited.
 * Sets appropriate headers on the response.
 */
function rateLimit(req, res, limit = DEFAULT_LIMIT) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';

  const now = Date.now();
  let entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ip, entry);
  }

  entry.count++;

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

  if (entry.count > limit) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return false;
  }

  return true;
}

module.exports = { rateLimit };
