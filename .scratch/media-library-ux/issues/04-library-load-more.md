# 04: Load more in My Drive and Archived

**What to build:** My Drive and Archived stop replacing the grid page by page. A centered "View more" control under the grid appends the next block of eight Media, keeping the rows already on screen. The control shows an inline spinner while loading, reports a failure and returns clickable for a retry, and disappears when the last block is loaded. Folders stay at the top of the list, never repeat between blocks, and the first block arrives with the page instead of after it.

**Blocked by:** 03 — Recent box as a two-row preview (for the shared "View more" control, not for the behaviour)

**Status:** ready-for-agent

## Decisions

- Loading happens only on activation. No viewport observer and no automatic fetch in this version.
- The library's read becomes an infinite query in the picker's pattern: the list has no cursor, so the key, query function, initial page and next-page rule are composed by hand. The first block is prefetched server-side into the same infinite key so the suspense boundary resolves with data and no empty grid flashes.
- The page number leaves the media URL contract; loaded blocks are query state. The list procedure still accepts a page because the asset picker and the Recent box request a specific page.
- Old links carrying a page number are ignored, not rejected; they open the first block.
- Changing search, view or folder starts again from the first block. Loading another block does not reset anything.
- Checked Media survive loading another block, since their cards stay on screen. They are cleared when search, view or folder changes. The panel's remount key follows the scope and no longer includes a page.
- Folders come from the first block only; later blocks append Media only.
- Archived uses the same read and control, because both views share the panel.

## Checklist

- [ ] My Drive appends the next block of eight Media on each activation, keeping the rows already shown.
- [ ] Archived has the same load-more behaviour.
- [ ] The control renders only when a next block exists, shows an inline spinner while fetching, returns enabled with a readable message after a failure, and disappears at the end.
- [ ] Folder cards render only in the first block and never repeat.
- [ ] The media URL no longer carries a page; `search`, `view` and `folderId` are unchanged, and a legacy page parameter is ignored.
- [ ] The first block is prefetched into the same infinite query key, so the page hydrates with content.
- [ ] The asset picker and the Recent box keep working against the page-based list contract.
- [ ] Selection survives loading another block and is cleared when search, view or folder changes.
- [ ] The panel remount key follows search, view and folder, and no longer includes a page.
- [ ] Component tests cover the control's presence, callback, loading and end states; a search-param test covers the removed page and the kept parameters.
- [ ] `npm run lint`, `npm run typecheck` and the test suite pass.
