#!/usr/bin/env node
// Fails when a tracked doc cites a repo path that is not in the repo.
//
// A doc that names a file is a promise: an ADR pointing at its evidence, a guide at the module it
// describes. The promise breaks in two ways a reader cannot see — the file moved, or the file was
// never committed (a working-tree-only spike report is a broken pointer for everyone else). Both
// are caught here, because the candidate set is `git ls-files`: a path that exists only on the
// author's disk is reported like a missing one.
//
// Scope is the docs, not the tickets: `.scratch/` holds closed plans that legitimately name files
// deleted since. A doc that deliberately names an absent path (removed, proposed) goes in
// `scripts/doc-citations-ignore.txt` with its reason — the exception is data, not prose.

import fs from "node:fs";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const IGNORE_FILE = "scripts/doc-citations-ignore.txt";

// Docs worth checking: the durable documentation and the files every session loads.
const isSourceDoc = (file) =>
  file.startsWith("docs/") ||
  ["AGENTS.md", "GLOSSARY.md", "README.md", "CODING_STANDARDS.md"].includes(file);

// A repo path in backticks, optionally followed by `:LINE` or `:LINE-LINE`.
const CITATION =
  /`((?:src|docs|scripts|tests|prisma|public|\.scratch|\.agents|\.github)\/[A-Za-z0-9_./()@[\]-]+\.[a-z0-9]+)(?::\d+(?:-\d+)?)?`/g;

function readTracked() {
  try {
    return execSync("git ls-files -z", { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\0")
      .filter(Boolean);
  } catch {
    console.error("check-doc-citations: git is required (the check reads `git ls-files`).");
    process.exit(2);
  }
}

function readIgnores() {
  if (!fs.existsSync(IGNORE_FILE)) return new Set();
  const ignores = new Set();
  for (const raw of fs.readFileSync(IGNORE_FILE, "utf8").split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [doc, cited] = line.split(/: +/);
    if (!doc || !cited) {
      console.error(`check-doc-citations: cannot parse "${line}" in ${IGNORE_FILE}.`);
      process.exit(2);
    }
    ignores.add(`${doc} ${cited}`);
  }
  return ignores;
}

const tracked = new Set(readTracked());
const ignores = readIgnores();
const failures = [];

for (const doc of [...tracked].filter((f) => f.endsWith(".md") && isSourceDoc(f))) {
  const text = fs.readFileSync(doc, "utf8");
  for (const match of text.matchAll(CITATION)) {
    const cited = match[1];
    if (tracked.has(cited) || ignores.has(`${doc} ${cited}`)) continue;
    failures.push(`${doc}: ${cited}`);
  }
}

if (failures.length) {
  console.error(`check-doc-citations: ${failures.length} citation(s) point at paths that are not in the repo:\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(`\nFix the path, commit the file the doc cites, or list the pair in ${IGNORE_FILE} with a reason.`);
  process.exit(1);
}

const checked = [...tracked].filter((f) => f.endsWith(".md") && isSourceDoc(f)).length;
console.log(`check-doc-citations: ${checked} docs, 0 broken citations.`);
