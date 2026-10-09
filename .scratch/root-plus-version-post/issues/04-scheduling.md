# 04: Scheduling on Root + Version

**What to build:** Scheduled publishing keeps working through the root/version model: scheduling acts on the current version, targets the root, and the handler promotes the scheduled version to live.

**Blocked by:** 03 — Edit, fork, publish, and unpublish for Post.

**Status:** done

## Acceptance criteria

- [ ] `schedule` acts only on the current version, moving `DRAFT`/`CHANGED` → `SCHEDULED` and storing `preSchedulingStatus`, under the root lock.
- [ ] A `ScheduledAction` is created with `targetType = POST_ROOT` and `targetId = PostRoot.id`.
- [ ] `reschedule` and `cancelSchedule` update the version and the action consistently.
- [ ] The scheduler handler resolves the scheduled version of the root and promotes it to `liveVersion`; successful runs mark the action complete.
- [ ] `calendar-query` reads scheduled posts through `ScheduledAction` + `PostRoot`.
- [ ] No changes to the `ScheduledAction` model or the automation engine.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`.

## Comments

Scheduling now runs entirely on `PostRoot` / `PostVersion`.

- **Schedule lib.** `schedule-post.ts` takes `versionId` (the current version), locks the `PostRoot`, asserts the target is the root's current version, requires `DRAFT`/`CHANGED`, then moves it to `SCHEDULED` and writes `preSchedulingStatus` and a `ScheduledAction` (`targetType = POST_ROOT`, `targetId = PostRoot.id`) in one transaction. `reschedulePost` / `cancelSchedule` update the version and its active action together under the same lock. The `postId` field was renamed `versionId` and `procedures.ts` was updated.
- **Handler.** `post-publish-handler.ts` resolves the root's current version at execution time (instead of the legacy "latest post row") and delegates to `publishPost({ id, rootId, mode: "scheduled" })`, which promotes it to `liveVersion` and marks the action `SUCCEEDED`.
- **Cutover tooling.** `backfillScheduledPosts` was rewritten off the dropped `Post` table: it queries roots whose current version is `SCHEDULED` and materializes the missing action. `verifySchedulerCutover` now reports `scheduledVersions` / `scheduledVersionsWithoutActiveAction` and orphaned/duplicate active actions against the root's current version. `docs/scheduled-publication.md` was updated to match. The `ScheduledAction` model and the runner were not changed.
- **Tests.** `scheduled-post.test.ts`, `scheduler-runner.test.ts`, `cutover.test.ts`, and `calendar-query.test.ts` were repointed to the new model via a shared `root-fixtures.ts` helper (`createPostRoot` / `seedPost`); 68 scheduling tests green. `npx tsc --noEmit` is clean for every file touched here; `eslint` reports no errors.
- **Remaining red (owned by later tickets).** `publish-post.test.ts`, `post-slug-faqs.test.ts`, the tags/categories router tests, and the de-version migration test still assume the legacy model and fail (ticket 07); the admin/public post UI still uses `postAuthors`/`postCategories` (ticket 06); `delete`/`updateSeo` are ticket 05.
