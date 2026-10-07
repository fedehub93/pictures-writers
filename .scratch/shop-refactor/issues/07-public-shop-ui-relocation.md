# 07: Public shop UI relocation

**What to build:** spostare i componenti presentazionali pubblici dello shop dentro i moduli, lasciando in `app/` solo `page.tsx`/`layout.tsx` sottili. Refactor a comportamento invariato.

**Blocked by:** 03 — Product categories end-to-end; 04 — Products: server, list, create and publish; 05 — Products: detail and core editing.

**Status:** resolved

- [x] Landing shop, card categoria/prodotto, dettaglio prodotto per tipo (ebook/servizio/webinar), JSON-LD (`product`/`course`/`event`) e helper SEO spostati nei moduli.
- [x] Le route pubbliche restano `page.tsx`/`layout.tsx` sottili che usano le query del modulo.
- [x] Rendering pubblico identico a prima; paginazione pubblica invariata (pagina 1).
- [x] Nessun import residuo dai vecchi helper in `src/data` per products/categories (route pubbliche attive).
- [x] `tsc` e lint verdi dopo lo spostamento.

## Comments

Delivered.

- Componenti pubblici spostati in `src/modules/shop/products/ui/public/`: `shop-landing.tsx` + `category-list.tsx` (landing), `category-hero.tsx` (hero preset), `products-list.tsx` e le card (`ebook-card`, `service-card`, `webinar-card`), il dettaglio per tipo (`product-gallery`, `ebook-info`, `box-info`, `buy-button`, `product-bottom-cta`, `service/**`, `webinar/**`) e le viste di composizione `category-view.tsx` / `product-detail-view.tsx`.
- JSON-LD `product`/`course`/`event` spostati in `src/modules/shop/products/ui/public/json-ld/`; il `JsonLd` di base e `toRomeIso` restano condivisi in `app/(home)/_components/seo/json-ld`.
- Query pubbliche spostate in `src/modules/shop/products/server/queries/`: `getProductsPaginatedByFilters`, `getPublishedProductBySlug`, `getPublishedProductsBuilding`, più l'helper SEO `getProductMetadataBySlug` (rimosso da `content-metadata.ts`). Esportate dal barrel `@/modules/shop/products`.
- Route pubbliche ora sottili: `shop/page.tsx` → `ShopLanding`; `[categorySlug]/page.tsx` → query modulo + `CategoryView`; `[productSlug]/page.tsx` → query modulo + `ProductDetailView`; la submission importa query/summary dal modulo. `generateMetadata`/`generateStaticParams` invariati.
- Rendering identico: i corpi JSX sono stati trasferiti testualmente; la paginazione pubblica resta `page: 1`.
- `src/data/product.ts` resta temporaneamente come sorgente per le query non-pubbliche (`getPublishedProductByRootId`, draft) e re-export dei tre helper spostati; la sua rimozione e l'aggiornamento di widget/ads/tiptap/automations è in carico al ticket 08. L'albero `draft/shop/**` (codice morto, rimosso dal ticket 08) è stato solo riallineato agli import del modulo per restare compilabile.
- Verified: `npx tsc --noEmit` pulito; `vitest run` (87 file, 715 test verdi). `npm run lint` resta rosso per errori preesistenti di repo (56) — nessun errore nuovo introdotto: i file spostati riportano gli stessi errori `no-non-null-asserted-optional-chain` che avevano prima dello spostamento.
