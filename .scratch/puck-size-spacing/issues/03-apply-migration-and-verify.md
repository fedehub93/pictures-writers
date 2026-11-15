# 03: Apply the migration and verify the split

**What to build:** Convert the stored documents and check the result with a human in the loop. This is the step that turns code and data into one shape, and it touches databases, so it needs an explicit confirmation before it writes.

**Blocked by:** 01, 02

**Status:** ready-for-human

- [ ] The dry run against the development database is reviewed: scanned rows match the number of Page and Site region versions, every changed document lists the spacing keys it would move, warnings are explained, and there are no failures.
- [ ] The write runs only after the owner confirms it.
- [ ] A second run reports zero changes, which is the proof that the transform is idempotent on real data.
- [ ] A migrated page opens in the editor with its authored values: Size shows width, height, max width and min height, Spacing shows the margins and paddings, at desktop, tablet and mobile, and the reset dot still clears a value at the current breakpoint.
- [ ] The same page shows both sections closed by default and independently openable.
- [ ] The published markup of a migrated page carries the same class list and the same style variables as before the migration.
- [ ] The code path, not the data, is checked in the agent environment through the editor browser probe.
- [ ] The production rollout is decided and written down: backup, deploy, migrate, restart — or the expand/contract alternative named in the spec. The chosen order is recorded in the ticket comment.

## Implementation notes

- Commands: `npm run puck:migrate-size-spacing:dry-run`, then `npm run puck:migrate-size-spacing`. Both read `DATABASE_URL`, so the same pair runs against whichever environment is loaded.
- The development database is the owner's data. Take a dump before the write if the run is not a trivially small one, and prefer a restore over a hand edit if something is wrong.
- Verify code and data separately: the agent environment seeds its own page and is the place for the browser probe, while the development database is the place where the real documents and their authored values live.
- Production, if page or Site region documents already exist there: backup, deploy, then run the migration as soon as the new container serves, then restart the container. Migrating before the deploy breaks the live site for the whole build, because the old code reads only `dimension`; migrating after the swap breaks it for the length of the script. The restart clears the in-memory ISR and `unstable_cache` entries: the migration writes rows without calling `revalidatePath`, so a page rendered during the window would stay cached unstyled until the 24h backstop. See `docs/self-hosting/08-operations-runbook.md`.
