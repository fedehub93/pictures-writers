# Media module refactor

**Status:** `ready-for-agent`

## Problem Statement

La sezione Media è l'unica area admin che non segue la convenzione delle altre liste (Posts, Categories, Tags), e la differenza non è estetica: produce comportamenti diversi per l'utente e un costo di manutenzione che ricade su ogni modifica futura.

Per chi usa il backoffice:

- Ricercare, cambiare pagina e cambiare vista non si comportano come nelle altre liste: i parametri URL si chiamano diversamente (`s` invece di `search`), la paginazione è un altro componente con un'altra forma, e la ricerca usa un input dedicato con la rotta `/admin/media` scritta dentro.
- Dopo un'azione (archivia, ripristina, elimina, rinomina) la lista si aggiorna solo perché qualcuno chiama un refresh dell'intera rotta: non c'è un data layer condiviso che si invalidi.
- Il conteggio in testa alla pagina e la quota non hanno un proprietario chiaro: il totale arriva dalla lettura diretta del database nella pagina, la quota e il driver da altre due letture server passate come props.

Per chi mantiene il codice:

- La feature è divisa tra la cartella della rotta (componenti e azioni) e il modulo (logica di storage e consegna), con un accoppiamento route→route: il selettore di Media importa un'azione dalla cartella della pagina media.
- La stessa operazione esiste due volte: un router REST dedicato per lista, modifica, archiviazione, ripristino ed eliminazione, e nessuna procedura tRPC. Le regole di autorizzazione sono quindi le uniche del progetto a passare da un controllo generico di amministratore invece che dai permessi `media.*`.
- Due componenti classificati come condivisi sono in realtà usati solo da Media e hanno `/admin/media` cablato: chiunque li riusasse navigherebbe sulla pagina sbagliata.

## Solution

La sezione Media si comporta, dall'esterno, come le altre liste del backoffice.

Chi amministra trova: una testata con il conteggio che segue i filtri, la ricerca con la stessa semantica delle altre liste, un interruttore Library/Archived, la quota e il driver di archiviazione dove sono sempre stati, e l'azione di caricamento; una griglia di card che resta una griglia (la miniatura è il contenuto, non una colonna); la stessa paginazione delle altre liste; URL condivisibili e navigabili con back/forward; stati di caricamento ed errore gestiti dal guscio della pagina invece che da un componente monolitico.

Le azioni si sentono istantanee perché la lista e la testata si invalidano insieme: archiviare una Media la toglie dalla vista Library e aggiorna quota e conteggio senza ricaricare la pagina.

Le altre parti del backoffice che devono scegliere una Media (il selettore usato da contenuti, prodotti e blocchi) usano lo stesso data layer, con una paginazione a scorrimento più densa di quella della libreria.

Il confine con lo storage resta dov'è: caricamento e sostituzione del file continuano a passare dalle rotte che scrivono sui byte, perché sono un'altra responsabilità. Tutto ciò che è lettura e gestione di riga non ha più una seconda superficie REST.

Il vocabolario resta quello del glossario: la riga della libreria è una **Media**; "asset" sopravvive solo come forma di URL legacy (`/assets/<key>`), che non va toccata.

## User Stories

