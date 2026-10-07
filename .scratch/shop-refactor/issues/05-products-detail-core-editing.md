# 05: Products — detail and core editing

**What to build:** la pagina dettaglio prodotto e i form di editing di base, collegati alle procedure tRPC, senza più passare dalle route REST.

**Blocked by:** 04 — Products: server, list, create and publish.

**Status:** resolved

- [x] Vista dettaglio con form core: details (titolo/slug/categoria/descrizione tiptap), pricing (acquisition mode/prezzo), gallery, FAQ, SEO, image, status.
- [x] Modifica di un prodotto **pubblicato** → nuova versione `CHANGED`; modifica di una bozza → in place; comportamento verificato end-to-end.
- [x] Salvataggio atomico di gallery, FAQ e SEO insieme ai campi principali.
- [x] Nessuna chiamata residua alle vecchie route REST admin products dai form.
- [x] Autorizzazione coerente con i permessi del router.

## Comments

Delivered.

- Nuova vista `ProductIdView` in `src/modules/shop/products/ui/admin/views/product-id-view.tsx`, con tab Details/Pricing/Gallery/FAQ/SEO, colonna sticky con `StatusBox` (publish/unpublish) e cover image, header con completion e delete. Form core in `ui/admin/components/`: `product-details-form`, `product-pricing-form`, `product-gallery-form`, `product-faq-form`, `product-seo-form`, `product-image-form`, `product-category-select`.
- Ogni form scrive via tRPC: `products.update` per details/pricing/gallery/FAQ/image (invalida `getMany` + `getLastByRootId`), `products.updateSeo` per la SEO. Nessun `axios`/route REST residuo. Il versioning resta server-side: bozza in place, pubblicato → nuova riga `CHANGED`; dopo l'invalidazione la vista ri-fetcha la versione più recente.
- `update` persiste gallery + FAQ + campi principali in un'unica transazione (`createNewVersion`); `updateSeo` è atomica a parte, come per i posts.
- Pagina `src/app/(admin)/admin/(routes)/shop/products/[rootId]/page.tsx` riscritta sul pattern del blog/categorie: `requirePermission(PRODUCTS_READ)` → `prefetchProductByRootId` → `HydrateClient` → `Suspense`/`ErrorBoundary`. Rimosso l'intero albero legacy `[rootId]/_components/**` (form REST-based). Esposta `ProductIdView` da `src/modules/shop/products/index.ts`.
- I form usano schemi `.pick()` del `productUpdateSchema` per evitare il mismatch di inferenza del `zodResolver` causato dalla discriminated union metadata (`z.coerce.date`).
- Autorizzazione coerente: la vista usa `usePermission(PRODUCTS_PUBLISH | PRODUCTS_DELETE)`; le procedure restano coperte da `permissionProcedure`.
- Coverage: `src/modules/shop/products/__tests__/products-router.test.ts` +1 test ("persists gallery, FAQs and core fields together in a single update") → 32 verdi.
- Verified: `npx tsc --noEmit` pulito, `npm run test:run` (87 file, 707 test verdi), eslint pulito sui file toccati.

