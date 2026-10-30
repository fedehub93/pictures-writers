# 04: Message sheet and thread scroll

**What to build:** The formatted body stops looking like a white rectangle pasted into the card: it becomes an inset "sheet" aligned with the message header, with rounded corners, a hairline border, inner padding and a normalized typographic rhythm, and the remote-images control becomes a muted bar above it. The thread scrolls in one native container whose scrollbar tracks the content, lands on the newest message once the frames have measured themselves, and never jumps when the reader is somewhere else in the thread.

**Blocked by:** None.

**Status:** resolved

## Decisions

- **Light paper in both themes (option A).** The email surface stays white and follows the sender's colours; the admin never inverts it, so a dark-mode admin sees a light sheet on the card surface. Dark bodies ("smart dark mode") are a separate decision, not part of this ticket.
- **Sheet chrome.** The body is inset with the message's own horizontal padding (so it lines up with the avatar's edge rather than being indented to the summary column, which would eat 52px of an email's 600px width on small screens), wrapped in `rounded-lg border` (plus a subtle ring in dark mode) and clipped, with 16px of padding inside the document.
- **Normalized typography.** The document base styles set block spacing (`p`, headings, lists, `blockquote`, `pre`, `hr`) while everything the email declares explicitly still wins. Images keep their inline display and only gain `height: auto` and a full-width cap, so inline icons in signatures and quoted text do not get pushed onto their own lines. Sizes stay 14px / 1.6, the font stack stays the system one.
- **Images bar.** The floating "Show images" button becomes a muted bar above the sheet (icon + "Remote images are blocked for this message." / "…are shown…" + a "Show images" / "Hide images" toggle), still only rendered when remote content exists and still carrying `aria-pressed`.
- **Native thread scrollbar.** The thread viewport is a plain `overflow-y-auto` container styled with the same thin rail as the sidebar, so the thumb is drawn by the browser and cannot lag behind the content. `ScrollArea` stays in place for the inbox and sent lists.
- **Measured heights are cached.** A small module-level cache keyed by message id and images state lets a re-expanded or re-rendered message paint at its real height instead of collapsing to zero. The cache is bounded and self-correcting: a width change re-measures and overwrites. Toggling images keeps the current height as the placeholder until the new measurement arrives, so revealing them never collapses the sheet first.
- **The frame reports shrinkable height.** The injected script reports `body.getBoundingClientRect().height` instead of the document's `scrollHeight`, which was pinned to the frame's own viewport height and could therefore only ever grow.
- **Follow the bottom only when at the bottom.** The detail keeps a "pinned to bottom" ref: opening a conversation pins, new messages re-pin only while the reader is near the bottom, expanding an earlier message or any deliberate pointer interaction inside the thread unpins, and a `ResizeObserver` on the content re-pins while pinned so the first open lands on the newest message once every frame has measured.
- **Scroll anchoring stays native (deviation from the plan).** `overflow-anchor` was left at its browser default rather than disabled: with the height cache and explicit pinning, native anchoring is what keeps the reading position stable when an earlier message finishes measuring.

## Checklist

