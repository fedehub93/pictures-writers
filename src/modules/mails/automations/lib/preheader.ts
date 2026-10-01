/**
 * Preheader (inbox preview text) support for the Send Email node.
 *
 * Transactional providers (SendGrid v3, Resend `emails.send`) expose no native
 * preview-text field; the inbox summary is the first text in the message body.
 * We therefore inject a hidden element at the top of the HTML, followed by
 * filler the client keeps in the preview instead of pulling real body copy.
 */

const PREHEADER_STYLE =
  "display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;";

const PREHEADER_FILLER = "&nbsp;&zwnj;".repeat(50);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Injects the preview text as a hidden preheader at the start of the message
 * body: right after the opening `<body>` tag for a full document, or prepended
 * for an HTML fragment. Blank preview text leaves the HTML untouched.
 */
export function applyPreheader(html: string, previewText?: string): string {
  const text = previewText?.trim();

  if (!text) {
    return html;
  }

  const span = `<span style="${PREHEADER_STYLE}">${escapeHtml(text)}${PREHEADER_FILLER}</span>`;
  const bodyTag = html.match(/<body[^>]*>/i);

  if (bodyTag?.index !== undefined) {
    const insertAt = bodyTag.index + bodyTag[0].length;
    return html.slice(0, insertAt) + span + html.slice(insertAt);
  }

  return span + html;
}
