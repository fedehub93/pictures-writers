#!/usr/bin/env node
/**
 * Spike: does the Puck 0.24 canvas behave the way a "text edit mode" implementation needs?
 *
 * Six scenarios, each run against a freshly navigated builder page, answering one question
 * from the spike brief. Every answer is a DOM fact read out of the canvas iframe, plus a
 * screenshot on disk. Nothing is saved: Puck's state is client-side until Save is clicked.
 *
 *   node --env-file=.env.agent .scratch/puck-text-edit-mode/spike/probe.mjs
 *   node --env-file=.env.agent .scratch/puck-text-edit-mode/spike/probe.mjs --only q1,q3
 *
 * The app must be the agent environment. This script signs in over HTTP as the probe user;
 * it never reads BETTER_AUTH_SECRET.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { withSession } from "../../../scripts/browser-probe.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const shotsDir = join(here, "screens");
const BASE_URL = process.env.SPIKE_BASE_URL ?? "http://localhost:3010";
const FRAME = "preview-frame";

const LOCK_CSS = `[data-puck-component] [data-puck-overlay-portal] [contenteditable="true"] { pointer-events: none !important }`;
const STRICT_LOCK_CSS = `[data-puck-component] [data-puck-overlay-portal], [data-puck-component] [data-puck-overlay-portal] * { pointer-events: none !important }`;
const ARM_CSS = `[data-puck-component][data-text-editing] [contenteditable="true"] { pointer-events: auto !important }`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pageRootId() {
  const id = process.env.PROBE_PAGE_ROOT_ID;
  if (!id) throw new Error("PROBE_PAGE_ROOT_ID is not set; run npm run agent:seed");
  return id;
}

async function login() {
  const email = process.env.PROBE_ADMIN_EMAIL;
  const password = process.env.PROBE_ADMIN_PASSWORD;

  if (!email || !password) throw new Error("PROBE_ADMIN_EMAIL / PROBE_ADMIN_PASSWORD missing");

  const response = await fetch(new URL("/api/auth/sign-in/email", BASE_URL), {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE_URL },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`sign-in failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }

  const cookie = (response.headers.getSetCookie?.() ?? []).find((c) =>
    c.startsWith("better-auth.session_token="),
  );

  if (!cookie) throw new Error("sign-in set no session cookie");

  return cookie.split(";")[0];
}

/* ------------------------------------------------------------------ frame helpers */

function wrap(body) {
  return `(() => {
    const host = document.getElementById(${JSON.stringify(FRAME)});
    const doc = host && host.contentDocument;
    const win = doc && doc.defaultView;
    if (!doc) return { error: "no-canvas" };
    ${body}
  })()`;
}

/** Element geometry in iframe-local and top-document coordinates. */
async function geometry(session, selector, text) {
  return session.evaluate(
    wrap(`
    const wanted = ${text === undefined ? "null" : JSON.stringify(text)};
    const all = Array.from(doc.querySelectorAll(${JSON.stringify(selector)}));
    const el = wanted === null ? all[0] : all.find((c) => (c.textContent ?? "").trim().includes(wanted));
    if (!el) return { found: false, count: all.length };
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    const fr = host.getBoundingClientRect();
    const scale = host.clientWidth ? fr.width / host.clientWidth : 1;
    return {
      found: true,
      count: all.length,
      tag: el.tagName.toLowerCase(),
      className: typeof el.className === "string" ? el.className : "",
      component: el.closest("[data-puck-component]")?.getAttribute("data-puck-component") ?? null,
      rect: { left: r.left, top: r.top, width: r.width, height: r.height },
      scale,
      local: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      top: { x: fr.left + (r.left + r.width / 2) * scale, y: fr.top + (r.top + r.height / 2) * scale },
    };`),
  );
}

/** Screen point of the middle of one word inside the heading text. */
async function wordGeometry(session, word) {
  return session.evaluate(
    wrap(`
    const editor = doc.querySelector(".ProseMirror");
    if (!editor) return { found: false, reason: "no-editor" };
    const walker = doc.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && !(node.textContent ?? "").includes(${JSON.stringify(word)})) node = walker.nextNode();
    if (!node) return { found: false, reason: "word-not-found" };
    const index = node.textContent.indexOf(${JSON.stringify(word)});
    const range = doc.createRange();
    range.setStart(node, index);
    range.setEnd(node, index + ${JSON.stringify(word)}.length);
    const r = range.getBoundingClientRect();
    const fr = host.getBoundingClientRect();
    const scale = host.clientWidth ? fr.width / host.clientWidth : 1;
    return {
      found: true,
      node: node.nodeName,
      text: node.textContent,
      index,
      charWidth: r.width / ${JSON.stringify(word)}.length,
      local: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      top: { x: fr.left + (r.left + r.width / 2) * scale, y: fr.top + (r.top + r.height / 2) * scale },
    };`),
  );
}

async function frameEval(session, body) {
  return session.evaluate(wrap(body));
}

