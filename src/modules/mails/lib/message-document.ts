import { decodeHtmlEntities } from "./html-entities";

/**
 * Turn a stored email body into a self-contained, sandboxed document. This
 * module is framework-free by design: it runs identically during server
 * rendering, in the browser and in tests, so the rendering path, previews and
 * send paths can share one transformation.
 */

export interface MessageDocumentOptions {
  /** Restore remote images and CSS `url()` references when true. */
  allowRemoteImages?: boolean;
}

export interface MessageDocument {
  /** The complete `srcdoc` document, CSP and base styles included. */
  html: string;
  /** Whether the source referenced remote images or CSS URLs. */
  hasRemoteContent: boolean;
}

const REMOTE_ATTRIBUTES = new Set(["src", "srcset", "poster", "background"]);
const REMOTE_TAG_ATTRIBUTES: Record<string, Set<string>> = {
  image: new Set(["href", "xlink:href"]),
  use: new Set(["href", "xlink:href"]),
};
const URL_ATTRIBUTES = new Set([
  "href",
  "src",
  "action",
  "formaction",
  "xlink:href",
  "srcset",
  "poster",
  "background",
  "ping",
  "srcdoc",
]);

/** Remove control characters and whitespace so a scheme cannot be disguised. */
function normalizeUrlForSchemeCheck(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/[\u0000-\u0020\u007f]+/g, "")
    .trim()
    .toLowerCase();
}

function isDangerousUrl(value: string): boolean {
  const inspected = normalizeUrlForSchemeCheck(value);

  return (
    inspected.startsWith("javascript:") ||
    inspected.startsWith("vbscript:") ||
    inspected.startsWith("data:text/html")
  );
}

function isRemoteUrl(value: string): boolean {
  return /^(?:https?:(?:\/\/)?|\/\/)/i.test(normalizeUrlForSchemeCheck(value));
}

function isRemoteSrcset(value: string): boolean {
  return decodeHtmlEntities(value)
    .split(",")
    .some((candidate) => isRemoteUrl(candidate.trim().split(/\s+/)[0] ?? ""));
}

function isRemoteAttribute(tagName: string, attributeName: string): boolean {
  if (REMOTE_ATTRIBUTES.has(attributeName)) return true;

  return (
    REMOTE_TAG_ATTRIBUTES[tagName.toLowerCase()]?.has(attributeName) ?? false
  );
}

