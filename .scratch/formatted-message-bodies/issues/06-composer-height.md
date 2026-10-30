# 06: Composer height

**What to build:** The reply composer can no longer push its own actions out of sight. It grows with what is written up to a share of the detail pane, then its body scrolls inside, so From/To/Subject and the toolbar stay put and Discard/Send are always reachable. The Compose panel keeps the same structure, with its attachments inside the scrolling body.

**Blocked by:** None.

**Status:** resolved

## Problem

`ReplyComposer` was a plain `div` with no height bound, rendered as the third child of the detail column: a header, the thread with its own scrollbar, then the composer. The editor's `min-h-40` set a floor and nothing set a ceiling, so the composer grew by the full height of what was typed plus its fixed bands (From/To/Subject, toolbar, attachments, footer). Past the pane height, the column's `overflow-hidden` clipped the excess: the text kept growing, nothing scrolled, and Discard/Send slid out of view. The thread's scrollbar was never involved — it sits above the composer.

`NewMessagePanel` already had the right structure (a `flex min-h-0` column with the editor in a `min-h-0 flex-1 overflow-y-auto` area), which is why only the reply composer failed.

## Decisions

- **One bounded column, one scroll region.** The composer is `flex max-h-[65%] min-h-0 flex-col overflow-hidden`; the title rows and the toolbar are fixed, the editor and attachments share a `min-h-0 flex-1 overflow-y-auto` body, and the action bar is `shrink-0`. The thread above stays `flex-1 min-h-0`, so the composer can never take more than 65% and the conversation keeps at least a third of the pane.
- **The title rows compress before the actions do.** They sit in a `min-h-0 overflow-y-auto` block, so a pane too short for the 65% cap to fit them (phone with the keyboard open) scrolls them instead of clipping the footer. The action bar is the one region that never shrinks.
- **The cap is a percentage, not a fixed height.** 65% of the pane adapts to a tall desktop column and to a phone with the keyboard open, and adds no second magic number to keep aligned.
- **The thread re-anchors when the pane shrinks.** The existing `ResizeObserver` now observes the thread viewport as well as its content: as the composer grows, a reader who was at the bottom keeps the newest message in view, and a reader scrolled further up is left alone.
- **Both composers share one structure.** The Compose panel moves its attachment list inside the scrolling body too, so a long attachment list cannot push its actions out either, and the two composers cannot drift apart.
- **No new components and no new state.** The change is layout only; the editor, the send path, the attachment upload and the draft reset are untouched.

## Checklist

- [x] `reply-composer.tsx`: root `flex max-h-[65%] min-h-0 flex-col overflow-hidden`, title rows compressed in a `min-h-0 overflow-y-auto` block, toolbar fixed above a `min-h-0 flex-1 overflow-y-auto` body holding the editor and the attachment list, action bar `shrink-0`, with the reason recorded in a comment.
- [x] `new-message-panel.tsx`: attachment list moved inside the scrolling body, title rows `min-h-0 overflow-y-auto`, action bar `shrink-0`.
- [x] `conversation-detail.tsx`: the thread's `ResizeObserver` observes the viewport as well as the content, so the newest message stays visible while the composer grows; the comment now states both triggers.
- [x] `npx tsc --noEmit` clean; scoped ESLint clean; `npm run test:run -- src/modules/mails` green (41 files / 393 tests).

## Manual checklist (layout cannot be asserted in jsdom)

- [ ] Open a conversation with several messages, reply, then paste 40+ lines: the composer stops growing at about two thirds of the pane, the editor scrolls, From/To/Subject stay visible and Discard/Send never leave the viewport.
- [ ] With the caret at the end of that long reply, the editor scrolls to follow the typing.
- [ ] While the composer grows, the newest message stays in view; scroll the thread up first and check that the resize does not yank it back.
- [ ] Add several attachments: they scroll with the editor, and the actions stay visible.
- [ ] Same checks in the Compose panel, including many attachments.
- [ ] Short pane (phone in landscape, or a small window): the editor area shrinks but both buttons remain reachable, and the From/To/Subject rows scroll rather than pushing the footer out.
- [ ] Send and Discard still work and reset the composer as before.

**Still to do by hand:** the checklist above. The suites cannot measure layout.

## Out of scope

- A drag handle or a user-resizable composer.
- Moving the reply into a floating or full-screen composer.
- Changing the editor's minimum height, the send path, attachments or the draft behaviour.
- Animation of the growth.

## Comments

Delivered in one pass: the bounded composer with a single internal scroll region, the same shape for the Compose panel, and the viewport observation that keeps the thread pinned to its newest message while the composer grows.
