# 05: Details panel

**What to build:** An editor sees read-only details of the selected Media or folder in a panel on the right.

**Blocked by:** 03 — Folder-scoped grid and Recent view

**Status:** done

- [x] Selecting a Media card shows its details: name, type, size, dimensions, MIME type, checksum, storage driver, usage count, public URL, created and updated dates.
- [x] Selecting a folder card shows its details: name, item count, total size, created and updated dates.
- [x] The panel shows an empty or placeholder state when nothing is selected.
- [x] The panel updates immediately when the selection changes.
- [x] Component tests verify the rendered details for a Media and a folder.

## Comments

**2026-11-24 — landed in 5283344b.**

`MediaDetailsPanel` is the right-hand third pane: read-only, presentational, and
fed by the library. A Media's facts come from the row the grid already holds, so
selecting a card costs no request; a folder's name, active item count, stored
original bytes and dates come from the new `media.getFolderDetails` query, since
`getMany` returns only child folders. The panel shows a loading line while that
read resolves instead of flashing the empty placeholder, and the row counts and
bytes cover the Media filed directly in the folder, matching the card that
opened it and the rows the folder shows. "Total size" is originals only, because
renditions have no stored-file row of their own; a tooltip says so.

Opening a folder is still ticket 03's click-to-open navigation, so it now also
selects that folder for the panel: the details of the folder an editor wants to
inspect are shown by entering it. There is no separate select-without-opening
gesture, because adding one would undo the interaction already accepted in
ticket 03. Clicking a Media selects it; the panel shows the folder again only
after the scope changes. `MediaLibrary` is remounted on every page, search, view
or folder change, so a selection never survives into a scope it does not belong
to. The card's action bar stops click propagation, so Replace, Edit, Archive,
the checkbox and the move menu do not move the panel; the card name is a real
button and is the keyboard path to selection. The selected card carries a ring.

The public URL is the stored delivery address, shown as the library composes it.
It deliberately does not compose an absolute form in the browser:
`docs/media.md` reserves `absoluteMediaUrl` for boundaries a browser does not
resolve, and a second composer could copy a preview or internal host.

Verification: `npm run typecheck` clean; `npx eslint src/modules/media` 0 errors
(the repository's two pre-existing warnings only); `npm run test:run` 303 files /
2752 tests passed; `npm run build:agent` succeeded against
`pictures_writers_agent`; `npm run check:doc-citations` 0 broken citations. New
coverage is 3 router tests (direct active count and byte sum with archived and
other-folder Media excluded, an empty folder, an unknown id), 5 happy-dom panel
tests (Media fields, folder fields, placeholder, loading, replacing the
selection) and 3 happy-dom card tests (click selects, the name button selects
once, an action does not select). No browser probe ran: the panel's wiring is
covered by the component tests, and the manual responsive check belongs to the
three-pane review described in the spec.

