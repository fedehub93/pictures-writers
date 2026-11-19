# 07: Read-only media audit

**What to build:** An operator can run one read-only command that proves the library is healthy after a driver change. It reports how many Media each driver wrote, which Media cannot be resolved through their recorded driver, how the bytes on the local volume compare with the bytes the database accounts for, and which recorded drivers are not configured on this instance. It exits non-zero when anything is unresolved, so it can gate a deployment. It prints Media ids and aggregates, never keys, addresses or content.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The command reports rows per driver, unresolved Media ids, local disk bytes against accounted bytes, and unconfigured drivers.
- [ ] It performs no writes.
- [ ] It exits 0 when every Media resolves and non-zero otherwise.
- [ ] Its output contains no storage keys, addresses or content.
- [ ] A test with one healthy local row, one healthy legacy row and one missing object asserts the counts, the unresolved id and the exit code.
