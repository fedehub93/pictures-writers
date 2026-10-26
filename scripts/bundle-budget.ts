import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_DATA_DIR = ".next/diagnostics/analyze/data";
const DEFAULT_CONFIG_PATH = "perf/bundle-budget.json";
const DEFAULT_BASELINE_PATH = "perf/bundle-budget.baseline.json";

interface AnalyzerChunkPart {
  output_file_index: number;
  size?: number;
  compressed_size?: number;
}

interface AnalyzerOutputFile {
  filename: string;
}

interface AnalyzerData {
  chunk_parts?: AnalyzerChunkPart[];
  output_files?: AnalyzerOutputFile[];
}

export interface ClientChunk {
  filename: string;
  size: number;
  compressedSize: number;
}

export interface ClientSizes {
  jsRaw: number;
  jsCompressed: number;
  cssRaw: number;
  cssCompressed: number;
  chunkCount: number;
  largestChunk: ClientChunk | null;
  chunks: ClientChunk[];
}

interface RouteBudget {
  clientJs: number;
  clientCss: number;
}

interface BudgetConfig {
  routes: Record<string, RouteBudget>;
}

interface BaselineSnapshot {
  routes: Record<
    string,
    { clientJsCompressed: number; clientCssCompressed: number }
  >;
}

interface RouteResult {
  route: string;
  sizes: ClientSizes;
  budget: RouteBudget;
  ok: boolean;
  jsHeadroom: number;
  cssHeadroom: number;
  baselineJsDelta: number | null;
  baselineCssDelta: number | null;
  baselineJsPercent: string | null;
  baselineCssPercent: string | null;
}

interface RunOptions {
  cwd?: string;
  dataDir?: string;
  configPath?: string;
  baselinePath?: string;
  writeBaseline?: boolean;
}

interface RunResult {
  exitCode: number;
  report: string;
  results: RouteResult[];
  errors: string[];
}

export function parseAnalyzeData(buffer: Buffer): AnalyzerData {
  if (buffer.length < 4) {
    throw new Error("Analyzer file is too short to contain a JSON payload.");
  }

  const length = buffer.readUInt32BE(0);

  if (length <= 0 || length + 4 > buffer.length) {
    throw new Error(
      `Analyzer file declares an invalid JSON payload length (${length}).`,
    );
  }

  return JSON.parse(buffer.subarray(4, length + 4).toString("utf8"));
}

export function collectClientSizes(analyze: AnalyzerData): ClientSizes {
  const chunkParts = analyze.chunk_parts ?? [];
  const outputFiles = analyze.output_files ?? [];
  const chunkMap = new Map<string, { size: number; compressedSize: number }>();

  for (const part of chunkParts) {
    const filename = outputFiles[part.output_file_index]?.filename ?? "";

    if (!filename.includes("[client-fs]/")) continue;

    const isJs = filename.endsWith(".js");
    const isCss = filename.endsWith(".css");

    if (!isJs && !isCss) continue;

    const chunk = chunkMap.get(filename) ?? { size: 0, compressedSize: 0 };

    chunk.size += Number(part.size) || 0;
    chunk.compressedSize += Number(part.compressed_size) || 0;
    chunkMap.set(filename, chunk);
  }

  let jsRaw = 0;
  let jsCompressed = 0;
  let cssRaw = 0;
  let cssCompressed = 0;

  const chunks = [...chunkMap.entries()].map(([filename, chunk]) => ({
    filename,
    size: chunk.size,
    compressedSize: chunk.compressedSize,
  }));

  for (const chunk of chunks) {
    if (chunk.filename.endsWith(".js")) {
      jsRaw += chunk.size;
      jsCompressed += chunk.compressedSize;
    } else {
      cssRaw += chunk.size;
      cssCompressed += chunk.compressedSize;
    }
  }

  chunks.sort((a, b) => b.compressedSize - a.compressedSize);

  return {
    jsRaw,
    jsCompressed,
    cssRaw,
    cssCompressed,
    chunkCount: chunks.length,
    largestChunk: chunks[0] ?? null,
    chunks,
  };
}

