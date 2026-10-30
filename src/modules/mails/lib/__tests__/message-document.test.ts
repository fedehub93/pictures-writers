import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  MESSAGE_DOCUMENT_SCRIPT,
  MESSAGE_DOCUMENT_SCRIPT_HASH,
  buildMessageDocument,
  isMessageHeightMessage,
  isMessageLinkMessage,
  resolveMessageDocumentEvent,
} from "../message-document";

describe("buildMessageDocument", () => {
  it("wraps a fragment in a self-contained document with a restrictive CSP", () => {
    const { html } = buildMessageDocument("<p>Hello</p>");

    expect(html).toContain('<meta http-equiv="Content-Security-Policy"');
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("style-src 'unsafe-inline'");
    expect(html).toContain("img-src data:;");
    expect(html).toContain("font-src 'none'");
    expect(html).toContain("media-src 'none'");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("form-action 'none'");
    expect(html).toContain("base-uri 'none'");
    expect(html).toContain("object-src 'none'");
    expect(html).toContain("frame-src 'none'");
    expect(html).toContain(`script-src 'sha256-${MESSAGE_DOCUMENT_SCRIPT_HASH}'`);
    expect(html).toContain("<p>Hello</p>");
  });

  it("ships a fixed base stylesheet", () => {
    const { html } = buildMessageDocument("<p>Hello</p>");

    expect(html).toContain("background: #ffffff");
    expect(html).toContain("font-family:");
    expect(html).toContain("font-size: 14px");
    expect(html).toContain("line-height: 1.6");
    expect(html).toContain("max-width: 100%");
    expect(html).toContain("overflow-wrap: anywhere");
  });

  it("runs exactly one script, the pinned one", () => {
    const { html } = buildMessageDocument("<p>Hello</p>");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.[1]).toBe(MESSAGE_DOCUMENT_SCRIPT);
    expect(html).toContain(`'sha256-${MESSAGE_DOCUMENT_SCRIPT_HASH}'`);
  });

  it("pins the CSP hash to the injected script", () => {
    const recomputed = createHash("sha256")
      .update(MESSAGE_DOCUMENT_SCRIPT, "utf8")
      .digest("base64");

    expect(recomputed).toBe(MESSAGE_DOCUMENT_SCRIPT_HASH);
  });

  it.each([
    {
      name: "script elements",
      source:
        '<p>before</p><script id="hostile-script">alert(1)</script><p>after</p>',
      removed: ["hostile-script", "alert(1)"],
      kept: ["before", "after"],
    },
    {
      name: "iframes",
      source: '<p>before</p><iframe src="https://evil.test/frame"></iframe>',
      removed: ["<iframe", "evil.test"],
      kept: ["before"],
    },
    {
      name: "objects",
      source: '<object data="https://evil.test/plugin"></object>',
      removed: ["<object", "evil.test"],
      kept: [],
    },
    {
      name: "embeds",
      source: '<embed src="https://evil.test/plugin">',
      removed: ["<embed", "evil.test"],
      kept: [],
    },
    {
      name: "forms and inputs",
      source: '<form action="https://evil.test/post"><input name="x"></form><p>ok</p>',
      removed: ["<form", "<input", "evil.test"],
      kept: ["ok"],
    },
    {
      name: "links and meta tags",
      source:
        '<link rel="stylesheet" href="https://evil.test/x.css"><meta http-equiv="refresh" content="0;url=https://evil.test"><p>ok</p>',
      removed: ["evil.test", 'rel="stylesheet"'],
      kept: ["ok"],
    },
  ])("strips $name", ({ source, removed, kept }) => {
    const { html } = buildMessageDocument(source);

    for (const marker of removed) {
      expect(html.toLowerCase()).not.toContain(marker.toLowerCase());
    }
    for (const marker of kept) {
      expect(html).toContain(marker);
    }
  });

  it("removes event handler attributes but keeps inline styles", () => {
    const { html } = buildMessageDocument(
      '<p onclick="alert(1)" onmouseover="steal()" style="color:red;text-align:center">ok</p>',
    );

    expect(html).not.toMatch(/\son(click|mouseover)=/i);
    expect(html).not.toContain("alert(1)");
    expect(html).not.toContain("steal()");
    expect(html).toContain('style="color:red;text-align:center"');
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,<script>alert(1)</script>",
    " &#106;avascript:alert(1)",
  ])("removes the dangerous URL %s", (url) => {
    const { html } = buildMessageDocument(`<a href="${url}">click</a>`);

    expect(html).not.toMatch(/\shref=/i);
    expect(html).not.toContain("javascript");
    expect(html).not.toContain("vbscript");
    expect(html).not.toContain("data:text/html");
    expect(html).toContain(">click</a>");
  });

  it("keeps safe http, https and mailto links", () => {
    const { html } = buildMessageDocument(
      '<a href="https://example.com">web</a><a href="http://example.com">plain</a><a href="mailto:hi@example.com">mail</a>',
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="http://example.com"');
    expect(html).toContain('href="mailto:hi@example.com"');
  });

  it("preserves ordinary formatting: emphasis, lists, alignment and spacing", () => {
    const source =
      '<p style="text-align:center">Hello <strong>bold</strong> <em>italic</em> <u>under</u> <s>strike</s></p><ul><li>One</li><li>Two</li></ul><ol><li>First</li></ol><p>Last</p><p><a href="https://example.com">link</a></p>';

    const { html } = buildMessageDocument(source);

    expect(html).toContain(
      '<p style="text-align:center">Hello <strong>bold</strong> <em>italic</em> <u>under</u> <s>strike</s></p>',
    );
    expect(html).toContain("<ul><li>One</li><li>Two</li></ul>");
    expect(html).toContain("<ol><li>First</li></ol>");
    expect(html).toContain("<p>Last</p>");
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it("neutralizes data:text/html urls inside CSS", () => {
    const source =
      '<div style="background:url(data:text/html,<script>alert(1)</script>)">x</div><style>.x{background:url(data:text/html,<svg onload=alert(1)>)}</style>';

    const { html } = buildMessageDocument(source);

    expect(html).not.toContain("data:text/html");
    expect(html).not.toContain("alert(1)");
  });

  it("unwraps a full document and lifts its style blocks into the controlled head", () => {
    const { html } = buildMessageDocument(
      '<!doctype html><html><head><title>Mail</title><style>.mail{color:blue}</style><link rel="stylesheet" href="https://evil.test/x.css"><meta name="x" content="y"></head><body class="mail-body"><p>ok</p></body></html>',
    );

    expect(html).toContain(".mail{color:blue}");
    expect(html).toContain("<p>ok</p>");
    expect(html).not.toContain("<title>");
    expect(html).not.toContain('body class="mail-body"');
    expect(html).not.toContain("evil.test");
  });

  it("neutralizes remote references while images are blocked and restores them when revealed", () => {
    const source =
      '<p>hi</p><img src="https://tracker.test/p.gif" srcset="https://tracker.test/p.gif 1x" poster="https://tracker.test/p.jpg"><table background="https://tracker.test/bg.png"></table><div style="background-image:url(https://tracker.test/bg.png)">x</div>';

    const blocked = buildMessageDocument(source);

    expect(blocked.hasRemoteContent).toBe(true);
    expect(blocked.html).not.toContain("tracker.test");
    expect(blocked.html).toContain("img-src data:;");

    const revealed = buildMessageDocument(source, { allowRemoteImages: true });

    expect(revealed.hasRemoteContent).toBe(true);
    expect(revealed.html).toContain('src="https://tracker.test/p.gif"');
    expect(revealed.html).toContain('srcset="https://tracker.test/p.gif 1x"');
    expect(revealed.html).toContain('poster="https://tracker.test/p.jpg"');
    expect(revealed.html).toContain('background="https://tracker.test/bg.png"');
    expect(revealed.html).toContain("url(https://tracker.test/bg.png)");
    expect(revealed.html).toContain("img-src data: https:;");
  });

  it("neutralizes remote SVG image and use references", () => {
    const source =
      '<svg><image xlink:href="https://tracker.test/a.png"></image><use href="https://tracker.test/b.svg"></use><use href="#local"></use></svg>';

    const blocked = buildMessageDocument(source);
    const revealed = buildMessageDocument(source, { allowRemoteImages: true });

    expect(blocked.hasRemoteContent).toBe(true);
    expect(blocked.html).not.toContain("tracker.test");
    expect(blocked.html).toContain('href="#local"');
    expect(revealed.html).toContain('xlink:href="https://tracker.test/a.png"');
    expect(revealed.html).toContain('href="https://tracker.test/b.svg"');
  });

  it("keeps inline data images in both modes and reports no remote content", () => {
    const source = '<img src="data:image/png;base64,AAAA">';

    const blocked = buildMessageDocument(source);
    const revealed = buildMessageDocument(source, { allowRemoteImages: true });

    expect(blocked.hasRemoteContent).toBe(false);
    expect(blocked.html).toContain('src="data:image/png;base64,AAAA"');
    expect(revealed.html).toContain('src="data:image/png;base64,AAAA"');
  });

  it("neutralizes remote urls inside embedded style blocks", () => {
    const source =
      "<style>.hero{background-image:url('https://tracker.test/bg.png')}</style><p>hi</p>";

    const blocked = buildMessageDocument(source);
    const revealed = buildMessageDocument(source, { allowRemoteImages: true });

    expect(blocked.hasRemoteContent).toBe(true);
    expect(blocked.html).not.toContain("tracker.test");
    expect(revealed.html).toContain("url('https://tracker.test/bg.png')");
  });
});

describe("message document message validators", () => {
  it("accepts only finite positive height payloads", () => {
    expect(isMessageHeightMessage({ type: "message-height", height: 240 })).toBe(
      true,
    );
    expect(isMessageHeightMessage({ type: "message-height", height: "240" })).toBe(
      false,
    );
    expect(isMessageHeightMessage({ type: "message-height", height: -1 })).toBe(
      false,
    );
    expect(
      isMessageHeightMessage({
        type: "message-height",
        height: Number.POSITIVE_INFINITY,
      }),
    ).toBe(false);
    expect(isMessageHeightMessage({ type: "message-height" })).toBe(false);
    expect(isMessageHeightMessage(null)).toBe(false);
  });

  it("accepts only http, https and mailto link payloads", () => {
    expect(
      isMessageLinkMessage({ type: "message-link", href: "https://example.com" }),
    ).toBe(true);
    expect(
      isMessageLinkMessage({ type: "message-link", href: "http://example.com" }),
    ).toBe(true);
    expect(
      isMessageLinkMessage({ type: "message-link", href: "mailto:hi@example.com" }),
    ).toBe(true);
    expect(
      isMessageLinkMessage({ type: "message-link", href: "javascript:alert(1)" }),
    ).toBe(false);
    expect(isMessageLinkMessage({ type: "message-link", href: "data:text/html,x" })).toBe(
      false,
    );
    expect(isMessageLinkMessage({ type: "message-link" })).toBe(false);
    expect(isMessageLinkMessage("https://example.com")).toBe(false);
  });

  it("accepts messages only from the expected frame window", () => {
    const frameWindow = {} as Window;
    const otherWindow = {} as Window;
    const height = { type: "message-height", height: 120 };
    const link = { type: "message-link", href: "https://example.com" };

    expect(
      resolveMessageDocumentEvent(frameWindow, frameWindow, height),
    ).toEqual({ type: "height", height: 120 });
    expect(
      resolveMessageDocumentEvent(frameWindow, frameWindow, link),
    ).toEqual({ type: "link", href: "https://example.com" });
    expect(resolveMessageDocumentEvent(otherWindow, frameWindow, height)).toBeNull();
    expect(resolveMessageDocumentEvent(null, frameWindow, height)).toBeNull();
    expect(resolveMessageDocumentEvent(frameWindow, undefined, height)).toBeNull();
    expect(
      resolveMessageDocumentEvent(frameWindow, frameWindow, { type: "other" }),
    ).toBeNull();
  });
});
