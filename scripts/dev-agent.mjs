#!/usr/bin/env node
/**
 * Start the development server against the agent environment.
 *
 *   npm run dev:agent
 *
 * `node --env-file=.env.agent next dev` does not survive Next's dev-server respawn: Node
 * refuses `--env-file` inside NODE_OPTIONS, so the child process dies. Loading the file here
 * and handing the values over as the child's environment avoids that, and lets the script
 * refuse before anything listens on the port.
 *
 * The guard is the point: this is the server agent sessions talk to, and it must never run
 * against `pictures_writers_dev`, which can hold a restored production dump.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
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
    `Refusing to start: .env.agent must point at ${AGENT_DATABASE} on localhost, found ${url?.hostname}/${database}.`,
  );
  process.exit(1);
}

console.log(`agent database: ${url.hostname}/${database}`);
console.log(`app url: ${values.NEXT_PUBLIC_APP_URL ?? "(unset)"}`);
console.log("probe user: " + (values.PROBE_ADMIN_EMAIL ?? "(unset)"));

const child = spawn(
  process.execPath,
  [join(repoRoot, "node_modules", "next", "dist", "bin", "next"), "dev"],
  {
    cwd: repoRoot,
    stdio: "inherit",
    // The agent values override anything Next would read from `.env`: process env wins.
    env: { ...process.env, ...values },
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