1. As an admin, I want to see how many Media match my current filters in the page header, so that the count always matches the grid below it.
2. As an admin, I want the header label to read "Media", so that the page speaks the same vocabulary as the rest of the product and the glossary.
3. As an admin, I want to search by name with the same debounce and the same URL parameter as Posts, Categories and Tags, so that the three lists feel like one product.
4. As an admin, I want my search term to live in the URL as `search`, so that a link I paste to a colleague opens the same filtered library.
5. As an admin, I want changing the search term to send me back to page 1, so that I never land on an empty page that exists only because I was deep in a filtered list.
6. As an admin, I want to switch between the active library and archived Media with a single click, so that I can find something I hid without remembering a query string.
7. As an admin, I want the Library/Archived switch to keep my search term, so that switching views does not make me retype it.
8. As an admin, I want the Library/Archived switch to reset pagination, so that I do not land on a page that only exists in the other view.
9. As an admin, I want the archived view to contain only archived Media and the library view only active ones, so that "archived" keeps meaning "hidden from the library".
10. As an admin, I want the URL to encode search, page and view, so that browser back and forward walk my exploration instead of resetting it.
11. As an admin, I want to page through the library with the same Previous/Next control as the other lists, so that I do not have to learn a second pagination.
12. As an admin, I want the same number of Media per page as today, so that the refactor does not change how much work I do between two clicks.
13. As an admin, I want to see the same card details I see today (name, type, size, dimensions, MIME, checksum, revision, usage count), so that inspecting a Media does not become worse.
14. As an admin, I want the note that usage counts only relational references to stay visible, so that I am never misled about why a deletion is refused.
15. As an admin, I want to archive one Media from its card, so that it disappears from the library without breaking the content that references it.
16. As an admin, I want to restore an archived Media from its card, so that it comes back into the library with its renditions served again.
17. As an admin, I want to be refused when I try to delete an active Media, so that archiving stays the mandatory step before destruction.
18. As an admin, I want to be refused when I try to delete a Media that content still references, so that a cover is never cleared silently.
19. As an admin, I want the refusal to name how many references block the deletion, so that I know what to fix.
20. As an admin, I want to delete an archived Media permanently and have the file and every rendition removed, so that deleting actually frees the storage and the quota.
21. As an admin, I want to select several cards on the current page and archive them in one action, so that cleaning a batch of unused Media does not need one dialog per item.
22. As an admin, I want to select several archived cards and delete them permanently in one action, so that a bulk cleanup is one confirmation, not twenty.
23. As an admin, I want my selection to die when I change page, so that I never delete something I can no longer see.
24. As an admin, I want each action to reflect in the grid, the count and the quota immediately, so that I can trust the screen without reloading it.
25. As an admin, I want to rename a Media and edit its alt text, so that accessibility and findability do not require a re-upload.
26. As an admin, I want the edited name to show in the grid immediately, so that I can confirm the change I just made.
27. As an admin, I want to replace a Media's file without its identity or references changing, so that swapping a bad image does not break published content.
28. As an admin, I want a replacement to be reflected in the grid immediately, so that I can verify the new file is the one being served.
29. As an admin, I want to upload a new Media and find it at the top of the library, so that the most recent upload is where I expect it.
30. As an admin, I want the quota meter to update after a permanent deletion, so that I can see the room I just freed.
31. As an admin, I want to choose the storage driver for new uploads, so that switching storage is a decision I can make in the library without a redeploy.
32. As an admin, I want the storage choice to affect only new uploads, so that existing Media keep being served from where they were written.
33. As an admin, I want a loading state while the list resolves and an error state if it fails, so that a slow or broken request does not look like an empty library.
34. As an admin, I want an explicit empty state that distinguishes "no Media" from "no archived Media", so that I do not mistake a filter for a data loss.
35. As an admin, I want the Media page to require the media read permission, so that a role without it cannot reach the page even by typing the URL.
36. As an admin with create permission, I want the upload action to be reachable from the library, so that the permission model is visible in the interface.
37. As an admin, I want to open the Media picker from a Post, Product or page block and see 12 Media per load instead of 3, so that choosing an image does not require a dozen round trips.
38. As an admin, I want the picker to search with the same semantics as the library, so that finding an image in a dialog and finding it in the library behave the same way.
39. As an admin, I want the picker's "create new asset" action to be the library's own upload action, so that the two surfaces cannot drift.
40. As an admin, I want every Media operation that used to fail with a generic error to still surface a readable message, so that the refactor does not regress error reporting.
41. As a maintainer, I want the Media feature's UI to live in the media module with the same subfolder convention as the other modules, so that I can find all of it in one place.
42. As a maintainer, I want the Media list, filters, quota and driver choice to come from one tRPC router, so that there is a single place to change behaviour and authorization.
43. As a maintainer, I want the Media procedures to declare their permission explicitly (`read`, `update`, `delete`) instead of relying on a name-derived guess, so that archive and restore cannot silently fall into a permission area that does not exist.
44. As a maintainer, I want the REST surface for Media reduced to the two endpoints that write bytes, so that a reader cannot mistake the admin CRUD for the storage seam.
45. As a maintainer, I want the public delivery route and the legacy `/assets/<key>` handling untouched, so that the refactor cannot break images already in published content.
46. As a maintainer, I want no database schema change and no permission-row change, so that the refactor is safe to deploy without a migration window.
47. As a maintainer, I want the two orphaned "shared" components deleted rather than generalised, so that nobody inherits a component that hardcodes the media page.
48. As a maintainer, I want the router exercised by an integration test against the test database, so that pagination, filtering, usage counts and the archive/restore/delete guards are proven at the highest available seam.
49. As a maintainer, I want the existing upload and replace route tests to keep passing unchanged, so that the part of Media that touches storage stays covered while the CRUD surface moves.
50. As a maintainer, I want the pre-existing behaviour of the picker (infinite scroll, load more) preserved, so that moving it to the new data layer is a transport change, not a redesign.