export function analyzeFileForRoute(dataDir: string, route: string): string {
  const segments =
    route === "/" ? [] : route.replace(/^\/+|\/+$/g, "").split("/");

  return path.join(dataDir, ...segments, "analyze.data");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function formatBytes(bytes: number): string {
  const absolute = Math.abs(bytes);

  if (absolute >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
  }

  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatDelta(bytes: number): string {
  if (bytes === 0) return "0 KiB";

  return `${bytes > 0 ? "+" : "-"}${formatBytes(Math.abs(bytes))}`;
}

function formatPercent(delta: number, baseline: number): string {
  if (!baseline) return "n/a";

  const percent = (delta / baseline) * 100;
  const rounded = Number.isInteger(percent) ? percent : percent.toFixed(1);

  return `${percent > 0 ? "+" : ""}${rounded}%`;
}

function evaluateRoute({
  route,
  sizes,
  budget,
  baseline,
}: {
  route: string;
  sizes: ClientSizes;
  budget: RouteBudget;
  baseline: BaselineSnapshot | null;
}): RouteResult {
  const baselineRoute = baseline?.routes?.[route];
  const baselineJs = baselineRoute?.clientJsCompressed;
  const baselineCss = baselineRoute?.clientCssCompressed;

  return {
    route,
    sizes,
    budget,
    ok:
      sizes.jsCompressed <= budget.clientJs &&
      sizes.cssCompressed <= budget.clientCss,
    jsHeadroom: budget.clientJs - sizes.jsCompressed,
    cssHeadroom: budget.clientCss - sizes.cssCompressed,
    baselineJsDelta:
      typeof baselineJs === "number" ? sizes.jsCompressed - baselineJs : null,
    baselineCssDelta:
      typeof baselineCss === "number" ? sizes.cssCompressed - baselineCss : null,
    baselineJsPercent:
      typeof baselineJs === "number"
        ? formatPercent(sizes.jsCompressed - baselineJs, baselineJs)
        : null,
    baselineCssPercent:
      typeof baselineCss === "number"
        ? formatPercent(sizes.cssCompressed - baselineCss, baselineCss)
        : null,
  };
}

function buildReport(
  results: RouteResult[],
  {
    dataDir,
    configPath,
    baselinePath,
    errors,
    baselineWritten,
  }: {
    dataDir: string;
    configPath: string;
    baselinePath: string;
    errors: string[];
    baselineWritten: boolean;
  },
): string {
  const lines = [
    "## Bundle budget",
    "",
    `- Analyzer data: \`${dataDir}\``,
    `- Budgets: \`${configPath}\``,
    `- Baseline: \`${baselinePath}\``,
    "",
    "| Route | JS (compressed) | JS budget | JS headroom | CSS (compressed) | CSS budget | CSS headroom | Chunks |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const result of results) {
    lines.push(
      `| \`${result.route}\` | ${formatBytes(result.sizes.jsCompressed)} | ${formatBytes(result.budget.clientJs)} | ${formatDelta(result.jsHeadroom)} | ${formatBytes(result.sizes.cssCompressed)} | ${formatBytes(result.budget.clientCss)} | ${formatDelta(result.cssHeadroom)} | ${result.sizes.chunkCount} |`,
    );
  }

  const largestChunks = results.filter((result) => result.sizes.largestChunk);

  if (largestChunks.length > 0) {
    lines.push(
      "",
      "### Largest client chunks",
      "",
      "| Route | Chunk | Compressed size |",
      "| --- | --- | ---: |",
    );

    for (const result of largestChunks) {
      lines.push(
        `| \`${result.route}\` | \`${result.sizes.largestChunk!.filename}\` | ${formatBytes(result.sizes.largestChunk!.compressedSize)} |`,
      );
    }
  }

  const hasBaseline = results.some((result) => result.baselineJsDelta !== null);

  if (hasBaseline) {
    lines.push(
      "",
      "### Delta vs baseline",
      "",
      "| Route | JS delta | JS % | CSS delta | CSS % |",
      "| --- | ---: | ---: | ---: | ---: |",
    );

    for (const result of results) {
      if (result.baselineJsDelta === null) continue;

      lines.push(
        `| \`${result.route}\` | ${formatDelta(result.baselineJsDelta)} | ${result.baselineJsPercent} | ${result.baselineCssDelta === null ? "n/a" : formatDelta(result.baselineCssDelta)} | ${result.baselineCssPercent ?? "n/a"} |`,
      );
    }
  }

  const failures = results.filter((result) => !result.ok);

  lines.push("");

  if (errors.length > 0) {
    lines.push(
      `**Result:** cannot check every route (${errors.length} analyzer/config error${errors.length === 1 ? "" : "s"}).`,
    );
  } else if (failures.length === 0) {
    lines.push(
      `**Result:** within budget (${results.length} route${results.length === 1 ? "" : "s"} checked).`,
    );
  } else {
    lines.push(
      `**Result:** over budget (${failures.length} of ${results.length} routes).`,
    );
  }

  if (baselineWritten) {
    lines.push("", `Baseline written to \`${baselinePath}\`.`);
  } else if (errors.length > 0) {
    lines.push("", "Baseline was not written because the check had errors.");
  }

  if (errors.length > 0) {
    lines.push("", "**Errors:**", ...errors.map((error) => `- ${error}`));
  }

  return lines.join("\n");
}

export function runBundleBudget({
  cwd = process.cwd(),
  dataDir = DEFAULT_DATA_DIR,
  configPath = DEFAULT_CONFIG_PATH,
  baselinePath = DEFAULT_BASELINE_PATH,
  writeBaseline = false,
}: RunOptions = {}): RunResult {
  const resolvedDataDir = path.resolve(cwd, dataDir);
  const resolvedConfigPath = path.resolve(cwd, configPath);
  const resolvedBaselinePath = path.resolve(cwd, baselinePath);

  const config = readJson<BudgetConfig>(resolvedConfigPath);

  if (!config.routes || typeof config.routes !== "object") {
    throw new Error(`No route budgets configured in ${resolvedConfigPath}.`);
  }

  const baseline =
    !writeBaseline && existsSync(resolvedBaselinePath)
      ? readJson<BaselineSnapshot>(resolvedBaselinePath)
      : null;

  const results: RouteResult[] = [];
  const errors: string[] = [];

  for (const [route, budget] of Object.entries(config.routes)) {
    const analyzeFile = analyzeFileForRoute(resolvedDataDir, route);

    if (!existsSync(analyzeFile)) {
      errors.push(
        `No analyzer output for \`${route}\` at \`${path.relative(cwd, analyzeFile)}\`.`,
      );
      continue;
    }

    const sizes = collectClientSizes(
      parseAnalyzeData(readFileSync(analyzeFile)),
    );

    results.push(evaluateRoute({ route, sizes, budget, baseline }));
  }

  const baselineWritten = writeBaseline && errors.length === 0;

  if (baselineWritten) {
    const snapshot: BaselineSnapshot = {
      routes: Object.fromEntries(
        results.map((result) => [
          result.route,
          {
            clientJsCompressed: result.sizes.jsCompressed,
            clientCssCompressed: result.sizes.cssCompressed,
          },
        ]),
      ),
    };

    mkdirSync(path.dirname(resolvedBaselinePath), { recursive: true });
    writeFileSync(
      resolvedBaselinePath,
      `${JSON.stringify(snapshot, null, 2)}\n`,
    );
  }

  const report = buildReport(results, {
    dataDir: path.relative(cwd, resolvedDataDir) || ".",
    configPath: path.relative(cwd, resolvedConfigPath),
    baselinePath: path.relative(cwd, resolvedBaselinePath),
    errors,
    baselineWritten,
  });

  const overBudget = results.some((result) => !result.ok);

  return {
    exitCode: errors.length > 0 || overBudget ? 1 : 0,
    report,
    results,
    errors,
  };
}

function parseArgs(argv: string[]): { writeBaseline: boolean; help: boolean } {
  const options = { writeBaseline: false, help: false };

  for (const arg of argv) {
    if (arg === "--write-baseline") {
      options.writeBaseline = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`Usage: npm run bundle:budget [-- --write-baseline]

Checks the Turbopack analyzer output against the committed bundle budgets.

Options:
  --write-baseline     Write the current sizes to the baseline file
  -h, --help           Show this help
`);
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const result = runBundleBudget({ writeBaseline: options.writeBaseline });

  console.log(result.report);
  process.exitCode = result.exitCode;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
