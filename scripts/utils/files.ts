import { readdir } from 'fs/promises';
import type { Dirent } from 'fs';
import path from 'path';

export interface GetFilesOptions {
  /** Make returned paths relative to this base (recommended for fxmanifest). */
  relativeTo?: string;
  /** Exclude directories by name. */
  excludeDirs?: Set<string>;
  /** Exclude files by name. */
  excludeFiles?: Set<string>;
  /** Exclude by extension (include the dot, e.g. '.map'). */
  excludeExt?: Set<string>;
}

/**
 * Returns a flattened array of all files located at the given paths.
 */
export async function getFiles(dirs: string | string[], options: GetFilesOptions = {}): Promise<string[]> {
  const list = Array.isArray(dirs) ? dirs : [dirs];

  const out: string[] = [];
  for (const dir of list) {
    await walk(dir);
  }

  // Normalize + sort for stable output
  const normalized = out.map((p) => p.replace(/\\/g, '/')).sort();

  if (options.relativeTo) {
    const base = path.resolve(options.relativeTo);
    return normalized.map((p) => {
      const abs = path.resolve(p);
      const rel = path.relative(base, abs).replace(/\\/g, '/');
      return rel;
    });
  }

  return normalized;

  async function walk(current: string): Promise<void> {
    let dirents: Dirent[];

    try {
      dirents = (await readdir(current, { withFileTypes: true })) as Dirent[];
    } catch (err: any) {
      if (err?.code === 'ENOENT' || err?.code === 'ENOTDIR') return;
      throw err;
    }

    for (const dirent of dirents) {
      const full = path.join(current, dirent.name);

      if (dirent.isDirectory()) {
        if (options.excludeDirs?.has(dirent.name)) continue;
        await walk(full);
        continue;
      }

      if (options.excludeFiles?.has(dirent.name)) continue;

      const ext = path.extname(dirent.name);
      if (options.excludeExt?.has(ext)) continue;

      out.push(full);
    }
  }
}
