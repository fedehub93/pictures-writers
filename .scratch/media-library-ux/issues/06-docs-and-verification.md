# 06: Document the new library browsing and verify the whole feature

**What to build:** The Media documentation describes the page as it now behaves: one control row, no relational-reference copy, a two-row Recent preview, load-more instead of pagination in My Drive and Archived, and the sort selector with its URL contract. The feature is then verified end to end, including a browser probe for the behaviours the component tests deliberately do not cover.

**Blocked by:** 01, 02, 03, 04, 05

**Status:** ready-for-agent

## Decisions

- One documentation pass at the end, because the media document describes the page as a whole and would otherwise be edited in five conflicting places.
- The browser probe covers the behaviours with no automated seam: the scroll back to the top after a sort change, the selection reset when the scope changes, and the URL round-trip for search, folder and sort.
- The probe runs against the agent database, never the development one.

## Checklist

- [ ] The media documentation states the single control row with the bounded search on the right.
- [ ] It states that relational-reference information is no longer shown and that deletion is still refused while content uses a Media.
- [ ] It states the Recent box's four-item preview, second-row reveal and eight-item cap, with no pagination or collapse.
- [ ] It describes load-more in My Drive and Archived, its eight-item blocks, the spinner, the retry and the end state, and that the page number is no longer in the URL.
- [ ] It describes the sort selector, the three orders, the URL parameter and the restart-on-change behaviour.
- [ ] No documentation cites a path the repository no longer has: `npm run check:doc-citations` passes.
- [ ] `npm run lint`, `npm run typecheck`, the full test suite and `npm run build:agent` pass.
- [ ] The browser probe confirms the sort scroll, the selection reset and the URL round-trip against the agent database.
- [ ] No screenshots, run logs or throwaway files are left behind.
