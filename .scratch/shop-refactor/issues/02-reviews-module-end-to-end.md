# 02: Reviews module end-to-end

**What to build:** portare le recensioni al pattern nuovo in un modulo dedicato: router tRPC, lista/dettaglio admin con Hydrate+nuqs+paginazione, componenti pubblici nel modulo, revalidation. Il model Prisma resta `Reviews` con `status` booleano e senza versioning.

**Blocked by:** 01 — Shop module foundation.

**Status:** resolved

- [x] (TDD) test di integrazione del router `reviews`: `create`, `update`, `remove`, `getOne`, `getMany` e `publish`/`unpublish` sul flag `status`.
- [x] `getMany` paginato e filtrabile per `search`, `status` (published/draft) e `product`.
- [x] Vista lista admin: filtri via nuqs, `ListHeader` dentro `HydrateClient` ma fuori da `Suspense`, `Suspense`+`ErrorBoundary`, `DataTable`+`DataPagination` come nei posts.
- [x] Vista dettaglio e dialog create/edit responsive.
- [x] `publish`/`unpublish` revalidano `/` (layout home) e `/shop` (layout).
- [x] Componenti pubblici delle recensioni spostati nel modulo; rendering di home e pagine prodotto invariato.
- [x] Autorizzazione via `permissionProcedure` con `reviews.read` / `reviews.manage`.
- [x] Vecchie route REST admin reviews rimosse in favore delle procedure.

## Comments

Delivered in `3b55153 refactor(shop): port reviews to a dedicated module`.

- Nuovo modulo `src/modules/reviews` con la struttura del blog/shop: `index.ts`, `schemas.ts`, `types.ts`, `constants.ts`, `params.ts`, `server/{procedures.ts,prefetch.ts,queries/}`, `hooks/`, `ui/{admin/{views,components},public/}`.
- Router tRPC registrato in `_app.ts` con `permissionProcedure` (`reviews.read` / `reviews.manage`) e procedure `create`, `update`, `remove`, `publish`, `unpublish`, `getOne`, `getMany`.
- `getMany` paginato e filtrabile per `search`, `status` (published/draft) e `product`.
- Lista admin con nuqs (`search | page | status | product`), `ListHeader` dentro `HydrateClient` ma fuori da `Suspense`, `Suspense`+`ErrorBoundary`, `DataTable`+`DataPagination`; create/edit in dialog responsive.
- `publish`/`unpublish` revalidano `/` (layout home) e `/shop` (layout) via `revalidate-content.ts`.
- Componenti pubblici e query `get-published-reviews` spostati nel modulo; home e pagine prodotto invariate.
- Rimosse le route REST admin (`/api/admin/shop/reviews/**`) e componenti/hook sparsi in `app/`.
- Coverage: `src/modules/reviews/__tests__/reviews-router.test.ts` (15 test verdi).
- Verified: `npx vitest run src/modules/reviews` → 1 file, 15 test verdi.
