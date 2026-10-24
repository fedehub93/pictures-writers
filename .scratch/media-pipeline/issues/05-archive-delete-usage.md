# 05: Archive, restore, permanent deletion, usage count

**What to build:** Archiving a Media removes it from the library while keeping it served and referenceable, restoring brings it back, and permanent deletion is a separate explicit act available only on archived Media that removes the row and its whole storage prefix. The library shows how many contents reference a Media and states that references embedded in rich text or page data are not counted. Deleting a Media used as a cover no longer silently removes that cover.

**Blocked by:** 02

**Status:** done

- [x] Archiving hides the Media from the library while its URLs keep working and published pages are unaffected.
- [x] Restoring an archived Media makes it visible again.
- [x] Permanent deletion is refused on a Media that is not archived.
- [x] Permanent deletion removes the row and every object under its prefix, leaving no orphaned renditions.
- [x] The library shows the number of relational references per Media and labels the count as excluding references embedded in content data.
- [x] Deleting or archiving a Media that is used as a cover no longer makes that cover disappear without a warning.

## Notes

- `archiveMedia` / `restoreMedia` in `src/modules/media/server/media-service.ts` set `archivedAt` and reissue the delivery token with the new `archived` flag, so an archived Media falls back to its original on the loader while restore brings renditions back. Neither operation touches content relations, so a cover never disappears.
- `deleteMediaPermanentlyBatch` validates every id before touching storage: unknown Media (`404`), not archived (`409`), or still referenced (`409`, with `usage`) abort the whole batch. Storage prefixes are removed before the rows so a successful deletion cannot leave rendition objects behind; a legacy original stored outside `<mediaId>/` is removed best-effort.
- `src/modules/media/server/media-usage.ts` counts `PostVersion`, `PageVersion`, `ProductVersion`, `ProductGallery`, `Seo`, `User` and `Impression` in a fixed number of grouped queries. References inside `puckData`, `tiptapBodyData`, email HTML and `AdItem.imageUrl` are strings and are intentionally not counted; the library states this next to the counts.
- The media page has an Active/Archived view (`?view=archived`), per-card Archive/Restore/Permanent delete actions, and bulk archive/delete. Permanent delete is only offered in the archived view; the API refuses it everywhere else.
- Routes: `POST /api/media/[mediaId]/archive`, `POST /api/media/[mediaId]/restore`, `DELETE /api/media/[mediaId]` and the realigned `DELETE /api/media/bulk_delete` (no more direct deletes or silent cover clearing). Shared error mapping lives in `src/app/api/media/_lib/media-error-response.ts`.
- Tests: `media-archive.test.ts` covers hiding/serving, restore, cover safety, refusal on active/referenced Media, prefix cleanup, legacy keys and every relation type; `lifecycle-route.test.ts` and `bulk_delete/route.test.ts` cover the admin-facing status codes and all-or-nothing batch preflight.

