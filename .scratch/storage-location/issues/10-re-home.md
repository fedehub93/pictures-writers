# 10: Re-home

**What to build:** The owner can move every file to the active driver from the library, and the move never changes an address, a key or a revision. Files are copied, verified against their checksum, then flipped; an interrupted run resumes; a file that cannot be read is reported and keeps serving from where it is; a newer switch supersedes the run. Before starting, the product warns when the disk cannot hold both copies, and the UI shows progress with a stop that is always safe. Every abandoned provider object is recorded for a later removal.

**Blocked by:** 02, 04

**Status:** ready-for-agent

- [ ] After a run, every stored file sits on the target driver and no key, revision or canonical address changed.
- [ ] An interrupted run resumes without recopying files it already verified.
- [ ] A file the source cannot read is reported by id and still serves from its current driver.
- [ ] A driver change during a run supersedes it, and the next run converges on the newest target.
- [ ] A run that would exhaust the disk warns and requires confirmation, and refuses when it is clearly impossible.
- [ ] The run records every abandoned object for the purge, including a legacy object whose key is not namespaced.
- [ ] The library shows how many files remain on another driver, offers the move, shows progress and can stop.
- [ ] No failure in a move ever breaks an address.
