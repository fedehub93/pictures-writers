# 03: Edit and publish Page versions

**What to build:** Editors can edit a page, fork a new version when the page is published, and publish/unpublish atomically without race conditions.

**Blocked by:** 02 — Read pages via Root+Version.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Editing a draft page updates the current `PageVersion` in place.
- [ ] Editing a published page creates a new `CHANGED` `PageVersion` while the live version remains unchanged.
- [ ] Publish promotes the target version to the root's `liveVersionId` and sets `status = PUBLISHED`.
- [ ] Publish acquires a row-level lock on `PageRoot` to prevent concurrent publish races.
- [ ] Unpublish clears `liveVersionId` and moves the published version to `CHANGED`.
- [ ] `firstPublishedAt` is set only on the first publication of the root.

## Notes

See the parent spec at `.scratch/root-plus-version-page-pilot/spec.md`.
