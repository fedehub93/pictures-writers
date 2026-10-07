# Shop Refactor

## Problem Statement

Product, product categories e reviews sono state scritte alla "vecchia maniera": route REST sotto `/api/admin/shop/**`, accesso diretto a Prisma nei server component, helper duplicati e sparsi (`data/product.ts`, `data/product-category.ts`, `lib/product.ts`, `lib/shop/product-category.ts`), nessun router tRPC, nessun Hydrate/nuqs, autorizzazione disomogenea (`authAdmin()` generico invece di permessi granulari). Customers e orders, aggiunti di recente, seguono invece il pattern nuovo dei moduli (`modules/*`, tRPC, `prefetch` + `HydrateClient` + `useSuspense*`, `permissionProcedure`).

Questa incoerenza produce: UX admin non uniforme (liste senza paginazione, create su pagina separata invece che in dialog), logica di versioning duplicata e presa lato client, validazione degli input debole (mass-assignment nello spread dei payload), bug (nessun endpoint unpublish per products/categories, route SEO rotta e non usata), revalidation incompleta (reviews non invalidano nulla), e molta duplicazione (albero `draft/shop`, componenti duplicati, codice morto).

## Solution

Rifattorizzare lo shop allineandolo al pattern del modulo blog.

- Un modulo **shop** che raccoglie i sottomoduli `products`, `product-categories`, `customers`, `orders`, più un modulo separato **reviews**.
- Ogni sottomodulo espone un router tRPC con autorizzazione granulare e nessuna logica di versioning lato client.
- Le viste admin seguono `loadSearchParams` (nuqs server) → `prefetch*` → `HydrateClient` → `Suspense` + `ErrorBoundary` → vista client con `useSuspense*`, con `ListHeader` dentro `HydrateClient` ma fuori da `Suspense`, `DataTable` (TanStack Table) e paginazione come nei posts.
- Le route `/api` inerenti allo shop vengono convertite in procedure; quelle pubbliche/infrastrutturali restano route handler.
- Le pagine pubbliche dello shop restano server component con query dirette del modulo (nuqs/Hydrate sono admin-only, come nel blog); solo i componenti presentazionali si spostano nei moduli.
- Vengono colmate lacune funzionali e di sicurezza trovate durante i controlli, e rimossi duplicati e codice morto.

## User Stories

1. Come admin con `products.read`, voglio vedere la lista dei prodotti paginata e filtrabile (ricerca, stato, tipo, categoria), così da trovare rapidamente un prodotto.
2. Come admin con `products.create`, voglio creare un prodotto da un dialog responsive scegliendone il tipo, così da finire subito nel dettaglio per completarlo.
3. Come admin con `products.update`, voglio modificare un prodotto esistente, così da mantenerne aggiornati contenuti, prezzo, media e FAQ.
4. Come admin con `products.update`, voglio che la modifica di un prodotto **pubblicato** generi una nuova versione in bozza modificabile (stato `CHANGED`) senza toccare la versione online, così da preparare una modifica senza pubblicarla subito.
5. Come admin con `products.update`, voglio che la modifica di un prodotto non pubblicato avvenga in place, così da non accumulare versioni inutili.
6. Come admin con `products.update`, voglio aggiornare le impostazioni SEO del prodotto, così da curarne la resa nei motori di ricerca.
7. Come admin con `products.publish`, voglio pubblicare una versione, così da renderla live.
8. Come admin con `products.publish`, voglio annullare la pubblicazione (unpublish), così da ritirare un prodotto dalla pubblica.
9. Come admin con `products.delete`, voglio eliminare un prodotto e tutte le sue versioni, così da rimuoverlo definitivamente.
10. Come admin, voglio che al salvataggio di un prodotto i dati correlati (galleria, FAQ, SEO) siano aggiornati in modo atomico, così da non lasciare record parziali.
11. Come admin, voglio che i metadati specifici per tipo (ebook, servizio, webinar, affiliazione) siano validati, così da evitare dati malformati.
12. Come admin con `product-categories.read`, voglio una lista categorie paginata e filtrabile (ricerca, stato).
13. Come admin con `product-categories.create`/`update`/`delete`, voglio gestire le categorie con lo stesso comportamento di versioning dei prodotti.
14. Come admin con `product-categories.publish`, voglio pubblicare e annullare la pubblicazione di una categoria, così da controllarne la visibilità.
15. Come admin con `reviews.read`, voglio una lista recensioni paginata e filtrabile (ricerca, stato, prodotto).
16. Come admin con `reviews.manage`, voglio creare, modificare ed eliminare una recensione.
17. Come admin con `reviews.manage`, voglio pubblicare e annullare la pubblicazione di una recensione, così da controllarne la visibilità pubblica.
18. Come visitatore, voglio che le pagine pubbliche dello shop (landing, categoria, dettaglio prodotto, submission, download) continuino a funzionare esattamente come prima.
19. Come visitatore, voglio vedere le recensioni pubblicate nella home e nelle pagine prodotto, aggiornate subito dopo una pubblicazione.
20. Come motore di ricerca, voglio che la `sitemap.xml` e le pagine `/shop` vengano revalidate alla pubblicazione o al ritiro di prodotti e categorie.
21. Come admin, voglio che l'autorizzazione sui nuovi endpoint usi i permessi granulari dell'area (products, product-categories, reviews), così che ogni azione richieda il permesso corretto.
22. Come responsabile sicurezza, voglio che nessun endpoint accetti campi non previsti dal contratto (niente mass-assignment su `status`, `rootId`, `isLatest`, `seoId`, `userId`, ecc.).
23. Come admin, voglio che le liste admin seguano il comportamento del blog (paginazione, filtri via URL, stato di caricamento/errore), così da avere un'esperienza coerente.
24. Come sviluppatore, voglio che i clienti e gli ordini vivano nello stesso modulo shop, così da avere un unico contesto di commercio.
25. Come sviluppatore, voglio che le query pubbliche dello shop vivano nel modulo (`server/queries`), così da eliminare gli helper duplicati in `src/data`.
26. Come sviluppatore, voglio che i tipi e le type-guard dei metadati prodotto vivano nel modulo products, così da avere il dominio definito in un solo posto.
27. Come sviluppatore, voglio che le vecchie route REST admin dello shop siano rimosse, così da avere un solo modo di mutare i dati.
28. Come sviluppatore, voglio che il codice morto e i duplicati (albero `draft/shop`, componenti duplicati, `data/ebook.ts`, form legacy) siano eliminati, così da ridurre la superficie di manutenzione.
29. Come sviluppatore, voglio test di integrazione dei router shop/creviews, così da prevenire regressioni su versioning, permessi e validazione.
30. Come sviluppatore, voglio che il versioning di products/categories si comporti esattamente come quello del blog, così da avere una sola semantica di pubblicazione in tutto il CMS.