/** One snapshot of everything the six questions care about. */
async function snapshot(session, label) {
  const frame = await frameEval(session, `
    const components = Array.from(doc.querySelectorAll("[data-puck-component]")).map((el) => ({
      id: el.getAttribute("data-puck-component"),
      tag: el.tagName.toLowerCase(),
      text: (el.textContent ?? "").trim().slice(0, 40),
      dragging: el.hasAttribute("data-dnd-dragging"),
    }));
    const entry = doc.querySelector("[data-puck-entry]");
    const overlays = Array.from(doc.querySelectorAll("[data-puck-overlay]")).map((el) => ({
      className: typeof el.className === "string" ? el.className : "",
      isSelected: /isSelected/.test(String(el.className)),
      label: (el.querySelector("[class*=ActionBar]")?.textContent ?? el.textContent ?? "").trim().slice(0, 60),
      bold: Boolean(el.querySelector('button[title="Bold"]')),
      italic: Boolean(el.querySelector('button[title="Italic"]')),
      menus: Array.from(el.querySelectorAll("button[title]")).map((b) => b.getAttribute("title")).slice(0, 12),
    }));
    const editor = doc.querySelector(".ProseMirror");
    const editorChild = editor ? editor.querySelector("p, h2, h3, span") : null;
    const active = doc.activeElement;
    const sel = doc.getSelection();
    return {
      componentOrder: components.map((c) => c.text),
      components,
      entryDragging: Boolean(entry && entry.hasAttribute("data-puck-dragging")),
      dndDragging: doc.querySelectorAll("[data-dnd-dragging]").length,
      dndPlaceholders: doc.querySelectorAll("[data-dnd-placeholder]").length,
      linePlaceholders: doc.querySelectorAll("[data-puck-line-placeholder]").length,
      dropzonesEnabled: doc.querySelectorAll("[class*=DropZone--isEnabled]").length,
      overlays,
      editor: editor
        ? {
            pointerEvents: win.getComputedStyle(editor).pointerEvents,
            childPointerEvents: editorChild ? win.getComputedStyle(editorChild).pointerEvents : null,
            textEditingAttr: editor.closest("[data-puck-component]")?.hasAttribute("data-text-editing") ?? null,
          }
        : null,
      activeElement: active
        ? {
            tag: active.tagName.toLowerCase(),
            className: typeof active.className === "string" ? active.className.slice(0, 60) : "",
            contenteditable: active.getAttribute?.("contenteditable") ?? null,
            insideEditor: Boolean(editor && editor.contains(active)),
          }
        : null,
      selection: sel
        ? {
            rangeCount: sel.rangeCount,
            collapsed: sel.isCollapsed,
            anchor: sel.anchorNode
              ? { name: sel.anchorNode.nodeName, text: (sel.anchorNode.textContent ?? "").slice(0, 40) }
              : null,
            anchorOffset: sel.anchorOffset,
            insideEditor: Boolean(editor && sel.anchorNode && editor.contains(sel.anchorNode)),
          }
        : null,
    };`);

  const top = await session.evaluate(`(() => {
    const text = document.body.innerText;
    return {
      url: location.href,
      hasLevel: /\\bLevel\\b/.test(text),
      hasTypography: /\\bTypography\\b/.test(text),
      hasDrawer: document.querySelectorAll('[class*="Drawer"]').length,
      hasDialog: document.querySelectorAll('[role="dialog"]').length,
      buttons: Array.from(document.querySelectorAll("button")).map((b) => (b.textContent ?? "").trim()).filter(Boolean).slice(0, 40),
    };
  })()`);

  return { label, frame, top };
}

async function screenshot(session, name) {
  const { data } = await session.send("Page.captureScreenshot", { format: "png" });
  const path = join(shotsDir, `${name}.png`);
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

/* ------------------------------------------------------------------ input helpers */

async function move(session, x, y, buttons = 0) {
  await session.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
    buttons,
    button: buttons ? "left" : "none",
  });
}

async function press(session, x, y, clickCount = 1) {
  await move(session, x, y);
  await session.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    buttons: 1,
    clickCount,
  });
}

async function release(session, x, y, clickCount = 1) {
  await session.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    buttons: 0,
    clickCount,
  });
}

async function click(session, point) {
  await press(session, point.x, point.y);
  await sleep(60);
  await release(session, point.x, point.y);
}

/**
 * Press, move in steps, observe mid-drag, release.
 *
 * Puck configures dnd-kit's PointerSensor with Delay(200) + Distance(5) for a press on the
 * component body (use-sensors.ts:16-19), so the hold has to outlast the delay before the
 * movement can activate the drag. `dx`/`dy` are canvas CSS pixels, mapped to screen pixels
 * through the builder's zoom.
 */
async function dragBy(session, point, dx, dy, scale, onMove) {
  const step = (delta, i) => point.y + ((delta * i) / 6) * scale;

  await press(session, point.x, point.y);
  await sleep(260);

  for (let i = 1; i <= 6; i += 1) {
    await move(session, point.x + ((dx * i) / 6) * scale, step(dy, i), 1);
    await sleep(40);
  }
  await sleep(120);

  const mid = onMove ? await onMove() : null;
  await release(session, point.x + dx, point.y + dy);
  await sleep(400);

  return mid;
}

async function doubleClick(session, point) {
  await press(session, point.x, point.y, 1);
  await release(session, point.x, point.y, 1);
  await sleep(30);
  await press(session, point.x, point.y, 2);
  await release(session, point.x, point.y, 2);
}

async function key(session, name, code, vk) {
  for (const type of ["keyDown", "keyUp"]) {
    await session.send("Input.dispatchKeyEvent", {
      type,
      key: name,
      code,
      windowsVirtualKeyCode: vk,
      nativeVirtualKeyCode: vk,
    });
  }
}

async function injectStyle(session, css, id) {
  return frameEval(session, `
    const existing = doc.getElementById(${JSON.stringify(id)});
    if (existing) existing.remove();
    const style = doc.createElement("style");
    style.id = ${JSON.stringify(id)};
    style.textContent = ${JSON.stringify(css)};
    (doc.head || doc.documentElement).appendChild(style);
    return { injected: true, id: ${JSON.stringify(id)} };`);
}

/* ------------------------------------------------------------------ page lifecycle */

async function waitForCanvas(session, timeout = 45_000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const ready = await session.evaluate(`(() => {
      const host = document.getElementById(${JSON.stringify(FRAME)});
      const doc = host && host.contentDocument;
      return Boolean(doc && doc.body && doc.body.querySelector("[data-puck-component]"));
    })()`);

    if (ready) {
      await sleep(900);
      return;
    }

    await sleep(300);
  }

  throw new Error("canvas did not render the block roots");
}

async function openBuilder(session, url) {
  await session.send("Page.navigate", { url });
  await waitForCanvas(session);

  // The builder auto-zooms the canvas to fit the preview pane (builder.tsx:16-39), which in a
  // small window shrinks it to ~11%: coordinates and screenshots become unusable. A bigger
  // emulated window gives the pane room, so the canvas lands near 50-70%.
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(900);

  // Start every scenario from the seeded two-block page with nothing selected / hovered.
  await move(session, 900, 8);
  await sleep(300);
}

