const { rateLimit } = require('../src/rate-limit');

function makeReq(ip = '127.0.0.1') {
  return {
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: ip }
  };
}

function makeRes() {
  const headers = {};
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn((key, val) => { headers[key] = val; }),
    _headers: headers
  };
}

describe('rateLimit', () => {
  test('allows requests under the limit', () => {
    const req = makeReq('10.0.0.1');
    const res = makeRes();
    const allowed = rateLimit(req, res, 100);
    expect(allowed).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('sets rate limit headers', () => {
    const req = makeReq('10.0.0.2');
    const res = makeRes();
    rateLimit(req, res, 50);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 50);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
  });

  test('blocks requests over the limit', () => {
    const ip = '10.0.0.3';
    const limit = 3;

    for (let i = 0; i < limit; i++) {
      const res = makeRes();
      expect(rateLimit(makeReq(ip), res, limit)).toBe(true);
    }

    // Next request should be blocked
    const res = makeRes();
    const allowed = rateLimit(makeReq(ip), res, limit);
    expect(allowed).toBe(false);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('different IPs have separate limits', () => {
    const limit = 2;

    // Exhaust limit for IP A
    for (let i = 0; i <= limit; i++) {
      rateLimit(makeReq('10.0.0.4'), makeRes(), limit);
    }

    // IP B should still be allowed
    const res = makeRes();
    expect(rateLimit(makeReq('10.0.0.5'), res, limit)).toBe(true);
  });
});
