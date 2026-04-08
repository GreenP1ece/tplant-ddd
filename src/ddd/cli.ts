// src/cli.ts
//
// CLI для tplant-ddd.
// Использование:
//   tplant-ddd --input "src/**/*.ts" [--output diagram.puml] [--tsconfig tsconfig.json]
//              [--context "Note"] [--title "Note Module"] [--all]

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import { DddOrchestrator } from './DddOchestrator';

// ─── Разбор аргументов (без сторонних зависимостей) ──────────────────────────

interface CliArgs {
  input:     string | undefined;
  output:    string | undefined;
  tsconfig:  string | undefined;
  context:   string | undefined;
  title:     string | undefined;
  all:       boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    input:    undefined,
    output:   undefined,
    tsconfig: undefined,
    context:  undefined,
    title:    undefined,
    all:      false,
  };

  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];

    switch (flag) {
      case '--input':    args.input    = next; i++; break;
      case '--output':   args.output   = next; i++; break;
      case '--tsconfig': args.tsconfig = next; i++; break;
      case '--context':  args.context  = next; i++; break;
      case '--title':    args.title    = next; i++; break;
      case '--all':      args.all      = true; break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }
  return args;
}

function printHelp(): void {
  console.log(`
tplant-ddd — DDD-aware TypeScript → PlantUML converter

Usage:
  tplant-ddd --input <glob> [options]

Options:
  --input     <glob>    Glob pattern or file path (required)
  --output    <file>    Output .puml file (default: stdout)
  --tsconfig  <file>    Path to tsconfig.json
  --context   <name>    Bounded context name (default: inferred)
  --title     <text>    Diagram title (default: inferred)
  --all                 Include classes without @ddd annotations
  --help                Show this help

Examples:
  tplant-ddd --input "src/note/**/*.ts" --output note.puml
  tplant-ddd --input "src/**/*.ts" --context "Note" --all
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (!args.input) {
    console.error('Error: --input is required');
    printHelp();
    process.exit(1);
  }

  // Разворачиваем glob
  const inputFiles = await glob(args.input, { absolute: true });

  if (inputFiles.length === 0) {
    console.error(`Error: no files matched pattern "${args.input}"`);
    process.exit(1);
  }

  const puml = DddOrchestrator.generate({
    inputFiles,
    tsConfigPath:      args.tsconfig,
    boundedContext:    args.context,
    title:             args.title,
    includeUnAnnotated: args.all,
  });

  if (args.output) {
    const outPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, puml, 'utf-8');
    console.log(`✓ Written to ${outPath}`);
  } else {
    process.stdout.write(puml + '\n');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});