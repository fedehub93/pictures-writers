# 16: Relink the content to the Media the library already holds

**What to build:** A command that, for every provider address live content still names, fetches the object and matches its bytes against the library: when a Media already owns that file's bytes the content is rewritten to that Media's canonical address, with no new row and no byte moved; an object no Media matches is adopted (a Stored file recording the provider address plus its Media role, still moving no byte); an object the provider no longer has is reported. The outcome is that `media:sweep-addresses` reports zero and the library gains no duplicate.

**Blocked by:** 11, 13

**Status:** done

- [x] Every address the sweep reports on live content ends relinked to an existing Media or adopted, and the run reports each group by field and count.
- [x] A relink writes no Stored file and no Media: the content address becomes the canonical address of the Media that already owns those bytes.
- [x] An object matching more than one library file resolves deterministically and is reported (six checksums are already shared inside the library).
- [x] An unmatched object is compared perceptually before adoption, so a re-encoded copy of a Media is relinked instead of duplicated.
- [x] A dry run reports the plan without writing, a second run reports zero, and the audit stays green afterwards.
- [x] After the run `media:sweep-addresses:dry-run` reports zero unresolved addresses.

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
perceptually as well.

**It must run before ticket 17.** The reason the match works is the defect ticket 17 repairs:
`StoredFile.checksum` still describes the *source* bytes, and the content objects are exactly
those sources. Repairing the column first would overwrite the only record that ties a content
object to its Media. So the order is: relink (16), then repair the checksums (17), then re-home.
Once the repair has run, a future relink would have to compare against a normalised copy instead,
which is why this is a one-off and its contract is written here rather than left implicit.

**2026-11-23 — landed and run on the production dump**

Landed in `e908f047` (`feat(media): relink content objects to the media that owns their bytes`).

- `npm run media:relink-content` builds the sweep's unresolved set, fetches each object from the
  address content names, and falls back to the same provider key on the current host the library's
  remote rows record. It matches sha256 against every Media's Stored file and relinks content to
  the owner's canonical address, writing no row and no byte; several owners resolve by
  visible-before-archived, then oldest, then lowest id, and are counted per field and in total.
  An unmatched object is compared with every image the library holds by a 9x8 difference hash
  (six of sixty-four bits) before adoption; only a genuinely new object becomes a Media + Stored
  file recording the provider key and the address that answered, still moving no byte. Two
  addresses for the same new object add one Media. The run ends as an ordinary sweep carrying its
  decisions, so live-content scope, idempotence and the no-write dry run are unchanged.
- The provider's key API no longer resolves these pre-seam keys on the current token (the library's
  own `driver.get` returns `StorageObjectNotFoundError` too), but the recorded addresses still
  serve the bytes: the command reads the address, which is what delivery does. The two addresses
  in the old `/a/<appId>/<fileKey>` shape are now parsed to their file key by
  `storageKeyFromMediaUrl`, alongside `/f/<key>`; the sweep and the relink share that parser.
- ADR-0026 and `docs/media.md` §Relink record the contract and the order before ticket 17; the
  glossary gains Relink and Adoption.
- Review: the two-axis review's Standards findings were applied (shared group mapping and nearest
  match, no key fragment in an adopted Media's name, a test for the failed-adoption branch, tests
  using `checksumOf`, the tally derived from the field, glossary entries, shorter script docs).
  The Spec review's findings were applied or answered in the design: the source-checksum shape is
  now a test, ambiguity is per field, adoption records the address that answered, and the legacy
  `/assets/` shape resolves through the current provider host.

Real run on the restored production dump of 2026-11-23 09:39 UTC (`pictures_writers_dev`, a safety
dump was taken first at `%TEMP%\pre-relink-16.dump`): `addresses: 469`, `relinked: 465` (460 by
checksum, 5 by perceptual match — the five objects the ticket predicted could be re-encoded
copies), `adopted: 4`, `ambiguous: 5`, `unreachable: 0`, `sweep rewritten: 557`,
`sweep unresolved: 0`. The field rows were `PageVersion.puckData 1/1/0`, `PostVersion.tiptapBodyData
540/540/0`, `AdItem.imageUrl 3/3/0`, `FormSubmission.data 0/2/0`, `User.imageUrl 0/2/0`
(relinked/adopted/unreachable). The library went from 726 to 730 Stored files: exactly the four
adoptions, so the 5 perceptual matches added no duplicate.

Verified after the run:

- `npm run media:sweep-addresses:dry-run` — `files: 0`, `rows: 0`, `addresses rewritten: 0`,
  `unresolved: 0`.
- `npm run media:relink-content:dry-run` again — `addresses: 0`, everything zero (second run).
- `npm run media:audit` — `files: 730`, `uploadthing=730`, `unresolved: 0`.
- `npm run test:run` — 295 files, 2676 tests passed; `npm run typecheck` clean; `npm run lint`
  0 errors (250 pre-existing warnings); `npm run check:doc-citations` 97 docs / 0 broken;
  `npm run build:agent` succeeded. No browser probe was run.

The checksum-repair command of ticket 17 has **not** run, so the order this ticket requires still
holds: relink (done), then 17, then re-home.
