import { readFile, writeFile } from 'node:fs/promises';
import JavaScriptObfuscator from 'javascript-obfuscator';

export async function obfuscateFile(file: string) {
  const code = await readFile(file, 'utf8');

  const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    stringArray: true,
    stringArrayShuffle: true,
    stringArrayThreshold: 0.75,
    rotateStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 8,
    numbersToExpressions: true,
    simplify: true,
    // Important: reduce obvious fingerprints
    renameGlobals: false,
  });

  await writeFile(file, result.getObfuscatedCode(), 'utf8');
}