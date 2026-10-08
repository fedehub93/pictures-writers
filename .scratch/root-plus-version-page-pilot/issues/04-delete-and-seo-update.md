# 04: Delete and SEO update for Page Root+Version

**What to build:** Page deletion and SEO updates work through the new root/version model without leaving orphaned rows.

**Blocked by:** 03 — Edit and publish Page versions.

**Status:** done

## Acceptance criteria

- [x] Deleting a page removes the `PageRoot` and all its `PageVersion` rows (cascade).
- [x] Deleting a page removes `Seo` records that belong only to that page's versions.
- [x] `updateSeo` updates the SEO of the current version.
- [x] SEO changes on a published page are staged on the current version and do not affect the live version until publish.
- [x] No orphaned versions or SEO rows remain after deletion.

## Notes

See the parent spec at `.scratch/root-plus-version-page-pilot/spec.md`.
