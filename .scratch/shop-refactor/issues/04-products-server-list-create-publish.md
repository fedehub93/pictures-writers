# 04: Products — server, list, create and publish

**What to build:** portare i prodotti al pattern nuovo per server, lista e ciclo di vita principale: router completo, versioning transazionale, schemi metadata per tipo, lista paginata/filtrabile, creazione da dialog con scelta tipo, publish/unpublish.

**Blocked by:** 01 — Shop module foundation; 03 — Product categories end-to-end (riusa pattern e semantica di versioning).

**Status:** resolved

- [x] (TDD) test di integrazione del router `products`: `create`, `update`, `updateSeo`, `remove`, `publish`, `unpublish`, `getOne`, `getLastByRootId`, `getMany`, `getByRootIds`.
- [x] Versioning come blog: nuova versione solo se la più recente è `PUBLISHED`, altrimenti in place; `updateSeo` separato; `unpublish` presente; operazioni versionate in transazione.
- [x] Schemi di input stretti (nessun mass-assignment su `status`, `rootId`, `isLatest`, `seoId`, `userId`, ecc.).
- [x] Metadati validati per tipo con discriminated union (`EBOOK | SERVICE | AFFILIATE | WEBINAR`), al posto di `metadata: z.any()`.
- [x] Lista admin paginata **sulle root distinte** (una riga per entità con la versione più recente), filtri via nuqs `search|status|type|category`, `ListHeader` fuori da `Suspense`, `DataTable`+`DataPagination`.
- [x] Create in dialog responsive con type-picker: crea il prodotto e redirige al dettaglio.
- [x] `publish`/`unpublish` chiamano `revalidateContent("product")` → `/shop` (layout) e `/sitemap.xml`.
- [x] `getByRootIds` copre i consumatori dell'attuale endpoint REST di fetch (widget prodotto, blocco ads).
- [x] Autorizzazione via `permissionProcedure` con `products.read|create|update|delete|publish`.

## Comments

Delivered.

- Nuovo modulo `src/modules/shop/products` con la struttura del blog/categorie: `index.ts`, `constants.ts`, `params.ts`, `schemas.ts`, `types.ts`, `lib/{create-new-version.ts,default-metadata.ts}`, `server/{procedures.ts,prefetch.ts}`, `hooks/`, `ui/admin/{views,components}`, `__tests__/products-router.test.ts`.
- Router `products` registrato in `src/trpc/routers/_app.ts`. Procedure: `create`, `update`, `updateSeo`, `remove`, `getOne`, `getLastByRootId`, `getMany`, `getByRootIds`, `publish`, `unpublish`, tutte via `permissionProcedure` (`products.read|create|update|delete|publish`).
- Versioning blog-aligned e transazionale in `lib/create-new-version.ts`: fork di una riga `CHANGED` (`isLatest:false`, `version+1`) con carry-over di galleria e FAQ solo se la più recente del root è `PUBLISHED`, altrimenti in place; nessun 404, nessuna dereferenziazione di input mancanti. `unpublish` riporta a `CHANGED` e riallinea `isLatest`.
- Schemi Zod stretti: insert (`title`, `slug`, `type`) e update (`id`, `rootId`, + opzionali senza `status`/`isLatest`/`seoId`/`userId`/`version`). `updateSeo` separato. I metadati usano una discriminated union per tipo; `createNewVersion` rifiuta metadati il cui `type` non coincide con quello del prodotto.
- `create` costruisce i metadati di default per tipo (`lib/default-metadata.ts`) e collega il prodotto all'utente autenticato, senza accettare `userId` dal client.
- Admin: lista `/admin/shop/products` con `loadSearchParams` → `prefetch` → `HydrateClient` → `Suspense`/`ErrorBoundary`, `ListHeader` dentro `HydrateClient` ma fuori da `Suspense`, filtri nuqs `search|status|type|category`, `DataTable`+`DataPagination`; create in dialog responsive con type-picker che redirige al dettaglio.
- `publish`/`unpublish` chiamano `revalidateContent("product")` (`/shop` layout + `/sitemap.xml`).
- `getByRootIds` replica il contratto dell'endpoint REST di fetch (`id`, `rootId`, `title`, `imageCover.url`, solo `PUBLISHED`/`isLatest`).
- Rimossi: pagina create `/admin/shop/products/create` (ora dialog) e i componenti lista legacy `products/_components/**`.
- Coverage: `src/modules/shop/products/__tests__/products-router.test.ts` (31 test verdi: create/versioning/metadati/updateSeo/publish/unpublish/getOne/getLastByRootId/getMany/getByRootIds/remove/permessi).
- Verified: `npx vitest run` (87 file, 706 test verdi), `npx tsc --noEmit` pulito, eslint pulito sui file toccati.
