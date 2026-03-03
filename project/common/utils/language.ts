import type { LanguageApi, LanguageArgs, LanguageConfigShape } from '../types/language';
import { LoadJsonFile } from './files';
import Config from './config';
import { logger } from './logging';

const log = logger.child('language');

/* ----------------------------- */
/* Enviromental flags via $      */
/* ----------------------------- */

let __DEV__ = false;
// This line is removed from non-dev builds by esbuild dropLabels,
// and kept in watch/dev builds.
$DEV: (__DEV__ = true);

let __BROWSER__ = false;
// This line is removed from non-browser builds by esbuild dropLabels,
// and kept in browser builds.
$BROWSER: (__BROWSER__ = true);

/* ----------------------------- */
/* Defaults                      */
/* ----------------------------- */

let defaultConfig = readLanguageConfig(Config);
let defaultLanguage = LoadJsonFile(formatPath(defaultConfig.Directory, defaultConfig.File, defaultConfig.Extension)) as unknown;
$BROWSER: {
  defaultLanguage = await defaultLanguage;
}

/* ----------------------------- */
/* Utils                         */
/* ----------------------------- */

type Dict = Record<string, string>;
type AnyObj = Record<string, any>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function flatten(obj: AnyObj, prefix = '', out: Dict = {}): Dict {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (isPlainObject(v)) flatten(v as AnyObj, key, out);
  }
  return out;
}

function replacePlaceholders(input: string, args?: LanguageArgs): string {
  if (!args) return input;

  return input.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_m, name: string) => {
    const v = (args as any)[name];
    if (v === undefined || v === null) return '';
    return String(v);
  });
}

function resolveRefs(
  key: string,
  raw: string,
  dict: Dict,
  args: LanguageArgs | undefined,
  maxDepth: number,
  depth = 0,
  seen: Set<string> = new Set()
): string {
  if (depth >= maxDepth) return raw;

  return raw.replace(/\$\(([a-zA-Z0-9_.-]+)\)/g, (_m, ref: string) => {
    // args override reference tokens too
    const argV = args ? (args as any)[ref] : undefined;
    if (argV !== undefined && argV !== null) return String(argV);

    const cycleKey = `${key} -> ${ref}`;
    if (seen.has(cycleKey)) return '';

    seen.add(cycleKey);

    const refRaw = dict[ref];
    if (!refRaw) return '';

    const resolved = resolveRefs(ref, refRaw, dict, args, maxDepth, depth + 1, seen);
    return replacePlaceholders(resolved, args);
  });
}

function coerceBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function coerceNum(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function coerceStr(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function formatPath(directory: string, file: string, extension: string) {
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${directory}/${file}${ext}`;
}

function readLanguageConfig(cfg: any): Required<LanguageConfigShape> {
  const lang = cfg?.Language ?? {};
  return {
    Depth: coerceNum(lang.Depth, 8),
    File: coerceStr(lang.File, 'en'),
    Extension: coerceStr(lang.Extension, '.json'),
    Directory: coerceStr(lang.Directory, 'static/language'),
    WarnMissing: coerceBool(lang.WarnMissing, true)
  };
}

/* ----------------------------- */
/* Language API                  */
/* ----------------------------- */

function loadLocaleFile(path: string): AnyObj | null {
  try {
    const data = LoadJsonFile<unknown>(path);
    if (!isPlainObject(data)) return null;
    return data as AnyObj;
  } catch {
    return null;
  }
}

export function createLanguage(): LanguageApi {
  let dict: Dict = {};
  let currentFile = defaultConfig.File;
  let maxDepth = defaultConfig.Depth;
  let warnMissing = defaultConfig.WarnMissing;
  let directory = defaultConfig.Directory;
  let extension = defaultConfig.Extension;

  let loading = false;
  let everLoaded = false;

  function setLang(file: string) {
    loading = false;
    everLoaded = false;
    currentFile = file;
    dict = {};
    loadLang();
  }

  function loadLang() {
    loading = true;

    const path = formatPath(directory, currentFile, extension);
    const obj = loadLocaleFile(path);

    if (!obj) {
      if (currentFile !== 'en') log.warn(`Language file not found: ${path} (using fallback en)`);
      return setLang('en');
    } else {
      log.error('Failed to load fallback language', new Error(`Failed to load language file: ${path}`));
    }

    dict = flatten(obj);
    loading = false;
    everLoaded = true;
    log.info(`Loaded ${currentFile} (${path})`);
  }

  function lookup(key: string): string | undefined {
    return dict[key];
  }

  function t(key: string, args?: LanguageArgs): string {
    const raw = lookup(key);

    if (!raw) {
      if (warnMissing) {
        // avoid spam during very early boot before first load attempt
        const shouldWarn = everLoaded || !loading;
        if (shouldWarn) log.warn(`Missing key "${key}" (file=${currentFile})`);
      }
      return '';
    }

    const withRefs = resolveRefs(key, raw, dict, args, maxDepth);
    return replacePlaceholders(withRefs, args);
  }

  function tk(key: string, args?: LanguageArgs): string {
    const v = t(key, args);
    return v || key;
  }

  function getDictionary(): Readonly<Dict> {
    return dict;
  }

  function getFile(): string {
    return currentFile;
  }

  // Auto-load on module import (no init required)
  void loadLang();

  return { setLang, getFile, t, tk, getDictionary };
}

export const lang = createLanguage();
export const t = (key: string, args?: LanguageArgs) => lang.t(key, args);
export const tk = (key: string, args?: LanguageArgs) => lang.tk(key, args);