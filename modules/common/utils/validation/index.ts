/**
 * Validates that a value is a non-empty string.
 *
 * The value must:
 * - be of type string
 * - contain non-whitespace characters after trimming
 *
 * This is commonly used for validating identifiers,
 * configuration values, and user input.
 *
 * @param v - The value to test.
 * @returns True if the value is a non-empty string.
 */
export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Validates that a value is a positive finite number.
 *
 * The value must:
 * - be of type number
 * - be finite
 * - be greater than zero
 *
 * This is commonly used for validating quantities,
 * limits, durations, and other numeric configuration values.
 *
 * @param v - The value to test.
 * @returns True if the value is a positive number.
 */
export function isPositiveNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}