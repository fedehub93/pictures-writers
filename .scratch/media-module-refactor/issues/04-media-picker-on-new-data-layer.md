# 04: Il selettore di Media sul nuovo data layer

**What to build:** aprire il selettore di Media da un Post, un Prodotto o un blocco di pagina usa la stessa sorgente della libreria. Ogni caricamento mostra 12 Media invece di 3, la ricerca ha la stessa semantica della libreria, e l'azione di caricamento arriva dal modulo media invece che dalla cartella della pagina. Il comportamento del selettore resta quello di sempre: apri, cerca, scegli, chiudi.

**Blocked by:** 02 (La pagina Media — shell, spostamento nel modulo e azioni per singola card)

**Status:** done

- [x] Il selettore legge la lista delle Media dal router, con paginazione a scorrimento e 12 elementi per caricamento.
- [x] La ricerca nel selettore usa la stessa semantica e lo stesso filtro della vista attiva della libreria.
- [x] L'azione "carica nuova Media" dentro il selettore è quella del modulo media, e non esiste più alcun import dalla cartella della rotta.
- [x] Il pulsante di caricamento di altri elementi si disabilita quando non c'è altro da mostrare e non duplica richieste mentre una è in corso.
- [x] L'hook di lettura del selettore vive nel modulo media e non esiste più un consumatore dell'endpoint di lista a cursore.
- [x] L'apertura, la selezione e la chiusura del selettore funzionano da Post, Prodotto e blocco di pagina senza regressioni.
- [x] Lint, typecheck e la suite esistente sono verdi.

## Comments

**2026-11-18** — Landed in `8e232e60` (`feat(media): read the picker from the media router`).

- Added `useMediaInfiniteQuery` in the media module: `getMany` with a page size of 12, the same trimmed case-insensitive search and the active view, and the page as the infinite query's page param. `MEDIA_PICKER_PAGE_SIZE` and `MEDIA_SEARCH_DEBOUNCE_MS` live in `src/modules/media/constants.ts`; the library's search filter now uses the same debounce constant.
- Deleted `src/app/(admin)/_hooks/use-assets-query.ts`. `GET /api/media` has no application consumer left; deleting the route itself is ticket 05.
- `useMediaInvalidation` now invalidates `getMany.pathFilter()` instead of the query key, so the library's page reads and the picker's infinite read refresh from the same write. The picker's key stays query-typed because `getMany` has no cursor and tRPC exposes no infinite key helper for it; the comment in the hook records why, and the path filter removes the type coupling.
- The modal keeps its copy and its open/search/select/close contract. Tiles wrap in one container (a single per-page row could not hold twelve), are keyed by id instead of name, and fall back to the Media name for alt text instead of the old placeholder. The loading and error guards use `isModalOpen`, so another modal opening cannot surface the picker's error state.
- Carried over from 02 as the ticket required at HEAD: the "Upload Media" action is the module's `MediaCreateAction`, and the "Load More" guard (`!hasNextPage || isFetchingNextPage`) is unchanged.
- The picker rows come from `getMany`, so each load pays the page's `usageCount` query even though the tiles do not render it. The spec mandates `getMany`; the cost is one reference count per load.
- No page block opens the picker today: Puck's Image field is a URL text input. The modal is shared by every caller, so there is no separate block path to regress; the third entry point named by the ticket was verified to be absent, not skipped.

Verification:

- `npm run typecheck` green; `npm run lint` 0 errors (257 pre-existing warnings); `npm run test:run` 281 files / 2497 tests green.
- Browser probe in the agent environment against the final code. From a Post cover form the picker opened with 12 tiles, "Load More" fetched page 2 (`pageSize: 12`, `page: 2`) and left 15 tiles with the button disabled as "Nothing more to load", searching `Probe Media 1` returned 7 tiles, and clicking a tile closed the dialog and set the cover. From a Product cover form it opened with 12 tiles and Escape closed it; the performance entries showed one `media.getMany` call and zero `/api/media` list calls. The post editor's Embed → Image opened the same picker with 12 tiles and Escape closed it.
- Probe fixtures (15 temporary Media rows, one product, one Seo row for the seeded post) were removed afterwards. The seed's probe post has no Seo row, which crashes its admin page on `CharsCounter` before any picker opens; that gap is left for ticket 06.
