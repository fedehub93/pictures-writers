# 02: HTML-derived text part and previews

**What to build:** The plain-text alternative attached to outbound mail and the snippets shown in the Inbox and Sent lists are derived from the composed HTML, so lists, links and paragraphs survive outside the CMS and historical messages get correct previews without a migration.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A single framework-free serializer turns HTML into readable plain text: one line per block, `- ` per unordered item, a running number per ordered list (nested lists included), link label followed by its URL, decoded entities, collapsed whitespace and no triple blank lines.
- [x] The serializer runs without DOM APIs, so it works on the server and in the browser, and it replaces the current HTML stripper used for text fallback.
- [x] Snippet derivation prefers the serializer on `bodyHtml` and falls back to `bodyText`, so historical rows with stored HTML preview correctly with no backfill.
- [x] `conversations.sendReply` and `conversations.sendNew` no longer accept `bodyText`; both derive it from `bodyHtml` and the provider receives the composed HTML unchanged plus the derived text part.
- [x] The reply and new-message composers submit only the editor HTML and keep the current empty-message validation.
- [x] Tests: list/link/entity/whitespace fixtures for the serializer; preview preferring HTML over stale `bodyText`; service-level send tests asserting the provider gets the original HTML and a text part containing list markers.
- [x] `npm run lint` and `npx tsc --noEmit` pass.

## Comments

Delivered:

- `src/modules/mails/lib/html-to-text.ts` — framework-free HTML serializer covering block boundaries, unordered and ordered lists (including nesting and `start`), links, image alt text, tables, entities, whitespace collapsing and stray `<` handling.
- `src/modules/mails/lib/html-entities.ts` — expanded common named-entity decoding shared by the serializer and the message document builder.
- `src/modules/mails/conversations/lib/format.ts` — body and preview derivation now prefer HTML-derived text and fall back to stored `bodyText`.
- `src/modules/mails/conversations/lib/send-one-to-one.ts` and `send-new-message.ts` — derive the text part from `bodyHtml`; the provider receives the original HTML plus derived plain text.
- `conversations.sendReply` / `conversations.sendNew` schemas and procedures — `bodyText` removed from the input contract; composers submit only editor HTML while keeping the empty-message check.
- Tests in `html-to-text.test.ts`, `format.test.ts`, the send use-case tests, `send-reply-e2e.test.ts` and the router test.

Verified: full suite green (190 files / 1575 tests), `npx tsc --noEmit` clean, scoped ESLint clean for every touched file. Full-repo `npm run lint` still reports pre-existing errors in untouched files.
