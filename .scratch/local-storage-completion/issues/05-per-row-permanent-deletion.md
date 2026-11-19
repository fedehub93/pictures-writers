# 05: Permanent deletion resolves the driver per Media

**What to build:** Deleting a selection that mixes Media written by different drivers removes each object through the driver that owns it, both the revision prefix and the legacy original. A mixed library leaves no bytes behind on either the local volume or the provider.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A selection containing a legacy Media with no recorded driver and a local Media deletes each through its own driver.
- [ ] No local bytes remain under a deleted revision prefix, and the legacy object is deleted when its provider is configured.
- [ ] When the legacy provider is not configured, the deletion of the rows still succeeds and the skipped object is reported rather than silently ignored.
- [ ] A Media written by an unknown driver does not abort the whole batch.
- [ ] Tests cover the mixed batch, both cleanups, and the unconfigured-provider case.
