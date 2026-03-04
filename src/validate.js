const VALID_SORT_VALUES = ['latency', 'cost', 'throughput'];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateSort(sort) {
  if (!sort) return 'latency';
  if (!VALID_SORT_VALUES.includes(sort)) {
    throw new ValidationError(`sort must be one of: ${VALID_SORT_VALUES.join(', ')}`);
  }
  return sort;
}

function validateLimit(limit) {
  if (limit === undefined || limit === null || limit === '') return 10;
  const n = parseInt(limit, 10);
  if (isNaN(n) || n < 1 || n > 100) {
    throw new ValidationError('limit must be an integer between 1 and 100');
  }
  return n;
}

function validatePositiveNumber(value, name) {
  if (value === undefined || value === null || value === '') return null;
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) {
    throw new ValidationError(`${name} must be a positive number`);
  }
  return n;
}

module.exports = { validateSort, validateLimit, validatePositiveNumber, ValidationError };
