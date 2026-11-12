#!/usr/bin/env node
/**
 * Drive a real Chrome at a URL and report what a click (or a key press) actually did.
 *
 * Unit tests run in happy-dom: no browser navigation, no Puck canvas listener. A test can
 * pass on top of a broken interaction, which is how the canvas links once shipped still
 * navigating. This probe is the check that settles it — real Chrome, real input events, a
 * JSON answer.
 *
 *   node scripts/browser-probe.mjs --url http://localhost:3000/ --target a --text Blog
 *   node scripts/browser-probe.mjs --url <builder> --frame preview-frame --target a --text Blog
 *   node scripts/browser-probe.mjs --url <url> --target a --text Blog --button middle
 *
 * See docs/agents/browser-probe.md.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const DEFAULT_PORT = 0;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_SETTLE_MS = 1_500;
const SEND_TIMEOUT_MS = 30_000;

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const KEY_CODES = { Enter: 13, Tab: 9, Space: 32 };

/** CDP modifier bitmask. */
const MODIFIER_BITS = { alt: 1, ctrl: 2, meta: 4, shift: 8 };

/** CDP `buttons` bitmask, keyed by the `button` name. */
const BUTTON_BITS = { left: 1, right: 2, middle: 4 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const found = CHROME_PATHS.find((candidate) => existsSync(candidate));

  if (!found) {
    throw new Error(
      "No Chrome or Edge found. Set CHROME_PATH to the browser executable.",
    );
  }

  return found;
}

/**
 * Start a headless browser with a throwaway profile and wait for its devtools port.
 * The profile lives in the OS temp directory so a probe never touches the user's session.
 */
async function launch(port) {
  const executable = findChrome();
  const profile = mkdtempSync(join(tmpdir(), "browser-probe-"));

  const chrome = spawn(
    executable,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  for (let attempt = 0; attempt < 100; attempt += 1) {
    // Chrome writes the port it actually bound, plus the browser websocket path, once it
    // is listening. Asking for port 0 and reading this file means two probes never share
    // a browser, which a fixed port lets them do when one is still shutting down.
    const activePort = join(profile, "DevToolsActivePort");

    if (existsSync(activePort)) {
      const [chosenPort, webSocketPath] = readFileSync(activePort, "utf8")
        .trim()
        .split("\n");

      if (chosenPort) {
        return { chrome, profile, port: Number(chosenPort), webSocketPath };
      }
    }

    await sleep(150);
  }

  await stop(chrome, profile);
  throw new Error(`Chrome did not open its devtools port (profile ${profile})`);
}

/**
 * Stop the browser and delete its throwaway profile.
 *
 * The profile can only be removed once the process tree is gone: on Windows a killed
 * parent leaves its renderer children holding files, and `rmSync` then fails with EPERM.
 * Cleanup is best-effort — a leftover temp directory must never fail a probe.
 */
async function stop(chrome, profile) {
  if (chrome.exitCode === null && !chrome.killed) {
    const exited = new Promise((resolve) => chrome.once("exit", resolve));

    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(chrome.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      chrome.kill("SIGKILL");
    }

    await Promise.race([exited, sleep(5_000)]);
  }

  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // The OS still holds a file; the temp directory is disposable.
  }
}

/** Open a fresh tab and return its devtools websocket URL. */
async function newTarget(port) {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
    method: "PUT",
  }).then((response) => response.json());

  return target.webSocketDebuggerUrl;
}

