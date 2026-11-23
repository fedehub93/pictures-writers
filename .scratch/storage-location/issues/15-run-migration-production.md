# 15: [human] Run the migration on the existing Installation

**What to build:** The existing Installation ends with every file on local disk, every address canonical, and no dependency on the provider — without a visitor seeing a broken picture. The sweep runs first, then the re-home, then the purge after the grace window, with a green audit between steps.

**Blocked by:** 11, 12, 14

**Status:** ready-for-human

- [ ] The sweep reports zero residuals and every existing Media answers on its canonical address.
- [ ] The re-home moves all 720 plus every attachment and avatar, and no key, revision or address changed.
- [ ] The audit is green before and after each step.
- [ ] After the grace window the purge removes exactly the recorded objects, and the provider resolves none of them.
- [ ] The provider token is removed from the environment and the library, the site, the forms and the email attachments still work.
- [ ] The documentation no longer describes the mixed library as an end state, and the ADR records the transition instead.

## Comments

**2026-11-23 — the dry run's 4044 residuals are explained; re-run before the re-home**

`media:sweep-addresses:dry-run` on a production dump reported `unresolved: 4044`
(`PostVersion.bodyData` 2544, `PostVersion.tiptapBodyData` 1485, `PageVersion.puckData` 8,
`AdItem.imageUrl` 3, `FormSubmission.data` 2, `User.imageUrl` 2). The cause was the sweep's
index: it did not know the provider address each rendition was written with, so a `srcset`
copied into an article resolved nothing. Fixed in ticket 11, `72eed7b9`.

Re-run the dry run with this build. The expected residue is only addresses that name an object
no Stored file owns — the 15 in the scalar fields are the current candidates. Each one must be
adopted into the library (bytes copied, `StoredFile` + `Media` created, then swept) or accepted
in writing before the first box can be ticked; an accepted one stays a provider dependency and
keeps its bytes alive past the purge.

One check before the purge, from the same probe: `/media/<key>` on production answered `200`
with UploadThing's headers (`x-ut-trace-id`, `cache-control: max-age=86400`) instead of the
route's `302`. Either something in front of the application rewrites `/media/*` to the provider,
or the deployed build is not this code. Confirm the delivery route is what answers before the
local bytes have to travel through it.
