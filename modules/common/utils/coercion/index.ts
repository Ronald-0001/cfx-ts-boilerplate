/**
 * Coerces an unknown value into a boolean.
 *
 * If the provided value is already a boolean, it is returned as-is.
 * Otherwise the provided fallback value is returned.
 *
 * This function does not attempt string or numeric truthy conversion
 * (e.g. `"true"` or `1`). It strictly accepts boolean values.
 *
 * @param v - The value to evaluate.
 * @param fallback - The value returned if `v` is not a boolean.
 * @returns A valid boolean value.
 */
export function coerceBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/**
 * Coerces an unknown value into a finite number.
 *
 * If the value is already a number it is used directly.
 * Otherwise `Number(v)` is attempted. If the result is not a
 * finite number (`NaN`, `Infinity`, etc.), the fallback is returned.
 *
 * Useful when parsing configuration values, JSON input,
 * or environment variables that may contain numeric strings.
 *
 * @param v - The value to convert.
 * @param fallback - The value returned if conversion fails.
 * @returns A finite number.
 */
export function coerceNum(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Coerces an unknown value into a trimmed string.
 *
 * If the value is a string it is trimmed and returned.
 * If the trimmed string is empty, the fallback value is returned.
 * Any non-string values immediately return the fallback.
 *
 * This is commonly used when validating configuration or user input
 * where empty strings should be treated as missing values.
 *
 * @param v - The value to evaluate.
 * @param fallback - The value returned if `v` is not a valid string.
 * @returns A non-empty trimmed string.
 */
export function coerceStr(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

/**
 * Coerces an unknown value into a string.
 *
 * If the value is a string it is returned as-is (empty strings allowed).
 * Any non-string values immediately return the fallback.
 *
 * @param v - The value to evaluate.
 * @param fallback - The value returned if `v` is not a string.
 * @returns A string.
 */
export function coerceStrLoose(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

/**
 * Coerces an unknown value into an integer.
 *
 * The function attempts to convert the input using `Number(v)`.
 * If the result is not a valid integer, the fallback value is returned.
 *
 * Useful when reading numeric configuration values that must
 * specifically be integers (ports, counts, limits, etc).
 *
 * @param v - The value to convert.
 * @param fallback - The value returned if conversion fails.
 * @returns A valid integer.
 */
export function coerceInt(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isInteger(n) ? n : fallback;
}

/**
 * Coerces an unknown value into an array.
 *
 * If the provided value is already an array it is returned.
 * Otherwise the fallback array is returned.
 *
 * This is useful when handling external input where the expected
 * structure may be missing or incorrectly typed.
 *
 * @typeParam T - Expected element type of the array.
 * @param v - The value to evaluate.
 * @param fallback - Array returned when `v` is not an array.
 * @returns A valid array.
 */
export function coerceArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? v : fallback;
}