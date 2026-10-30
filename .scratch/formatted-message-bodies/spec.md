Status: ready-for-agent
Labels: ready-for-agent

# Formatted message bodies in the mailbox

## Problem Statement

Outbound mail leaves the CMS correctly formatted, but it comes back plain when read in the admin. Opening a conversation shows only the text part of each message: bold, italic, links, alignment and lists disappear, and a bullet list after a paragraph can collapse into a blank gap because the text part is derived from the editor with a lossy conversion. Received mail has the same problem, so every message in the thread is read as plain text.

The HTML is generated, sent and stored correctly on `EmailMessage.bodyHtml`. The defect is only in how the mailbox renders the body: the thread view prefers the stored text part and otherwise strips the HTML. The stored text part is itself lossy because it is produced with the editor's plain-text extraction, which drops list markers and all inline formatting. Previews in the Inbox and Sent lists inherit the same lossy text, including for messages that already have proper HTML.

## Solution

Render each message body from its stored HTML inside a sandboxed iframe, in both directions, so what was composed is what is read. Keep a plain-text fallback for messages with no HTML. Derive the stored plain-text part from the HTML with a serializer that preserves lists and links, and derive list previews from the HTML as well, so historical messages read correctly without a migration.

Remote content is blocked by default and can be revealed per message with a "Show images" control. Email styling stays inside the iframe; the app styling never leaks in and the email styling never leaks out.

## User Stories

1. As a backoffice user, I want the message I composed to look the same when I reopen it from Sent, so that I can trust what the recipient received.
2. As a backoffice user, I want bold, italic, underline and strikethrough preserved, so that emphasis is readable.
3. As a backoffice user, I want bulleted and numbered lists preserved, so that structured instructions stay structured.
4. As a backoffice user, I want links preserved and clickable, so that I can follow them from the thread.
5. As a backoffice user, I want paragraph spacing and line breaks preserved, so that the message reads as it was written.
6. As a backoffice user, I want received mail to render formatted too, so that I read replies as their sender intended.
7. As a backoffice user, I want the whole message readable without a nested scrollbar, so that reading a long message is not awkward.
8. As a backoffice user, I want remote images blocked by default, so that senders cannot track when I open a message.
9. As a backoffice user, I want a "Show images" control per message, so that I can reveal them deliberately when I need them.
10. As a backoffice user, I want the message to grow when I reveal images, so that nothing is clipped.
11. As a backoffice user, I want email styling confined to the message, so that a badly built email cannot break the inbox layout.
12. As a backoffice user, I want links to open in a new tab, so that I do not lose the thread.
13. As a backoffice user, I want a message with no HTML to still be readable as text, so that nothing becomes blank.
14. As a backoffice user, I want the Inbox and Sent previews to reflect the real message text, so that I can triage without opening.
15. As a backoffice user, I want historical messages to display correctly, so that the fix applies retroactively.
16. As a backoffice user, I want collapsed messages to stay cheap, so that opening a long thread stays fast.
17. As a backoffice user, I want the message body to be readable in light and dark admin themes, so that the thread never becomes unreadable.
18. As a backoffice user, I want a text-only recipient to receive a sensible plain-text alternative, so that lists and links are not lost outside the CMS.
19. As a developer, I want a single module that turns stored HTML into a safe document and into plain text, so that rendering, previews and sending cannot drift apart.
20. As a developer, I want the email HTML treated as untrusted at every boundary, so that a hostile message cannot reach the app origin.

## Implementation Decisions

