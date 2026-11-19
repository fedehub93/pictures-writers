# 12: Removing the provider's copies

**What to build:** The owner can delete the copies a move left behind, and only those: the command acts on the record the move wrote, refuses while any file still points at that driver or the audit is not green, waits out a grace window, and demands a typed confirmation. It is never automatic, and it is the only irreversible step in the product's storage lifecycle.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] The command refuses while any stored file still records that driver.
- [ ] The command refuses while the audit is not green.
- [ ] Objects younger than the grace window are left alone and reported as waiting.
- [ ] The command requires a typed confirmation before deleting anything.
- [ ] After a run the provider resolves none of the recorded objects, and the local files still serve.
- [ ] A provider failure on one object is reported per object and the rest of the batch continues.
- [ ] A second run finds nothing to delete and reports zero.
