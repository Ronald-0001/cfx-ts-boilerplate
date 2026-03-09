/**
 * Placeholder arguments used during translation formatting.
 *
 * Keys correspond to placeholder names in language strings.
 *
 * Example:
 * "welcome": "Hello {name}"
 *
 * t("welcome", { name: "John" })
 */
export type LanguageArgs = Record<string, string | number | boolean | null | undefined>;

/**
 * Language configuration shape used when resolving language settings
 * from the project configuration.
 *
 * All properties are optional and fall back to internal defaults when omitted.
 */
export interface LanguageConfigShape {

  /**
   * Maximum recursion depth when resolving language references.
   *
   * References allow language keys to include other keys using the `$(key)` syntax.
   *
   * @default 8
   */
  Depth?: number;

  /**
   * Default language file identifier.
   *
   * Typically a language code such as `"en"` or `"da"`.
   *
   * @default "en"
   */
  File?: string;

  /**
   * File extension used when loading language files.
   *
   * The extension may include or omit the leading dot.
   *
   * @default ".json"
   */
  Extension?: string;

  /**
   * Directory containing language files relative to the resource root.
   *
   * @default "static/language"
   */
  Directory?: string;

  /**
   * Enables warnings when language keys, references, or placeholders are missing.
   *
   * @default true
   */
  WarnMissing?: boolean;

  /**
   * Fallback language file used when the requested language cannot be loaded.
   *
   * @default "en"
   */
  Fallback?: string;
}

/**
 * Language API used for loading language files and resolving translations.
 */
export interface LanguageApi {

  /**
   * Loads or switches to a language file.
   *
   * If the file cannot be loaded, the configured fallback language
   * will be used instead.
   *
   * @param file - Language file identifier (usually a language code).
   */
  loadLang(file: string): Promise<void>;

  /**
   * Returns the currently active language file.
   *
   * @returns The active language file identifier.
   */
  getFile(): string;

  /**
   * Resolves a translated string from the current language dictionary.
   *
   * Supports:
   *
   * - placeholder replacement (`{name}`)
   * - language references (`$(other.key)`)
   *
   * If the key does not exist, an empty string is returned.
   *
   * @param key - The translation key.
   * @param args - Optional placeholder arguments used during formatting.
   * @returns The resolved translated string.
   */
  t(key: string, args?: LanguageArgs): string;

  /**
   * Resolves a translated string or returns the original key if missing.
   *
   * This behaves like `t()` but is useful during UI development where
   * missing translations should remain visible.
   *
   * @param key - The translation key.
   * @param args - Optional placeholder arguments used during formatting.
   * @returns The translated string or the key itself if missing.
   */
  tk(key: string, args?: LanguageArgs): string;

  /**
   * Returns the flattened dictionary for the currently loaded language file.
   *
   * This is primarily useful for debugging, tooling, or inspection.
   *
   * @returns A readonly map of translation keys to resolved strings.
   */
  getDictionary(): Readonly<Record<string, string>>;
}