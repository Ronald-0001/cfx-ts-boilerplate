/**
 * Determines whether a value is a plain JavaScript object.
 *
 * A plain object is defined as:
 * - typeof "object"
 * - not null
 * - not an array
 *
 * This is commonly used when validating parsed JSON or
 * unknown runtime data structures.
 *
 * @param v - The value to test.
 * @returns True if the value is a plain object.
 */
export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Runtime type guard that checks whether a value is a string.
 *
 * Useful when working with unknown inputs where static typing
 * cannot guarantee the value type.
 *
 * @param v - The value to test.
 * @returns True if the value is a string.
 */
export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

/**
 * Runtime type guard that checks whether a value is a finite number.
 *
 * The function ensures the value:
 * - is of type number
 * - is not NaN
 * - is not Infinity
 *
 * @param v - The value to test.
 * @returns True if the value is a valid finite number.
 */
export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Runtime type guard that checks whether a value is a boolean.
 *
 * This function only returns true for literal boolean values
 * (`true` or `false`) and does not perform truthy coercion.
 *
 * @param v - The value to test.
 * @returns True if the value is a boolean.
 */
export function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}