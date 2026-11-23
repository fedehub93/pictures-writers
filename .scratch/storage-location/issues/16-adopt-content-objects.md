# 16: Adopt the provider objects content still names

**What to build:** A command that turns every provider object the address sweep reports unresolved into a Media of the Installation, without moving a byte: the object already exists at the provider, so the run records its address as the file's remote location, creates the Stored file and its Media role, and lets the sweep rewrite the content to the canonical address. An address whose object no longer answers is reported by field and left for a content repair, never invented.

**Blocked by:** 11, 13

**Status:** ready-for-agent

- [ ] Every address the sweep reports unresolved is either adopted or listed as an object the provider no longer has.
- [ ] Adoption creates one Stored file and one Media per object, records the provider address as the remote location and writes no byte; a second run adopts nothing.
- [ ] An object whose bytes equal an existing Media's is relinked to that Media instead of duplicated, proved by size then checksum.
- [ ] After the run the sweep rewrites every adopted address to `/media/<key>` and a second sweep reports zero.
- [ ] The audit stays green and the quota counts the adopted bytes; a dry run reports the plan without writing.
- [ ] The unreachable references are reported by field and count, and the documentation says what the owner does with them.

## Comments

**2026-11-23 — scope refined**

`PostVersion.bodyData` is out of every scope: it is not rendered, `save-post` only carries it
forward, and the column is slated for removal, so objects named only by it are not adopted.

Every unreachable reference found so far sits in a superseded post version; the live versions
hold 462 distinct provider addresses and none is unreachable. The adoption run therefore targets
the live objects (≈439, ≈69 MB), and the dead references are either removed from the historical
versions by a reported one-off or accepted — a decision for the owner, not a blocker for the
re-home (only for the purge).

## Comments

**2026-11-23 — measured scope, on the dump of 2026-11-23 09:39 UTC**

The sweep's `unresolved: 4044` are **507 distinct addresses**: 505 provider objects and 2
`/files/` paths. No Stored file records any of them as a key, a remote address or a rendition
address, which is why the ticket-11 fix changes no number on this data.

Each address was asked for its object:

| state | objects | referenced by current content |
| --- | --- | --- |
| answers at the address content has | 360 | 339 |
| answers only on `ghhc7ejbae.ufs.sh` with the same id (old `utfs.io` host retired) | 79 | 76 |
| no longer answers anywhere | ~66 | see the run's report |

- Live objects: **≈439**, about **69 MB**, types `image/jpeg` 344, `image/png` 12, `image/webp` 1,
  `image/gif` 1, `application/pdf` 2. Counts move by a few between probes because a provider HEAD
  can time out; the command reports the exact list.
- Identity: of the 360 that answer, only 8 have a byte size equal to a library original or a
  recorded rendition (4 unique originals, 3 renditions, 1 ambiguous) — so these are not the
  library's pictures under another address. They were never in the library.
- The 21 live objects referenced only by the legacy `bodyData` are stored content all the same;
  the run adopts them unless the owner decides the legacy body is out of scope.
- The unreachable ones are already broken images today: the provider does not have them, so no
  sweep and no adoption can make them answer. They need a content decision (remove the
  reference, or replace it with a Media), and that is a ticket of its own if the owner wants them
  repaired rather than accepted.

Open questions the run must settle:

1. **Host alias.** 79 objects answer only under the current provider host while content names the
   retired one. The adoption records the address that answers; the content address is rewritten
   to the canonical Media address in the same run, so no provider host survives.
2. **Duplicates.** Size is a proxy, not a proof. When a size matches, the run compares checksums
   and relinks on equality; a near-duplicate with different bytes becomes its own Media.
3. **Legacy body.** Whether an object referenced only by `PostVersion.bodyData` is adopted (it is
   stored content) or accepted.
