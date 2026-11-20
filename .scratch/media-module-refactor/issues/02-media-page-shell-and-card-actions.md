# 02: La pagina Media — shell, spostamento nel modulo e azioni per singola card

**What to build:** la libreria si comporta come le altre liste del backoffice. Chi amministra vede una testata con il conteggio che segue i filtri, una ricerca con la stessa semantica delle altre liste, un interruttore Library/Archived, la quota e il driver dove sono sempre stati, il caricamento nello stesso posto, e una paginazione identica a quella di Posts, Categories e Tags. L'URL contiene ricerca, pagina e vista, quindi back e forward camminano nell'esplorazione. Caricamento ed errore sono gestiti dal guscio della pagina, non da un componente monolitico. Archiviare, ripristinare o eliminare una Media dalla card aggiorna griglia, conteggio e quota senza ricaricare la pagina. Tutta l'interfaccia della feature vive nel modulo media con il vocabolario del glossario: `Media`, non `asset`. La pagina è protetta dal permesso di lettura.

**Blocked by:** 01 (Data layer — router `media`, parametri URL, hook e test)

**Status:** done

- [x] La rotta ha un layout che richiede il permesso di lettura e una pagina che lo richiede di nuovo, come la rotta dei Post.
- [x] La pagina legge i parametri con il loader, esegue il prefetch della lista e della testata, e renderizza la testata fuori dal confine di suspense e la griglia dentro un confine di suspense avvolto da un confine di errore.
- [x] La testata mostra il titolo "Media" con il conteggio filtrato, la ricerca con debounce sull'URL, l'interruttore Library/Archived, la quota, il selettore del driver e l'azione di caricamento.
- [x] L'interruttore di vista conserva la ricerca e azzera la pagina; cambiare la ricerca azzera la pagina.
- [x] La griglia mantiene le informazioni attuali di ogni card (nome, tipo, dimensione, dimensioni, MIME, checksum, revisione, conteggio dei riferimenti) e la nota che i conteggi riguardano solo i riferimenti relazionali.
- [x] Gli stati vuoti distinguono "nessuna Media" da "nessuna Media archiviata".
- [x] La paginazione usa il controllo condiviso delle altre liste con pagina e totale pagine, e il numero di Media per pagina resta quello di oggi.
- [x] Archivia, ripristina ed elimina dalla card passano dal router e invalidano lista e testata; nessuna azione chiama un refresh dell'intera rotta.
- [x] Card, griglia, testata, filtro di ricerca, interruttore di vista, quota, selettore del driver e azione di caricamento vivono nel modulo media, con i nomi che dicono "Media" e non "asset", e la pagina non importa più nulla da sé stessa per questi componenti.
- [x] Il selettore di Media esistente aggiorna il proprio import dell'azione di caricamento verso il modulo e continua a funzionare come prima; caricamento e sostituzione del file restano sulle rotte che scrivono i byte.
- [x] I due componenti condivisi che cablano la rotta media e non hanno altri consumatori sono cancellati.
- [x] Un Media archiviata resta fuori dalla vista Library e compare solo in Archived; una ripristinata fa il percorso inverso.
- [x] Lint, typecheck e la suite esistente sono verdi; i test delle rotte di caricamento e sostituzione passano senza modifiche.

## Comments

**2026-11-18** — Landed in `5b9b16b2` (`feat(media): serve the library page from the media router`).

- Added the `media` route layout and turned the page into the usual shell: `loadMediaSearchParams`, `prefetchMedia` for the grid, an awaited `prefetchMediaMeta` for the header, then `HydrateClient` with the header outside the Suspense boundary and the grid inside it plus an error boundary.
- Moved the header, search filter, view switch, quota meter, storage-driver select, create action, card, grid and the library view into `src/modules/media/ui/`; the page imports nothing from its own folder.
- Card actions call `archive`, `restore` and `removeMany` through the router and invalidate `getMany` + `getMeta` through `useMediaInvalidation`; there is no `router.refresh()` left in the module. Saving the storage driver invalidates the header instead of reloading the route.
- Search writes `search` with the shared 500 ms debounce and resets `page`; the view switch writes `view` and resets `page` while keeping the search; pagination is `DataPagination` (page/totalPages) and the page size stays 8.
- Bulk selection was carried over on the router, and its state now lives in a subtree remounted on any search/page/view change, so a selection cannot survive into a page the admin cannot see.
- Deleted the media-only `extended-pagination` and `search-input` components. The picker imports `MediaCreateAction` from the module, which also gates on `media.create` like the library header.
- `edit`/`replace` dialogs and the picker's data hook are untouched and remain tickets 03 and 04; the REST CRUD surface is untouched and remains ticket 05.

Verification: lint 0 errors; `npm run typecheck` green; full suite 281 files / 2497 tests green. Browser probe in the agent environment: the header count followed the filters (10 → 2 with `search=Probe Media 1` → 0 in Archived), Next wrote `?page=2` and showed Media 9–10, search from page 2 wrote `?search=…` with no `page` and returned both matches, the view switch kept `search` and dropped `page`, archiving removed a card and changed the count 10 → 9, restore removed it from Archived, permanent deletion dropped the quota from 57 KiB to 55 KiB and left the explicit "No archived Media found" state, and a page change cleared the selection without resurrecting it on return; the browser reported a single navigation entry throughout, so no action reloaded the route.
