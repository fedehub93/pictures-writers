#!/usr/bin/env node
/**
 * Drive the Puck builder as the probe user: log in, then run a list of steps against the
 * canvas iframe.
 *
 *   npm run agent:seed                                       # reset the probe page
 *   node --env-file=.env.agent scripts/builder-probe.mjs --steps steps.json
 *   node --env-file=.env.agent scripts/builder-probe.mjs --login-only
 *
 * `npm run agent:probe -- --flag` is not the documented form: npm 12 on this machine
 * swallows the flags after `--`, so the command needs node directly to load `.env.agent`.
 *
 * Steps are an array of objects, run in order:
 *
 *   { "action": "click", "target": "h2", "text": "Probe heading" }
 *   { "action": "type", "text": "Hello" }
 *   { "action": "read", "target": ".ProseMirror" }
 *   { "action": "exists", "target": "[data-puck-rte]" }
 *   { "action": "wait", "ms": 500 }
 *   { "action": "evaluate", "expression": "document.title" }
 *
 * `target` resolves inside the canvas iframe (`--frame`, default `preview-frame`) unless
 * `--frame` is empty. The report is JSON on stdout; a failed step exits 1.
 *
 * The login is a real sign-in through Better Auth with the probe user, not a signed cookie:
 * nothing here reads BETTER_AUTH_SECRET. The guards below refuse to run unless every value
 * points at the agent environment, so a probe cannot mint a session for a production
 * database or a production host.
 *
 * See docs/agents/browser-probe.md.
 */

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { withSession } from "./browser-probe.mjs";

const AGENT_DATABASE = "pictures_writers_agent";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const DEFAULT_FRAME = "preview-frame";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_SETTLE_MS = 500;

/** CDP modifier bitmask, for `press`. */
const MODIFIER_BITS = { alt: 1, ctrl: 2, meta: 4, shift: 8 };

const NAMED_KEYS = {
  Enter: 13,
  Tab: 9,
  Space: 32,
  Escape: 27,
  Backspace: 8,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
};

/** Map a key name to the three fields CDP wants: `key`, `code`, and the virtual key code. */
function keyInfo(key) {
  if (/^[a-z]$/i.test(key)) {
    const upper = key.toUpperCase();
    return { key: key.toLowerCase(), code: `Key${upper}`, windowsVirtualKeyCode: upper.charCodeAt(0) };
  }

  if (/^[0-9]$/.test(key)) {
    return { key, code: `Digit${key}`, windowsVirtualKeyCode: key.charCodeAt(0) };
  }

  if (key in NAMED_KEYS) {
    return { key, code: key, windowsVirtualKeyCode: NAMED_KEYS[key] };
  }

  throw new Error(`Unsupported key "${key}". Use a letter, a digit, or one of ${Object.keys(NAMED_KEYS).join(", ")}.`);
}

