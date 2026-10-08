# 04: Scheduling on Root + Version

**What to build:** Scheduled publishing keeps working through the root/version model: scheduling acts on the current version, targets the root, and the handler promotes the scheduled version to live.

**Blocked by:** 03 — Edit, fork, publish, and unpublish for Post.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] `schedule` acts only on the current version, moving `DRAFT`/`CHANGED` → `SCHEDULED` and storing `preSchedulingStatus`, under the root lock.
- [ ] A `ScheduledAction` is created with `targetType = POST_ROOT` and `targetId = PostRoot.id`.
- [ ] `reschedule` and `cancelSchedule` update the version and the action consistently.
- [ ] The scheduler handler resolves the scheduled version of the root and promotes it to `liveVersion`; successful runs mark the action complete.
- [ ] `calendar-query` reads scheduled posts through `ScheduledAction` + `PostRoot`.
- [ ] No changes to the `ScheduledAction` model or the automation engine.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`.
