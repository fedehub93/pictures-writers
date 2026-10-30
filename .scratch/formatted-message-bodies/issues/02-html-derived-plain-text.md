# 02: HTML-derived text part and previews

**What to build:** The plain-text alternative attached to outbound mail and the snippets shown in the Inbox and Sent lists are derived from the composed HTML, so lists, links and paragraphs survive outside the CMS and historical messages get correct previews without a migration.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A single framework-free serializer turns HTML into readable plain text: one line per block, `- ` per unordered item, a running number per ordered list (nested lists included), link label followed by its URL, decoded entities, collapsed whitespace and no triple blank lines.
- [ ] The serializer runs without DOM APIs, so it works on the server and in the browser, and it replaces the current HTML stripper used for text fallback.
- [ ] Snippet derivation prefers the serializer on `bodyHtml` and falls back to `bodyText`, so historical rows with stored HTML preview correctly with no backfill.
- [ ] `conversations.sendReply` and `conversations.sendNew` no longer accept `bodyText`; both derive it from `bodyHtml` and the provider receives the composed HTML unchanged plus the derived text part.
- [ ] The reply and new-message composers submit only the editor HTML and keep the current empty-message validation.
- [ ] Tests: list/link/entity/whitespace fixtures for the serializer; preview preferring HTML over stale `bodyText`; service-level send tests asserting the provider gets the original HTML and a text part containing list markers.
- [ ] `npm run lint` and `npx tsc --noEmit` pass.

## Comments
