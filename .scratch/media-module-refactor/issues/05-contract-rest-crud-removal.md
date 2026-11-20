# 05: Contrazione — via la superficie REST del CRUD

**What to build:** delle rotte amministrative di Media restano solo quelle che scrivono byte. Lista paginata, modifica, eliminazione singola, eliminazione multipla, archiviazione e ripristino spariscono con i rispettivi test, perché non hanno più un chiamante. La delivery pubblica e la gestione legacy degli indirizzi `/assets/<key>` restano intatte: nessuna immagine già pubblicata cambia comportamento. Chi legge il codice trova un solo confine: le rotte servono lo storage, il router serve la libreria.

**Blocked by:** 03 (Selezione multipla e dialoghi), 04 (Il selettore di Media sul nuovo data layer)

**Status:** done

- [x] Restano soltanto le due rotte amministrative che scrivono o sostituiscono i byte, con i loro test invariati.
- [x] Le rotte della lista paginata, della modifica, dell'eliminazione singola, dell'eliminazione multipla, dell'archiviazione e del ripristino sono cancellate insieme ai loro test.
- [x] Nessun punto dell'applicativo fa più riferimento alle rotte cancellate.
- [x] La rotta pubblica di consegna dei file e la risoluzione degli indirizzi legacy continuano a funzionare e i loro test passano.
- [x] I test del ciclo di vita che coprivano le rotte cancellate sono rimossi senza lasciare fixture orfane o helper inutilizzati.
- [x] Lint, typecheck e la suite completa sono verdi.

## Comments

**2026-11-18** — Chiuso da `6a2c9bbd`.

Superficie rimasta: `POST /api/media` (upload JSON o multipart) e `POST /api/media/[mediaId]/replace`. Entrambi i file di test sono invariati. Cancellati `GET /api/media` (lista paginata, con `MEDIA_BATCH` e le letture Prisma), `PATCH`/`DELETE /api/media/[mediaId]`, `DELETE /api/media/bulk_delete`, `POST /api/media/[mediaId]/archive`, `POST /api/media/[mediaId]/restore`, più `lifecycle-route.test.ts` e `bulk_delete/route.test.ts`. `mediaErrorResponse` resta per la rotta di sostituzione; ne sono caduti i rami `MediaNotArchivedError` e `MediaInUseError`, che nessuna rotta può più produrre.

La rotta pubblica `/media/[...path]` e la risoluzione legacy `/assets/<key>` non sono state toccate. I test di delivery, loader e backfill passano invariati. `archiveMedia`, `restoreMedia` e `deleteMediaPermanently` restano nel service nonostante il loro ultimo chiamante di produzione fosse la rotta cancellata: `route.test.ts` (congelato da questo ticket) usa `archiveMedia` per liberare la quota, e il tRPC importa le varianti batch.

Verifica: `npm run typecheck` pulito, `npm run lint` 0 errori (257 warning preesistenti), `npm run test:run` 279 file / 2487 test passati, `npm run build` riuscito con le sole rotte `/api/media` e `/api/media/[mediaId]/replace` nella tabella.
