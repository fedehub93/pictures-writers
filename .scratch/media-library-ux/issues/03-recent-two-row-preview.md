# 03: Recent box as a two-row preview

**What to build:** The Recent box stays a preview instead of behaving like a second My Drive. It shows the four newest active Media, and a centered "View more" control under the box reveals a second row. It never grows past two rows (eight items), then the control disappears. The local pagination and the "Show less" toggle are removed. This ticket also introduces the shared "View more" control that the library's load-more will reuse.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Decisions

- The box reads eight Media in one request and reveals four per activation, so the second row needs no request and appears immediately.
- The reveal is local UI state, not URL state; it resets on navigation.
- The control appears only when more than four items exist, and only while fewer than eight are revealed. At the cap it disappears rather than disabling.
- The box is still hidden in Archived and while a search term is present, and is not drawn at all when there are no active Media.
- Recent cards keep no checkbox and no click action; only the action menu acts.
- The shared control is presentational: optional loading state, a click handler, centered placement. My Drive adds its asynchronous state later.

## Checklist

- [ ] The box opens with four cards, newest first.
- [ ] A centered "View more" control with a downward chevron renders only when more than four Media exist.
- [ ] One activation reveals the second row; the box never shows more than eight items even when more exist.
- [ ] The control disappears at the cap and when there is nothing more to reveal.
- [ ] No pagination, no page text and no "Show less" render in the box.
- [ ] The box is still hidden while searching and in Archived, and absent when the library has no active Media.
- [ ] Recent cards still have no checkbox or click selection, and their action menu still performs Edit, Replace, Move to folder and Archive.
- [ ] One shared "View more" control exists and is used by the box, ready for the library to reuse with a loading state.
- [ ] Component tests cover the initial count, the reveal, the cap, the disappearing control, the hidden states and the menu action.
- [ ] `npm run lint`, `npm run typecheck` and the test suite pass.
