#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  inferImportFormat,
  parseCandidateInput,
  readImportFile,
  writeCandidatesJson,
} from './candidate-import.mjs';

function usage() {
  return [
    'Usage: npm run import -- input.json|input.csv [--replace]',
    'Writes .private/candidates.json for coordinator upload.',
    'Email and phone scrubbing in free-text fields is best-effort and cannot guarantee anonymity.',
  ].join('\n');
}

async function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const replace = args.includes('--replace');
  const inputs = args.filter((arg) => arg !== '--replace');
  if (inputs.length !== 1 || args.some((arg) => arg.startsWith('-') && arg !== '--replace')) {
    throw new Error(usage());
  }

  const inputPath = resolve(process.cwd(), inputs[0]);
  const format = inferImportFormat(inputPath);
  const bytes = await readImportFile(inputPath);
  const candidates = parseCandidateInput(bytes, format);
  const projectRoot = fileURLToPath(new URL('../', import.meta.url));
  const outputPath = resolve(projectRoot, '.private', 'candidates.json');

  await writeCandidatesJson(candidates, outputPath, { replace });
  process.stdout.write(`Prepared ${candidates.length} candidates at .private/candidates.json for coordinator upload.\n`);
  process.stdout.write('Free-text contact scrubbing is best-effort and cannot guarantee anonymity.\n');
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`Import failed: ${error.message}\n`);
  process.exitCode = 1;
});
