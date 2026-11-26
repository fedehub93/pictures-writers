# 03: Recent box as a two-row preview

**What to build:** The Recent box stays a preview instead of behaving like a second My Drive. It shows the four newest active Media, and a centered "View more" control under the box reveals a second row. It never grows past two rows (eight items), then the control disappears. The local pagination and the "Show less" toggle are removed. This ticket also introduces the shared "View more" control that the library's load-more will reuse.

**Blocked by:** None (can start immediately)

**Status:** done

## Decisions

- The box reads eight Media in one request and reveals four per activation, so the second row needs no request and appears immediately.
- The reveal is local UI state, not URL state; it resets on navigation.
- The control appears only when more than four items exist, and only while fewer than eight are revealed. At the cap it disappears rather than disabling.
- The box is still hidden in Archived and while a search term is present, and is not drawn at all when there are no active Media.
- Recent cards keep no checkbox and no click action; only the action menu acts.
- The shared control is presentational: optional loading state, a click handler, centered placement. My Drive adds its asynchronous state later.

## Checklist

- [x] The box opens with four cards, newest first.
- [x] A centered "View more" control with a downward chevron renders only when more than four Media exist.
- [x] One activation reveals the second row; the box never shows more than eight items even when more exist.
- [x] The control disappears at the cap and when there is nothing more to reveal.
- [x] No pagination, no page text and no "Show less" render in the box.
- [x] The box is still hidden while searching and in Archived, and absent when the library has no active Media.
- [x] Recent cards still have no checkbox or click selection, and their action menu still performs Edit, Replace, Move to folder and Archive.
- [x] One shared "View more" control exists and is used by the box, ready for the library to reuse with a loading state.
- [x] Component tests cover the initial count, the reveal, the cap, the disappearing control, the hidden states and the menu action.
- [x] `npm run lint`, `npm run typecheck` and the test suite pass.

## Comments

**2026-11-26 — landed in `fdc5ed82`.**

- The Recent box reads eight Media in one request and opens on the newest four. A centered "View more" control under the grid reveals four more; the reveal is local state capped at eight, so the control disappears at the cap or when the second row is the last item. The page state, the pagination and the "Show less" toggle are gone.
- Added `src/modules/media/ui/components/media-view-more.tsx`: one presentational button labelled "View more" with a downward chevron, centered, an optional `isLoading` state that shows an inline spinner and disables a second activation. The Recent box passes no loading state; the library's load-more reuses it next.
- `RECENT_PAGE_SIZE` became `RECENT_BOX_SIZE = RECENT_PREVIEW_COUNT * 2`, and `useMediaRecent` lost its page parameter. `recentMediaInput` still prefetches page one, page size eight.
- `docs/media.md` now describes the two-row preview instead of "View all"/pagination, and its map row names the shared control.
- Tests: new `media-view-more` suite covers the label, the click handler, the spinner/disabled state and the enabled state; the Recent box suite covers the initial four, hiding the control at four or fewer, the reveal, the eight-item cap with a twelve-item fixture, the disappearing control at the cap and when the second row is the last item, the absence of pagination and "Show less", the hidden search/Archived/empty states, and the move menu action.

Verification: `npm run lint` 0 errors (250 pre-existing warnings), `npm run typecheck` passes, `npm run check:doc-citations` 0 broken citations, full suite 307 files / 2783 tests passing. No schema or routing change, so no agent build was required.
