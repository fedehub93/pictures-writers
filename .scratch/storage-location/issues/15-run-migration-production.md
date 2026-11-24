# 15: [human] Run the migration on the existing Installation

**What to build:** The existing Installation ends with every file on local disk, every address canonical, and no dependency on the provider — without a visitor seeing a broken picture. The sweep runs first, then the re-home, then the purge after the grace window, with a green audit between steps.

**Blocked by:** 11, 12, 14

**Status:** ready-for-human

- [ ] The sweep reports zero residuals and every existing Media answers on its canonical address.
- [x] The re-home moves all 720 plus every attachment and avatar, and no key, revision or address changed.
- [ ] The audit is green before and after each step.
- [ ] After the grace window the purge removes exactly the recorded objects, and the provider resolves none of them.
- [ ] The provider token is removed from the environment and the library, the site, the forms and the email attachments still work.
- [x] The documentation no longer describes the mixed library as an end state, and the ADR records the transition instead.

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

**2026-11-23 — the dump is verified and the residue has a cause of its own**

Restored `pg-dump-pictures_writers-1795426748` (created 2026-11-23 09:39 UTC, PG 18.6) into the
development database: 725 Media, 726 Stored files, 11,296 recorded rendition addresses, 99
migrations — the post-backfill state. `media:sweep-addresses:dry-run` reports `rewritten: 90`,
`unresolved: 4044`, exactly as before, and the ticket-11 fix changes neither number.

The 4044 are 4,029 occurrences of **500 distinct provider objects that no Stored file records**:
none matches a stored key, a stored remote address or an address recorded for a rendition. 465
of them are referenced by current content (`tiptapBodyData`), 33 only by the legacy `bodyData`,
2 elsewhere; all but a handful are on the older `utfs.io` host. Seven more sit in `AdItem`,
`FormSubmission` and `User`, and eight in the Puck data — the same class. The 90 rewritten
addresses come from a few images inserted after the storage seam, whose URL is
`/f/<namespaced key>` (5 distinct files, one of them repeated across 19 product descriptions).

So the sweep cannot close this gate: there is nothing to join on. Each of those objects must be
either relinked to an existing Media (if it is the same picture the library already holds) or
adopted as a Media of its own, recording the provider address as its remote location so the
sweep can rewrite the content and the re-home can copy the bytes. That is ticket 16, and this
gate stays blocked until the dry run reports only accepted addresses.

Measured on the same dump (2026-11-23, read-only, one HEAD per object): of the 505 provider
objects, 360 answer at the address content has, 79 answer only on the current `ufs.sh` host with
the same id (the `utfs.io` host is retired), and about 66 no longer answer anywhere — those
images are already broken today. The live ones are ≈439 objects, ≈69 MB. Only 8 of them have a
size equal to a library original or a recorded rendition, so they are new Media, not duplicates
of the library. Ticket 16 owns the run; the unreachable references need a content decision of
their own.

**Later the same day — the legacy body is out of scope, and nothing live is broken**

`PostVersion.bodyData` left the sweep's field list (the renderer never reads it and the column is
slated for removal), so the dry run now reports `rows: 44`, `addresses rewritten: 44`,
`unresolved: 1500`.

Split by what a visitor can see: the versions the roots mark as live (`PostRoot.liveVersionId`)
hold 462 distinct provider addresses and **none of them is unreachable**; the current heads hold
none either. Every unreachable reference sits in a superseded version. The one inspected by hand
is `concorso-tre-colori-2027`, version 4, status `CHANGED`, an `image` node with alt "Concorso
Tre Colori 2027: Iscriviti": 404 at its `utfs.io` address and 404 on the current host with the
same id, and absent from the published page.

So the site has no broken picture today. The repair is either to remove those nodes from the
historical versions (a reported one-off, dry run first) or to accept them; neither blocks the
re-home, only the purge.

**Then the owner narrowed the contract to what a visitor can reach.** The sweep reads each root's
live version and its current head only, plus the single-row content; a superseded version is out
of scope, and `PostVersion.bodyData` went with it. The same dump now reports `rows: 8`,
`addresses rewritten: 8`, `unresolved: 549` — 540 in live/current post bodies, 2 in Puck data, 5
across `AdItem`, `FormSubmission` and `User`. Every one of those addresses is an object the
provider answers for; the unreachable set now sits entirely in superseded versions. So this gate
needs no content repair: relink the ≈460 live objects to the Media that already owns their bytes
(ticket 16), sweep to zero, re-home, purge.

**Before the re-home: the checksum column is wrong for almost the whole library.** Re-fetching the
708 remote originals whose record carries a checksum gives the exact `size` but a different
sha256 in 706 cases, because `media:backfill-renditions` recorded the checksum of the bytes it
read as a source against the normalised copy it wrote. `moveStoredFile` refuses a file whose
source bytes do not hash to the record (`rehome.ts:403-406`), so a re-home today would move 2
files and refuse 706. Ticket 17 repairs the column; the re-home step waits for it.

**2026-11-24 — production run in progress; purge pending**

Deploy of the branch that carries the live-only sweep, the relink, the checksum repair and the
re-home code. The active driver was already `local`; the library was still entirely on
`uploadthing` (730 files).

- `media:relink-content:dry-run`: `addresses 469`, `relinked 465` (460 by checksum, 5 by
  perceptual match), `adopted 4`, `ambiguous 5`, `unreachable 0`, `failed 0`,
  `sweep addresses rewritten 557`, `sweep unresolved 0`.
- `media:relink-content` real: completed. The following `media:sweep-addresses:dry-run` reported
  `files 0`, `rows 0`, `rewritten 0`, `unresolved 0`.
- `media:audit` after the relink: `files 730`, `uploadthing=730`, `unresolved: 0`. The four
  adoptions brought the library from 726 to 730.
- `media:repair-checksums`: completed before the move; the move then finished with no
  `checksum-mismatch`. The exact repair counts were not captured in this note (add them if the
  output is kept).
- `media:rehome` from the library panel: completed. `media:audit` after it:
  `files: 730`, `drivers: local=730`,
  `bytes: accounted=387748620 localAccounted=387748620 localOnDisk=387748620 localDifference=0`,
  `objects: accounted=12026 onDisk=12026 missing=0 orphaned=0`, `unresolved: 0`.

The five ambiguous relinks are images already duplicated inside the library; the choice is
deterministic and was reported. The field rows count occurrences, not distinct addresses, so
`User.imageUrl occurrences=0 ... adopted=2` is a field-tally quirk; the totals are authoritative.
Documentation committed in `f8f91f9a` (`docs(media): describe the mixed library as a transition`).

Still open:

- the canonical-address check over every existing Media (HTTP) — the sweep is zero, but the full
  check was not recorded here;
- the seven-day grace window;
- `media:purge -- --driver uploadthing`, and the provider resolving none of the objects
  afterwards;
- removing `UPLOADTHING_TOKEN` and verifying the library, pages, forms, email attachments and
  avatars.

`ready-for-human` stays until the purge and the token removal.
