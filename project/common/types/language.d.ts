export type LanguageArgs = Record<string, string | number | boolean | null | undefined>;

export interface LanguageConfigShape {
  Depth?: number;
  File?: string;
  Extension?: string;
  Directory?: string;
  WarnMissing?: boolean;
  Fallback?: string
}

export interface LanguageApi {
  /** Reload using current config (or override file code) */
  loadLang(file: string): Promise<void>;

  /** Current selected language code (File) */
  getFile(): string;

  /** Translate a key */
  t(key: string, args?: LanguageArgs): string;

  /** Translate or return key if missing (nice for UI dev) */
  tk(key: string, args?: LanguageArgs): string;

  /** Debug: flattened dictionary for current file */
  getDictionary(): Readonly<Record<string, string>>;
}