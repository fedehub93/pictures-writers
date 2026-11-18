# 03: Selezione multipla e dialoghi — azioni in blocco, rinomina, sostituzione file

**What to build:** le operazioni che non stanno dentro una singola card funzionano sul nuovo data layer e si riflettono subito su ciò che si vede. Selezionare più card della pagina corrente e archiviarle in un'unica conferma, oppure eliminarle definitivamente in un'unica conferma quando si è nella vista archiviata. La selezione riguarda solo ciò che è visibile e si azzera cambiando pagina. Rinominare una Media e cambiarne il testo alternativo dal dialogo, con il nuovo nome visibile in griglia appena si chiude. Sostituire il file di una Media senza cambiarne identità, con la griglia che riflette la nuova revisione. Ogni rifiuto continua a spiegare perché.

**Blocked by:** 02 (La pagina Media — shell, spostamento nel modulo e azioni per singola card)

**Status:** done

- [x] Selezionare più card e archiviare esegue una sola operazione in blocco e una sola conferma, e la griglia, il conteggio e la quota si aggiornano insieme.
- [x] Selezionare più card archiviate ed eliminare esegue una sola operazione in blocco e una sola conferma, con le stesse guardie della singola eliminazione.
- [x] La selezione è limitata agli elementi visibili e si azzera quando cambia la pagina, la ricerca o la vista.
- [x] La rinomina e il testo alternativo si modificano dal dialogo esistente tramite il router; il nuovo nome compare in griglia senza ricaricare la pagina.
- [x] La sostituzione del file resta sulla rotta che scrive i byte ma invalida lista e testata, così la revisione e la miniatura aggiornate sono visibili subito.
- [x] Un'eliminazione rifiutata perché la Media è referenziata mostra il messaggio con il numero di riferimenti, e la griglia resta invariata.
- [x] Un'eliminazione rifiutata perché la Media non è archiviata lascia la card nella vista Library con il messaggio atteso.
- [x] Dopo un'azione in blocco parzialmente rifiutata, l'interfaccia riporta l'errore e non lascia una selezione fantasma su elementi che non esistono più.
- [x] Lint, typecheck e la suite esistente sono verdi.

## Comments

**2026-11-18** — Landed in `b37019e8` (`feat(media): refresh the library from bulk and dialog actions`).

- The edit dialog now saves through `media.update` (name and alt text only), closes, and invalidates `getMany` + `getMeta` instead of calling `router.refresh()`. Its copy says Media, matching the glossary.
- The replace dialog keeps the byte route untouched; on success it closes and invalidates the same two reads, so the new revision and thumbnail replace the cached ones. It no longer refreshes the route.
- The upload dialog joined the same invalidation: it was the last `router.refresh()` in the media surface, which the spec calls a leftover. A new upload now lands at the top of the grid through the list refetch.
- Bulk archive and delete call the batch procedures with the current ids and invalidate both reads on every exit path, including a refusal, so a batch rejected by another tab's changes resyncs the grid, count and quota. The grid receives `selectedIds` (visible ids only) rather than the raw checked state, and the subtree still remounts on a page, search or view change.
- Review follow-up: the replace dialog's generic error message was left as "Something went wrong" (an axios error's own message is less readable), the edit dialog names a missing id instead of returning silently, and invalidation no longer blocks the dialog close.

Verification: lint 0 errors (257 pre-existing warnings); `npm run typecheck` green; full suite 281 files / 2497 tests green. Browser probe in the agent environment: renaming through the dialog changed the grid name and closed the dialog with one document navigation entry; bulk archive of two cards used one confirmation, reported “Archived 2 Media” and removed both from Library; the archived view listed them; bulk permanent deletion of two used one confirmation and reported “Deleted 2 Media permanently”; a refused batch of two archived Media where one was referenced showed “referenced by 1 content item”, left both cards and the count at 2, and the server log shows the 409 `removeMany` followed by a `getMany` + `getMeta` refetch. The replace flow was verified by code inspection and its route tests, not driven end to end: the agent environment has no UploadThing token to exercise the upload half. The not-archived deletion guard is not reachable from the page (Delete is only offered on archived cards and in the archived view); it is covered by the router test from ticket 01 and by the same refusal-resync path above.
