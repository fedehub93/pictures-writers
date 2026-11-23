# 16: Relink the content to the Media the library already holds

**What to build:** A command that, for every provider address live content still names, fetches the object and matches its bytes against the library: when a Media already owns that file's bytes the content is rewritten to that Media's canonical address, with no new row and no byte moved; an object no Media matches is adopted (a Stored file recording the provider address plus its Media role, still moving no byte); an object the provider no longer has is reported. The outcome is that `media:sweep-addresses` reports zero and the library gains no duplicate.

**Blocked by:** 11, 13, 17

**Status:** ready-for-agent

- [ ] Every address the sweep reports on live content ends relinked to an existing Media or adopted, and the run reports each group by field and count.
- [ ] A relink writes no Stored file and no Media: the content address becomes the canonical address of the Media that already owns those bytes.
- [ ] An object matching more than one library file resolves deterministically and is reported (six checksums are already shared inside the library).
- [ ] An unmatched object is compared perceptually before adoption, so a re-encoded copy of a Media is relinked instead of duplicated.
- [ ] A dry run reports the plan without writing, a second run reports zero, and the audit stays green afterwards.
- [ ] After the run `media:sweep-addresses:dry-run` reports zero unresolved addresses.

## Comments

**2026-11-23 — it is a relink, not an adoption**

Measured on the dump of 2026-11-23 09:39 UTC, over the 460 distinct provider addresses the live
and current versions still name:

| finding | addresses |
| --- | --- |
| sha256 equal to exactly one library file's checksum | 452 |
| sha256 equal to several library files' checksums | 3 |
| no library file has those bytes | 5 (4.4 MB) |
| unreachable | 0 |

So the content objects are not new pictures: they are the bytes the library already derived its
Media from (the pre-normalisation sources, which is why they hash to the checksum the backfill
recorded — see ticket 17). Adopting them would have created about 460 duplicate Media and taken
the library from 725 to roughly 1,185 rows for nothing.

The command therefore relinks first and adopts only what no Media matches, checking those five
perceptually as well. It also has to run after ticket 17, because once the checksums describe the
stored bytes the match must be made against the stored copy, not the source; the two tickets must
agree on which bytes the checksum means.