## Implementation Decisions

### Data layer

- A new tRPC router `media` is registered in the application router. It owns every read and every row-level operation of the library.
- Procedures and contracts:
  - `getMany({ page, pageSize, search, view })` → `{ items, total, totalPages }`. `page` defaults to 1; `pageSize` defaults to the library page size and is bounded; `search` is a nullish case-insensitive name match; `view` is `active | archived` and defaults to `active`. Items carry the library projection plus `usageCount` computed for the page's ids. Order is `createdAt desc` with `id asc` as a deterministic tiebreaker. No sort/direction input in this iteration.
  - `getMeta({ search, view })` → `{ total, quota, storage }`. One query on purpose: the header's count must respect the same filters as the grid, so computing it separately from the quota would either double the work or let the number disagree with what is on screen. `quota` is the existing quota status; `storage` is the active driver choice plus whether the remote driver is configured.
  - `update({ id, name, altText })` → the updated Media. This replaces the old mass-assignment update: only name and alt text are editable.
  - `archive({ ids })` and `restore({ ids })` → the number of Media transitioned. They take a list because bulk archive from a selection is an existing behaviour, and looping client-side would refetch once per item. A single card passes one id.
  - `removeMany({ ids })` → the number deleted. It covers the single-card permanent deletion too: the batch validation (must be archived, must not be referenced) is the same, so a separate single-row procedure would only duplicate the guard.
- Authorization uses explicit permission procedures for every operation: `getMany` and `getMeta` require the media read permission, `update`/`archive`/`restore` the media update permission, `removeMany` the media delete permission. The name-derived permission mapper is deliberately not touched: `archive` and `restore` would resolve to a media manage permission that does not exist in the permission table, and bending the procedure names to satisfy a guesser would distort the API.
- Domain errors from the media service (not found, still active, still referenced) are mapped to tRPC errors with the service's messages, so the UI keeps explaining *why* a deletion was refused.
- No schema, migration or permission-row change.

### URL state

- Three nuqs parameters: `search` (string, default empty, cleared when default), `page` (integer, default 1, cleared when default), `view` (enum `active | archived`, absent means active).
- A server-side loader is the only way the page reads them; a client hook is the only way components write them. Same shape as the other lists.
- `search` replaces today's `s`; existing links with `s` are not supported.
- `sort` and `direction` are intentionally absent until the grid gains a sortable header.

### Module shape

- The media module grows the conventional subfolders of the other modules: constants, URL params, a barrel for the page's exports, `hooks/`, `server/` (router and prefetch), and `ui/` split into `views/` and `components/`.
- Everything that only the media page renders moves into the module: the list header, the search filter, the view switch, the card, the grid, the bulk actions, the quota meter and the storage driver select.
- The upload action (the "create" button) also moves into the module, because both the library and the picker use it; the picker importing it from the page folder is exactly the route→route coupling this refactor removes.
- The picker's data hook moves into the module. The modal components themselves stay where the global modal provider registers them: they are singletons owned by the admin shell, like the post/product/user modals, and moving only some of them would split the registry.
- Naming follows the glossary: the moved symbols say "media", not "asset" (`MediaCard`, `MediaList`, the infinite query hook for the picker). "Asset" remains only in the legacy URL constant and the old `/assets/<key>` rewrite.

### Page shell

- A layout guards the route with the media read permission; the page guards again, exactly like the posts route, so the requirement is visible from the page itself.
- The page loads the search params, prefetches `getMany` and `getMeta`, then renders the hydrated client with the header outside the suspense boundary and the grid inside a suspense boundary wrapped by an error boundary.
- The header owns: the "Media" title with the filtered count, the search filter, the Library/Archived switch, the quota meter, the storage driver select and the create action.
- The view owns: the card grid, per-page selection, bulk actions, the usage note, the empty states and the pagination control.
- Pagination uses the shared page/totalPages control the other lists use. The media-only pagination component and the media-only search input are deleted: both hardcode the media route and neither has a second consumer.

### Picker

- The picker uses `getMany` through an infinite query with its own page size of 12, keeping the "load more" affordance. The cursor-based REST list it used before is deleted with the rest of the CRUD surface.
- The picker keeps its existing UX contract: open, search, pick a Media, close.

### REST surface

