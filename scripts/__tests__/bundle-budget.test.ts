import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  analyzeFileForRoute,
  collectClientSizes,
  parseAnalyzeData,
  runBundleBudget,
} from "../bundle-budget";

const tempDirs: string[] = [];

function makeTempDir() {
  const dir = mkdtempSync(path.join(tmpdir(), "bundle-budget-"));
  tempDirs.push(dir);
  return dir;
}

function writeAnalyzeFile(
  dataDir: string,
  route: string,
  analyze: ReturnType<typeof analyzeFor>,
) {
  const file = analyzeFileForRoute(dataDir, route);
  mkdirSync(path.dirname(file), { recursive: true });

  const json = Buffer.from(JSON.stringify(analyze));
  const header = Buffer.alloc(4);
  header.writeUInt32BE(json.length);

  writeFileSync(file, Buffer.concat([header, json, Buffer.from([1, 2, 3])]));
}

function analyzeFor({
  js = 1000,
  css = 200,
  server = 500,
  media = 300,
} = {}) {
  return {
    sources: [],
    chunk_parts: [
      {
        source_index: 0,
        output_file_index: 0,
        size: js,
        compressed_size: js / 2,
      },
      {
        source_index: 1,
        output_file_index: 1,
        size: css,
        compressed_size: css / 2,
      },
      {
        source_index: 2,
        output_file_index: 2,
        size: server,
        compressed_size: server / 2,
      },
      {
        source_index: 3,
        output_file_index: 3,
        size: media,
        compressed_size: media / 2,
      },
    ],
    output_files: [
      { filename: "[client-fs]/_next/static/chunks/app.js" },
      { filename: "[client-fs]/_next/static/chunks/app.css" },
      { filename: "[output]/.next/server/chunks/app.js" },
      { filename: "[client-fs]/_next/static/media/font.woff2" },
    ],
  };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("parseAnalyzeData", () => {
  it("reads the length-prefixed JSON payload and ignores trailing binary data", () => {
    const analyze = analyzeFor({});
    const payload = Buffer.from(JSON.stringify(analyze));
    const header = Buffer.alloc(4);
    header.writeUInt32BE(payload.length);

    const parsed = parseAnalyzeData(
      Buffer.concat([header, payload, Buffer.from([9, 9, 9])]),
    );

    expect(parsed).toEqual(analyze);
  });
});

describe("collectClientSizes", () => {
  it("counts only client javascript and css, not server chunks or media", () => {
    const sizes = collectClientSizes(analyzeFor({ js: 1000, css: 200 }));

    expect(sizes).toMatchObject({
      jsRaw: 1000,
      jsCompressed: 500,
      cssRaw: 200,
      cssCompressed: 100,
      chunkCount: 2,
    });
    expect(sizes.largestChunk).toEqual({
      filename: "[client-fs]/_next/static/chunks/app.js",
      size: 1000,
      compressedSize: 500,
    });
  });
});

describe("runBundleBudget", () => {
  it("reports route sizes, headroom, and baseline deltas without failing when within budget", () => {
    const cwd = makeTempDir();
    const dataDir = path.join(cwd, "data");
    const configPath = path.join(cwd, "budget.json");
    const baselinePath = path.join(cwd, "baseline.json");

    writeAnalyzeFile(dataDir, "/", analyzeFor({ js: 1000, css: 200 }));
    writeFileSync(
      configPath,
      JSON.stringify({
        routes: {
          "/": { clientJs: 1200, clientCss: 300 },
        },
      }),
    );
    writeFileSync(
      baselinePath,
      JSON.stringify({
        routes: {
          "/": { clientJsCompressed: 400, clientCssCompressed: 50 },
        },
      }),
    );

    const result = runBundleBudget({
      cwd,
      dataDir,
      configPath,
      baselinePath,
    });

    expect(result.exitCode).toBe(0);
    expect(result.report).toContain("| `/` |");
    expect(result.report).toContain("+100%");
    expect(result.report).toContain("[client-fs]/_next/static/chunks/app.js");
    expect(result.report).toMatch(/within budget/i);
  });

  it("fails when a route exceeds its budget", () => {
    const cwd = makeTempDir();
    const dataDir = path.join(cwd, "data");
    const configPath = path.join(cwd, "budget.json");

    writeAnalyzeFile(
      dataDir,
      "/blog/[slug]",
      analyzeFor({ js: 1000, css: 200 }),
    );
    writeFileSync(
      configPath,
      JSON.stringify({
        routes: {
          "/blog/[slug]": { clientJs: 400, clientCss: 300 },
        },
      }),
    );

    const result = runBundleBudget({
      cwd,
      dataDir,
      configPath,
      baselinePath: path.join(cwd, "missing-baseline.json"),
    });

    expect(result.exitCode).toBe(1);
    expect(result.report).toContain("`/blog/[slug]`");
    expect(result.report).toContain("over budget");
  });

  it("fails clearly when a configured route has no analyzer output", () => {
    const cwd = makeTempDir();
    const configPath = path.join(cwd, "budget.json");

    writeFileSync(
      configPath,
      JSON.stringify({
        routes: { "/missing": { clientJs: 1, clientCss: 1 } },
      }),
    );

    const result = runBundleBudget({
      cwd,
      dataDir: path.join(cwd, "data"),
      configPath,
      baselinePath: path.join(cwd, "missing-baseline.json"),
    });

    expect(result.exitCode).toBe(1);
    expect(result.report).toContain("No analyzer output for `/missing`");
  });

  it("writes a baseline snapshot when asked", () => {
    const cwd = makeTempDir();
    const dataDir = path.join(cwd, "data");
    const configPath = path.join(cwd, "budget.json");
    const baselinePath = path.join(cwd, "baseline.json");

    writeAnalyzeFile(dataDir, "/", analyzeFor({ js: 1000, css: 200 }));
    writeFileSync(
      configPath,
      JSON.stringify({
        routes: { "/": { clientJs: 2000, clientCss: 2000 } },
      }),
    );

    const result = runBundleBudget({
      cwd,
      dataDir,
      configPath,
      baselinePath,
      writeBaseline: true,
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(readFileSync(baselinePath, "utf8"))).toEqual({
      routes: {
        "/": { clientJsCompressed: 500, clientCssCompressed: 100 },
      },
    });
  });

  it("does not write a partial baseline when a route is missing", () => {
    const cwd = makeTempDir();
    const configPath = path.join(cwd, "budget.json");
    const baselinePath = path.join(cwd, "baseline.json");

    writeFileSync(
      configPath,
      JSON.stringify({
        routes: { "/missing": { clientJs: 1, clientCss: 1 } },
      }),
    );

    const result = runBundleBudget({
      cwd,
      dataDir: path.join(cwd, "data"),
      configPath,
      baselinePath,
      writeBaseline: true,
    });

    expect(result.exitCode).toBe(1);
    expect(result.report).toContain("Baseline was not written");
    expect(() => readFileSync(baselinePath, "utf8")).toThrow();
  });
});
