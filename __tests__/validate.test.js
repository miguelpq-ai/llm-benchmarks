const { validateSort, validateLimit, validatePositiveNumber, ValidationError } = require('../src/validate');

describe('validateSort', () => {
  test('accepts valid sort values', () => {
    expect(validateSort('latency')).toBe('latency');
    expect(validateSort('cost')).toBe('cost');
    expect(validateSort('throughput')).toBe('throughput');
  });

  test('returns default when not provided', () => {
    expect(validateSort(undefined)).toBe('latency');
    expect(validateSort(null)).toBe('latency');
    expect(validateSort('')).toBe('latency');
  });

  test('throws ValidationError for invalid value', () => {
    expect(() => validateSort('speed')).toThrow(ValidationError);
    expect(() => validateSort('price')).toThrow(ValidationError);
    expect(() => validateSort('__proto__')).toThrow(ValidationError);
  });
});

describe('validateLimit', () => {
  test('accepts valid limits', () => {
    expect(validateLimit('10')).toBe(10);
    expect(validateLimit('1')).toBe(1);
    expect(validateLimit('100')).toBe(100);
  });

  test('returns default when not provided', () => {
    expect(validateLimit(undefined)).toBe(10);
    expect(validateLimit(null)).toBe(10);
    expect(validateLimit('')).toBe(10);
  });

  test('throws for out-of-range values', () => {
    expect(() => validateLimit('0')).toThrow(ValidationError);
    expect(() => validateLimit('101')).toThrow(ValidationError);
    expect(() => validateLimit('-1')).toThrow(ValidationError);
  });

  test('throws for non-numeric values', () => {
    expect(() => validateLimit('abc')).toThrow(ValidationError);
  });
});

describe('validatePositiveNumber', () => {
  test('accepts positive numbers', () => {
    expect(validatePositiveNumber('50', 'latency_target')).toBe(50);
    expect(validatePositiveNumber('0.001', 'budget')).toBe(0.001);
  });

  test('returns null when not provided', () => {
    expect(validatePositiveNumber(undefined, 'x')).toBeNull();
    expect(validatePositiveNumber(null, 'x')).toBeNull();
    expect(validatePositiveNumber('', 'x')).toBeNull();
  });

  test('throws for zero or negative', () => {
    expect(() => validatePositiveNumber('0', 'x')).toThrow(ValidationError);
    expect(() => validatePositiveNumber('-5', 'x')).toThrow(ValidationError);
  });

  test('throws for non-numeric values', () => {
    expect(() => validatePositiveNumber('abc', 'x')).toThrow(ValidationError);
  });
});
