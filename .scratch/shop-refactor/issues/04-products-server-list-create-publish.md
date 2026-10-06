# 04: Products — server, list, create and publish

**What to build:** portare i prodotti al pattern nuovo per server, lista e ciclo di vita principale: router completo, versioning transazionale, schemi metadata per tipo, lista paginata/filtrabile, creazione da dialog con scelta tipo, publish/unpublish.

**Blocked by:** 01 — Shop module foundation; 03 — Product categories end-to-end (riusa pattern e semantica di versioning).

**Status:** ready-for-agent

- [ ] (TDD) test di integrazione del router `products`: `create`, `update`, `updateSeo`, `remove`, `publish`, `unpublish`, `getOne`, `getLastByRootId`, `getMany`, `getByRootIds`.
- [ ] Versioning come blog: nuova versione solo se la più recente è `PUBLISHED`, altrimenti in place; `updateSeo` separato; `unpublish` presente; operazioni versionate in transazione.
- [ ] Schemi di input stretti (nessun mass-assignment su `status`, `rootId`, `isLatest`, `seoId`, `userId`, ecc.).
- [ ] Metadati validati per tipo con discriminated union (`EBOOK | SERVICE | AFFILIATE | WEBINAR`), al posto di `metadata: z.any()`.
- [ ] Lista admin paginata **sulle root distinte** (una riga per entità con la versione più recente), filtri via nuqs `search|status|type|category`, `ListHeader` fuori da `Suspense`, `DataTable`+`DataPagination`.
- [ ] Create in dialog responsive con type-picker: crea il prodotto e redirige al dettaglio.
- [ ] `publish`/`unpublish` chiamano `revalidateContent("product")` → `/shop` (layout) e `/sitemap.xml`.
- [ ] `getByRootIds` copre i consumatori dell'attuale endpoint REST di fetch (widget prodotto, blocco ads).
- [ ] Autorizzazione via `permissionProcedure` con `products.read|create|update|delete|publish`.

## Comments