- Only two admin endpoints remain: uploading a new file and replacing an existing file. They stay on route handlers because they move bytes through the storage driver.
- Deleted with their tests: the paginated list, the update, the permanent delete, the bulk delete, and the archive/restore handlers.
- The public delivery route, the manifest/rendition logic and the legacy `/assets/<key>` rewrite are untouched.

### Client updates

- Mutations invalidate the list query (`getMany`), the header query (`getMeta`) and the picker's infinite query instead of calling a router refresh. This is what makes the header count and the quota update with the grid.
- Optimistic update is not required: the list is small and invalidation is enough; adding optimistic state would duplicate the server's guards (a delete can be refused).

## Testing Decisions

- A good test here asserts observable behaviour through the router boundary: what a caller gets back and what the database holds afterwards. It must not assert which Prisma query was issued, nor how many times a helper was called; the ordering, filtering and guard rules are the behaviour, the query shape is not.
- One seam covers the whole data layer: the media router invoked through a caller factory, with the tRPC initialisation module mocked to plain procedures, running against the disposable test database. Prior art: the categories and products router tests, which build a caller per test, create fixtures through the caller itself where possible, and clean up by collected ids.
- That seam must cover: the pagination envelope (`total`, `totalPages`, page 2 contents), case-insensitive name search, the `active`/`archived` filter, the deterministic order, `usageCount` reflecting an actual relational reference, `getMeta`'s count matching the same filters plus a well-formed quota and storage choice, `update` changing only name and alt text, `archive` and `restore` being idempotent and reflected in the view filter, `removeMany` refusing an active Media, refusing a referenced Media with the reference count, and deleting both rows and the storage prefix when allowed, and not-found handling for unknown ids.
- Storage-touching behaviour in `removeMany` follows the prior art of the media service and archive tests, which create rows with the local driver and assert the objects disappear with the row.
- The upload and replace route tests are the second, pre-existing seam. They must keep passing without edits; they are the proof that the storage path was not collateral damage.
- No new UI test seam. The admin list views have no component tests anywhere in the repo, and a test on the media view would assert nuqs glue rather than behaviour; the page is verified manually in the agent environment in addition to typecheck and lint.
- The permission mapping is not covered by the router test, because the mocked initialisation strips the permission middleware. That is acceptable by construction: every procedure names its permission explicitly, so there is no derivation left to get wrong.

## Out of Scope

- Column sorting and the `sort`/`direction` URL parameters; the grid has no column headers to click.
- Cross-page selection; selection stays scoped to the visible page.
- A Media detail page, a lightbox or an inline preview.
- Any change to the rendition ladder, the storage seam, the delivery route, the quota arithmetic or the upload/replace pipelines.
- Renaming the domain entity to "Asset": the glossary term stays, and the legacy `/assets/<key>` URL shape is not migrated.
- Fixing the "page beyond the last page after a deletion" edge case; the other lists have the same behaviour and it is not this refactor's subject.
- Adding a clear-filters button, unsaved-changes warnings or keyboard shortcuts that the other lists do not have.
- An ADR: the change is reversible and adds no surprising trade-off beyond the ones already recorded in the media storage ADR.
- Glossary edits: no term changes, so the file stays as it is.

## Further Notes

- Why "Media" and not "Asset": the glossary entry dates from the storage-seam change, when the row stopped being "an uploaded file" and became an identity with a storage key, checksum, revision, rendition manifest and archived state. "Asset" is already load-bearing for the legacy `/assets/<key>` URL shape and is ambiguous in a CMS (build assets, ad assets, brand assets). Renaming the model would also mean a table rename across six relations, the permission area, the admin route and the delivery path, with the legacy rewrite left as a leftover conflict. The only rename this refactor performs is the one it has to perform anyway, on the files it moves.
- Sequencing matters: the data layer (router, params, hooks) must land with typecheck green before the UI work starts, otherwise the boundary between "moving code" and "rewriting code" blurs and review becomes guesswork.
- Two invariants are easy to lose in a rewrite: the library page size stays at today's value, and selection remains scoped to the page.
- `getMeta` recomputes the quota on every filter change (debounced with the search). That is a deliberate trade: the library is in the hundreds of rows, and a header count that disagrees with the grid is a worse outcome than an aggregate.
- The picker's page size goes from 3 to 12 while its data layer changes; it is the same change window, and leaving it at 3 would preserve a round-trip cost nobody would choose.
- The refactor deletes the old client-side refresh loop. Anything that still expects a full route refresh after a media action should be considered a leftover.