function requireEnvironment() {
  const problems = [];

  const databaseUrl = process.env.DATABASE_URL;
  const database = databaseUrl ? safeUrl(databaseUrl) : null;

  if (!database || !LOCAL_HOSTS.has(database.hostname) || database.pathname.replace(/^\//, "") !== AGENT_DATABASE) {
    problems.push(`DATABASE_URL must point at ${AGENT_DATABASE} on localhost`);
  }

  const authUrl = process.env.BETTER_AUTH_URL ? safeUrl(process.env.BETTER_AUTH_URL) : null;

  if (!authUrl || !LOCAL_HOSTS.has(authUrl.hostname)) {
    problems.push("BETTER_AUTH_URL must be a localhost origin");
  }

  for (const key of ["PROBE_ADMIN_EMAIL", "PROBE_ADMIN_PASSWORD"]) {
    if (!process.env[key]) problems.push(`${key} is not set`);
  }

  if (problems.length > 0) {
    throw new Error(
      `Refusing to probe. Load the agent environment with node --env-file=.env.agent scripts/builder-probe.mjs.\n- ${problems.join("\n- ")}`,
    );
  }

  return {
    baseUrl: authUrl.origin,
    email: process.env.PROBE_ADMIN_EMAIL,
    password: process.env.PROBE_ADMIN_PASSWORD,
    pageRootId: process.env.PROBE_PAGE_ROOT_ID,
  };
}

function safeUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

async function login({ baseUrl, email, password }) {
  const response = await fetch(new URL("/api/auth/sign-in/email", baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Better Auth rejects a state-changing request with no Origin (MISSING_OR_NULL_ORIGIN).
      origin: baseUrl,
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`sign-in failed (${response.status}): ${body.slice(0, 400)}`);
  }

  const cookie = (response.headers.getSetCookie?.() ?? []).find((candidate) =>
    candidate.startsWith("better-auth.session_token="),
  );

  if (!cookie) {
    throw new Error("sign-in succeeded but set no better-auth session cookie");
  }

  return cookie.split(";")[0];
}

function rootExpression(frame) {
  return frame
    ? `document.getElementById(${JSON.stringify(frame)})?.contentDocument ?? null`
    : "document";
}

async function readElement(session, { target, frame }) {
  return session.evaluate(`(() => {
    const root = ${rootExpression(frame)};
    const element = root ? root.querySelector(${JSON.stringify(target)}) : null;
    if (!element) return { found: false };
    return {
      found: true,
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? "").trim(),
      html: element.innerHTML,
    };
  })()`);
}

/**
 * Put the caret in the inline editor.
 *
 * A click on a block selects it and the editor takes the caret, but automation clicks can
 * land before Tiptap is ready to accept one: the DOM exists, the focus does not. Clicking
 * until `document.activeElement` is contenteditable makes the flow deterministic, and the
 * reported `attempts` shows when the first click was not enough.
 */
async function focusEditor(session, { selector = ".ProseMirror", frame, attempts = 3, settle }) {
  await session.waitFor({ selector, frame });

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const target = await session.waitFor({ selector, frame });

    await session.instrument({ selector, frame });
    await session.clickAt({ x: target.x, y: target.y, button: "left", modifiers: [] });
    await session.wait(settle);

    const focused = await session.evaluate(`(() => {
      const root = ${rootExpression(frame)};
      const active = root?.activeElement ?? null;
      return Boolean(active && active.getAttribute && active.getAttribute("contenteditable") === "true");
    })()`);

    if (focused) return { attempts: attempt, tag: target.tag, focused: true };
  }

  throw new Error(`the editor did not take the caret after ${attempts} clicks`);
}

async function runSteps(session, steps, frame) {
  const results = [];

  for (const [index, step] of steps.entries()) {
    const settle = step.settle ?? DEFAULT_SETTLE_MS;

    try {
      switch (step.action) {
        case "click": {
          if (!step.target) throw new Error("click needs a target");
          const target = await session.waitFor({ selector: step.target, text: step.text, frame });

          await session.instrument({ selector: step.target, text: step.text, frame });
          await session.clickAt({
            x: target.x,
            y: target.y,
            button: step.button ?? "left",
            modifiers: step.modifiers ?? [],
          });
          await session.wait(settle);

          results.push({
            index,
            action: "click",
            target: { selector: step.target, text: step.text ?? null, tag: target.tag },
            clicked: true,
          });
          break;
        }
        case "type": {
          if (typeof step.text !== "string") throw new Error("type needs text");
          await session.send("Input.insertText", { text: step.text });
          await session.wait(settle);
          results.push({ index, action: "type", text: step.text });
          break;
        }
        case "read": {
          if (!step.target) throw new Error("read needs a target");
          results.push({ index, action: "read", ...(await readElement(session, { ...step, frame })) });
          break;
        }
        case "exists": {
          if (!step.target) throw new Error("exists needs a target");
          const result = await readElement(session, { target: step.target, frame });
          results.push({ index, action: "exists", target: step.target, found: result.found });
          break;
        }
        case "wait": {
          await session.wait(step.ms ?? 500);
          results.push({ index, action: "wait", ms: step.ms ?? 500 });
          break;
        }
        case "focus": {
          const result = await focusEditor(session, {
            selector: step.target ?? ".ProseMirror",
            frame,
            attempts: step.attempts ?? 3,
            settle,
          });
          results.push({ index, action: "focus", ...result });
          break;
        }
        case "press": {
          if (typeof step.key !== "string") throw new Error("press needs a key");
          const modifiers = step.modifiers ?? [];

          for (const name of modifiers) {
            if (!(name in MODIFIER_BITS)) {
              throw new Error(`Unknown modifier "${name}". Known: ${Object.keys(MODIFIER_BITS).join(", ")}.`);
            }
          }

          const mask = modifiers.reduce((total, name) => total | MODIFIER_BITS[name], 0);
          const info = keyInfo(step.key);

          for (const type of ["keyDown", "keyUp"]) {
            await session.send("Input.dispatchKeyEvent", { type, modifiers: mask, ...info });
          }

          await session.wait(settle);
          results.push({ index, action: "press", key: step.key, modifiers });
          break;
        }
        case "evaluate": {
          if (typeof step.expression !== "string") throw new Error("evaluate needs an expression");
          results.push({ index, action: "evaluate", value: await session.evaluate(step.expression) });
          break;
        }
        default:
          throw new Error(`Unknown action "${step.action}"`);
      }
    } catch (error) {
      error.message = `step ${index} (${step.action}): ${error.message}`;
      throw error;
    }
  }

  return results;
}

