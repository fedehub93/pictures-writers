# 05: Propagate audience CRUD to provider

**What to build:** Audience mutations in the tRPC router automatically propagate changes to the email provider. Creating an audience creates the corresponding segment on the provider and saves the `externalId`. Renaming an audience updates the segment name on the provider. Deleting an audience removes the segment from the provider. Provider errors are logged but do not block the local operation.

**Blocked by:** 03 (fix core sync functions)

**Status:** ready-for-agent

- [ ] `propagateAudienceCreate(id)` function in `lib/core/index.ts`: calls `adapter.syncSegment(null, name)`, saves returned `externalId` on the audience
- [ ] `propagateAudienceUpdate(id)` function in `lib/core/index.ts`: calls `adapter.syncSegment(externalId, newName)` to propagate rename
- [ ] `audiences.create` mutation calls `propagateAudienceCreate` after `db.emailAudience.create`
- [ ] `audiences.update` mutation calls `propagateAudienceUpdate` after `db.emailAudience.update`
- [ ] `audiences.remove` mutation calls `adapter.deleteSegment(externalId)` before `db.emailAudience.delete` (only if `externalId` is non-null)
- [ ] All propagation calls wrapped in try/catch: errors logged, local operation succeeds
- [ ] tRPC mutation responses include `propagationWarning?: string`
- [ ] Tests cover: create propagates and saves externalId, update propagates rename, remove calls deleteSegment, missing externalId on remove skips provider call, provider error returns warning
