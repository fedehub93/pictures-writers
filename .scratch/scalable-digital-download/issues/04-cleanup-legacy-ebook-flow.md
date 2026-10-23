# 04: Cleanup legacy ebook flow

**What to build:** Remove the hardcoded single-ebook code so only the generic free digital download flow remains.

**Blocked by:** 01 — Database and admin plumbing; 02 — Backend download flow; 03 — Public modal, tracking and visibility.

**Status:** done

- [x] Remove `FreeEbookModal`, `subscribeFreeEbook`, and `BUILT_IN_EBOOK_FORM_ID`.
- [x] Remove the old `EBOOK_DOWNLOADED` admin notification type.
- [x] Keep the legacy `ebooks` dashboard metric: there is no backfill, so it remains the only historical view. It counts unique contacts and continues to work for the ebook since the new action still writes its interaction.
- [x] Remove `freeEbookTemplateId` from `EmailSetting` and related UI.
- [x] Verify the existing ebook still works end-to-end through the new generic flow.
- [x] Update any tests that depended on the old hardcoded flow.

## Notes

Implemented in this ticket.

- The cleanup migration re-links any free `EBOOK` `ProductVersion` still pointing at `built-in-form-ebook` to `free-ebook-download`, rewrites the matching published automation snapshots and draft trigger nodes, guarantees the generic form exists, then deletes the legacy form only when nothing references it.
- `freeEbookTemplateId` is dropped from `EmailSetting`; `freeDigitalDownloadTemplateId` remains the single delivery template.
- The product-detail page now mounts the generic modal only when the free product has a linked form. A free product without one shows no download CTA rather than a broken fallback.
- The blog product-pop widget now uses `subscribeFreeDigitalProduct` and the generic `digital_download` event (`source: "product_pop"`), so no public surface depends on the removed action.
- Tests removed with the old flow (`ebook-emit.test.ts`); the generic action test now also proves the legacy ebook writes `ebook_downloaded` and still increments the `ebooks` metric. A cleanup-migration test covers the re-link and legacy-form deletion.
- Verified with `npx tsc --noEmit`, ESLint on touched files, and the full Vitest suite (155 files, 1296 tests).
