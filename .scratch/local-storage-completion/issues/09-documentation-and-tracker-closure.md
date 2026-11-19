# 09: Documentation and tracker closure

**What to build:** The documentation matches the delivered behaviour. The media map states the per-row driver rule, the mixed-state acceptance, the 302 semantics and the non-image decision. The ADR records why the existing Media stay on the provider and why the 302 is not a path to own-domain addresses for them. The self-hosting pages stop describing UploadThing as unchanged, and the previous media spec is closed on paper.

**Blocked by:** 01, 08

**Status:** ready-for-agent

- [ ] The media map documents the per-row rule, the 302 semantics, non-image support and the audit.
- [ ] The ADR revision records the mixed-state acceptance and why legacy Media do not traverse the 302.
- [ ] The self-hosting pages no longer describe UploadThing as unchanged, and the environment appendix matches the surviving variables.
- [ ] The audit, the volume, the backup and the restore are documented where an operator will look for them.
- [ ] The previous media spec is marked done.
- [ ] The documentation citation check passes.
