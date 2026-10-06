# 03: Product categories end-to-end

**What to build:** portare le categorie prodotto al pattern blog (tRPC + Hydrate/nuqs) ed è il ticket che stabilisce la semantica di versioning unificata da riusare per i prodotti.

**Blocked by:** 01 — Shop module foundation.

**Status:** ready-for-agent

- [ ] (TDD) test di integrazione del router `productCategories`: `create`, `update`, `updateSeo`, `remove`, `publish`, `unpublish`, `getOne`, `getLastByRootId`, `getMany`.
- [ ] Versioning allineato al blog: `update` crea una nuova riga `CHANGED` (con `isLatest:false`) **solo se la versione più recente del root è `PUBLISHED`**, altrimenti aggiorna in place; nessun 404.
- [ ] `updateSeo` è una procedura separata; `unpublish` esiste e riporta la versione a `CHANGED`.
- [ ] Creazione della nuova versione (con SEO) in transazione, senza dereferenziare input mancanti.
- [ ] Lista e dettaglio admin con Hydrate/nuqs/paginazione, filtri `search`+`status`, create/edit in dialog responsive.
- [ ] Query pubbliche per slug/root spostate nel modulo; pagine `/shop/[categorySlug]` invariate (paginazione pubblica invariata).
- [ ] `publish`/`unpublish` chiamano `revalidateContent("product")` → invalida `/shop` (layout) e `/sitemap.xml`.
- [ ] Autorizzazione via `permissionProcedure` con `product-categories.*`, incluso `PRODUCT_CATEGORIES_PUBLISH`.

## Comments
