# 03: Product categories end-to-end

**What to build:** portare le categorie prodotto al pattern blog (tRPC + Hydrate/nuqs) ed è il ticket che stabilisce la semantica di versioning unificata da riusare per i prodotti.

**Blocked by:** 01 — Shop module foundation.

**Status:** resolved

- [x] (TDD) test di integrazione del router `productCategories`: `create`, `update`, `updateSeo`, `remove`, `publish`, `unpublish`, `getOne`, `getLastByRootId`, `getMany`.
- [x] Versioning allineato al blog: `update` crea una nuova riga `CHANGED` (con `isLatest:false`) **solo se la versione più recente del root è `PUBLISHED`**, altrimenti aggiorna in place; nessun 404.
- [x] `updateSeo` è una procedura separata; `unpublish` esiste e riporta la versione a `CHANGED`.
- [x] Creazione della nuova versione (con SEO) in transazione, senza dereferenziare input mancanti.
- [x] Lista e dettaglio admin con Hydrate/nuqs/paginazione, filtri `search`+`status`, create/edit in dialog responsive.
- [x] Query pubbliche per slug/root spostate nel modulo; pagine `/shop/[categorySlug]` invariate (paginazione pubblica invariata).
- [x] `publish`/`unpublish` chiamano `revalidateContent("product")` → invalida `/shop` (layout) e `/sitemap.xml`.
- [x] Autorizzazione via `permissionProcedure` con `product-categories.*`, incluso `PRODUCT_CATEGORIES_PUBLISH`.

## Comments

Delivered.

- Nuovo modulo `src/modules/shop/product-categories` con la struttura del blog: `index.ts`, `constants.ts`, `params.ts`, `schemas.ts`, `types.ts`, `lib/create-new-version.ts`, `server/{procedures.ts,prefetch.ts,queries/}`, `hooks/`, `ui/admin/{views,components}`.
- Router `productCategories` registrato in `src/trpc/routers/_app.ts`. Procedure: `create`, `update`, `updateSeo`, `remove`, `publish`, `unpublish`, `getOne`, `getLastByRootId`, `getMany`, tutte via `permissionProcedure` (`product-categories.read|create|update|delete|publish`).
- Versioning blog-aligned e transazionale in `lib/create-new-version.ts`: fork di una riga `CHANGED` (`isLatest:false`, `version+1`) solo se la più recente del root è `PUBLISHED`, altrimenti in place. Nessun 404, nessuna dereferenziazione di input mancanti. `unpublish` riporta a `CHANGED` e riallinea `isLatest` (una sola riga latest per root).
- Schemi Zod stretti: insert (`title`, `slug`) e update (`id`, `rootId`, `title?`, `slug?`, `description?`). Niente mass-assignment su `status`, `isLatest`, `seoId`, ecc.
- Admin: lista `/admin/shop/categories` con `loadSearchParams` → `prefetch` → `HydrateClient` → `Suspense`/`ErrorBoundary`, `ListHeader` dentro `HydrateClient` ma fuori da `Suspense`, filtri nuqs `search|status`, `DataTable`+`DataPagination`; create in dialog responsive; dettaglio `/admin/shop/categories/[rootId]` con auto-save (categoria + SEO) e `StatusBox` (publish/unpublish/delete).
- Query pubbliche `getPublishedProductCategoryBySlug` / `getDraftProductCategoryBySlug` spostate in `server/queries`; importatori (`/shop/[categorySlug]`, `/draft/shop/[categorySlug]`) aggiornati, pagine pubbliche invariate.
- `publish`/`unpublish` chiamano `revalidateContent("product")` (`/shop` layout + `/sitemap.xml`).
- Rimossi: route REST admin `/api/admin/shop/categories/**`, vecchia pagina create e componenti duplicati, `src/data/product-category.ts`, `src/lib/shop/product-category.ts`, `src/schemas/product-category.ts`, `src/app/(admin)/_hooks/use-product-categories.ts`; il product-category-select usa ora la query tRPC del modulo.
- Coverage: `src/modules/shop/product-categories/__tests__/product-categories-router.test.ts` (22 test verdi).
- Verified: `npx vitest run` (86 file, 675 test verdi), `npx tsc --noEmit` pulito, eslint pulito sui file del modulo. Il lint di repo resta rosso per errori preesistenti non correlati.