/** Canvas scale: CSS pixels inside the iframe → top-document pixels. */
async function canvasScale(session) {
  return session.evaluate(`(() => {
    const host = document.getElementById(${JSON.stringify(FRAME)});
    const fr = host.getBoundingClientRect();
    return host.clientWidth ? fr.width / host.clientWidth : 1;
  })()`);
}

/* ------------------------------------------------------------------ scenarios */

const scenarios = {
  /**
   * Q1 — does a locked editor still let a press turn into a drag?
   *
   * Four presses, all on the Heading, all 30 canvas px down:
   *   a. the brief's LOCK_CSS, press on the text
   *   b. no CSS at all, press on the text (control)
   *   c. a strict lock that also kills pointer-events on the editor's descendants, press on
   *      what is now the block root
   *   d. no CSS, but padding on the h2 so a press can land on the root instead of the text
   */
  async q1(session, results) {
    const url = results.url;

    const pressProbe = async (label, mode = "text") => {
      const scale = await canvasScale(session);
      const point = await frameEval(session, `
        const editor = doc.querySelector(".ProseMirror");
        const root = doc.querySelector("h2[data-puck-component]");
        const r = editor.getBoundingClientRect();
        const rr = root.getBoundingClientRect();
        return ${mode === "root"
          ? `{ x: rr.left + 8, y: rr.top + 8, left: r.left, top: r.top, width: r.width, height: r.height }`
          : `{ x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, top: r.top, width: r.width, height: r.height }`};`);
      const host = await frameEval(session, `
        const fr = host.getBoundingClientRect();
        return { left: fr.left, top: fr.top, scale: ${scale} };`);
      const top = { x: host.left + point.x * scale, y: host.top + point.y * scale };
      const hit = await frameEval(session, `
        const el = doc.elementFromPoint(${point.x}, ${point.y});
        const interactive = "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [contenteditable]:not([contenteditable=\\"false\\"])";
        return {
          tag: el?.tagName?.toLowerCase() ?? null,
          className: typeof el?.className === "string" ? el.className.slice(0, 60) : null,
          insideEditor: Boolean(doc.querySelector(".ProseMirror")?.contains(el)),
          insideOverlayPortal: Boolean(el?.closest("[data-puck-overlay-portal]")),
          isBlockRoot: el === doc.querySelector("h2[data-puck-component]"),
          matchesInteractiveSelector: Boolean(el?.closest(interactive)),
          editorPointerEvents: win.getComputedStyle(doc.querySelector(".ProseMirror")).pointerEvents,
          editorChildPointerEvents: (() => {
            const c = doc.querySelector(".ProseMirror p");
            return c ? win.getComputedStyle(c).pointerEvents : null;
          })(),
        };`);

      const before = await snapshot(session, `${label}-before`);
      const shotBefore = await screenshot(session, `${label}-before`);
      const mid = await dragBy(session, top, 0, 30, scale, () => snapshot(session, `${label}-during`));
      const shotDuring = await screenshot(session, `${label}-during`);
      const after = await snapshot(session, `${label}-after`);
      const shotAfter = await screenshot(session, `${label}-after`);

      return {
        label,
        point: top,
        scale,
        hit,
        during: {
          entryDragging: mid.frame.entryDragging,
          dndDragging: mid.frame.dndDragging,
          dndPlaceholders: mid.frame.dndPlaceholders,
          linePlaceholders: mid.frame.linePlaceholders,
          dropzonesEnabled: mid.frame.dropzonesEnabled,
          overlays: mid.frame.overlays.length,
        },
        after: {
          order: after.frame.componentOrder,
          beforeOrder: before.frame.componentOrder,
          entryDragging: after.frame.entryDragging,
          activeElement: after.frame.activeElement,
        },
        screenshots: { shotBefore, shotDuring, shotAfter },
      };
    };

    // a. The brief's lock CSS, press on the text.
    await openBuilder(session, url);
    await injectStyle(session, LOCK_CSS, "spike-lock");
    const lockTextPress = await pressProbe("q1-lock-text");

    // b. Control: no CSS at all, press on the text.
    await openBuilder(session, url);
    const unlockedTextPress = await pressProbe("q1-unlocked-text");

    // c. Strict lock: no pointer events anywhere in the editor portal, so the root is hit.
    await openBuilder(session, url);
    await injectStyle(session, STRICT_LOCK_CSS, "spike-strict-lock");
    const strictLockPress = await pressProbe("q1-strict-lock");

    // d. No CSS, but the h2 gets padding so a press can land on the root above the text.
    await openBuilder(session, url);
    await frameEval(session, `
      const root = doc.querySelector("h2[data-puck-component]");
      root.style.paddingTop = "20px";
      root.style.borderTop = "1px solid transparent";
      return true;`);
    const rootPress = await pressProbe("q1-root-padding", "root");

    // e. The brief's CSS, but the editor loses its contenteditable attribute: same hit target
    // (<p>, still inside the portal), no [contenteditable] ancestor. Isolates dnd-kit's
    // interactive-target guard from Puck's pointer-events rules.
    await openBuilder(session, url);
    await injectStyle(session, LOCK_CSS, "spike-lock");
    await frameEval(session, `
      doc.querySelector(".ProseMirror").removeAttribute("contenteditable");
      return true;`);
    const withoutContentEditable = await pressProbe("q1-no-contenteditable");

    // Plain click on the locked editor: selection without a caret?
    await openBuilder(session, url);
    await injectStyle(session, LOCK_CSS, "spike-lock");
    const heading = await geometry(session, "h2[data-puck-component]");
    await click(session, heading.top);
    await sleep(400);
    const clicked = await snapshot(session, "q1-after-click");
    await move(session, 8, 8);
    await sleep(500);
    const afterLeave = await snapshot(session, "q1-after-pointer-leave");
    const shotClick = await screenshot(session, "q1-heading-after-click");

    // Same plain click on the Text block, locked.
    await openBuilder(session, url);
    await injectStyle(session, LOCK_CSS, "spike-lock");
    const textScale = await canvasScale(session);
    const textEditor = await frameEval(session, `
      const editor = doc.querySelectorAll(".ProseMirror")[1];
      const r = editor.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`);
    const textHost = await frameEval(session, `const fr = host.getBoundingClientRect(); return { left: fr.left, top: fr.top };`);
    await click(session, { x: textHost.left + textEditor.x * textScale, y: textHost.top + textEditor.y * textScale });
    await sleep(400);
    const textClicked = await snapshot(session, "q1-text-after-click");
    const shotTextClick = await screenshot(session, "q1-text-after-click");

    return {
      question: 1,
      css: LOCK_CSS,
      strictCss: STRICT_LOCK_CSS,
      lockTextPress,
      unlockedTextPress,
      strictLockPress,
      rootPress,
      withoutContentEditable,
      plainClickHeadingLocked: {
        overlays: clicked.frame.overlays,
        activeElement: clicked.frame.activeElement,
        selection: clicked.frame.selection,
        sidebarLevel: clicked.top.hasLevel,
        afterPointerLeave: {
          overlays: afterLeave.frame.overlays,
          sidebarLevel: afterLeave.top.hasLevel,
        },
      },
      plainClickTextLocked: {
        overlays: textClicked.frame.overlays,
        activeElement: textClicked.frame.activeElement,
        selection: textClicked.frame.selection,
        order: textClicked.frame.componentOrder,
      },
      screenshots: { shotClick, shotTextClick },
    };
  },

  /** Q2 — does a dblclick reach React's container, and what is its target? */
  async q2(session, results) {
    const url = results.url;
    await openBuilder(session, url);
    await injectStyle(session, LOCK_CSS, "spike-lock");

    const installed = await frameEval(session, `
      win.__spikeDbl = [];
      const describe = (el) => el ? {
        tag: el.tagName?.toLowerCase() ?? String(el.nodeName),
        className: typeof el.className === "string" ? el.className.slice(0, 80) : null,
        component: el.closest?.("[data-puck-component]")?.getAttribute("data-puck-component") ?? null,
        inOverlayPortal: Boolean(el.closest?.("[data-puck-overlay-portal]")),
        inEditor: Boolean(el.closest?.(".ProseMirror")),
      } : null;
      const record = (where) => (event) => win.__spikeDbl.push({
        where,
        type: event.type,
        detail: event.detail,
        target: describe(event.target),
        cancelBubble: event.cancelBubble,
        defaultPrevented: event.defaultPrevented,
      });
      for (const type of ["dblclick", "click", "mousedown", "mouseup"]) {
        doc.addEventListener(type, record("document-capture:" + type), true);
        doc.addEventListener(type, record("document-bubble:" + type));
      }
      win.addEventListener("dblclick", record("window-bubble:dblclick"));

      // Where would React dispatch from? A React root marks its container with
      // __reactContainer$<hash>. Walk every ancestor of the block root.
      const root = doc.querySelector("h2[data-puck-component]");
      let container = root;
      let reactContainer = null;
      while (container) {
        const key = Object.keys(container).find((k) => k.startsWith("__reactContainer$"));
        if (key) {
          reactContainer = { tag: container.tagName.toLowerCase(), key: key.slice(0, 24) };
          break;
        }
        container = container.parentElement;
      }
      const propsKey = root ? Object.keys(root).find((k) => k.startsWith("__reactProps$")) : null;
      const fiberKey = root ? Object.keys(root).find((k) => k.startsWith("__reactFiber$")) : null;
      const listeningKeys = (node) =>
        node ? Object.keys(node).filter((k) => k.startsWith("__reactListening")) : [];
      const reactListening = {
        document: listeningKeys(doc).length,
        body: listeningKeys(doc.body).length,
        html: listeningKeys(doc.documentElement).length,
        entry: listeningKeys(doc.querySelector("[data-puck-entry]")).length,
        topDocument: 0,
      };

      const editor = doc.querySelector(".ProseMirror");
      const r = editor.getBoundingClientRect();
      return {
        reactContainer,
        reactPropsOnRoot: propsKey ? propsKey.slice(0, 20) : null,
        reactFiberOnRoot: fiberKey ? fiberKey.slice(0, 20) : null,
        reactListening,
        point: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      };`);

    // Does anything outside the canvas frame see the double click? A React handler living in
    // the parent document would only receive it through a bubbled event.
    await session.evaluate(`(() => {
      window.__spikeTopDbl = [];
      for (const type of ["dblclick", "click"]) {
        document.addEventListener(type, (event) => window.__spikeTopDbl.push({
          type,
          target: event.target?.tagName?.toLowerCase() ?? null,
          defaultPrevented: event.defaultPrevented,
        }), true);
      }
      return true;
    })()`);

    const map = await frameEval(session, `
      const fr = host.getBoundingClientRect();
      const scale = host.clientWidth ? fr.width / host.clientWidth : 1;
      return { left: fr.left, top: fr.top, scale };`);
    const point = {
      x: map.left + installed.point.x * map.scale,
      y: map.top + installed.point.y * map.scale,
    };

    await doubleClick(session, point);
    await sleep(500);

    const events = await frameEval(session, `return win.__spikeDbl;`);
    const topEvents = await session.evaluate(`window.__spikeTopDbl`);
    const state = await snapshot(session, "q2-after-dblclick");
    const shot = await screenshot(session, "q2-after-dblclick");

    // Would a React handler inside the canvas run at all? The Duplicate action in the block
    // action bar is a React onClick portalled into the iframe: if the block count grows,
    // React does receive native events from the iframe document.
    const duplicate = await geometry(session, 'button[title="Duplicate"]');
    const beforeDuplicate = (await snapshot(session, "q2-before-duplicate")).frame.componentOrder;
    let reactClick = { found: duplicate.found };
    if (duplicate.found) {
      await click(session, duplicate.top);
      await sleep(700);
      const after = await snapshot(session, "q2-after-duplicate");
      reactClick = {
        found: true,
        before: beforeDuplicate,
        after: after.frame.componentOrder,
        changed: after.frame.componentOrder.length !== beforeDuplicate.length,
      };
    }

    return {
      question: 2,
      css: LOCK_CSS,
      point,
      reactContainer: installed.reactContainer,
      reactPropsOnRoot: installed.reactPropsOnRoot,
      reactFiberOnRoot: installed.reactFiberOnRoot,
      reactListening: installed.reactListening,
      events,
      topDocumentEvents: topEvents,
      reactClickInIframe: reactClick,
      state: {
        activeElement: state.frame.activeElement,
        selection: state.frame.selection,
        overlays: state.frame.overlays.length,
        order: state.frame.componentOrder,
      },
      screenshots: { shot },
    };
  },

  /** Q3 — CSS + data-text-editing flips the block from locked to editable, no re-render. */
  async q3(session, results) {
    const url = results.url;
    await openBuilder(session, url);
    await injectStyle(session, LOCK_CSS, "spike-lock");
    await injectStyle(session, ARM_CSS, "spike-arm");

    const before = await snapshot(session, "q3-before-arm");
    const lockedHit = await frameEval(session, `
      const editor = doc.querySelector(".ProseMirror");
      const r = editor.getBoundingClientRect();
      const el = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { tag: el?.tagName?.toLowerCase(), inEditor: editor.contains(el), pointerEvents: win.getComputedStyle(editor).pointerEvents };`);

    const armed = await frameEval(session, `
      const root = doc.querySelector("[data-puck-component] h2, h2[data-puck-component]");
      root.setAttribute("data-text-editing", "");
      const editor = doc.querySelector(".ProseMirror");
      const r = editor.getBoundingClientRect();
      const el = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        rootTag: root.tagName.toLowerCase(),
        attr: root.getAttribute("data-text-editing"),
        hitTag: el?.tagName?.toLowerCase(),
        hitClass: typeof el?.className === "string" ? el.className.slice(0, 60) : null,
        hitInEditor: editor.contains(el),
        pointerEvents: win.getComputedStyle(editor).pointerEvents,
        childPointerEvents: (() => { const c = editor.querySelector("p"); return c ? win.getComputedStyle(c).pointerEvents : null; })(),
      };`);

    const point = await wordGeometry(session, "Probe");
    const map = await frameEval(session, `
      const fr = host.getBoundingClientRect();
      const scale = host.clientWidth ? fr.width / host.clientWidth : 1;
      return { left: fr.left, top: fr.top, scale };`);
    const clickPoint = { x: map.left + point.local.x * map.scale, y: map.top + point.local.y * map.scale };

    await click(session, clickPoint);
    await sleep(600);

    const after = await snapshot(session, "q3-after-click");
    const shot = await screenshot(session, "q3-armed-click");

    return {
      question: 3,
      css: [LOCK_CSS, ARM_CSS],
      beforeArm: {
        pointerEvents: before.frame.editor?.pointerEvents,
        lockedHit,
        activeElement: before.frame.activeElement,
        selection: before.frame.selection,
      },
      armed,
      clickPoint,
      after: {
        activeElement: after.frame.activeElement,
        selection: after.frame.selection,
        menuBold: after.frame.overlays.map((o) => o.bold),
        overlays: after.frame.overlays,
        componentOrder: after.frame.componentOrder,
      },
      screenshots: { shot },
    };
  },

  /**
   * Q4 — programmatic focus on ProseMirror: does it set Puck's currentRichText (toolbar)?
   *
   * The block is locked with STRICT_LOCK_CSS so a click selects it without putting the caret
   * in the editor: currentRichText stays null and the toolbar is absent. Then .focus() is
   * called on the ProseMirror element and the action bar is read again.
   */
  async q4(session, results) {
    const url = results.url;
    await openBuilder(session, url);
    await injectStyle(session, STRICT_LOCK_CSS, "spike-strict-lock");
    await injectStyle(session, ARM_CSS, "spike-arm");

    const heading = await geometry(session, "h2[data-puck-component]");
    await click(session, heading.top);
    await sleep(500);
    await move(session, 8, 8);
    await sleep(300);

    const selectedNoCaret = await snapshot(session, "q4-selected-no-caret");

    await frameEval(session, `
      const root = doc.querySelector("h2[data-puck-component]");
      root.setAttribute("data-text-editing", "");
      return true;`);

    const focusResult = await frameEval(session, `
      const editor = doc.querySelector(".ProseMirror");
      editor.focus();
      return {
        activeIsEditor: doc.activeElement === editor,
        activeTag: doc.activeElement?.tagName?.toLowerCase(),
        contenteditable: doc.activeElement?.getAttribute?.("contenteditable"),
        pointerEvents: win.getComputedStyle(editor).pointerEvents,
      };`);
    await sleep(700);

    const afterProgrammatic = await snapshot(session, "q4-programmatic-focus");
    const shot = await screenshot(session, "q4-programmatic-focus");
    const activeAfter = await frameEval(session, `
      const editor = doc.querySelector(".ProseMirror");
      return {
        activeIsEditor: doc.activeElement === editor,
        iframeActive: Boolean(doc.activeElement),
        topActive: document.activeElement ? document.activeElement.tagName.toLowerCase() : null,
      };`);

    return {
      question: 4,
      css: [STRICT_LOCK_CSS, ARM_CSS],
      selectedNoCaret: {
        activeElement: selectedNoCaret.frame.activeElement,
        overlays: selectedNoCaret.frame.overlays.map((o) => ({ isSelected: o.isSelected, bold: o.bold, menus: o.menus })),
        selection: selectedNoCaret.frame.selection,
      },
      focusResult,
      afterProgrammatic: {
        activeElement: afterProgrammatic.frame.activeElement,
        overlays: afterProgrammatic.frame.overlays.map((o) => ({ isSelected: o.isSelected, bold: o.bold, menus: o.menus })),
        selection: afterProgrammatic.frame.selection,
        activeAfter,
      },
      screenshots: { shot },
    };
  },

  /** Q5 — does caretFromPoint land the caret on the clicked character? */
  async q5(session, results) {
    const url = results.url;
    await openBuilder(session, url);
    await injectStyle(session, LOCK_CSS, "spike-lock");
    await injectStyle(session, ARM_CSS, "spike-arm");

    await frameEval(session, `
      const root = doc.querySelector("h2[data-puck-component]");
      root.setAttribute("data-text-editing", "");
      return true;`);

    const word = await wordGeometry(session, "heading");
    const probes = await frameEval(session, `
      const editor = doc.querySelector(".ProseMirror");
      const x = ${word.local.x};
      const y = ${word.local.y};
      const fromRange = doc.caretRangeFromPoint ? doc.caretRangeFromPoint(x, y) : null;
      const fromPosition = doc.caretPositionFromPoint ? doc.caretPositionFromPoint(x, y) : null;
      const inside = (node) => Boolean(node && editor.contains(node));
      return {
        point: { x, y },
        caretRangeFromPoint: fromRange ? {
          startContainer: fromRange.startContainer.nodeName,
          text: (fromRange.startContainer.textContent ?? "").slice(0, 40),
          startOffset: fromRange.startOffset,
          rect: (() => { const r = fromRange.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; })(),
          insideEditor: inside(fromRange.startContainer),
        } : null,
        caretPositionFromPoint: fromPosition ? {
          nodeName: fromPosition.offsetNode.nodeName,
          offset: fromPosition.offset,
          insideEditor: inside(fromPosition.offsetNode),
        } : null,
      };`);

    // Expected: the character under the click point, computed independently.
    const expected = await frameEval(session, `
      const editor = doc.querySelector(".ProseMirror");
      const range = doc.caretRangeFromPoint(${word.local.x}, ${word.local.y});
      return range ? { text: (range.startContainer.textContent ?? ""), offset: range.startOffset } : null;`);

    // Now set the DOM selection from the range, focus, and see whether it survives.
    const applied = await frameEval(session, `
      const editor = doc.querySelector(".ProseMirror");
      const range = doc.caretRangeFromPoint(${word.local.x}, ${word.local.y});
      if (!range) return { applied: false };
      const sel = doc.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      editor.focus();
      const after = doc.getSelection();
      const rect = after.rangeCount ? after.getRangeAt(0).getBoundingClientRect() : null;
      return {
        applied: true,
        activeIsEditor: doc.activeElement === editor,
        selection: {
          collapsed: after.isCollapsed,
          anchorOffset: after.anchorOffset,
          anchorText: (after.anchorNode?.textContent ?? "").slice(0, 40),
          insideEditor: Boolean(after.anchorNode && editor.contains(after.anchorNode)),
          rect: rect ? { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
        },
      };`);
    await sleep(500);

    const state = await snapshot(session, "q5-after-caret");
    const shot = await screenshot(session, "q5-caret");

    return {
      question: 5,
      word,
      probes,
      expected,
      applied,
      afterFocus: {
        activeElement: state.frame.activeElement,
        selection: state.frame.selection,
      },
      screenshots: { shot },
    };
  },

  /**
   * Q6 — Enter with a Heading selected.
   *
   * Two states:
   *   A. selected with the caret outside the editor (STRICT_LOCK_CSS): what does Puck do?
   *   B. selected with the caret inside the editor (default behaviour): the contrast case.
   */
  async q6(session, results) {
    const url = results.url;

    const run = async (label, css) => {
      await openBuilder(session, url);
      if (css) await injectStyle(session, css, "spike-lock");

      const heading = await geometry(session, "h2[data-puck-component]");
      await click(session, heading.top);
      await sleep(400);
      await move(session, 8, 8);
      await sleep(400);

      const before = await snapshot(session, `${label}-before`);
      const htmlBefore = await frameEval(session, `return doc.querySelector("h2[data-puck-component]").innerHTML;`);
      const shotBefore = await screenshot(session, `${label}-before`);

      await key(session, "Enter", "Enter", 13);
      await sleep(800);

      const after = await snapshot(session, `${label}-after`);
      const htmlAfter = await frameEval(session, `return doc.querySelector("h2[data-puck-component]").innerHTML;`);
      const shotAfter = await screenshot(session, `${label}-after`);

      return {
        label,
        before: {
          order: before.frame.componentOrder,
          overlays: before.frame.overlays.map((o) => ({ isSelected: o.isSelected, bold: o.bold })),
          activeElement: before.frame.activeElement,
          rootAttributes: await frameEval(session, `
            const root = doc.querySelector("h2[data-puck-component]");
            return {
              tabindex: root.getAttribute("tabindex"),
              role: root.getAttribute("role"),
              draggable: root.getAttribute("draggable"),
              ariaDescribedBy: root.getAttribute("aria-describedby"),
            };`),
          drawer: before.top.hasDrawer,
          dialog: before.top.hasDialog,
          buttons: before.top.buttons,
          sidebarLevel: before.top.hasLevel,
          html: htmlBefore,
        },
        after: {
          order: after.frame.componentOrder,
          overlays: after.frame.overlays.map((o) => ({ isSelected: o.isSelected, bold: o.bold })),
          activeElement: after.frame.activeElement,
          entryDragging: after.frame.entryDragging,
          dndDragging: after.frame.dndDragging,
          selection: after.frame.selection,
          drawer: after.top.hasDrawer,
          dialog: after.top.hasDialog,
          buttons: after.top.buttons,
          sidebarLevel: after.top.hasLevel,
          html: htmlAfter,
        },
        changed: htmlBefore !== htmlAfter,
        screenshots: { shotBefore, shotAfter },
      };
    };

    return {
      question: 6,
      strictLock: await run("q6-strict-lock", STRICT_LOCK_CSS),
      defaultCss: await run("q6-default"),
    };
  },

  /** Diagnostics — do the pointer events reach the block root, and when does a drag start? */
  async diag(session, results) {
    const url = results.url;
    await openBuilder(session, url);

    const rects = await frameEval(session, `
      const headingRoot = doc.querySelector("h2[data-puck-component]");
      const editor = doc.querySelector(".ProseMirror");
      const rr = headingRoot.getBoundingClientRect();
      const er = editor.getBoundingClientRect();
      return {
        root: { left: rr.left, top: rr.top, right: rr.right, bottom: rr.bottom, width: rr.width, height: rr.height },
        editor: { left: er.left, top: er.top, right: er.right, bottom: er.bottom, width: er.width, height: er.height },
        rootPadding: { top: win.getComputedStyle(headingRoot).paddingTop, left: win.getComputedStyle(headingRoot).paddingLeft },
        rootDisplay: win.getComputedStyle(headingRoot).display,
      };`);

    const log = await frameEval(session, `
      win.__spikePointer = [];
      const root = doc.querySelector("h2[data-puck-component]");
      const record = (phase) => (event) => win.__spikePointer.push({
        phase,
        type: event.type,
        target: event.target?.tagName?.toLowerCase() ?? null,
        targetClass: typeof event.target?.className === "string" ? event.target.className.slice(0, 40) : null,
        defaultPrevented: event.defaultPrevented,
        cancelBubble: event.cancelBubble,
        buttons: event.buttons,
        t: Math.round(performance.now()),
      });
      for (const type of ["pointerdown", "pointermove", "pointerup", "mousedown", "mouseup"]) {
        root.addEventListener(type, record("root-capture"), true);
        root.addEventListener(type, record("root-bubble"));
      }
      doc.addEventListener("pointerdown", record("document-bubble"));
      return true;`);

    const map = await frameEval(session, `
      const fr = host.getBoundingClientRect();
      const scale = host.clientWidth ? fr.width / host.clientWidth : 1;
      return { left: fr.left, top: fr.top, scale };`);

    const localPoint = { x: rects.editor.left + rects.editor.width / 2, y: rects.editor.top + rects.editor.height / 2 };
    const topPoint = { x: map.left + localPoint.x * map.scale, y: map.top + localPoint.y * map.scale };

    const signals = async (label) => {
      const frame = await frameEval(session, `
        return {
          entryDragging: Boolean(doc.querySelector("[data-puck-entry]")?.hasAttribute("data-puck-dragging")),
          dndDragging: doc.querySelectorAll("[data-dnd-dragging]").length,
          placeholders: doc.querySelectorAll("[data-dnd-placeholder]").length,
          liveRegion: doc.querySelector('[role="status"], [aria-live]')?.textContent?.slice(0, 80) ?? null,
          overlays: doc.querySelectorAll("[data-puck-overlay]").length,
        };`);
      return { label, ...frame };
    };

    const timeline = [];
    await press(session, topPoint.x, topPoint.y);
    timeline.push(await signals("press+0"));
    await sleep(120);
    timeline.push(await signals("press+120"));
    await sleep(160);
    timeline.push(await signals("press+280"));
    for (let i = 1; i <= 4; i += 1) {
      await move(session, topPoint.x, topPoint.y + i * 10, 1);
      await sleep(80);
      timeline.push(await signals(`move-${i * 10}px`));
    }
    await release(session, topPoint.x, topPoint.y + 40);
    await sleep(300);
    timeline.push(await signals("release"));

    const events = await frameEval(session, `return win.__spikePointer;`);

    // Second run: press the block root outside the editor box (if the root is larger).
    const rootOnly = rects.root.right - rects.root.left > rects.editor.right - rects.editor.left + 20;
    let rootOnlyRun = null;

    if (rootOnly) {
      await openBuilder(session, url);
      await frameEval(session, `
        win.__spikePointer = [];
        const root = doc.querySelector("h2[data-puck-component]");
        const record = (phase) => (event) => win.__spikePointer.push({ phase, type: event.type, target: event.target?.tagName?.toLowerCase() ?? null });
        for (const type of ["pointerdown", "pointermove", "pointerup"]) {
          root.addEventListener(type, record("root-capture"), true);
          root.addEventListener(type, record("root-bubble"));
        }
        return true;`);
      const p = { x: map.left + (rects.root.right - 10) * map.scale, y: map.top + (rects.root.top + rects.root.height / 2) * map.scale };
      const hit = await frameEval(session, `
        const el = doc.elementFromPoint(${rects.root.right - 10}, ${rects.root.top + rects.root.height / 2});
        return { tag: el?.tagName?.toLowerCase(), className: typeof el?.className === "string" ? el.className.slice(0, 40) : null };`);
      await press(session, p.x, p.y);
      await sleep(280);
      await move(session, p.x, p.y + 20, 1);
      await sleep(120);
      const during = await signals("root-only-during");
      await move(session, p.x, p.y + 30, 1);
      await sleep(120);
      const during2 = await signals("root-only-during-2");
      await release(session, p.x, p.y + 30);
      await sleep(300);
      rootOnlyRun = { hit, point: p, during, during2, events: await frameEval(session, `return win.__spikePointer;`) };
    }

    const shot = await screenshot(session, "diag");

    return {
      question: "diag",
      rects,
      point: topPoint,
      hit: await frameEval(session, `const el = doc.elementFromPoint(${localPoint.x}, ${localPoint.y}); return { tag: el?.tagName?.toLowerCase() };`),
      timeline,
      events,
      rootOnlyRun,
      screenshots: { shot },
    };
  },

  /** Q7 — Escape on a selected block, and whether a capture listener can pre-empt it. */
  async q7(session, results) {
    const url = results.url;

    /** Listeners that record every Escape that reaches the canvas, and who stopped it. */
    const installKeyProbes = async (preempt) =>
      frameEval(session, `
        win.__spikeKeys = [];
        const describe = (el) => el ? {
          tag: el.tagName?.toLowerCase() ?? String(el.nodeName),
          className: typeof el.className === "string" ? el.className.slice(0, 60) : null,
          component: el.closest?.("[data-puck-component]")?.tagName?.toLowerCase() ?? null,
        } : null;
        const record = (where) => (event) => win.__spikeKeys.push({
          where,
          key: event.key,
          code: event.code,
          target: describe(event.target),
          cancelBubble: event.cancelBubble,
          defaultPrevented: event.defaultPrevented,
        });
        doc.addEventListener("keydown", record("document-capture"), true);
        doc.addEventListener("keydown", record("document-bubble"));
        const root = doc.querySelector("h2[data-puck-component]");
        if (root) root.addEventListener("keydown", record("component-root-bubble"));

        ${preempt
          ? `doc.addEventListener("keydown", (event) => {
               win.__spikeKeys.push({ where: "spike-preempt", key: event.key, code: event.code, cancelBubble: event.cancelBubble });
               event.stopPropagation();
             }, true);`
          : ""}
        return true;`);

    const beforeAfter = async (label) => {
      const state = await snapshot(session, label);
      return {
        order: state.frame.componentOrder,
        overlays: state.frame.overlays.map((o) => ({ isSelected: o.isSelected, bold: o.bold, menus: o.menus })),
        activeElement: state.frame.activeElement,
        selection: state.frame.selection,
        sidebarLevel: state.top.hasLevel,
        drawer: state.top.hasDrawer,
        dialog: state.top.hasDialog,
      };
    };

    // A. Default CSS (no lock): a click puts the caret in the text and mounts the toolbar.
    await openBuilder(session, url);
    const defaultHeading = await geometry(session, "h2[data-puck-component]");
    await click(session, defaultHeading.top);
    await sleep(500);
    await installKeyProbes(false);
    const aBefore = await beforeAfter("q7-default-before-esc");
    const shotDefault = await screenshot(session, "q7-default-before-esc");
    await key(session, "Escape", "Escape", 27);
    await sleep(700);
    const aAfter = await beforeAfter("q7-default-after-esc");
    const aEvents = await frameEval(session, `return win.__spikeKeys;`);
    const shotDefaultAfter = await screenshot(session, "q7-default-after-esc");

    // B. Strict lock: a click selects the block and leaves the caret outside the editor.
    await openBuilder(session, url);
    await injectStyle(session, STRICT_LOCK_CSS, "spike-strict-lock");
    const lockedHeading = await geometry(session, "h2[data-puck-component]");
    await click(session, lockedHeading.top);
    await sleep(500);
    await move(session, 8, 8);
    await sleep(300);
    await installKeyProbes(false);
    const bBefore = await beforeAfter("q7-locked-before-esc");
    const shotLocked = await screenshot(session, "q7-locked-before-esc");
    await key(session, "Escape", "Escape", 27);
    await sleep(700);
    const bAfter = await beforeAfter("q7-locked-after-esc");
    const bEvents = await frameEval(session, `return win.__spikeKeys;`);
    const shotLockedAfter = await screenshot(session, "q7-locked-after-esc");

    // C. Same locked state, but a capture-phase listener inside the canvas swallows Escape.
    await openBuilder(session, url);
    await injectStyle(session, STRICT_LOCK_CSS, "spike-strict-lock");
    const preemptHeading = await geometry(session, "h2[data-puck-component]");
    await click(session, preemptHeading.top);
    await sleep(500);
    await move(session, 8, 8);
    await sleep(300);
    await installKeyProbes(true);
    const cBefore = await beforeAfter("q7-preempt-before-esc");
    const shotPreempt = await screenshot(session, "q7-preempt-before-esc");
    await key(session, "Escape", "Escape", 27);
    await sleep(700);
    const cAfter = await beforeAfter("q7-preempt-after-esc");
    const cEvents = await frameEval(session, `return win.__spikeKeys;`);
    const shotPreemptAfter = await screenshot(session, "q7-preempt-after-esc");

    /** Selection is a fact about the action bar: does an overlay still claim isSelected? */
    const selected = (state) => state.overlays.some((o) => o.isSelected);

    return {
      question: 7,
      A_defaultCss: {
        before: aBefore,
        after: aAfter,
        stillSelected: selected(aAfter),
        selectedBefore: selected(aBefore),
        events: aEvents,
      },
      B_strictLock: {
        before: bBefore,
        after: bAfter,
        stillSelected: selected(bAfter),
        selectedBefore: selected(bBefore),
        events: bEvents,
      },
      C_strictLockCaptureStop: {
        before: cBefore,
        after: cAfter,
        stillSelected: selected(cAfter),
        selectedBefore: selected(cBefore),
        events: cEvents,
      },
      screenshots: { shotDefault, shotDefaultAfter, shotLocked, shotLockedAfter, shotPreempt, shotPreemptAfter },
    };
  },
};

async function main() {
  const { values } = parseArgs({
    options: { only: { type: "string" } },
    strict: true,
  });

  mkdirSync(shotsDir, { recursive: true });

  const url = `${BASE_URL}/admin/pages/${pageRootId()}/builder/`;
  const cookie = await login();
  const wanted = values.only
    ? values.only.split(",").map((s) => s.trim())
    : Object.keys(scenarios);

  const report = await withSession({ url, cookies: [cookie], timeout: 60_000 }, async (session) => {
    const out = [];
    const results = { url };

    for (const name of wanted) {
      if (!scenarios[name]) throw new Error(`unknown scenario ${name}`);
      console.log(`\n### ${name}`);
      try {
        const answer = await scenarios[name](session, results);
        out.push(answer);
        console.log(JSON.stringify(answer, null, 2));
      } catch (error) {
        const failure = { question: name, error: String(error?.message ?? error) };
        out.push(failure);
        console.log(JSON.stringify(failure, null, 2));
      }
    }

    return { url, answers: out };
  });

  const path = join(here, "results.json");
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(`\nwrote ${path}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
