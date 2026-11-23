# 11: The address sweep

**What to build:** A command rewrites every absolute provider address stored anywhere into the canonical address of the file it points to, in every field the product stores content in, and reports what it could not resolve. Running it twice changes nothing the second time.

**Blocked by:** 04

**Status:** done

- [x] Absolute addresses in page and post bodies, rich text, ad items, the logo setting, form submission data, email attachment urls and user images are rewritten to the canonical form.
- [x] A second run reports zero changes.
- [x] Unresolvable addresses are reported by field and by count, never by full address.
- [x] The command reports how many files it touched, and the audit stays green afterwards.
- [x] Rewriting changes no file's key, revision or driver.
- [x] A dry run reports what would change without writing.

## Comments

**2026-11-20**

Landed in `98b9f40b` (`feat(media): sweep legacy provider addresses into canonical ones`).

- `npm run media:sweep-addresses` builds one index from every Stored file and rewrites the
  provider URL, the legacy `/assets/` shape and an absolute address the library already recorded
  into the canonical address of the file it names. It covers `Media.url`, page, site-region and
  post Puck/body data, product rich text, ad items, the logo setting, form submission data, both
  user image columns and the legacy `EmailAttachment` rows. Ordinary external links are left
  alone.
- A content address names each rendition by its own `/media/<key>` path, so a later move cannot
  leave a provider URL inside a page. `Media.url` keeps the rendition token it already carries,
  because the delivery route reads the provider's rendition address from it until the bytes move;
  a local row is rebuilt with own-domain rendition addresses instead.
- A rendition the original key cannot own (a flat or three-segment legacy key) is left out of the
  token rather than written as an address the route would answer 404. The delivery route's
  ownership rule is mirrored in `canonicalMediaAddress`.
- The run writes no Stored file: keys, revisions, drivers and remote locations are read, never
  changed. It is idempotent; `--dry-run` / `media:sweep-addresses:dry-run` performs the same reads
  and report without writing. The report gives per-field rows, rewritten and unresolved counts and
  the distinct files touched; an unresolved address is left exactly as it was and the command
  exits `1`.
- The sweep is a CLI one-off, so it cannot invalidate the running server's in-memory ISR cache.
  `docs/media.md` records that a cached page keeps the provider address until the 24h backstop or
  the next deploy, and that the provider address still answers until the purge, so no visitor sees
  a broken picture.
- The address index shares the rendition-location guard with Re-home through
  `src/modules/media/lib/renditions.ts`; `docs/media.md`, ADR-0026 and the glossary's Address sweep
  entry record the command, the canonical content token and the prerequisite order (location
  backfill, then the sweep, then Re-home).

Tests: a new suite seeds every listed field and asserts the rewrite, an untouched external link,
no change to Stored-file keys, drivers or remote locations, a Media's key/revision/driver, a green
audit, a second run with zero changes and a dry run that writes nothing. It also puts an
unresolvable provider URL into a page and a post and asserts the field/count report, the exit code
and that neither the formatted report nor the JSON carries the address. Pure tests cover the
legacy `/assets/` shape and a flat key, the rendition prefix guard, the row-token preservation and
the content composer.

Verification: `npm run test:run` — 292 files, 2651 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (247 pre-existing warnings); `npm run check:doc-citations` 97 docs / 0
broken; `npm run build:agent` succeeded. No browser probe was run for this ticket.

**2026-11-23 — the index missed every rendition address (found on the existing Installation)**

Ticket 15's dry run on a production dump reported `unresolved: 4044` — 2544 in
`PostVersion.bodyData`, 1485 in `PostVersion.tiptapBodyData`, and 15 across the scalar fields.
A Media's rendition manifest records the provider address each generated file was written with
(`https://<provider>/f/<opaque id>`), and stored content names those addresses: a `srcset`
copied with an article is the common shape — one resolvable original plus seven unresolvable
renditions per image. The index put only `StoredFile.remoteUrl` in `byAddress`, and the
provider's opaque id is not the Installation's key, so every rendition address fell through to
`unresolved` while the provider still served it.

The sweep now indexes each rendition's recorded address too, resolved to that rendition's own
`/media/<key>` path — never to the original's, which would lose the width and the format the
content asked for. The fixture that had signed this ticket off encoded the Installation's key in
the provider URL, so `storageKeyFromMediaUrl` resolved it by key; the address the provider
actually issues (an opaque id) is now the fixture's shape, and a `srcset` case asserts the
rewrite and a second run at zero.

Verification: `npx vitest run src/modules/media` — 27 files, 293 tests passed; `npm run
typecheck` clean; `npx eslint` on the three changed files clean. The real-data proof belongs to
ticket 15: re-run `media:sweep-addresses:dry-run` and compare `unresolved` (expected: only
addresses that name an object no Stored file owns remain).

Landed in `72eed7b9` (`fix(media): resolve a rendition's recorded address in the sweep`).

The run also narrowed to the content a visitor can reach — each root's live version and current
head — and `PostVersion.bodyData` left the list for good. On the 2026-11-23 dump that is
`rows: 8`, `addresses rewritten: 8`, `unresolved: 549`, and none of the 549 is an unreachable
object: the dead set sits entirely in superseded versions, which the sweep no longer reads.

`PostVersion.bodyData` left the field list the same day: the renderer never reads it, a save only
carries it forward, and the column is slated for removal, so a provider address inside it is not
a dependency of the product. On the dump of 2026-11-23 the dry run then reports `rows: 44`,
`addresses rewritten: 44`, `unresolved: 1500` instead of `90 / 4044` — the residual is now only
the content a visitor can reach, plus the historical post versions.

Executed on the production dump of 2026-11-23 09:39 UTC (725 Media, 726 Stored files, 11,296
recorded rendition addresses, 99 migrations): the report is unchanged — `rewritten: 90`,
`unresolved: 4044`. The fix resolves nothing on that data, because no address in content equals
an address recorded for a rendition (`by_rendition_url = 0`). The residue has a different cause,
recorded on ticket 15: 500 distinct provider objects that no Stored file records. The change
still stands on its own — a rendition's recorded address is an address the library knows and
must be able to rewrite — but it does not close ticket 15's gate.
