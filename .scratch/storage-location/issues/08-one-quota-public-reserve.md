# 08: One quota for every file, with a reserve for public uploads

**What to build:** The library shows one number that describes the disk — every stored file counts, whatever its role. Inside that number a configurable reserve protects the owner from the public: when public-origin files reach the reserve, further public uploads are refused and library uploads keep working. Nothing is ever deleted automatically for budget reasons.

**Blocked by:** 03, 06

**Status:** ready-for-agent

- [ ] The library shows used and total bytes over every stored file, archived Media included.
- [ ] The same number names how much of it is public-origin.
- [ ] A public upload that would pass the reserve is refused, and an admin upload at the same moment succeeds.
- [ ] A refusal carries a machine-readable reason and leaves no bytes and no record.
- [ ] An attachment's bytes stop counting when its owner is deleted.
- [ ] The reserve is an Installation setting with a documented default, and an installation with no public forms is unaffected.