/**
 * Wait for the canvas iframe to render a document, then let it settle.
 *
 * The editor mounts asynchronously after the builder route hydrates: a step that runs on
 * the first paint finds the block but clicks before the inline editor exists, and the click
 * lands on a heading that cannot take the caret yet.
 */
async function waitForCanvas(session, frame, timeout) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const ready = await session.evaluate(`(() => {
      const host = document.getElementById(${JSON.stringify(frame)});
      const doc = host?.contentDocument;
      return Boolean(doc && doc.body && doc.body.querySelector("*"));
    })()`);

    if (ready) {
      await session.wait(800);
      return;
    }

    await session.wait(250);
  }

  throw new Error(`canvas #${frame} did not render within ${timeout}ms`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      steps: { type: "string" },
      url: { type: "string" },
      frame: { type: "string", default: DEFAULT_FRAME },
      "login-only": { type: "boolean", default: false },
      timeout: { type: "string", default: String(DEFAULT_TIMEOUT_MS) },
    },
    strict: true,
  });

  const environment = requireEnvironment();
  const frame = values.frame === "" ? null : values.frame;
  const url =
    values.url ??
    (environment.pageRootId
      ? `${environment.baseUrl}/admin/pages/${environment.pageRootId}/builder/`
      : null);

  if (!values["login-only"] && !url) {
    throw new Error("No page to probe. Run npm run agent:seed to create the probe page, or pass --url.");
  }

  if (!values["login-only"] && !values.steps) {
    throw new Error("--steps <file.json> is required (or --login-only)");
  }

  const cookie = await login(environment);

  if (values["login-only"]) {
    console.log(
      JSON.stringify(
        { login: { email: environment.email, url: environment.baseUrl }, cookieName: cookie.split("=")[0] },
        null,
        2,
      ),
    );
    return;
  }

  const steps = JSON.parse(readFileSync(values.steps, "utf8"));

  if (!Array.isArray(steps)) {
    throw new Error(`${values.steps} must contain a JSON array of steps`);
  }

  const report = await withSession(
    { url, cookies: [cookie], timeout: Number(values.timeout) },
    async (session) => {
      if (frame) await waitForCanvas(session, frame, Number(values.timeout));

      return {
        url,
        frame,
        login: { email: environment.email },
        steps: await runSteps(session, steps, frame),
        errors: session.events
          .filter((event) => event.method === "Runtime.exceptionThrown")
          .map(
            (event) =>
              event.params.exceptionDetails.exception?.description ??
              event.params.exceptionDetails.text,
          ),
      };
    },
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