## Implementation Decisions

- **Tassonomia moduli.** `shop` raccoglie `products`, `product-categories`, `customers`, `orders`; `reviews` è un modulo separato. Ogni slice segue la struttura del blog: `index.ts`, `schemas.ts`, `types.ts`, `constants.ts`, `params.ts`, `server/{procedures.ts,prefetch.ts,queries/}`, `hooks/`, `ui/{admin/{views,components},public/}`, e `lib/` dove serve. In `app/` restano solo `page.tsx`/`layout.tsx` (route sottili).
- **Chiavi router tRPC.** `products`, `productCategories`, `reviews`; `customers` e `orders` mantengono le chiavi attuali. `productCategories` è già gestita dall'alias `productCategories → product-categories` usato dal mapping permessi.
- **Versioning unificato al blog.** `update` chiama sempre la logica `createNewVersion`, che crea una nuova riga `CHANGED` **solo se la versione più recente del root è `PUBLISHED`**, altrimenti aggiorna in place. La decisione vive nel server, non nel client, e non produce più 404. `updateSeo` è una procedura separata (come i posts). Vengono aggiunte `unpublish` per products e product-categories. `createNewVersionProduct/Category` opera in transazione e gestisce galleria/FAQ/SEO/versioni senza dereferenziare input mancanti.
- **Procedure.** products: `create, update, updateSeo, remove, publish, unpublish, getOne, getLastByRootId, getMany, getByRootIds`. productCategories: `create, update, updateSeo, remove, publish, unpublish, getOne, getLastByRootId, getMany` (+ query pubbliche per slug/root dove servono a modali/widget). reviews: `create, update, remove, publish, unpublish, getOne, getMany`. `getByRootIds` sostituisce l'endpoint REST di fetch usato da widget e ads.
- **Autorizzazione.** `permissionProcedure` esplicito per tutti i nuovi router. Viene aggiunto il permesso mancante `PRODUCT_CATEGORIES_PUBLISH: "product-categories.publish"`. reviews usa `reviews.read` / `reviews.manage` (nessun `reviews.publish`).
- **Viste admin.** Filtri via nuqs: products `search | page | status | type | category`; product-categories `search | page | status`; reviews `search | page | status | product`. La lista products pagina sulle **root distinte** (una riga per entità, con la versione più recente), preservando l'attuale `distinct: ["rootId"]`. Convenzioni obbligatorie: `ListHeader` dentro `HydrateClient` ma fuori da `Suspense`; `Suspense` + `ErrorBoundary` attorno alla vista; `DataTable` + `DataPagination` come nei posts. La creazione avviene in dialog responsive: products chiede il tipo e redirige al dettaglio; categories/reviews usano un dialog semplice.
- **Paginazione pubblica invariata.** La lista pubblica per categoria continua a mostrare la pagina 1 senza UI di paginazione (nessuna feature nuova in questo lavoro).
- **Schemi e validazione.** Zod come unica libreria di validazione; schemi stretti (niente spread di payload arbitrari). I metadati prodotto sono validati per tipo con una discriminated union (`EBOOK | SERVICE | AFFILIATE | WEBINAR`), sostituendo l'attuale `metadata: z.any()`.
- **Revalidation.** products/categories: `publish` e `unpublish` chiamano `revalidateContent("product")`, che invalida `/shop` (layout) e `/sitemap.xml`. reviews: `publish`/`unpublish` invalidano `/` (layout, home) e `/shop` (layout, pagine prodotto); la sitemap non contiene review e non viene toccata.
- **Reviews.** Il model Prisma resta `Reviews` (rinomina a `Review` rinviata a un lavoro separato), con flag `status` booleano e **nessun versioning**: le recensioni non sono contenuto editoriale versionato.
- **Tipi e query.** I tipi `ProductMetadata`/`EbookFormat`/guards e le query `getPublishedProductBySlug|ByRootId|ProductsPaginatedByFilters|PublishedProductsBuilding` si spostano nel modulo products; blog/widget/mails importano dal modulo shop. Categorie e reviews seguono lo stesso schema.
- **Pulizia.** Rimuovere: route REST admin shop, albero `app/(home)/(routes)/draft/shop/**`, `data/ebook.ts` (nessun importer), `product-metadata.tsx`, form di submission legacy, e consolidare i componenti duplicati (galleria, box-info).

