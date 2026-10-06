# 02: Reviews module end-to-end

**What to build:** portare le recensioni al pattern nuovo in un modulo dedicato: router tRPC, lista/dettaglio admin con Hydrate+nuqs+paginazione, componenti pubblici nel modulo, revalidation. Il model Prisma resta `Reviews` con `status` booleano e senza versioning.

**Blocked by:** 01 — Shop module foundation.

**Status:** ready-for-agent

- [ ] (TDD) test di integrazione del router `reviews`: `create`, `update`, `remove`, `getOne`, `getMany` e `publish`/`unpublish` sul flag `status`.
- [ ] `getMany` paginato e filtrabile per `search`, `status` (published/draft) e `product`.
- [ ] Vista lista admin: filtri via nuqs, `ListHeader` dentro `HydrateClient` ma fuori da `Suspense`, `Suspense`+`ErrorBoundary`, `DataTable`+`DataPagination` come nei posts.
- [ ] Vista dettaglio e dialog create/edit responsive.
- [ ] `publish`/`unpublish` revalidano `/` (layout home) e `/shop` (layout).
- [ ] Componenti pubblici delle recensioni spostati nel modulo; rendering di home e pagine prodotto invariato.
- [ ] Autorizzazione via `permissionProcedure` con `reviews.read` / `reviews.manage`.
- [ ] Vecchie route REST admin reviews rimosse in favore delle procedure.

## Comments
