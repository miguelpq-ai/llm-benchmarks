describe('Cron auth', () => {
  let handler;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.CRON_AUTH_TOKEN;
    delete process.env.CRON_SECRET;
  });

  function makeRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  }

  test('returns 405 for unsupported methods', async () => {
    process.env.CRON_AUTH_TOKEN = 'secret';
    handler = require('../pages/api/cron/benchmark').default;
    const res = makeRes();
    await handler({ method: 'DELETE', headers: {} }, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('returns 500 when no cron secret is set', async () => {
    handler = require('../pages/api/cron/benchmark').default;
    const res = makeRes();
    await handler({ method: 'POST', headers: { authorization: 'Bearer undefined' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('returns 401 for wrong token', async () => {
    process.env.CRON_AUTH_TOKEN = 'secret123';
    handler = require('../pages/api/cron/benchmark').default;
    const res = makeRes();
    await handler({ method: 'POST', headers: { authorization: 'Bearer wrongtoken' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 for missing auth header', async () => {
    process.env.CRON_AUTH_TOKEN = 'secret123';
    handler = require('../pages/api/cron/benchmark').default;
    const res = makeRes();
    await handler({ method: 'POST', headers: {} }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('accepts CRON_SECRET (Vercel convention)', async () => {
    process.env.CRON_SECRET = 'vercel-secret';
    handler = require('../pages/api/cron/benchmark').default;
    const res = makeRes();
    // With wrong token it should be 401 (proves CRON_SECRET is read)
    await handler({ method: 'POST', headers: { authorization: 'Bearer wrong' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