- [x] `buildMessageDocument` base styles: 16px body padding, block rhythm for `p`, headings, lists, `blockquote`, `hr`, `pre`, `code`, images as blocks capped at full width, unchanged white background, 14px / 1.6 and word wrapping.
- [x] The injected script reports the body's rect height (shrinkable) and still reports on `ResizeObserver`, load and image load/error; the pinned CSP hash is recomputed.
- [x] `message-height-cache.ts`: bounded get/set/clear, key includes the images state.
- [x] `thread-scroll.ts`: `isNearBottom` predicate used by the detail.
- [x] `MessageBody` renders the sheet wrapper (inset, rounded, hairline border, clipped), the muted images bar above it, a 64px frame until the first measurement, and caches each reported height.
- [x] `MessageItem` passes the message id to the body and insets the body like the header.
- [x] `ConversationDetail` uses a native scroll viewport with the thin rail, pins to the newest message on open and on new messages only when already near the bottom, and unpins on an explicit expand/collapse.
- [x] `.mail-thread-scroll` rail added to `(admin)/admin.css` next to the sidebar rail.
- [x] Tests: base-style assertions extended, `message-height-cache` and `isNearBottom` unit tests added, document/rendering suites updated.
- [x] ADR-0033 records the sheet chrome, the normalized typography and the images bar; `CONTEXT.md` gains "message sheet".
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run test:run` pass.

## Manual checklist (layout cannot be asserted in jsdom)

- [ ] Open a long conversation: it lands on the newest message with no visible jump while the frames measure.
- [ ] Scroll with the wheel: the thumb moves with the content and stops where the content is.
- [ ] With the thread scrolled up, a new inbound message does not move the view.
- [ ] Expand an earlier message: the message being read stays where it is.
- [ ] Collapse and re-expand a message: no zero-height flash.
- [ ] Toggle images on and off: the sheet grows and shrinks with the content.
- [ ] Light and dark admin: the sheet is inset, rounded, and the images bar matches the theme.

## Comments

Delivered:

- `src/modules/mails/lib/message-document.ts` — base styles now pad the sheet (16px) and normalize the block rhythm (`p`, headings, lists, `blockquote`, `hr`, `img`, `code`), keeping the white background and 14px / 1.6; the injected script reports `body.getBoundingClientRect().height`, so the frame can now shrink instead of ratcheting on its own `scrollHeight`; the CSP hash was recomputed and re-pinned.
- `src/modules/mails/lib/__tests__/message-document.test.ts` — asserts the padding and rhythm, and asserts the body-rect measurement so the shrinkable height cannot regress silently.
- `src/modules/mails/conversations/lib/message-height-cache.ts` — bounded, self-correcting cache keyed by message id and images state.
- `src/modules/mails/conversations/lib/thread-scroll.ts` — `isNearThreadBottom`, the predicate behind "follow only when already at the bottom".
- `src/modules/mails/conversations/ui/components/message-body.tsx` — inset sheet (rounded, hairline border, clipped), muted images bar above it, 64px frame until the first measurement, per-state height cache.
- `src/modules/mails/conversations/ui/components/message-item.tsx` — passes the message id to the body.
- `src/modules/mails/conversations/ui/components/conversation-detail.tsx` — native scroll viewport, pin on open with a `ResizeObserver` re-pin while following, re-pin on new messages only when near the bottom, unpin on an explicit expand/collapse, `scrollIntoView` removed. The viewport is focusable (`role="region"`, labelled) so the thread scrolls from the keyboard, which the earlier markup did not offer.
- `src/app/(admin)/admin.css` — `.mail-thread-scroll`, the always-visible thin rail next to the sidebar one.
- `CONTEXT.md` — new "message sheet" term; `docs/adr/0033-sandboxed-iframe-for-email-bodies.md` — consequences updated (sheet chrome, normalized rhythm, images bar, shrinkable height, native scroll, follow-when-at-bottom).
- Verified: `npx tsc --noEmit` clean, scoped ESLint clean (the repo's 40 pre-existing errors are unrelated files), mails suites green (41 files / 393 tests).
- Deviation recorded above: `overflow-anchor` stays at the browser default instead of being disabled, because native anchoring is what keeps the reading position stable when an earlier message finishes measuring; the bug's actual sources — zero-height frames, `scrollIntoView` and a JS-drawn thumb — are gone.

Still to do by hand: the manual checklist above (scroll thumb, follow behaviour, light/dark look).

### Code review (two axes)

Standards:
- Added `import "client-only"` to `message-height-cache.ts`: it is module state filled from a client component, and `AGENTS.md` asks for the marker on client-only modules.
- Stopped exporting `THREAD_BOTTOM_THRESHOLD`, which was only its own default.
- `toggleImages` now keeps the current height while the revealed document measures, and pointer interaction inside the thread unpins, so revealing images on an older message can no longer yank the view to the bottom.
- Kept: `clearMessageHeightCache` (test reset for module state), `aria-pressed` with a flipping label (the documented control, and the label states the action plainly for both sighted and assistive users), and the string assertions on the base stylesheet (they guard a hand-written CSS literal; the behaviour-level tests cover the cache and the bottom predicate).

Spec:
- Added the promised dark-mode ring to the sheet.
- Added block spacing to `pre` and a `body > :last-child` reset so the last block does not double the body padding.
- Images intentionally are not forced to `display: block`: the ticket now says so and explains why.
- Rendering tests now assert the images bar copy and the absence of "Hide images" before a reveal.
- Rejected: "unpin is undone when collapsing" — collapsing shrinks the content, and if that leaves the reader inside the threshold they are at the bottom, where following new mail is the wanted behaviour; the explicit unpin still keeps the resize observer from pulling the view during the collapse itself.
- Rejected: "empty bodies never measure" — the body carries 16px of padding, so its rect is never zero, and the `height > 0` guard only filters malformed messages.
