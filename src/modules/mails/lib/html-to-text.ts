import { decodeHtmlEntities } from "./html-entities";

/**
 * Serialize stored email HTML into readable plain text. This module is
 * framework-free on purpose: it runs on the server (to derive the text part of
 * outbound mail) and in the browser (to preview messages), so it must not touch
 * the DOM.
 */

const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "body",
  "dd",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "main",
  "nav",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "tfoot",
  "thead",
  "tr",
]);

const ELEMENT_WITH_CONTENT = /<(script|style|head|title|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const LONE_ELEMENT = /<\/?(?:script|style|head|title|noscript)\b[^>]*>/gi;
const TOKEN = /<(?:[^<>"']|"[^"]*"|'[^']*')*>|[^<]+|</g;

interface ListState {
  ordered: boolean;
  index: number;
}

interface AnchorState {
  href: string;
  text: string;
}

function attributeValue(tag: string, name: string): string | null {
  const pattern = new RegExp(
    `\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : null;
}

function isDangerousHref(href: string): boolean {
  const inspected = decodeHtmlEntities(href)
    .replace(/[\u0000-\u0020\u007f]+/g, "")
    .toLowerCase();

  return inspected.startsWith("javascript:") || inspected.startsWith("vbscript:");
}

function orderedListStart(tag: string): number {
  const raw = attributeValue(tag, "start");
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  return Number.isFinite(parsed) ? parsed - 1 : 0;
}

/** Normalize the accumulated raw text into lines. */
function normalize(raw: string): string {
  return decodeHtmlEntities(raw)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v\u00a0]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToPlainText(html: string): string {
  if (!html) return "";

  const source = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(ELEMENT_WITH_CONTENT, "")
    .replace(LONE_ELEMENT, "");

  const tokens = source.match(TOKEN) ?? [];
  const listStack: ListState[] = [];
  let anchor: AnchorState | null = null;
  let raw = "";

  const lastLine = () => {
    const index = raw.lastIndexOf("\n");
    return index === -1 ? raw : raw.slice(index + 1);
  };

  const isMarkerOnlyLine = () => /^(?:- |\d+\. )\s*$/.test(lastLine());

  const breakLine = () => {
    if (raw.length > 0 && !raw.endsWith("\n")) raw += "\n";
  };

  const openBlock = () => {
    if (raw.length === 0 || raw.endsWith("\n")) return;
    if (isMarkerOnlyLine()) return;
    raw += "\n";
  };

  const appendText = (text: string) => {
    const collapsed = text.replace(/\s+/g, " ");
    if (anchor) anchor.text += collapsed;
    else raw += collapsed;
  };

  const flushAnchor = () => {
    if (!anchor) return;

    const { href, text } = anchor;
    anchor = null;

    const label = text.replace(/\s+/g, " ").trim();
    const safeHref = href && !isDangerousHref(href) ? href.trim() : "";

    if (label) {
      raw += label;
      if (safeHref && label !== safeHref) raw += ` (${safeHref})`;
    } else if (safeHref) {
      raw += safeHref;
    }
  };

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      appendText(token);
      continue;
    }

    const nameMatch = token.match(/^<\s*\/?\s*([a-zA-Z][\w:-]*)/);
    if (!nameMatch) {
      appendText(token);
      continue;
    }

    const name = nameMatch[1]!.toLowerCase();
    const closing = /^<\s*\//.test(token);

    if (name === "br") {
      if (anchor) anchor.text += " ";
      else raw += "\n";
      continue;
    }

    if (name === "hr") {
      breakLine();
      continue;
    }

    if (name === "img") {
      const alt = attributeValue(token, "alt");
      if (alt) appendText(` ${alt} `);
      continue;
    }

    if (name === "a") {
      if (closing) {
        flushAnchor();
      } else if (!anchor) {
        anchor = { href: attributeValue(token, "href") ?? "", text: "" };
      }
      continue;
    }

    if (anchor) continue;

    if (name === "ul" || name === "ol") {
      if (closing) {
        breakLine();
        listStack.pop();
      } else {
        breakLine();
        listStack.push({
          ordered: name === "ol",
          index: name === "ol" ? orderedListStart(token) : 0,
        });
      }
      continue;
    }

    if (name === "li") {
      if (closing) {
        breakLine();
        continue;
      }

      breakLine();

      const list = listStack[listStack.length - 1];
      if (list?.ordered) {
        list.index += 1;
        raw += `${list.index}. `;
      } else {
        raw += "- ";
      }
      continue;
    }

    if (BLOCK_TAGS.has(name)) {
      if (closing) breakLine();
      else openBlock();
      continue;
    }

    if (closing && (name === "td" || name === "th")) {
      raw += " ";
    }
  }

  flushAnchor();

  return normalize(raw);
}
