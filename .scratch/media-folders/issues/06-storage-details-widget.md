# 06: Storage details widget

**What to build:** An editor sees how much storage is used overall and how it is split across Images, Videos, Audio and Documents.

**Blocked by:** 01 — Folder tree sidebar, 03 — Folder-scoped grid and Recent view

**Status:** done

- [x] The aggregation endpoint returns total used bytes, total quota bytes, and per-`MediaType` usage.
- [x] The widget renders a progress bar for total used vs quota.
- [x] The widget lists Images, Videos, Audio and Documents with their file counts and sizes.
- [x] The widget shows a warning state when usage is above the configured warning ratio.
- [x] Router/API tests verify the aggregation.
- [x] Component test verifies the widget renders the breakdown.

## Comments

**2026-11-24 — landed in 085c85f7.**

`media.getMeta` now returns `byMediaType`: one row for every Media type in the
library's listing order, with the number of stored originals and their bytes.
The rows count originals only — a rendition shares its Media's bytes and an
attachment or avatar has no Media type — while the total is the quota figure the
uploads enforce, so the rows deliberately need not add up to it. The grouping is
opt-in inside `readUsage`, so an upload's admission check still reads only the
totals.

`MediaStorageDetails` sits under the Recent/Archived navigation in the folder
sidebar and replaces the header's old quota meter: used vs quota with the
existing warning/exceeded colours, the four type rows, the public-origin
reserve and the quota warning. The warning copy no longer names a percentage,
because a rounded `percent` could read "80%" while the raw ratio already warns.

Verification: `npm run typecheck` clean; `npx eslint` clean on every changed
file; `npm run test:run` 304 files / 2757 tests passed; `npm run build:agent`
succeeded against `pictures_writers_agent`; `npm run check:doc-citations` 0
broken citations. New coverage is 1 router test (all four types in order, an
empty Audio row, originals-only versus the rendition-inclusive total), 1 quota
test (an attachment counts in the total but adds no type row) and 3 happy-dom
tests (the breakdown, the warning above the ratio and no warning below it). No
browser probe ran: the feature's responsive three-pane check belongs to the
manual review the spec describes.
