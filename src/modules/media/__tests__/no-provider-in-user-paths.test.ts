import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const PROVIDER_CLIENT_IMPORT =
  /from\s+["'](?:uploadthing|uploadthing\/server|uploadthing\/next|@uploadthing\/react)["']/;
const PROVIDER_ROUTER_IMPORT =
  /from\s+["'](?:@\/app\/api\/uploadthing|uploadthing\/next)["']/;
const PROVIDER_TOKEN_READ = /\b(?:process\.)?env\.UPLOADTHING_TOKEN\b/;

function collectSource(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) return collectSource(entryPath);
    if (!/\.(?:ts|tsx|mjs|js)$/.test(entry.name)) return [];
    if (
      entry.name.includes(".test.") ||
      entryPath.includes(`${path.sep}__tests__${path.sep}`)
    ) {
      return [];
    }

    return [entryPath];
  });
}

const SOURCE_FILES = collectSource(SRC);

/** A module the server cannot render: it runs on the client or in both. */
function isClientModule(source: string): boolean {
  const header = source.split("\n", 5).join("\n");
  return (
    /^\s*["']use client["'];?/m.test(header) ||
    /^\s*import\s+["']client-only["'];?/m.test(header)
  );
}

function isServerOnly(source: string): boolean {
  return /^\s*import\s+["']server-only["'];?/m.test(source);
}

function filesMatching(pattern: RegExp): string[] {
  return SOURCE_FILES.filter((file) =>
    pattern.test(readFileSync(file, "utf8")),
  ).map((file) => path.relative(SRC, file));
}

describe("no storage provider in a user path", () => {
  it("ships no provider client to the browser", () => {
    const offenders = SOURCE_FILES.filter((file) => {
      const source = readFileSync(file, "utf8");
      return isClientModule(source) && PROVIDER_CLIENT_IMPORT.test(source);
    }).map((file) => path.relative(SRC, file));

    expect(offenders).toEqual([]);
  });

  it("has no provider file-router route", () => {
    expect(existsSync(path.join(SRC, "app/api/uploadthing"))).toBe(false);
    expect(filesMatching(PROVIDER_ROUTER_IMPORT)).toEqual([]);
  });

  it("reads the provider token only in a server-only module", () => {
    const readers = SOURCE_FILES.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return PROVIDER_TOKEN_READ.test(source) ? [{ file, source }] : [];
    });

    for (const { file, source } of readers) {
      expect(
        isServerOnly(source),
        `${path.relative(SRC, file)} reads UPLOADTHING_TOKEN without server-only`,
      ).toBe(true);
    }
  });

  it("does not depend on the provider's client library", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(ROOT, "package.json"), "utf8"),
    );

    expect(pkg.dependencies?.["@uploadthing/react"]).toBeUndefined();
    expect(pkg.devDependencies?.["@uploadthing/react"]).toBeUndefined();
  });
});
