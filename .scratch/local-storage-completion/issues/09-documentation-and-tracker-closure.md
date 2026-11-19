# 09: Documentation and tracker closure

**What to build:** The documentation matches the delivered behaviour. The media map states the per-row driver rule, the mixed-state acceptance, the 302 semantics and the non-image decision. The ADR records why the existing Media stay on the provider and why the 302 is not a path to own-domain addresses for them. The self-hosting pages stop describing UploadThing as unchanged, and the previous media spec is closed on paper.

**Blocked by:** 01, 08

**Status:** done

- [x] The media map documents the per-row rule, the 302 semantics, non-image support and the audit.
- [x] The ADR revision records the mixed-state acceptance and why legacy Media do not traverse the 302.
- [x] The self-hosting pages no longer describe UploadThing as unchanged, and the environment appendix matches the surviving variables.
- [x] The audit, the volume, the backup and the restore are documented where an operator will look for them.
- [x] The previous media spec is marked done.
- [x] The documentation citation check passes.

## Comments

**2026-11-19 — landed in `0e17793f`, review fixes in `61ea3b51`, previous spec closed in `4a9a0aa2`.**

`docs/media.md` now states the per-row driver rule and the expected mixed library, explains the
delivery route's `302` from what the route actually branches on (the recorded driver, not the
address shape), keeps the non-image transport decision, and adds the read-only audit: what it
reports, the reason codes, the exit code and the fact that remote rows are verified only through
configuration and key presence.

ADR-0026 gains a revision recording the mixed-state acceptance and why a legacy Media's absolute
address never requests the route, so the `302` is not a path to own-domain addresses. ADR-0032
keeps its historical bullet and gains a revision note linking to ADR-0026.

The self-hosting pages were revised rather than rewritten as history: the README banner scopes the
October diagram, the critical-points list and deployment checklist no longer say UploadThing is
unchanged, and `01`, `03`, `05`, `06`, `07`, `09`, `00` and the environment appendix now describe
the local driver, the `/media/<key>` delivery, the `media-storage` volume and the surviving
variables (`MEDIA_STORAGE_DRIVER`, `MEDIA_STORAGE_LOCAL_ROOT`, `INSTALLATION_SLUG`,
`UPLOADTHING_TOKEN`; `MEDIA_STORAGE_LOCAL_PUBLIC_URL` is documented as removed).

The runbook's media section gained the volume, backup, restore and audit procedures, plus the
activation order (code and migrations, volume and backup, restore drill, then the driver choice).
The volume backup is documented with its current limitation: the scheduled archive is local to the
VPS and no off-site copy exists yet, so a lost VPS relies on the Hetzner snapshot until one is
added. `09-troubleshooting.md` gained the local-delivery and audit-reason entries.

The previous media spec is `done`, with its own `## Comments` and landing commit. The parent
`local-storage-completion` spec stays open: ticket 01 (`ready-for-human`) still owns the
upload-survives-redeploy and restore-drill checks.

Verification: `npm run check:doc-citations` 96 docs / 0 broken; `npm run lint` 0 errors (257
pre-existing warnings); `npm run typecheck` clean; `npm run test:run` 283 files / 2559 tests
passed. No browser probe: the change is documentation only.
