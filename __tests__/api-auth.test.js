const Database = require('../src/db');

// Mock the database module
jest.mock('../src/db');

const { authenticateApiKey } = require('../src/api-auth');

function makeReq(authHeader) {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('authenticateApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns public access when no auth header', async () => {
    const result = await authenticateApiKey(makeReq(), makeRes());
    expect(result).toEqual({ authenticated: false, rateLimit: 100 });
  });

  test('returns public access for non-Bearer auth', async () => {
    const result = await authenticateApiKey(makeReq('Basic abc123'), makeRes());
    expect(result).toEqual({ authenticated: false, rateLimit: 100 });
  });

  test('returns null and sends 401 for invalid key', async () => {
    const mockDb = {
      init: jest.fn(),
      validateApiKey: jest.fn().mockResolvedValue(null),
      close: jest.fn(),
    };
    Database.mockImplementation(() => mockDb);

    const res = makeRes();
    const result = await authenticateApiKey(makeReq('Bearer llmb_invalid'), res);

    expect(result).toBeNull();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or inactive API key' });
  });

  test('returns authenticated for valid key', async () => {
    const mockDb = {
      init: jest.fn(),
      validateApiKey: jest.fn().mockResolvedValue({
        key: 'llmb_valid',
        customer_email: 'test@example.com',
        plan: 'premium',
        active: 1,
      }),
      close: jest.fn(),
    };
    Database.mockImplementation(() => mockDb);

    const result = await authenticateApiKey(makeReq('Bearer llmb_valid'), makeRes());

    expect(result).toEqual({
      authenticated: true,
      plan: 'premium',
      email: 'test@example.com',
      rateLimit: 1000,
    });
  });

  test('returns public access on DB error (fail open)', async () => {
    Database.mockImplementation(() => ({
      init: jest.fn().mockRejectedValue(new Error('DB down')),
    }));

    const result = await authenticateApiKey(makeReq('Bearer llmb_test'), makeRes());
    expect(result).toEqual({ authenticated: false, rateLimit: 100 });
  });
});
