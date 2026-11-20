# 01: Persistent media volume, backup and restore

**What to build:** The production Installation keeps its locally stored media across redeploys. The local storage root lives on a persistent volume, that volume is part of the backup alongside the database, and a restore has been rehearsed. In development the default root stays inside the project and is ignored by version control.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] A persistent volume is mounted at the local storage root in production, and the root is set through the existing environment variable.
- [ ] A file uploaded after the volume exists is still served after a redeploy.
- [x] The development default root is excluded from version control.
- [x] The backup procedure includes the media volume alongside the database.
- [ ] A restore has been performed into a scratch environment and a restored file is served through its delivery address.
- [ ] The operations runbook records the volume path, the backup command and the restore steps.

## Comments

**2026-11-19** — Progress; the ticket stays open because the two file-level checks need the
deploy that ships the delivery route and the selector. On production today `origin/master` has
neither `src/app/media/[...path]/route.ts` nor `a0d4c4e5` (the library selector), and the
`Media.storageDriver` column is not migrated, so a local upload could not be served and the
`storageDriver` query cannot run.

Done:

- `/.media-storage/` excluded in `.gitignore` (`e3aa8243`), the development default root.
- A volume named `media-storage` is mounted at `/data/media` on the production app, and
  `MEDIA_STORAGE_LOCAL_ROOT=/data/media` is set there. A marker file survived a redeploy;
  the container writes as root and the mount is writable.
- A daily storage backup is scheduled for that volume. The first run succeeded, the archive was
  downloaded and its contents inspected. It is local-only for now: no off-site copy of the
  volume exists yet, and the procedure still says so.
- Hetzner automatic VPS backups are active, which currently covers the volume against losing
  the server.

Deferred to the deploy: the upload-then-redeploy check, the restore drill, and the runbook
section. The restore drill also needs the future dump, which will carry the media migrations.

