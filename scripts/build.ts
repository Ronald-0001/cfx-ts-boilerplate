import { rmSync, cpSync, existsSync } from 'node:fs';

import type esbuild from 'esbuild';

import { createBuilder } from './utils/esbuild';
import { createFxmanifest } from './utils/manifest';
import { getFiles } from './utils/files';
import { exec, exists } from './utils/process';

const watch = process.argv.includes('--watch');
const release = process.argv.includes('--release') || (!watch && !process.argv.includes('--dev'));
const prod = release && !watch;

const commonHardening: esbuild.BuildOptions = {
  minify: prod,
  sourcemap: watch ? 'inline' : false,
  keepNames: !prod, // in prod, allow renaming
  legalComments: prod ? 'none' : 'inline',
  // drop: prod ? ['console', 'debugger'] : undefined, // optionally drop console/debugger in production will remove all logs though, so be careful with this one
  // mangle props only if you use a naming convention for private fields
  // e.g. this will mangle obj._foo into obj.a etc.
  mangleProps: prod ? /^_/ : undefined,
  // preserve some props if needed
  reserveProps: prod ? /^(__|on|emit|exports$)/ : undefined,
};

rmSync('./dist', { recursive: true, force: true });

/* ----------------------------- */
/* Detect layout                 */
/* ----------------------------- */
const hasServer = await exists('./project/server/index.ts');
const hasClient = await exists('./project/client/index.ts');
const hasInterface = await exists('./project/interface/index.html');
const hasStatic = await exists('./project/static');

/* ----------------------------- */
/* Copy static -> dist/static    */
/* ----------------------------- */
if (hasStatic) {
  cpSync('./project/static', './dist/static', { recursive: true });
}

/* ----------------------------- */
/* Drop labels                   */
/* ----------------------------- */
const dropLabels: string[] = ['$BROWSER'];
if (!watch) dropLabels.push('$DEV');

/* ----------------------------- */
/* Build server/client (esbuild) */
/* ----------------------------- */
const environments: { name: string; options: esbuild.BuildOptions }[] = [];

if (hasServer) {
  environments.push({
    name: 'server',
    options: {
      ...commonHardening,
      entryPoints: ['./project/server/index.ts'],
      outfile: 'dist/server/index.js',
      platform: 'node',
      target: ['node22'],
      format: 'cjs',
      dropLabels: [...dropLabels, '$CLIENT'],
    },
  });
}

if (hasClient) {
  environments.push({
    name: 'client',
    options: {
      ...commonHardening,
      entryPoints: ['./project/client/index.ts'],
      outfile: 'dist/client/index.js',
      platform: 'browser',
      target: ['es2021'],
      format: 'iife',
      dropLabels: [...dropLabels, '$SERVER'],
    },
  });
}

/* ----------------------------- */
/* Interface (Vite)              */
/* ----------------------------- */
async function buildInterfaceOnce(): Promise<void> {
  await exec('pnpm exec vite build project/interface');
}

async function startInterfaceWatch(): Promise<void> {
  await exec('pnpm exec vite build project/interface --watch').catch((e) => {
    console.error('[interface] vite watch failed:', e);
  });
}

/* ----------------------------- */
/* Manifest generation           */
/* ----------------------------- */
function toResourcePath(p: string) {
  return p.replace(/^dist[\\/]/, '').replaceAll('\\', '/');
}

async function addDirFiles(targetDir: string, out: string[]) {
  if (!existsSync(targetDir)) return;
  const dirFiles = await getFiles(targetDir);
  for (const f of dirFiles) {
    if (f.endsWith('.map')) continue;
    out.push(toResourcePath(f));
  }
}

async function generateManifest(): Promise<void> {
  const files: string[] = [];

  await addDirFiles('./dist/interface', files);
  await addDirFiles('./dist/static', files);

  const uniqueFiles = Array.from(new Set(files)).sort();

  await createFxmanifest({
    client_scripts: hasClient ? ['client/index.js'] : undefined,
    server_scripts: hasServer ? ['server/index.js'] : undefined,
    files: uniqueFiles.length ? uniqueFiles : undefined,
    dependencies: ['/onesync'],
    metadata: existsSync('./dist/interface')
      ? { ui_page: 'interface/index.html', node_version: '22' }
      : { node_version: '22' },
    outPath: './dist/fxmanifest.lua',
    write: true,
  } as any);
}

/* ----------------------------- */
/* Orchestrate                   */
/* ----------------------------- */

// Start Vite watcher early (watch only) — don't await
if (watch && hasInterface) {
  startInterfaceWatch();
}

await createBuilder(
  watch,
  {
    sourcemap: watch,
    legalComments: 'inline',
    treeShaking: true,
    keepNames: true
  },
  environments,
  async (_outfiles, final) => {
    // WATCH MODE:
    // - regenerate manifest after each esbuild rebuild
    // - do NOT obfuscate
    // - do NOT run vite build (watcher handles interface)
    if (watch) {
      await generateManifest();
      return;
    }

    // NON-WATCH MODE:
    // - only run on final=true
    if (!final) return;

    // Build interface once (if present) BEFORE manifest,
    // so dist/interface exists when we scan it.
    if (hasInterface) {
      await buildInterfaceOnce();
    }

    // Optional: obfuscate only in prod/release
    if (prod) {
      const { obfuscateFile } = await import('./utils/obfuscate');
      if (existsSync('dist/client/index.js')) await obfuscateFile('dist/client/index.js');
      if (existsSync('dist/server/index.js')) await obfuscateFile('dist/server/index.js');
    }

    await generateManifest();

    // No need for process.exit if createBuilder disposes contexts,
    // but harmless as a belt-and-suspenders.
    process.exit(0);
  }
);