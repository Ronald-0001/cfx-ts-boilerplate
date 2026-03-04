import type { LanguageApi, LanguageArgs, LanguageConfigShape } from '../types/language';
import { LoadJsonFile } from './files';
import Config from './config';
import { logger } from './logging';

/* ----------------------------- */
/* Defaults                      */
/* ----------------------------- */

const log = logger.child('language');

let defaultConfig = readLanguageConfig(Config);
const defaultPath = formatPath(defaultConfig.Directory, defaultConfig.File, defaultConfig.Extension)
let defaultLanguage = LoadJsonFile<unknown>(defaultPath);
$BROWSER: {
  defaultLanguage = await defaultLanguage;
}

/* ----------------------------- */
/* File handling                 */
/* ----------------------------- */

async function loadLocaleFile(path: string): Promise<AnyObj | null> {
  try {
    const temp = LoadJsonFile<unknown>(path);
    const data = await Promise.resolve(temp);
    if (!isPlainObject(data)) return null;
    return data as AnyObj;
  } catch {
    return null;
  }
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

function replacePlaceholders(input: string, warnMissing: boolean, file: string, args?: LanguageArgs): string {
  if (!args) return input;

  return input.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_m, name: string) => {
    const v = (args as any)[name];
    if (v === undefined || v === null) {
      if (warnMissing) log.warn(`Missing placeholder: ${_m} (file=${file})`);
      return _m;
    }
    return String(v);
  });
}

function resolveRefs(
  key: string,
  raw: string,
  dict: Dict,
  args: LanguageArgs | undefined,
  maxDepth: number,
  warnMissing: boolean,
  file: string,
  depth = 0,
  seen: Set<string> = new Set()
): string {
  if (depth >= maxDepth) return raw;

  return raw.replace(/\$\(([a-zA-Z0-9_.-]+)\)/g, (_m, ref: string) => {
    if (seen.has(ref)) {
      // cycle detected
      if (warnMissing) log.warn(`Cycle detected for language key: "${key}" (file=${file})`);
      return `$(${ref})`;
    }

    if (args) {
      // handle args overwrite
      const v = (args as any)[ref];
      if (v !== undefined && v !== null) {
        return String(v);
      }
    }

    const refRaw = dict[ref];

    if (!refRaw) {
      // dosent exist...
      if (warnMissing) log.warn(`Missing language ref: ${_m} (file=${file})`);
      return `$(${ref})`;
    }

    seen.add(ref);

    const resolved = resolveRefs(
      ref,
      refRaw,
      dict,
      args,
      maxDepth,
      warnMissing,
      file,
      depth + 1,
      seen
    );

    seen.delete(ref);

    return replacePlaceholders(resolved, warnMissing, file, args);
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
    WarnMissing: coerceBool(lang.WarnMissing, true),
    Fallback: coerceStr(lang.Fallback, 'en')
  };
}

/* ----------------------------- */
/* Language API                  */
/* ----------------------------- */

export function createLanguage(): LanguageApi {
  let dict: Dict = {};
  let currentFile = defaultConfig.File;
  let maxDepth = defaultConfig.Depth;
  let warnMissing = defaultConfig.WarnMissing;
  let directory = defaultConfig.Directory;
  let extension = defaultConfig.Extension;

  let loading = false;
  let everLoaded = false;

  async function loadDefault() {
    loading = true;

    const path = defaultPath;
    const obj = defaultLanguage;

    if (!isPlainObject(obj)) {
      dict = {};
      loading = false;
      everLoaded = false;
      log.error(`Default language is not an object: ${path}`);
      return;
    }

    dict = flatten(obj as AnyObj);
    loading = false;
    everLoaded = true;
    log.info(`Loaded ${currentFile} (${path})`);
  }

  async function loadLang(file: string) {
    if (loading) return;
    if (file == currentFile) return;
    loading = true;
    everLoaded = false;
    dict = {};

    const path = formatPath(directory, file, extension);
    const obj = await loadLocaleFile(path);

    if (!obj) {
      if (file !== defaultConfig.Fallback) log.warn(`Language file not found: ${path} (using fallback ${defaultConfig.Fallback})`);
      loading = false;

      try {
        const fallback: Promise<void> = loadLang(defaultConfig.Fallback);
        return fallback;
      } catch (err) {
        log.error(`Failed to load fallback`, err);
        loading = false;
        everLoaded = true;
        dict = {};
      }
    }

    currentFile = file;
    dict = flatten(obj);
    loading = false;
    everLoaded = true;
    log.info(`Loaded ${file} (${path})`);
  }

  function lookup(key: string): string | undefined {
    return dict[key];
  }

  function t(key: string, args?: LanguageArgs): string {
    const raw = lookup(key);
    // avoid spam during very early boot before first load attempt
    const shouldWarn = warnMissing? (everLoaded || !loading) : false;

    if (!raw) {
      if (shouldWarn) log.warn(`Missing language key: "${key}" (file=${currentFile})`);
      return '';
    }

    const withRefs = resolveRefs(key, raw, dict, args, maxDepth, shouldWarn, currentFile);
    return replacePlaceholders(withRefs, shouldWarn, currentFile, args);
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
  void loadDefault();

  return { loadLang, getFile, t, tk, getDictionary };
}

export const lang = createLanguage();
export const t = (key: string, args?: LanguageArgs) => lang.t(key, args);
export const tk = (key: string, args?: LanguageArgs) => lang.tk(key, args);