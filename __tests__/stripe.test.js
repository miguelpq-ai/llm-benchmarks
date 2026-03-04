/**
 * Tests for Stripe webhook and checkout endpoint logic.
 * These test the handler functions directly with mocked Stripe.
 */

const Database = require('../src/db');

describe('Stripe checkout', () => {
  let handler;

  beforeEach(() => {
    jest.resetModules();
    // Clear Stripe env to test guard
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID;
  });

  test('rejects non-POST requests', async () => {
    // Dynamic require to get fresh module
    handler = require('../pages/api/stripe/checkout').default;

    const req = { method: 'GET' };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('returns 500 if Stripe not configured', async () => {
    handler = require('../pages/api/stripe/checkout').default;

    const req = { method: 'POST', body: { email: 'test@test.com' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Stripe is not configured' });
  });

  test('returns 400 if email missing', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_ID = 'price_test_fake';
    jest.resetModules();
    handler = require('../pages/api/stripe/checkout').default;

    const req = { method: 'POST', body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
  });
});

describe('API key DB operations', () => {
  let db;

  beforeAll(async () => {
    db = new Database(':memory:');
    await db.init();
  });

  afterAll(() => db.close());

  test('creates and validates an API key', async () => {
    const key = await db.createApiKey('test@example.com', 'cus_test123', 'premium');
    expect(key).toMatch(/^llmb_/);
    expect(key.length).toBeGreaterThan(10);

    const result = await db.validateApiKey(key);
    expect(result).toBeTruthy();
    expect(result.customer_email).toBe('test@example.com');
    expect(result.plan).toBe('premium');
  });

  test('returns null for invalid API key', async () => {
    const result = await db.validateApiKey('llmb_nonexistent');
    expect(result).toBeNull();
  });

  test('deactivates API key by Stripe customer', async () => {
    const key = await db.createApiKey('deactivate@test.com', 'cus_deactivate');

    // Key should be valid
    let result = await db.validateApiKey(key);
    expect(result).toBeTruthy();
    expect(result.active).toBe(1);

    // Deactivate
    await db.deactivateApiKeyByStripeCustomer('cus_deactivate');

    // Key should now be invalid
    result = await db.validateApiKey(key);
    expect(result).toBeNull();
  });

  test('finds API key by Stripe customer', async () => {
    await db.createApiKey('lookup@test.com', 'cus_lookup');
    const result = await db.getApiKeyByStripeCustomer('cus_lookup');
    expect(result).toBeTruthy();
    expect(result.customer_email).toBe('lookup@test.com');
  });
});
