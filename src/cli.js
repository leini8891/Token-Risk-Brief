#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { analyzeEvidence, renderMarkdown } from "./engine.js";

function usage() {
  return "Usage: npm run analyze -- <evidence.json> [--format json|markdown]";
}

function parseArguments(argv) {
  const args = [...argv];
  const file = args.shift();
  let format = "json";

  while (args.length > 0) {
    const argument = args.shift();
    if (argument === "--format") {
      format = args.shift();
    } else if (argument.startsWith("--format=")) {
      format = argument.slice("--format=".length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!file) {
    throw new Error(usage());
  }
  if (!["json", "markdown"].includes(format)) {
    throw new Error("--format must be json or markdown");
  }

  return { file, format };
}

async function main() {
  const { file, format } = parseArguments(process.argv.slice(2));
  const raw = await readFile(file, "utf8");
  const input = JSON.parse(raw);
  const result = analyzeEvidence(input);
  const output = format === "markdown" ? renderMarkdown(result) : JSON.stringify(result, null, 2);
  process.stdout.write(`${output.trimEnd()}\n`);
}

main().catch((error) => {
  process.stderr.write(`Token Risk Brief failed: ${error.message}\n`);
  process.exitCode = 1;
});
