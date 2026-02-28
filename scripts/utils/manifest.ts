import { writeFile } from 'fs/promises';
import { z } from 'zod';
import { readJsonZod } from './json.js';

const PackageSchema = z.object({
  name: z.string(),
  author: z.string().optional(),
  version: z.string(),
  license: z.string().optional(),
  repository: z.union([z.string(), z.object({ url: z.string() })]).optional(),
  description: z.string().optional(),
});

type PackageJson = z.infer<typeof PackageSchema>;

export interface FxResourceManifest {
  client_scripts?: string[];
  server_scripts?: string[];
  files?: string[];
  dependencies?: string[];

  /** Extra top-level fxmanifest keys (e.g. ui_page, node_version, etc.) */
  metadata?: Record<string, string | number | boolean>;

  outPath?: string;
  write?: boolean;

  games?: string[];
  fx_version?: string;
  lua54?: 'yes' | 'no';

  /** If true and games includes rdr3, adds rdr3_warning line. Default: true */
  rdr3_warning?: boolean;
}

/** Stable, deduped, sorted list */
function normalizeList(list?: string[]): string[] | undefined {
  if (!list?.length) return undefined;
  return Array.from(new Set(list.filter(Boolean))).sort();
}

function renderKeyValue(key: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'boolean') return `${key} ${value ? 'true' : 'false'}\n`;
  if (typeof value === 'number') return `${key} ${value}\n`;
  return `${key} '${String(value).replace(/'/g, "\\'")}'\n`;
}

function renderArraySection(name: string, items?: string[]): string {
  const arr = normalizeList(items);
  if (!arr?.length) return '';
  const body = arr.map((v) => `\t'${v.replace(/'/g, "\\'")}'`).join(',\n');
  return `\n${name} {\n${body}\n}\n`;
}

function repoUrl(repo?: PackageJson['repository']): string | undefined {
  if (!repo) return undefined;
  return typeof repo === 'string' ? repo : repo.url;
}

export async function createFxmanifest(input: FxResourceManifest): Promise<string> {
  const {
    client_scripts,
    server_scripts,
    files,
    dependencies,
    metadata,
    outPath = 'dist/fxmanifest.lua',
    write = true,
    games = ['gta5', 'rdr3'],
    fx_version = 'cerulean',
    lua54 = 'yes',
    rdr3_warning = true,
  } = input;

  const pkg = await readJsonZod('package.json', PackageSchema);

  let output = '';
  output += renderKeyValue('fx_version', fx_version);
  output += `games { ${games.map((g) => `'${g}'`).join(', ')} }\n`;
  output += renderKeyValue('lua54', lua54);

  if (rdr3_warning && games.includes('rdr3')) {
    output += `rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'\n`;
  }

  output += '\n';

  output += renderKeyValue('name', pkg.name);
  output += renderKeyValue('author', pkg.author);
  output += renderKeyValue('version', pkg.version);
  output += renderKeyValue('license', pkg.license);
  output += renderKeyValue('repository', repoUrl(pkg.repository));
  output += renderKeyValue('description', pkg.description);

  if (metadata) {
    for (const [k, v] of Object.entries(metadata)) {
      output += renderKeyValue(k, v);
    }
  }

  output += renderArraySection('files', files);
  output += renderArraySection('dependencies', dependencies);
  output += renderArraySection('client_scripts', client_scripts);
  output += renderArraySection('server_scripts', server_scripts);

  // Ensure trailing newline
  if (!output.endsWith('\n')) output += '\n';

  if (write) {
    await writeFile(outPath, output);
  }

  return output;
}
