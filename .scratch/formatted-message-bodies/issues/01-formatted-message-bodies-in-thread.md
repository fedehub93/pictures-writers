# 01: Formatted message bodies in the thread

**What to build:** Opening any message that has stored HTML shows it formatted — bold, lists, links, alignment and spacing — in both Sent and Received, without touching the rest of the mailbox. Bodies are isolated from the app, remote images stay blocked until revealed per message, links open in a new tab, and the frame grows to fit the whole body. Messages without HTML keep falling back to text, and collapsed messages stay cheap.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A message document builder turns untrusted stored HTML into a self-contained document: it normalizes fragments and full documents, strips `script`/`iframe`/`object`/`embed`/`form`/`input`/`link`/`meta`, removes `on*` attributes and `javascript:`/`vbscript:`/`data:text/html` URLs, and keeps inline styles.
- [x] The document carries a restrictive CSP (`default-src 'none'`, `style-src 'unsafe-inline'`, `img-src data:` while blocked and `data: https:` when revealed, no fonts/media/connect/frames, `script-src` limited to a pinned hash) and a fixed base stylesheet: white background, neutral sans-serif 14px / 1.6, images and tables capped at full width.
- [x] Remote `src`, `srcset`, `poster` and CSS `url()` references are neutralized while images are blocked, so no broken-image placeholders appear, and restored when revealed; the builder reports whether remote content was present.
- [x] Exactly one script runs inside the document: it reports content height on `ResizeObserver` and window load and forwards `http`/`https`/`mailto` link clicks to the parent. A test recomputes its SHA-256 and asserts it matches the CSP hash.
- [x] The body component renders an iframe with `sandbox="allow-scripts"` only, a descriptive title, no cap and no internal scrollbar, and re-measures after images are revealed.
- [x] Height and link messages are accepted only when `event.source` is the frame's `contentWindow` and the payload shape is valid; `event.origin` is never trusted. Links open in a new tab with `noopener,noreferrer`.
- [x] A labelled "Show images" control with `aria-pressed` appears only when remote content exists; the reveal is per message and resets on unmount.
- [x] The thread renders the formatted body for expanded messages with non-empty HTML, keeps the text path when HTML is missing, renders no iframe for collapsed messages, and preserves expansion state, scroll-to-newest, attachments and the Sent/Received badge.
- [x] Tests: hostile and ordinary HTML fixtures for every stripped element, attribute and scheme; neutralization and restoration of remote references; CSP and base styles present; hash pinning; outbound and inbound formatted messages render a sandboxed frame whose `srcdoc` carries the scrubbed markup; a message without HTML still reads as text; the images control appears only with remote content.
- [x] `npm run lint`, `npx tsc --noEmit` and the conversations rendering tests pass.

## Comments

Delivered:

- `src/modules/mails/lib/message-document.ts` — framework-free builder for the sandboxed message document: fragment/full-document normalization, element and attribute sanitization, dangerous-URL removal, CSS `url()` handling, remote-content neutralization/restoration, CSP assembly, base styles and the single pinned height/link script.
- `src/modules/mails/lib/html-entities.ts` — shared entity decoder used by the builder and the existing text fallback.
- `src/modules/mails/conversations/ui/components/message-body.tsx` — sandboxed iframe with `allow-scripts`, source-validated height/link messages via `resolveMessageDocumentEvent`, new-tab links with `noopener,noreferrer`, and a per-message "Show images" control.
- `src/modules/mails/conversations/ui/components/message-item.tsx` — expanded messages with HTML render the sandboxed body; messages without HTML keep the text fallback; collapsed messages render no frame.
- Tests in `message-document.test.ts` and the extended `conversations-rendering.test.tsx` cover hostile and ordinary markup, CSP/base styles, pinned hash, remote neutralization/restore, source validation, inbound/outbound frames, text fallback and the images control.
- Verified: full suite green (189 files / 1558 tests), `npx tsc --noEmit` clean, scoped ESLint clean.

Committed in `7f639ff4` (`feat(mailbox): render formatted message bodies in a sandboxed frame`). Tickets 02 (HTML-derived text part/previews) and 03 (ADR/glossary) remain separate.
