import esbuild from 'esbuild';

export type Environment = { name: string; options: esbuild.BuildOptions };

export async function createBuilder(
  watch: boolean,
  baseOptions: esbuild.BuildOptions,
  environments: Environment[],
  onBuild: (outfiles: Record<string, string>, final: boolean) => Promise<void>,
): Promise<void> {
  const outfiles: Record<string, string> = {};
  const contexts: esbuild.BuildContext[] = [];

  // Debounce onBuild across multiple targets finishing around the same time
  let buildScheduled = false;
  let buildRunning = false;

  const scheduleOnBuild = async () => {
    if (!watch) return; // in non-watch we call onBuild once explicitly
    if (buildScheduled) return;

    buildScheduled = true;

    // small debounce window
    setTimeout(async () => {
      buildScheduled = false;

      // prevent overlapping onBuild runs
      if (buildRunning) return;
      buildRunning = true;

      try {
        await onBuild(outfiles, false);
      } catch (e) {
        console.error('[createBuilder] onBuild failed:', e);
      } finally {
        buildRunning = false;
      }
    }, 50);
  };

  const plugins: esbuild.Plugin[] = [
    {
      name: 'build-logger',
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            const out = build.initialOptions.outfile ?? build.initialOptions.outdir;
            console.log(`✔ Built ${out}`);
            void scheduleOnBuild();
          }
        });
      },
    },
  ];

  // Create contexts
  for (const { name, options } of environments) {
    const defaultOutfile = `dist/${name}/index.js`;

    const merged: esbuild.BuildOptions = {
      bundle: true,
      treeShaking: true,
      keepNames: true,
      legalComments: 'inline',

      entryPoints: [`./project/${name}/index.ts`],
      outfile: defaultOutfile,

      ...baseOptions,
      ...options,
      plugins: [...(options.plugins ?? []), ...plugins],
    };

    outfiles[name] = (merged.outdir ?? merged.outfile ?? defaultOutfile) as string;

    const ctx = await esbuild.context(merged);
    contexts.push(ctx);
  }

  // Run initial build/watch
  if (watch) {
    await Promise.all(contexts.map((c) => c.watch()));
  } else {
    await Promise.all(contexts.map((c) => c.rebuild()));
  }

  // Always run onBuild once after the initial build completes
  await onBuild(outfiles, true);

  // Dispose in non-watch so pnpm build exits naturally
  if (!watch) {
    await Promise.all(contexts.map((c) => c.dispose()));
  }
}
