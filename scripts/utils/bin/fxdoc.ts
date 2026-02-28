import ts from 'typescript';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { getFiles } from '../files.js';
import { readJsonZod } from '../json.js';

const args = new Map(process.argv.slice(2).map((a) => a.split('=', 2) as [string, string]));

const options = {
  dir: args.get('dir') ?? './project',
  out: args.get('out') ?? './fxdoc',
  tsconfig: args.get('tsconfig') ?? './tsconfig.json',
};

const PackageSchema = z.object({
  name: z.string(),
});

type ExportEntry = {
  name: string;
  description: string;
  parameters?: ts.Symbol[];
  returnType: string;
};

const exportEntries: ExportEntry[] = [];

function readTsConfig(tsconfigPath: string) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext([configFile.error], {
        getCanonicalFileName: (f) => f,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
      }),
    );
  }

  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, process.cwd());

  if (parsed.errors.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
        getCanonicalFileName: (f) => f,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
      }),
    );
  }

  return parsed;
}

const parsedTsConfig = readTsConfig(options.tsconfig);

const programFiles = await getFiles(options.dir, {
  excludeDirs: new Set(['node_modules', 'dist', '.git']),
  excludeExt: new Set(['.d.ts', '.map']),
});

const program = ts.createProgram(programFiles, parsedTsConfig.options);
const typeChecker = program.getTypeChecker();

function getFunctionDeclarationFromSymbol(symbol: ts.Symbol): ts.Signature | undefined {
  const decl = symbol.getDeclarations()?.[0];
  if (decl && ts.isFunctionLike(decl)) return typeChecker.getSignatureFromDeclaration(decl);
}

function getFunctionSignature(fnArg: ts.Expression): ts.Signature | undefined {
  if (ts.isFunctionLike(fnArg)) return typeChecker.getSignatureFromDeclaration(fnArg);

  if (ts.isIdentifier(fnArg)) {
    const symbol = typeChecker.getSymbolAtLocation(fnArg);
    if (!symbol) return;
    return (
      getFunctionDeclarationFromSymbol(symbol) ?? getFunctionDeclarationFromSymbol(typeChecker.getAliasedSymbol(symbol))
    );
  }
}

/**
 * Change this predicate if your export API differs.
 * Currently matches: exports('name', fn)
 */
function isExportsCall(node: ts.CallExpression): boolean {
  const { expression, arguments: args } = node;
  return ts.isIdentifier(expression) && expression.text === 'exports' && ts.isStringLiteral(args[0]) && !!args[1];
}

function visit(node: ts.Node): void {
  if (ts.isCallExpression(node) && isExportsCall(node)) {
    const name = (node.arguments[0] as ts.StringLiteral).text;
    const fnArg = node.arguments[1];
    const signature = getFunctionSignature(fnArg);

    if (signature) {
      const decl = signature.getDeclaration();
      const params = signature.getParameters();
      const returnType = typeChecker.typeToString(typeChecker.getReturnTypeOfSignature(signature));

      const jsdoc = decl ? ts.getJSDocCommentsAndTags(decl) : [];
      const description = jsdoc
        .map((c: any) => (typeof c?.comment === 'string' ? c.comment : ''))
        .filter(Boolean)
        .join('\n');

      exportEntries.push({ name, description, parameters: params, returnType });
    }
  }

  ts.forEachChild(node, visit);
}

for (const sourceFile of program.getSourceFiles()) {
  if (sourceFile.isDeclarationFile) continue;
  ts.forEachChild(sourceFile, visit);
}

const pkg = await readJsonZod('./package.json', PackageSchema);

if (!exportEntries.length) {
  console.log('[fxdoc] No exports() found.');
  process.exit(0);
}

await fs.mkdir(options.out, { recursive: true });

const dts: string[] = [];
const dlua: string[] = [];

for (const exp of exportEntries.sort((a, b) => a.name.localeCompare(b.name))) {
  const parameters = exp.parameters?.map((p) => p.valueDeclaration?.getText() ?? '').join(', ') ?? '';
  const md = `## ${exp.name}
${exp.description ?? ''}

\`\`\`ts
${exp.name}(${parameters}) => ${exp.returnType}
\`\`\`

### Parameters
${
  exp.parameters
    ?.map((param) => {
      const [n, t] = (param.valueDeclaration?.getText() ?? '').split(': ', 2);
      const comment = param.getDocumentationComment(typeChecker)[0]?.text;
      const base = `- ${n}: \`${t}\``;
      return comment ? `${base}\n  - ${comment}` : base;
    })
    .join('\n') ?? ''
}

### Returns
- ${exp.returnType}
`;

  dts.push(
    `${exp.description ? `/** ${exp.description} */\n\t\t` : ''}${exp.name}: (${parameters}) => ${exp.returnType};`,
  );
  dlua.push(`---@field ${exp.name} fun(self: self, ${parameters}): ${exp.returnType} ${exp.description ?? ''}`);

  await fs.writeFile(path.join(options.out, `${exp.name}.md`), md, 'utf8');
}

await fs.writeFile(
  path.join(options.out, 'exports.d.ts'),
  `interface CitizenExports {\n\t"${pkg.name}": {\n\t\t${dts.join('\n\t\t')}\n\t}\n}\n`,
  'utf8',
);

await fs.writeFile(
  path.join(options.out, 'exports.d.lua'),
  `---@class CitizenExports.${pkg.name}\n${dlua.join('\n')}\n`,
  'utf8',
);

console.log(`[fxdoc] Wrote ${exportEntries.length} exports to ${options.out}`);