- **One shared, framework-free module owns body transformation.** It exposes a plain-text serializer, a preview derivation and a message-document builder. It uses no DOM APIs so it runs identically during server rendering and in the browser.
- **Plain text is derived from HTML, not from the editor.** The serializer emits one block per paragraph, `- ` for unordered items and a running number per ordered list, link labels followed by their URL, decoded entities and collapsed whitespace. It replaces the current HTML stripper for fallback rendering and previews.
- **Previews prefer HTML.** Snippet derivation uses the serializer on `bodyHtml` and falls back to `bodyText`. No migration or backfill: historical rows have `bodyHtml`, so old previews and old bodies improve automatically.
- **The mailbox renders a sandboxed iframe.** When a message has HTML, the expanded body is an `iframe` with `sandbox="allow-scripts"`, deliberately without `allow-same-origin`, `allow-forms`, `allow-top-navigation` or `allow-popups`. The app origin is unreachable from the document.
- **CSP is delivered inside the document.** `default-src 'none'`, `style-src 'unsafe-inline'` (stored emails rely on inline and embedded styles), `img-src data:` while images are blocked and `img-src data: https:` when revealed, `font-src 'none'`, `media-src 'none'`, `connect-src 'none'`, `form-action 'none'`, `base-uri 'none'`, `object-src 'none'`, `frame-src 'none'`, and `script-src` limited to the hash of the one injected script.
- **Exactly one script runs inside the document.** It reports content height to the parent with a `ResizeObserver` plus a load handler and re-reports after images finish loading. It also intercepts anchor clicks for `http`, `https` and `mailto`, and posts the URL to the parent instead of navigating the frame. The CSP hash is a constant, and a unit test recomputes the hash from the injected source so it cannot silently drift.
- **All other scripts are removed.** The builder strips `script`, `iframe`, `object`, `embed`, `form`, `input`, `link` and `meta` elements, `on*` attributes, and `javascript:`, `vbscript:` and `data:text/html` URLs.
- **Full documents are normalized.** Received mail may be a fragment or a complete document; the builder unwraps `html`/`head`/`body`, lifts inline `style` blocks into the controlled document and drops everything else from the head.
- **Remote content is neutralized, not merely blocked.** When images are off, `src`, `srcset`, `poster` and `background` references pointing at remote origins are removed so the browser shows no broken-image placeholders, and CSS `url()` references to remote origins are stripped. Revealing images rebuilds the document with those references restored. The builder reports whether remote content was present so the control only appears when it can do something.
- **Height is fully automatic.** The parent accepts only messages whose `source` is the iframe's window, validates the payload shape, and sets the frame height to the reported content height. There is no cap and no internal scrollbar; the thread remains the only scroll container. A resize never forces the thread to scroll.
- **Revealing images is per message and in memory.** A local state per rendered message resets on unmount; no preference is persisted.
- **The frame is self-styled.** A fixed base stylesheet supplies a white background, a neutral sans-serif stack at 14px with 1.6 line height, `max-width: 100%` for images and tables, and word wrapping. The admin theme is never inherited, so dark mode cannot make sender colours unreadable.
- **`MessageItem` chooses the rendering.** Expanded messages with non-empty `bodyHtml` render the sandboxed body; expanded messages without HTML keep the current plain-text path; collapsed messages render no iframe at all, so long threads stay cheap.
- **Send paths derive the text part server-side.** `sendReply` and `sendNew` no longer accept `bodyText`; both use cases derive it from `bodyHtml` through the serializer before calling the provider. The composers submit only the editor HTML and keep the existing emptiness validation.
- **Accessibility.** The iframe carries a descriptive title naming the sender, and the images control is a button with `aria-pressed` and a visible label.
- **No schema or migration changes.** `EmailMessage.bodyHtml` and `bodyText` already exist and are already selected by the conversation and sent-message queries.

### API contract

- `conversations.sendReply` — input drops `bodyText`; the use case derives it from `bodyHtml`.
- `conversations.sendNew` — input drops `bodyText`; same derivation.
- `conversations.getOne` and `conversations.getSentMessages` — unchanged shape; `bodyHtml` is already returned.
- No new procedure is introduced.

### Documentation

An ADR records the reversal of the "the inbox never renders email HTML" stance, comparing the sandboxed iframe, a sanitizer and a plain-text-only approach. The domain glossary gains the terms for the HTML part, the text part and remote content.

## Testing Decisions

- Tests assert external behaviour only: the markup a user receives and the payload a provider receives. No test reaches into component internals or asserts CSS rules line by line.
- The message-document builder is the primary seam: a table-driven test feeds hostile and ordinary HTML and asserts that scripts, handlers, frames and remote references are neutralized, that the CSP and base styles are present, and that remote references return when images are revealed.
- A dedicated test recomputes the SHA-256 of the injected script and asserts it equals the hash embedded in the CSP, so the document can never ship a blocked (or silently widened) script.
- The serializer is tested on the same fixtures used for previews, covering unordered and ordered lists, nested lists, links, entities, line breaks and whitespace collapsing.
- The send use cases are tested at the existing service seam: a composer payload with only HTML reaches the provider with the original HTML and a derived text part containing list markers.
- Rendering tests extend the existing `renderToStaticMarkup` conversation tests: an outbound and an inbound formatted message both render a sandboxed frame whose `srcdoc` carries the CSP and the scrubbed markup, a message without HTML still renders its text, and the images control appears only when remote content exists.
- Prior art: the conversation rendering tests, the `format` unit tests and the inbound/new-message/send-reply service tests already in the module.

## Out of Scope

- Inline `cid:` images and storing `Content-ID` on attachments; a received inline image stays unresolved and is handled by a separate ticket.
- Images proxy or server-side fetching of remote content.
- Sanitizing with a third-party library such as DOMPurify; isolation is the browser's sandbox.
- Theming email bodies to match light or dark admin mode.
- Any database migration, backfill or re-fetch of message bodies from the provider.
- Rendering HTML email previews in marketing screens; the template preview path is unchanged.
- Quoted replies, reply headers and printing.
- Changes to the composer's formatting capabilities.

## Further Notes

- The first render of a message with images blocked is the safe default; the height is re-measured after a reveal, so enabling images never clips the message.
- Because the iframe has no same-origin access, `event.origin` arrives as `"null"`; the parent must identify the sender by comparing `event.source` with the frame's `contentWindow` instead of trusting the origin string.
- Historical outbound messages already carry HTML, so the Sent view becomes correct as soon as the rendering lands, without any data work.
