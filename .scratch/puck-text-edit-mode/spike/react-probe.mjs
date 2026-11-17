#!/usr/bin/env node
/**
 * Where does React listen? The canvas is a portal into the iframe, so the question is whether
 * React's delegated listeners live inside the canvas document. A synthetic element.click()
 * inside the iframe only triggers a React handler if they do.
 *
 *   node --env-file=.env.agent .scratch/puck-text-edit-mode/spike/react-probe.mjs
 */

import { parseArgs } from "node:util";

import { withSession } from "../../../scripts/browser-probe.mjs";

const BASE_URL = process.env.SPIKE_BASE_URL ?? "http://localhost:3010";

async function login() {
  const response = await fetch(new URL("/api/auth/sign-in/email", BASE_URL), {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE_URL },
    body: JSON.stringify({
      email: process.env.PROBE_ADMIN_EMAIL,
      password: process.env.PROBE_ADMIN_PASSWORD,
    }),
  });

  if (!response.ok) throw new Error(`sign-in failed ${response.status}`);

  const cookie = (response.headers.getSetCookie?.() ?? []).find((c) =>
    c.startsWith("better-auth.session_token="),
  );

  return cookie.split(";")[0];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  parseArgs({ options: {}, strict: true });

  const url = `${BASE_URL}/admin/pages/${process.env.PROBE_PAGE_ROOT_ID}/builder/`;
  const cookie = await login();

  const report = await withSession({ url, cookies: [cookie], timeout: 60_000 }, async (session) => {
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });

    for (let i = 0; i < 80; i += 1) {
      const ready = await session.evaluate(`(() => {
        const host = document.getElementById("preview-frame");
        return Boolean(host && host.contentDocument && host.contentDocument.querySelector("[data-puck-component]"));
      })()`);
      if (ready) break;
      await sleep(300);
    }
    await sleep(900);

    const markers = await session.evaluate(`(() => {
      const host = document.getElementById("preview-frame");
      const doc = host.contentDocument;
      const keys = (node) => node ? Object.keys(node).filter((k) => /__react(Listening|Container|Fiber|Props)/.test(k)) : [];
      return {
        iframeDocument: keys(doc),
        iframeHtml: keys(doc.documentElement),
        iframeBody: keys(doc.body),
        iframeEntry: keys(doc.querySelector("[data-puck-entry]")),
        iframeFirstComponent: keys(doc.querySelector("[data-puck-component]")),
        topDocument: keys(document),
        topBody: keys(document.body),
        overlaysInIframe: doc.querySelectorAll("[data-puck-overlay]").length,
        overlaysInTop: document.querySelectorAll("[data-puck-overlay]").length,
        duplicateInIframe: Boolean(doc.querySelector('button[title="Duplicate"]')),
        duplicateInTop: Boolean(document.querySelector('button[title="Duplicate"]')),
      };
    })()`);

    // DevTools' getEventListeners is available with the command line API: count the native
    // click listeners each candidate node carries, which is where React's delegation lives.
    const listeners = await session.send("Runtime.evaluate", {
      expression: `(() => {
        const host = document.getElementById("preview-frame");
        const doc = host.contentDocument;
        const count = (node) => {
          if (!node) return null;
          const all = getEventListeners(node);
          return {
            click: (all.click ?? []).length,
            dblclick: (all.dblclick ?? []).length,
            pointerdown: (all.pointerdown ?? []).length,
            mousedown: (all.mousedown ?? []).length,
          };
        };
        return {
          iframeDocument: count(doc),
          iframeBody: count(doc.body),
          entry: count(doc.querySelector("[data-puck-entry]")),
          overlay: count(doc.querySelector("[data-puck-overlay]")),
          editor: count(doc.querySelector(".ProseMirror")),
          topDocument: count(document),
          topBody: count(document.body),
        };
      })()`,
      includeCommandLineAPI: true,
      returnByValue: true,
    });
    const listenerReport = listeners.result?.value ?? listeners;

    // Select the heading with a real click so the action bar exists.
    const point = await session.evaluate(`(() => {
      const host = document.getElementById("preview-frame");
      const doc = host.contentDocument;
      const root = doc.querySelector("h2[data-puck-component]");
      root.scrollIntoView({ block: "center" });
      const r = root.getBoundingClientRect();
      const fr = host.getBoundingClientRect();
      const scale = host.clientWidth ? fr.width / host.clientWidth : 1;
      return { x: fr.left + (r.left + r.width / 2) * scale, y: fr.top + (r.top + r.height / 2) * scale };
    })()`);

    for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
      await session.send("Input.dispatchMouseEvent", {
        type,
        x: point.x,
        y: point.y,
        button: type === "mouseMoved" ? "none" : "left",
        buttons: type === "mousePressed" ? 1 : 0,
        clickCount: type === "mouseMoved" ? 0 : 1,
      });
    }
    await sleep(700);

    const before = await session.evaluate(
      `document.getElementById("preview-frame").contentDocument.querySelectorAll("[data-puck-component]").length`,
    );

    // Where does the action bar live once a block is selected, and who listens on it?
    const afterSelect = await session.send("Runtime.evaluate", {
      expression: `(() => {
        const host = document.getElementById("preview-frame");
        const doc = host.contentDocument;
        const count = (node) => {
          if (!node) return null;
          const all = getEventListeners(node);
          return {
            click: (all.click ?? []).length,
            dblclick: (all.dblclick ?? []).length,
            pointerdown: (all.pointerdown ?? []).length,
          };
        };
        const overlayIframe = doc.querySelector("[data-puck-overlay]");
        const overlayTop = document.querySelector("[data-puck-overlay]");
        const buttonIframe = doc.querySelector('button[title="Duplicate"]');
        const buttonTop = document.querySelector('button[title="Duplicate"]');
        return {
          overlayInIframe: Boolean(overlayIframe),
          overlayInTop: Boolean(overlayTop),
          buttonInIframe: Boolean(buttonIframe),
          buttonInTop: Boolean(buttonTop),
          listenersOverlayIframe: count(overlayIframe),
          listenersButtonIframe: count(buttonIframe),
          listenersButtonTop: count(buttonTop),
          buttonOwnerIsIframe: buttonIframe ? buttonIframe.ownerDocument === doc : null,
          editorListeners: count(doc.querySelector(".ProseMirror")),
        };
      })()`,
      includeCommandLineAPI: true,
      returnByValue: true,
    });
    const selectionReport = afterSelect.result?.value ?? afterSelect;

    // Synthetic click: only React's own delegated listeners can see this.
    const synthetic = await session.evaluate(`(() => {
      const doc = document.getElementById("preview-frame").contentDocument;
      const button = doc.querySelector('button[title="Duplicate"]');
      if (!button) return { found: false };
      button.click();
      return { found: true };
    })()`);
    await sleep(700);

    const afterSynthetic = await session.evaluate(
      `document.getElementById("preview-frame").contentDocument.querySelectorAll("[data-puck-component]").length`,
    );

    return { markers, listenerReport, before, selectionReport, synthetic, afterSynthetic };
  });

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
