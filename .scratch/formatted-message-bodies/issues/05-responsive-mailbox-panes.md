# 05: Responsive mailbox panes

**What to build:** The mailbox stops overflowing at intermediate widths. The conversation panes shrink to the space they actually have instead of pushing the row past the viewport, where `overflow-hidden` turned the excess into a hard clip that cut the thread and pushed the header actions off screen. Which panes are shown is decided by the space the admin sidebar leaves them (a container query), not by the viewport: the row answers the same at a given width whether the sidebar is open or closed.

**Blocked by:** None.

**Status:** resolved

## Problem

Three causes stacked on the three-pane row in `conversations-view.tsx`:

- The detail pane was a `flex-1` item without `min-w-0`, so its automatic minimum was its content's intrinsic width — the nowrap subject, the message addresses and the reply label could only ever grow it.
- The fixed columns (nav 280, list 352) plus the thread's intrinsic floor exceeded the row, and the row's `overflow-hidden` clipped the excess instead of scrolling.
- The row had no width cap above it either, so the oversized content widened the whole `SidebarInset` and the header's `ml-auto` actions (mode toggle, notifications, user) ended up past the right edge.

The pane widths were also budgeted wrongly: three panes were forced from 1024px of viewport, where the thread would have received ~72px.

## Decisions

- **The row is the query container.** `@container` on the row and container variants on the panes, because the admin sidebar is `collapsible="offcanvas"`: opening or closing it changes the available width by 256px, which a viewport breakpoint cannot see.
- **Named variants, one source of truth.** `two-panes`, `three-panes` and `one-pane` are declared once as `@custom-variant`s in `(admin)/admin.css`, next to the existing `dark` variant, with the arithmetic in a comment above them. Components read by intent (`hidden three-panes:flex`) instead of repeating `@min-[45.5rem]`/`@5xl` in five places across three files.
- **Thresholds, measured on the row's content box (padding excluded):** one pane below 45.5rem (728px = list 352 + gap 16 + thread 360), two panes from 45.5rem, three panes from 64rem (1024px = nav 280 + gap 16 + list 352 + gap 16 + thread 360). That is 1016px / 1312px of viewport with the sidebar open, and 760px / 1056px with it closed.
- **The thread keeps a 360px floor.** Below it, a pane is dropped rather than the message compressed. The back button in the detail header is `one-pane:` visible — present exactly when the list is not beside the thread.
- **Dropping the rail must not drop navigation.** The rail owned the only view switcher, so a new `MailboxViewSelector` (a `Select` with Inbox, Sent, Starred, Archive, Trash, and the unread/archived counts folded into the labels) renders in both the conversation list and the Sent panel whenever the rail is hidden (`three-panes:hidden`), beside the account selector. The rail, the selector and the account selector now appear and disappear together.
- **One-line truncation everywhere in the thread.** Subject, sender name, sender address, the `to …` line and the reply label truncate with an ellipsis; the date and direction badge are `shrink-0` and always visible. No `line-clamp-2` on the subject: the full text is in the message, and a title that reflows on resize moves the thread.
- **`min-w-0` on the whole chain:** the row's detail `section`, the detail root, the list pane, and `SidebarInset` — the last one passed as a `className` at its single call site in `(admin)/layout.tsx`, so the vendored shadcn primitive stays untouched and the reason sits in a comment where the layout is read.
- **No horizontal scroll anywhere in the mailbox.** No scaffold was kept as an escape hatch.
- **No ADR and no glossary term.** CSS is reversible and the code carries the reason, so the three ADR criteria are not met; "pane" is not an ambiguous domain term, so the glossary stays a glossary.

## Checklist

