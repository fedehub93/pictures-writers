# 01: Data layer — router `media`, parametri URL, hook e test

**What to build:** le procedure che governano lettura e gestione della libreria Media esistono e sono provate, mentre la pagina attuale continua a funzionare come prima. Un amministratore non vede ancora alcun cambiamento: questo è il passo di espansione, la nuova forma affianca la vecchia senza romperla. Ciò che si guadagna è che ogni regola della libreria (paginazione, ricerca, vista attiva/archiviata, conteggio d'uso, guardie su archiviazione ed eliminazione) ha un solo posto dove vive ed è verificabile senza aprire un browser.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Un router tRPC `media` è registrato nell'applicativo e le sue procedure hanno i contratti concordati: `getMany({ page, pageSize, search, view })` restituisce `{ items, total, totalPages }`; `getMeta({ search, view })` restituisce `{ total, quota, storage }`; `update({ id, name, altText })`; `archive({ ids })`; `restore({ ids })`; `removeMany({ ids })`.
- [x] Ogni procedura dichiara il proprio permesso in modo esplicito — lettura per `getMany` e `getMeta`, aggiornamento per `update`, `archive` e `restore`, eliminazione per `removeMany` — e nessuna dipende dalla derivazione del permesso dal nome della procedura.
- [x] `getMany` usa pagina 1 e 8 elementi come default, limita `pageSize`, filtra per nome senza distinzione di maiuscole, filtra per vista attiva o archiviata, ordina per data di creazione discendente con l'id come spareggio deterministico, e restituisce per ogni elemento il conteggio dei riferimenti relazionali.
- [x] `total` e `totalPages` di `getMany` sono coerenti con gli stessi filtri usati per gli elementi.
- [x] `getMeta` calcola `total` con gli stessi filtri della griglia e restituisce quota e scelta del driver dalle sorgenti già esistenti, senza duplicarne l'aritmetica.
- [x] `archive` e `restore` accettano una lista di identificativi, sono idempotenti e non esiste una procedura separata per la rimozione di una singola Media.
- [x] `removeMany` rifiuta una Media attiva, rifiuta una Media ancora referenziata indicando quante referenze la bloccano, e quando l'operazione è consentita elimina righe e prefisso di archiviazione.
- [x] `update` modifica esclusivamente nome e testo alternativo.
- [x] I parametri URL sono `search`, `page` e `view`, con i default e la pulizia dall'URL quando tornano al default, leggibili sul server da un loader e scrivibili sul client da un hook.
- [x] Esistono funzioni di prefetch per la lista e per la testata, utilizzabili dalla pagina.
- [x] Un test di integrazione del router, eseguito contro il database di test, copre: busta di paginazione e seconda pagina, ricerca senza distinzione di maiuscole, filtro attiva/archiviata, ordine deterministico, conteggio dei riferimenti relazionali, `getMeta` coerente con i filtri, `update` che non tocca altri campi, idempotenza di `archive` e `restore`, i rifiuti di `removeMany` e la cancellazione consentita, e l'identificativo inesistente.
- [x] La pagina Media attuale funziona invariata, e lint e typecheck sono verdi.

## Comments

**2026-11-18** — Landed in `4e0c3308` (`feat(media): own library reads and row operations in a tRPC router`).

- Registered the `media` router with explicit `permissionProcedure` declarations for every operation: `getMany`/`getMeta` read, `update`/`archive`/`restore` update, `removeMany` delete.
- `getMany` defaults to page 1 and eight items, bounds `pageSize`, shares one filter builder with `getMeta`, orders `createdAt desc` / `id asc`, and attaches `usageCount` for the page.
- `getMeta` reuses the existing quota and storage-choice sources instead of repeating their arithmetic.
- Added `archiveMediaBatch` / `restoreMediaBatch` (idempotent, unknown ids abort the batch) and mapped not-found, not-archived and in-use service errors to `NOT_FOUND` / `CONFLICT` with the service message intact.
- Added the `search`, `page`, `view` nuqs loader and client hook, plus `prefetchMedia` / `prefetchMediaMeta`.
- The existing Media page and its REST lifecycle routes are untouched; the service's single-row archive/restore implementations are unchanged, so this ticket is purely additive.

Verification: focused router suite 17/17 green; `npm run typecheck` green; `npm run lint` 0 errors (warnings only, all pre-existing); full suite 281 files / 2497 tests green. No browser probe: the admin UI and its REST calls do not change in this ticket.
