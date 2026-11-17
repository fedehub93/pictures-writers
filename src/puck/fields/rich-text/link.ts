import { mergeAttributes } from "@tiptap/core";
import { Link } from "@tiptap/extension-link";
import type { DOMOutputSpec } from "@tiptap/pm/model";

/**
 * Protocols the inline link mark is allowed to produce.
 *
 * Relative URLs (`/blog/`, `#section`) are still valid: they carry no scheme,
 * so they never reach the protocol check. Anything else, such as `javascript:`
 * or `data:`, stays plain text instead of becoming an anchor.
 */
export const RICH_TEXT_LINK_PROTOCOLS = [
  "http",
  "https",
  "mailto",
  "tel",
] as const;

const ALLOWED_URI_PATTERN = new RegExp(
  `^(?:(?:${RICH_TEXT_LINK_PROTOCOLS.join("|")}):|[^a-z]|[a-z0-9+.\\-]+(?:[^a-z+.\\-:]|$))`,
  "i",
);

/**
 * Strict href allow-list for the rich text link mark.
 *
 * TipTap's `protocols` option only *adds* to its built-in list (which also
 * accepts `ftp:`, `sms:` and friends), so the mark overrides `isAllowedUri`
 * with this predicate to keep exactly the four safe schemes plus relative
 * URLs. Whitespace is stripped first so `java\nscript:` cannot smuggle a
 * scheme past the check.
 */
export const isSafeRichTextHref = (href: unknown): boolean => {
  if (typeof href !== "string") return false;

  const normalized = href.replace(/[\0\s]/g, "");

  return normalized.length > 0 && ALLOWED_URI_PATTERN.test(normalized);
};

/**
 * Link mark shared by the Puck rich text editor and the public render config.
 *
 * `HTMLAttributes` clears TipTap's default `target="_blank"` and
 * `rel="noopener noreferrer nofollow"` (null overrides the value `configure`
 * deep-merges): the anchor only carries the attributes the author actually
 * wrote. Leaving the defaults in place would make the canvas and the public
 * site disagree, and would add a `target` the author never chose.
 */
export const RichTextLinkMark = Link.extend({
  renderHTML({ HTMLAttributes }): DOMOutputSpec {
    // A mark that slipped into stored JSON with a disallowed href must not
    // become an anchor on the public site. Keep its text, drop the link.
    if (!isSafeRichTextHref(HTMLAttributes.href)) {
      return ["span", 0];
    }

    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
}).configure({
  openOnClick: false,
  enableClickSelection: false,
  protocols: [...RICH_TEXT_LINK_PROTOCOLS],
  isAllowedUri: (href) => isSafeRichTextHref(href),
  HTMLAttributes: {
    target: null,
    rel: null,
    class: null,
  },
});