## Testing Decisions

- Un buon test verifica **comportamento esterno**, non dettagli implementativi: invoca le procedure del router come fa l'app e osserva record e transizioni di stato nel DB; non asserisce su funzioni interne.
- **Seam scelto (uno):** i router tRPC, esercitati con `createCallerFactory` e `@/trpc/init` mockato (procedure protette → procedure semplici), contro il database di test. È il seam più alto e già in uso.
- **Prior art:** `src/modules/customers/__tests__/customers-router.test.ts` e `src/modules/orders/__tests__/orders-router.test.ts` per i router; i test lib del blog (`src/modules/blog/posts/lib/__tests__/create-new-version-faqs.test.ts`, `publish-post.test.ts`) come riferimento per il versioning.
- **Moduli testati:** `products` (create/update/versioning/updateSeo/publish/unpublish/remove/getMany/getByRootIds), `product-categories` (stessa matrice), `reviews` (CRUD + publish/unpublish + `status` booleano), più il comportamento di revalidation dove testabile.
- **Casi espliciti:** modifica di prodotto pubblicato → nuova riga `CHANGED` con `isLatest:false`; modifica di bozza → in place; allineamento di `isLatest` al publish/unpublish; rimozione di tutte le versioni al delete; rifiuto dei campi non previsti; permessi negati senza il permesso richiesto.
- Verifica finale: `npx vitest run`, `npx tsc --noEmit`, lint puliti, più accettazione manuale del flusso create → modifica → publish → unpublish e delle pagine pubbliche.

## Out of Scope

- Wiring di Stripe sul modello `Order` (`OrderSource.STRIPE` / `PaymentMethod.STRIPE`) e migrazione dei `Purchase` legacy.
- Fix del checkout embedded rotto (`clientSecret` vs `{ url }`).
- Submission pubblica delle recensioni (oggi il bottone è disabilitato): è una feature nuova.
- Rinomina del model Prisma `Reviews` → `Review`.
- Introduzione della paginazione pubblica dello shop.
- Conversione delle altre route `/api` non-shop (ads, widgets, settings, users, authors, languages, media, posts, ecc.).

## Further Notes

- Termini aggiunti a `CONTEXT.md`: **Product**, **Product category**, **Review** (sezione Catalog).
- Non sono stati ritenuti necessari ADR: le scelte sono allineamento a un pattern esistente e correzione di lacune, non trade-off architetturali sorprendenti o difficili da invertire.
- Il comportamento utente del versioning per products/categories **non cambia**: cambia solo dove vive la decisione (server) e si correggono i pezzi rotti/mancanti.
- `getByRootIds` deve coprire i consumatori attuali dell'endpoint di fetch (widget prodotto, blocco ads) per poterne rimuovere la route REST.
