# 06: Integrazione e verifica

**What to build:** il ramo è unificabile. Dopo la cancellazione della superficie REST, il progetto compila, i controlli che la CI esegue passano tutti, e la build di produzione — che la CI non esegue ma che questa modifica richiede perché tocca il routing — riesce. Un passaggio manuale nell'ambiente agente conferma che le cinque capacità della libreria funzionano insieme e non solo in isolamento.

**Blocked by:** 05 (Contrazione — via la superficie REST del CRUD)

**Status:** done

- [x] Lint è verde.
- [x] Typecheck è verde.
- [x] La suite di test completa è verde.
- [x] La build di produzione riesce.
- [x] Il controllo dei riferimenti documentali è verde, e nessun documento cita un percorso che la modifica ha spostato o rimosso.
- [x] Nell'ambiente agente, la libreria mostra il conteggio coerente con la ricerca, cambia vista conservando la ricerca, pagina con il controllo condiviso e mantiene il numero di Media per pagina atteso.
- [x] Nell'ambiente agente, archiviare una Media la toglie dalla vista Library, ripristinarla la riporta, e un'eliminazione rifiutata spiega il motivo.
- [x] Nell'ambiente agente, eliminare definitivamente una Media archiviata aggiorna la quota mostrata.
- [x] Nell'ambiente agente, il selettore di Media si apre da un contenuto, cerca e carica altri elementi a gruppi di 12.
- [x] Lo stato del repository è pulito: nessuno screenshot, log o file di lavoro rimasto indietro, e i file dei ticket sono l'unica cosa non ancora committata.

## Comments

**2026-11-19** — Closed by `7c122f06`, with `376315df` as the cleanup from the closure review.

What changed:

- `scripts/seed-agent.ts` now creates the probe post's SEO row through `createPostVersionSeo` and repairs a version a previous seed left without one (current and live version when they differ). Ticket 04 left this gap: the probe post's admin page crashed on `CharsCounter` before the picker could open.
- Dropped the unused `MediaSearchParams` export, the `MediaLibraryView` re-export in `media-library.ts`, and the stale refactor-narrative comment on `DEFAULT_PAGE_SIZE`.

Verification:

- `npm run lint` 0 errors (257 pre-existing warnings); `npm run typecheck` green; `npm run test:run` 279 files / 2487 tests green; `npm run check:doc-citations` 95 docs, 0 broken citations.
- `npm run build` green. The first attempt hit a transient Prisma `timeout exceeded when trying to connect` while the full suite was running in parallel; the rerun on its own succeeded.

Browser probes, agent database, production build through `next start`:

- Library: 20 active fixtures plus 2 archived. Header "20 entry found", 8 cards per page, "Page 1 of 3"; Next wrote `?page=2` with 8 cards on "Page 2 of 3"; Previous returned to page 1. Search "Probe Media 1" wrote `?search=Probe+Media+1`, header 10 and "Page 1 of 2". Archived kept the search in the URL and in the input (`?search=Probe+Media+1&view=archived`), header 0 with "No archived Media found"; clearing the search showed the 2 archived.
- Archive and restore: searching "Probe Media 20" and archiving it drove the header 1 → 0 with "No Media found" and toast "Media archived"; Archived kept the search and showed the Media; Restore drove it 1 → 0 with toast "Media restored"; Library showed it again.
- Refused deletion: Probe Archived 01, referenced by the probe post's SEO row. The confirm dialog said "1 content item still references it"; confirming returned the toast "This media is referenced by 1 content item. Remove those references before deleting it." and the card stayed.
- Permanent deletion: Probe Archived 02 was removed with toast "Media deleted permanently"; the quota moved from "10.02 MiB of 5 GiB" to "21.48 KiB of 5 GiB".
- Picker, opened from the probe post's image cover: 12 tiles from `media.getMany` (`pageSize: 12`, page 1); Load More fetched page 2 and left 20 tiles with "Nothing more to load"; searching "Probe Media 1" returned 10 tiles with the library's semantics; Escape closed the dialog and the cover stayed empty.
- Probe fixtures (20 active and 2 archived Media, plus the SEO reference) were removed afterwards; the `Media` table is back to 0 rows.

Notes:

- Probes ran against `next start` because `next dev` in this checkout entered a ~4 s full-document reload loop on admin pages. It reproduced on `/admin/posts/` too, next to a pre-existing "empty string passed to src" warning in the admin shell; unrelated to media, so the production build was used for a stable run.
- The picker modal keeps its "asset" copy ("Add existing asset", "Search for assets") because ticket 04 froze it.
- `removeMany` still resolves one storage driver for the whole batch, exactly as the deleted REST routes did; per-row driver deletion is a storage-seam follow-up, not a regression from this refactor.
- Two marketing docs were already uncommitted before this ticket; per their owner they were committed separately in `671d84a4` (`docs(marketing): add the pitch deck service definition`).