- [x] `(admin)/admin.css`: `@custom-variant`s `two-panes` (>= 45.5rem), `three-panes` (>= 64rem), `one-pane` (< 45.5rem), with the width arithmetic documented above them.
- [x] `conversations-view.tsx`: `@container` on the row; `min-w-0` on the detail `section` and on the list pane, with the reason recorded in a comment; list pane `hidden two-panes:flex two-panes:w-88 two-panes:shrink-0`; the view selector node passed to both panels.
- [x] `mailbox-nav.tsx`: rail visible with `three-panes:flex`.
- [x] `mailbox-view-selector.tsx` (new): the five views, counts folded into the labels for Inbox and Archive.
- [x] `conversation-list-panel.tsx` and `sent-messages-panel.tsx`: `viewSelector` prop, account selector and view selector in one row hidden with `three-panes:hidden`, Compose `three-panes:hidden`.
- [x] `conversation-detail.tsx`: `min-w-0` on the root, back button `hidden one-pane:inline-flex`, reply label truncates inside a `min-w-0` span with a `shrink-0` icon.
- [x] `message-item.tsx`: sender row and `to …`/date row are single-line with truncation and `shrink-0` on the separator and time.
- [x] `(admin)/layout.tsx`: `min-w-0` on `SidebarInset` with the reason in a comment; `src/shared/ui/sidebar.tsx` left as vendored.
- [x] Variants verified to compile against the real `admin.css`: `two-panes` → `@container (width >= 45.5rem)`, `three-panes` → `(width >= 64rem)`, `one-pane` → `(width < 45.5rem)`, emitted after the base utilities so they win.
- [x] `npx tsc --noEmit` clean; scoped ESLint clean apart from the pre-existing `react-hooks/purity` error on the sidebar skeleton's random width (untouched area); `npm run test:run -- src/modules/mails` green (41 files / 393 tests).

## Manual checklist (layout cannot be asserted in jsdom)

Try each width with a long-subject conversation open, sidebar open **and** collapsed, light and dark:

- [ ] 360px (phone): single pane, thread readable, no horizontal scroll, back button returns to the list, the view selector switches between Inbox and Sent.
- [ ] 768px: single pane (list and thread), back button visible, nothing cut at the right edge.
- [ ] 1016px viewport, sidebar open: two panes; account and view selectors visible in the list; no nav rail; every view still reachable.
- [ ] 1056px viewport, sidebar collapsed: three panes.
- [ ] 1312px viewport, sidebar open: three panes, thread ≥ 360px.
- [ ] 1440px and 1536px: three panes, thread comfortable; resize slowly across both thresholds and check nothing jumps, clips, or loses the open conversation.
- [ ] Header at every width: mode toggle, notifications and user menu always visible at the far right.
- [ ] Sent view: same pane behaviour, Compose present in every mode, the selector shows Sent and switching away returns to the list.

**Still to do by hand:** the checklist above. Nothing in this ticket ran in a browser — the change is CSS and the suites cannot measure layout.

## Out of scope

- Horizontal scrolling as a fallback, inside the app or inside the message sheet.
- Playwright or any browser-test infrastructure.
- Dark-mode message bodies.
- Restyling the panes themselves (widths, radii, sheet chrome are unchanged).

## Comments

Delivered in one pass: the `min-w-0` chain, the container query on the row behind three named variants, the 45.5rem/64rem thresholds, the re-coupled controls plus the missing view switcher, and the one-line truncation in the thread. The `md:px-6` / `md:p-6` rhythm inside the detail was deliberately left on the viewport: it is a padding preference rather than a pane, and moving it to a container variant would widen the sheet padding in three-pane mode while leaving it at 16px in two-pane mode at the same thread width.

Correction to the diagnosis in the interview: the Sent panel did already render a Compose button, and the reply bar is a plain `<button>`, not the `whitespace-nowrap` `Button` primitive. Neither changes the outcome — the coupling was real and the label still needed truncation to keep the bar on one line — but the record should not claim a control that never was missing.

### Code review (two axes)

Standards:
- Moved the thresholds out of the components into three named `@custom-variant`s: the same number was repeated in five classes across three files, and the back button's rule lived in a different file from the pane it mirrors.
- Honoured "repo standards over baseline" for the JSX comments: `//` inside attribute lists and block comments above `return` both already occur in the codebase.
- Reverted the edit to the vendored `src/shared/ui/sidebar.tsx`; `min-w-0` is now a `className` at its single call site, which keeps the primitive mergeable with upstream without losing the fix.
- Left equal `truncate` shrink on the sender name and address: expressing a priority needs a query container on the message header, and both values remain reachable from the reply composer; recorded rather than over-engineered.

Spec:
- The rail was the only view switcher, so hiding it below 64rem made Sent, Trash, Starred and Archive unreachable — the reason `MailboxViewSelector` exists and why the checklist now tests every view in two-pane mode.
- Added the `min-w-0` the list pane was missing: the same intrinsic-minimum trap, dormant only because every row already truncates.
- Added the "still to do by hand" caveat instead of implying the layout had been verified.