function escapeAttribute(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function tagAlternation(names: string[]): string {
  return names.join("|");
}

function anyTagPattern(names: string[]): RegExp {
  return new RegExp(
    `</?(${tagAlternation(names)})\\b((?:[^>"']|"[^"]*"|'[^']*')*)>`,
    "gi",
  );
}

/**
 * Remove whole elements (including their fallback content). Used for elements
 * that could execute or embed foreign content.
 */
function removeElementsWithContent(html: string, names: string[]): string {
  const paired = new RegExp(
    `<(${tagAlternation(names)})\\b((?:[^>"']|"[^"]*"|'[^']*')*)>[\\s\\S]*?<\\/\\1\\s*>`,
    "gi",
  );

  return html.replace(paired, "").replace(anyTagPattern(names), "");
}

/** Remove the opening and closing tags but keep the content (e.g. `form`). */
function removeTags(html: string, names: string[]): string {
  return html.replace(anyTagPattern(names), "");
}

interface SanitizedCss {
  css: string;
  hasRemoteContent: boolean;
}

function sanitizeCss(css: string, allowRemoteImages: boolean): SanitizedCss {
  let hasRemoteContent = false;
  let result = css
    .replace(/@import\b[^;]*;?/gi, "")
    .replace(/(?:javascript|vbscript)\s*:/gi, "")
    .replace(/expression\s*\(/gi, "none(");

  result = result.replace(
    /url\(\s*("([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi,
    (match, _quoted: string, doubleQuoted?: string, singleQuoted?: string, raw?: string) => {
      const value = doubleQuoted ?? singleQuoted ?? raw ?? "";
      if (isDangerousUrl(value)) return "none";
      if (!isRemoteUrl(value)) return match;

      hasRemoteContent = true;
      return allowRemoteImages ? match : "none";
    },
  );

  return { css: result, hasRemoteContent };
}

interface ParsedAttribute {
  name: string;
  value: string | null;
}

interface ParsedTag {
  name: string;
  attributes: ParsedAttribute[];
  selfClosing: boolean;
}

const WHITESPACE = /\s/;

function parseOpenTag(tag: string): ParsedTag | null {
  const nameMatch = tag.match(/^<([^\s/>]+)/);
  if (!nameMatch) return null;

  const name = nameMatch[1]!;
  let index = nameMatch[0].length;
  let selfClosing = false;
  const attributes: ParsedAttribute[] = [];

  while (index < tag.length) {
    while (index < tag.length && WHITESPACE.test(tag[index]!)) index += 1;

    if (index >= tag.length || tag[index] === ">") break;

    if (tag[index] === "/") {
      selfClosing = true;
      index += 1;
      continue;
    }

    const attributeStart = index;
    while (
      index < tag.length &&
      !WHITESPACE.test(tag[index]!) &&
      tag[index] !== "=" &&
      tag[index] !== ">" &&
      tag[index] !== "/"
    ) {
      index += 1;
    }

    const attributeName = tag.slice(attributeStart, index);
    if (!attributeName) {
      index += 1;
      continue;
    }

    let value: string | null = null;
    while (index < tag.length && WHITESPACE.test(tag[index]!)) index += 1;

    if (tag[index] === "=") {
      index += 1;
      while (index < tag.length && WHITESPACE.test(tag[index]!)) index += 1;

      const quote = tag[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;
        while (index < tag.length && tag[index] !== quote) index += 1;
        value = tag.slice(valueStart, index);
        if (tag[index] === quote) index += 1;
      } else {
        const valueStart = index;
        while (
          index < tag.length &&
          !WHITESPACE.test(tag[index]!) &&
          tag[index] !== ">"
        ) {
          index += 1;
        }
        value = tag.slice(valueStart, index);
      }
    }

    attributes.push({ name: attributeName, value });
  }

  return { name, attributes, selfClosing };
}

function serializeOpenTag(
  name: string,
  attributes: ParsedAttribute[],
  selfClosing: boolean,
): string {
  const serialized = attributes
    .map((attribute) =>
      attribute.value === null
        ? ` ${attribute.name}`
        : ` ${attribute.name}="${escapeAttribute(attribute.value)}"`,
    )
    .join("");

  return `<${name}${serialized}${selfClosing ? " /" : ""}>`;
}

interface SanitizedMarkup {
  markup: string;
  hasRemoteContent: boolean;
}

const OPEN_TAG = /<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

function sanitizeMarkup(
  markup: string,
  allowRemoteImages: boolean,
): SanitizedMarkup {
  let hasRemoteContent = false;

  const sanitized = markup.replace(OPEN_TAG, (tag) => {
    const parsed = parseOpenTag(tag);
    if (!parsed) return tag;

    const attributes: ParsedAttribute[] = [];

    for (const attribute of parsed.attributes) {
      const name = attribute.name.toLowerCase();

      // Event handlers and embedded documents never survive.
      if (name.startsWith("on") && name.length > 2) continue;
      if (name === "srcdoc") continue;

      if (name === "style" && attribute.value !== null) {
        const css = sanitizeCss(attribute.value, allowRemoteImages);
        if (css.hasRemoteContent) hasRemoteContent = true;

        attributes.push({ name: attribute.name, value: css.css });
        continue;
      }

      if (URL_ATTRIBUTES.has(name) && attribute.value !== null) {
        if (isDangerousUrl(attribute.value)) continue;

        if (isRemoteAttribute(parsed.name, name)) {
          const remote =
            name === "srcset"
              ? isRemoteSrcset(attribute.value)
              : isRemoteUrl(attribute.value);

          if (remote) {
            hasRemoteContent = true;
            if (!allowRemoteImages) continue;
          }
        }
      }

      if (name === "ping") continue;

      attributes.push(attribute);
    }

    return serializeOpenTag(parsed.name, attributes, parsed.selfClosing);
  });

  return { markup: sanitized, hasRemoteContent };
}

interface NormalizedDocument {
  body: string;
  styles: string[];
}

function normalizeDocument(sourceHtml: string): NormalizedDocument {
  let html = sourceHtml;

  html = html.replace(/<!doctype[^>]*>/gi, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // Remove executable/embedded elements before touching anything else, so a
  // style block hidden inside a script is never lifted into the document.
  html = removeElementsWithContent(html, ["script", "iframe", "object", "embed"]);

  const styles: string[] = [];
  html = html.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi,
    (_, css: string) => {
      styles.push(css);
      return "";
    },
  );

  // A full document keeps only its body; the controlled head is ours.
  html = html.replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, "");
  html = html.replace(/<\/?head\b[^>]*>/gi, "");
  html = html.replace(/<\/?html\b[^>]*>/gi, "");
  html = html.replace(/<\/?body\b[^>]*>/gi, "");

  // Forms are unwrapped; their controls are dropped entirely.
  html = removeTags(html, ["form"]);
  html = removeTags(html, ["input", "link", "meta", "base"]);

  return { body: html.trim(), styles };
}

const MESSAGE_DOCUMENT_BASE_STYLES = `
:root { color-scheme: light; }
html { background: #ffffff; }
body {
  margin: 0;
  padding: 16px;
  background: #ffffff;
  color: #1a1a1a;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: break-word;
}
p {
  margin: 0 0 0.75em;
}
p:last-child {
  margin-bottom: 0;
}
body > :last-child {
  margin-bottom: 0;
}
h1, h2, h3, h4, h5, h6 {
  margin: 1em 0 0.5em;
  font-weight: 600;
  line-height: 1.3;
}
h1 { font-size: 1.35em; }
h2 { font-size: 1.2em; }
h3 { font-size: 1.1em; }
h4, h5, h6 { font-size: 1em; }
ul, ol {
  margin: 0 0 0.75em;
  padding-left: 1.25em;
}
li {
  margin: 0.15em 0;
}
li > ul, li > ol {
  margin: 0.15em 0 0;
}
blockquote {
  margin: 0 0 0.75em;
  padding: 0.15em 0 0.15em 0.75em;
  border-left: 2px solid #d8d8d8;
  color: #4a4a4a;
}
hr {
  margin: 1em 0;
  border: 0;
  border-top: 1px solid #e2e2e2;
}
img {
  height: auto;
}
img, table {
  max-width: 100%;
}
table {
  border-collapse: collapse;
}
a {
  color: #0b5fff;
}
pre {
  margin: 0 0 0.75em;
  white-space: pre-wrap;
}
code, pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.95em;
}
`.trim();

/**
 * The only script that runs inside a message document. It reports the content
 * height and forwards safe link clicks to the mailbox. Its SHA-256 is pinned in
 * the CSP and asserted by a unit test.
 */
export const MESSAGE_DOCUMENT_SCRIPT = `(function () {
  function post(payload) {
    window.parent.postMessage(payload, "*");
  }

  function reportHeight() {
    var body = document.body;
    if (!body) return;

    post({
      type: "message-height",
      height: Math.ceil(body.getBoundingClientRect().height)
    });
  }

  function handleClick(event) {
    var node = event.target;
    while (node && node.nodeName !== "A") {
      node = node.parentNode;
    }
    if (!node || typeof node.getAttribute !== "function") return;

    var href = (node.getAttribute("href") || "").trim();
    if (!/^(https?:|mailto:)/i.test(href)) return;

    event.preventDefault();
    post({ type: "message-link", href: href });
  }

  document.addEventListener("click", handleClick);

  if (typeof ResizeObserver === "function") {
    var observer = new ResizeObserver(reportHeight);
    if (document.body) observer.observe(document.body);
  }

  window.addEventListener("load", reportHeight);

  var images = document.images || [];
  for (var index = 0; index < images.length; index += 1) {
    var image = images[index];
    if (!image.complete) image.addEventListener("load", reportHeight);
    image.addEventListener("error", reportHeight);
  }

  reportHeight();
})();`;

export const MESSAGE_DOCUMENT_SCRIPT_HASH =
  "kRdd49E4yYpxQFWkFrZcNC/6Jc4V5bJLs43j/+anLhA=";

function contentSecurityPolicy(allowRemoteImages: boolean): string {
  return [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    allowRemoteImages ? "img-src data: https:" : "img-src data:",
    "font-src 'none'",
    "media-src 'none'",
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    `script-src 'sha256-${MESSAGE_DOCUMENT_SCRIPT_HASH}'`,
  ].join("; ");
}

/**
 * Build the document rendered inside the message iframe. The source is treated
 * as hostile: scripts, frames, forms, event handlers and dangerous URLs are
 * removed, remote content is neutralized unless explicitly revealed, and the
 * only surviving script is the pinned height/link reporter.
 */
export function buildMessageDocument(
  sourceHtml: string,
  options: MessageDocumentOptions = {},
): MessageDocument {
  const allowRemoteImages = options.allowRemoteImages === true;
  const normalized = normalizeDocument(sourceHtml ?? "");
  const body = sanitizeMarkup(normalized.body, allowRemoteImages);
  const styles = normalized.styles.map((css) =>
    sanitizeCss(css, allowRemoteImages),
  );
  const hasRemoteContent =
    body.hasRemoteContent ||
    styles.some((style) => style.hasRemoteContent);

  const emailStyles = styles
    .map((style) => style.css)
    .filter((css) => css.trim().length > 0)
    .join("\n");

  const html = [
    "<!doctype html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(
      allowRemoteImages,
    )}">`,
    `<style>${MESSAGE_DOCUMENT_BASE_STYLES}</style>`,
    emailStyles ? `<style>${emailStyles}</style>` : "",
    "</head>",
    "<body>",
    body.markup,
    `<script>${MESSAGE_DOCUMENT_SCRIPT}</script>`,
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("");

  return { html, hasRemoteContent };
}

/** Narrow a posted message to a height report. */
export function isMessageHeightMessage(
  value: unknown,
): value is { type: "message-height"; height: number } {
  if (typeof value !== "object" || value === null) return false;

  const message = value as Record<string, unknown>;

  return (
    message.type === "message-height" &&
    typeof message.height === "number" &&
    Number.isFinite(message.height) &&
    message.height > 0
  );
}

/** Narrow a posted message to a safe outbound link. */
export function isMessageLinkMessage(
  value: unknown,
): value is { type: "message-link"; href: string } {
  if (typeof value !== "object" || value === null) return false;

  const message = value as Record<string, unknown>;

  return (
    message.type === "message-link" &&
    typeof message.href === "string" &&
    /^(https?:|mailto:)/i.test(message.href.trim())
  );
}

export type MessageDocumentEvent =
  | { type: "height"; height: number }
  | { type: "link"; href: string }
  | null;

/**
 * Resolve a posted message only when it came from the expected frame and has a
 * valid shape. `event.origin` is deliberately ignored: a sandboxed frame sends
 * `"null"` and the window reference is the reliable identity.
 */
export function resolveMessageDocumentEvent(
  source: unknown,
  frameWindow: Window | null | undefined,
  data: unknown,
): MessageDocumentEvent {
  if (!frameWindow || source !== frameWindow) return null;

  if (isMessageHeightMessage(data)) {
    return { type: "height", height: data.height };
  }

  if (isMessageLinkMessage(data)) {
    return { type: "link", href: data.href };
  }

  return null;
}