function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  const pending = new Map();
  const events = [];
  let nextId = 0;

  socket.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);

    if (!payload.id) {
      events.push(payload);
      return;
    }

    const waiter = pending.get(payload.id);

    if (!waiter) return;

    pending.delete(payload.id);

    if (payload.error) {
      waiter.reject(new Error(JSON.stringify(payload.error)));
    } else {
      waiter.resolve(payload.result);
    }
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = (nextId += 1);
      // A browser that dies mid-run closes the socket without answering; without this
      // timer the probe would wait forever instead of reporting what it saw.
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP ${method} did not answer within ${SEND_TIMEOUT_MS}ms`));
      }, SEND_TIMEOUT_MS);

      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });

      socket.send(JSON.stringify({ id, method, params }));
    });

  return { socket, send, ready, events };
}

async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ??
        JSON.stringify(result.exceptionDetails),
    );
  }

  return result.result.value;
}

/**
 * The document a selector is resolved against: the canvas iframe when `frame` is set,
 * the top document otherwise.
 */
function rootExpression(frame) {
  return frame
    ? `document.getElementById(${JSON.stringify(frame)})?.contentDocument ?? null`
    : "document";
}

/**
 * Find the element, scroll it into view and return its click point in top-document
 * coordinates. The canvas iframe is CSS-transformed for viewport zoom, so the point is
 * mapped through the transform rather than used as-is.
 */
async function findTarget(send, options) {
  const { frame } = options;
  const expression = `(() => {
    const root = ${rootExpression(frame)};
    if (!root) return { found: false, reason: "frame-missing" };
    const wanted = ${options.text === undefined ? "null" : JSON.stringify(options.text)};
    const matches = Array.from(root.querySelectorAll(${JSON.stringify(options.selector)}));
    const element = wanted === null
      ? matches[0]
      : matches.find((candidate) => (candidate.textContent ?? "").trim() === wanted);
    if (!element) return { found: false, reason: "no-match", matches: matches.length };

    element.scrollIntoView({ block: "center", inline: "center" });
    const rect = element.getBoundingClientRect();
    const host = ${frame ? `document.getElementById(${JSON.stringify(frame)})` : "null"};
    const frameRect = host?.getBoundingClientRect() ?? null;
    const scale = frameRect && host.clientWidth ? frameRect.width / host.clientWidth : 1;

    return {
      found: true,
      tag: element.tagName.toLowerCase(),
      href: element.getAttribute("href"),
      text: (element.textContent ?? "").trim(),
      x: (frameRect?.left ?? 0) + (rect.left + rect.width / 2) * scale,
      y: (frameRect?.top ?? 0) + (rect.top + rect.height / 2) * scale,
    };
  })()`;

  return evaluate(send, expression);
}

/**
 * Record the event the element acts on. `defaultPrevented` is read after the action, so
 * every handler that ran — capture, the block root's own listener, bubble — has had its say.
 */
async function instrument(send, { selector, text, frame, focus }) {
  const expression = `(() => {
    const root = ${rootExpression(frame)};
    if (!root) return false;
    const wanted = ${text === undefined ? "null" : JSON.stringify(text)};
    const matches = Array.from(root.querySelectorAll(${JSON.stringify(selector)}));
    const element = wanted === null
      ? matches[0]
      : matches.find((candidate) => (candidate.textContent ?? "").trim() === wanted);
    if (!element) return false;

    const scope = root.defaultView ?? window;
    scope.__probe = { event: null };
    const record = (event) => {
      scope.__probe.event = event;
    };
    element.addEventListener("click", record, true);
    element.addEventListener("auxclick", record, true);
    ${focus ? "element.focus();" : ""}
    return true;
  })()`;

  return evaluate(send, expression);
}

async function readState(send, frame) {
  const expression = `(() => {
    const root = ${rootExpression(frame)};
    const scope = root?.defaultView ?? null;
    const event = scope?.__probe?.event ?? null;
    return {
      top: location.href,
      frame: root?.location?.href ?? null,
      event: event
        ? { type: event.type, prevented: event.defaultPrevented, button: event.button }
        : null,
    };
  })()`;

  return evaluate(send, expression);
}

function modifierMask(modifiers) {
  return modifiers.reduce((mask, name) => mask | MODIFIER_BITS[name], 0);
}

async function clickAt(send, { x, y, button, modifiers }) {
  const mask = modifierMask(modifiers);

  // `element.click()` would not produce an `auxclick`, so the probe sends real input
  // events at the element's coordinates instead.
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
    modifiers: mask,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button,
    buttons: BUTTON_BITS[button],
    modifiers: mask,
    clickCount: 1,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button,
    buttons: 0,
    modifiers: mask,
    clickCount: 1,
  });
}

async function pressKey(send, key) {
  const windowsVirtualKeyCode = KEY_CODES[key];

  if (!windowsVirtualKeyCode) {
    throw new Error(`Unsupported key "${key}". Known: ${Object.keys(KEY_CODES)}`);
  }

  for (const type of ["keyDown", "keyUp"]) {
    await send("Input.dispatchKeyEvent", {
      type,
      key,
      code: key,
      windowsVirtualKeyCode,
      nativeVirtualKeyCode: windowsVirtualKeyCode,
    });
  }
}

/**
 * Run one probe and return its report. The browser is always closed before returning.
 */
export async function runProbe({
  url,
  selector = "a",
  text,
  frame,
  button = "left",
  modifiers = [],
  key,
  cookies = [],
  port = DEFAULT_PORT,
  timeout = DEFAULT_TIMEOUT_MS,
  settle = DEFAULT_SETTLE_MS,
}) {
  const { chrome, profile, port: debugPort } = await launch(port);
  let socket;

  try {
    const connection = connect(await newTarget(debugPort));
    socket = connection.socket;

    const { send, ready, events } = connection;
    await ready;

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    for (const cookie of cookies) {
      const [name, ...value] = cookie.split("=");
      await send("Network.setCookie", {
        name,
        value: value.join("="),
        url,
      });
    }

    const tabsBefore = (await send("Target.getTargets")).targetInfos.map(
      (target) => target.targetId,
    );

    await send("Page.navigate", { url });

    const deadline = Date.now() + timeout;
    let target = { found: false, reason: "not-started" };

    while (Date.now() < deadline) {
      target = await findTarget(send, { selector, text, frame });

      if (target.found) break;

      await sleep(300);
    }

    if (!target.found) {
      throw new Error(
        `Target not found: ${selector}${text ? ` with text "${text}"` : ""} (${JSON.stringify(target)})`,
      );
    }

    const before = await readState(send, frame);

    await instrument(send, { selector, text, frame, focus: Boolean(key) });

    if (key) {
      await pressKey(send, key);
    } else {
      await clickAt(send, { x: target.x, y: target.y, button, modifiers });
    }

    await sleep(settle);

    const after = await readState(send, frame);
    const tabsAfter = (await send("Target.getTargets")).targetInfos;

    return {
      url,
      frame: frame ?? null,
      target: {
        selector,
        text: text ?? null,
        tag: target.tag,
        href: target.href,
        visibleText: target.text,
      },
      action: key
        ? { type: "key", key }
        : { type: "click", button, modifiers },
      cancelled: after.event?.prevented ?? null,
      event: after.event,
      navigated: {
        top: after.top !== before.top,
        frame: frame ? after.frame !== before.frame : null,
        newTabs: tabsAfter
          .filter((tab) => !tabsBefore.includes(tab.targetId))
          .filter((tab) => tab.type === "page")
          .map((tab) => tab.url),
      },
      location: { before, after },
      errors: events
        .filter((event) => event.method === "Runtime.exceptionThrown")
        .map(
          (event) =>
            event.params.exceptionDetails.exception?.description ??
            event.params.exceptionDetails.text,
        ),
    };
  } finally {
    try {
      socket?.close();
    } catch {
      // The socket may already be gone after a navigation.
    }

    await stop(chrome, profile);
  }
}

function parseModifier(name) {
  if (!(name in MODIFIER_BITS)) {
    throw new Error(
      `Unknown modifier "${name}". Known: ${Object.keys(MODIFIER_BITS).join(", ")}`,
    );
  }

  return name;
}

async function main() {
  const { values } = parseArgs({
    options: {
      url: { type: "string" },
      target: { type: "string", default: "a" },
      text: { type: "string" },
      frame: { type: "string" },
      button: { type: "string", default: "left" },
      modifier: { type: "string", multiple: true, default: [] },
      key: { type: "string" },
      cookie: { type: "string", multiple: true, default: [] },
      port: { type: "string", default: String(DEFAULT_PORT) },
      timeout: { type: "string", default: String(DEFAULT_TIMEOUT_MS) },
      settle: { type: "string", default: String(DEFAULT_SETTLE_MS) },
    },
    strict: true,
  });

  if (!values.url) {
    throw new Error("--url is required");
  }

  if (!(values.button in BUTTON_BITS)) {
    throw new Error(
      `Unknown button "${values.button}". Known: ${Object.keys(BUTTON_BITS).join(", ")}`,
    );
  }

  const report = await runProbe({
    url: values.url,
    selector: values.target,
    text: values.text,
    frame: values.frame,
    button: values.button,
    modifiers: values.modifier.map(parseModifier),
    key: values.key,
    cookies: values.cookie,
    port: Number(values.port),
    timeout: Number(values.timeout),
    settle: Number(values.settle),
  });

  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
