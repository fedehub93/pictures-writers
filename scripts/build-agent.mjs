#!/usr/bin/env node
/**
 * Build against the agent environment.
 *
 *   npm run build:agent
 *
 * `npm run build` reads `.env` and therefore the development database, which
 * can hold a restored production dump. This script loads `.env.agent`, checks
 * that it points at `pictures_writers_agent` on localhost, generates the
 * Prisma client, applies pending migrations and then runs `next build` with the
 * agent values. A schema change no longer needs the development database just
 * to make the build pass.
 *
 * `node --env-file=.env.agent next build` is not enough: Next passes its
 * execArgv to the build workers, and Node refuses `--env-file` inside
 * NODE_OPTIONS. Loading the file here and handing the values to the child as
 * `env` is the same pattern as `scripts/dev-agent.mjs`.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const agentEnvPath = join(repoRoot, ".env.agent");

const AGENT_DATABASE = "pictures_writers_agent";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

if (!existsSync(agentEnvPath)) {
  console.error("No .env.agent found. Run npm run agent:env first.");
  process.exit(1);
}

const values = parseEnv(readFileSync(agentEnvPath, "utf8"));
const databaseUrl = values.DATABASE_URL ?? "";
const url = databaseUrl ? new URL(databaseUrl) : null;
const database = url?.pathname.replace(/^\//, "");

if (!url || !LOCAL_HOSTS.has(url.hostname) || database !== AGENT_DATABASE) {
  console.error(
    `Refusing to build: .env.agent must point at ${AGENT_DATABASE} on localhost, found ${url?.hostname}/${database}.`,
  );
  process.exit(1);
}

// `npm run` adds node_modules/.bin to PATH; a direct `node scripts/build-agent.mjs`
// does not, and Prisma's JSON types generator is a binary that lives there.
const pathKey =
  Object.keys(process.env).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
const env = {
  ...process.env,
  ...values,
  [pathKey]: `${join(repoRoot, "node_modules", ".bin")}${delimiter}${process.env[pathKey] ?? ""}`,
};

const prismaCli = join(repoRoot, "node_modules", "prisma", "build", "index.js");
const nextCli = join(repoRoot, "node_modules", "next", "dist", "bin", "next");

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`building against ${url.hostname}/${database}`);

run([prismaCli, "generate"]);
run([prismaCli, "migrate", "deploy"]);
run([nextCli, "build"]);
