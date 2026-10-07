# 09: End-to-end verification and docs

**What to build:** verifica finale dell'intero refactor e allineamento della documentazione.

**Blocked by:** 08 — Contract and cleanup.

**Status:** resolved

- [x] `npx vitest run` verde su tutta la suite; `npx tsc --noEmit` e lint puliti.
- [x] Accettazione manuale create → edit → publish → unpublish per prodotto, categoria e recensione.
- [x] Pagine pubbliche shop invariate; verifica revalidation di `/shop` e `/sitemap.xml` dopo publish/unpublish di prodotto/categoria; revalidation di `/` e `/shop` dopo publish/unpublish di review.
- [x] `CONTEXT.md` allineato (termini Product / Product category / Review) e spec `.scratch/shop-refactor/spec.md` referenziata.
- [x] Nessun residuo del vecchio sistema (route REST shop, helper duplicati, codice morto).

## Comments

### Verification notes (ticket 09)

Verified on branch `shop-refactor` at `321e8b8`.

#### 1. Test suite, typecheck, lint

- `npx vitest run`: **87 file, 717 test verdi** (73.65s), contro il database di test dedicato (`localhost:5433`).
- `npx tsc --noEmit`: exit code `0`, nessun errore.
- `npm run build` (Turbopack): compilato in 39.3s, **377/377 pagine statiche generate**. Le pagine pubbliche dello shop restano SSG/servite: `/shop` (static), `/shop/[categorySlug]` (dynamic), i dettagli prodotto `/shop/{categoria}/{prodotto}` e le submission (SSG via `generateStaticParams`, revalidate 1d), `/sitemap.xml` (static, revalidate 1h).
- `npm run lint`: nessun errore nuovo. Il lint di repo resta rosso per **41 errori preesistenti** non correlati (forms builder, mails, sidebar, carousel, ecc.). Diff riga-per-riga base `5cb5155` (58 errori) → HEAD (54 errori): tutti gli 11 spostamenti "nuovi" sono gli **stessi errori nelle stesse righe di file spostati** da `src/app/(home)/(routes)/shop/**` a `src/modules/shop/**` (es. `ebook-card.tsx:42:18`, `products-list.tsx:51:32`) più `product-reviews.tsx:44:5` e `widget/product.tsx:65:28`. Nessuna regressione introdotta; il refactor riduce il totale di 4 errori. Stessa linea già documentata nei ticket 01 e 07.

#### 2. Accettazione create → edit → publish → unpublish

Coperta dal test seam concordato (router tRPC con `createCallerFactory` e `@/trpc/init` mockato, contro il DB di test), per tutte e tre le entità:

- **Products** — `src/modules/shop/products/__tests__/products-router.test.ts`: create draft + SEO + metadata di default; update draft in place (1 riga); update di pubblicato → nuova versione `CHANGED` `isLatest:false`; carry-over di galleria/FAQ; publish con allineamento `isLatest`; unpublish a `CHANGED`; rimozione di tutte le versioni + SEO; rifiuto campi fuori contratto; rifiuto metadata per tipo.
- **Product categories** — `src/modules/shop/product-categories/__tests__/product-categories-router.test.ts`: stessa matrice (create/update in place/nuova versione `CHANGED`/publish/unpublish/remove/getMany).
- **Reviews** — `src/modules/reviews/__tests__/reviews-router.test.ts`: create non pubblicata di default, update, publish/unpublish (flag booleano), remove, getMany con filtri; `status` rifiutato in input.
- Permessi: `src/modules/shop/__tests__/permissions.test.ts` (chiave `product-categories.publish` a catalogo e assegnata ad ADMIN).

La passeggiata manuale della UI admin non è stata eseguita dall'agente; le transizioni server accettate (create/edit/publish/unpublish) sono però esattamente quelle esercitate dai test di integrazione sopra.

#### 3. Pagine pubbliche e revalidation

- Le route pubbliche sono `page.tsx` sottili che usano le query del modulo (es. `shop/[categorySlug]/page.tsx` → `getPublishedProductCategoryBySlug` + `getProductsPaginatedByFilters` + `CategoryView`); rendering e paginazione pubblica (pagina 1) invariati, confermati dal build.
- `revalidateContent` (`src/shared/lib/revalidate-content.ts`) mappa gli scope come da spec:
  - `product` → `revalidatePath("/shop", "layout")` + `revalidatePath("/sitemap.xml")`.
  - `review` → `revalidatePath("/", "layout")` + `revalidatePath("/shop", "layout")` (niente sitemap: le review non vi compaiono).
- Call-site verificati: `products/server/procedures.ts` (`publish` L330, `unpublish` L350), `product-categories/server/procedures.ts` (`publish` L284, `unpublish` L304), `reviews/server/procedures.ts` (`publish` L176, `unpublish` L191). `next/cache` è stub nei test (`tests/mocks/next-cache.ts`), quindi il comportamento è verificato staticamente; un test dedicato introdurrebbe un secondo seam rispetto alla decisione "seam scelto (uno): i router tRPC".

#### 4. Documentazione

- `CONTEXT.md` sezione **Catalog** contiene i tre termini: **Product** (L129), **Product category** (L133), **Review** (L137) — aggiunti nel ticket 01 (`4b7175f`). `CONTEXT.md` è un glossario e per convenzione non linka `.scratch/**` (nessuna occorrenza storica di `.scratch` nel file).
- La spec è referenziata da questo ticket e dall'intera epopea in `.scratch/shop-refactor/spec.md`; rimandi incrociati già presenti nelle note della spec (§Further Notes: termini aggiunti a `CONTEXT.md`).

#### 5. Residui del vecchio sistema

- Route REST admin shop rimosse (`src/app/api/admin/shop/**` assente); nessun riferimento a `/api/admin/shop`, `@/data/product`, `@/data/product-category`, `@/data/ebook`, `@/lib/product`, `@/lib/shop/product-category`, `@/schemas/product`, `draft/shop`, `createNewVersionProduct`, `ProductFAQ`.
- Albero `app/(home)/(routes)/draft/shop/**` assente; `product-metadata.tsx` (vecchio) assente e sostituito dai `metadata/*-form.tsx` per tipo; nessun `submission-form.tsx` legacy (solo `submission-form-v2.tsx`).
- Duplicati consolidati: una sola `product-gallery.tsx` (pubblica) e una `product-gallery-form.tsx` (admin), una sola `box-info.tsx`.
- Rimosso anche il residuo non tracciato `src/lib/shop/` (directory vuota rimasta dopo il ticket 08).

#### 6. Note fuori scope

- `src/lib/vercel.ts` (`triggerWebhookBuild`) non è più chiamato da nessuno ma è dead code preesistente, estraneo al refactor shop (superato da ADR-0001 prima di questo lavoro): non rimosso per non allargare il perimetro.

### Code review summary (two-axis, fixed point `5cb5155`)

**Standards**

- **Hard (documented in AGENTS.md › Component conventions):** `"client-only"` / `"server-only"` non importati in molti nuovi file. È una deviazione di repo già sistemica e non introdotta da questo refactor: i `*create-new-version.ts` del blog/pages non importano `server-only`, i componenti admin del blog (`link-button-bubble.tsx` a parte) non importano `client-only`. Il ticket 07 del FAQ aveva già scelto di non toccarla per coerenza con i sibling. Non risolto.
- **Judgement (baseline Fowler):** `create-new-version` duplicato tra products e product-categories, dispatch su `ProductType` ripetuto, clump `{id, rootId}`, cast `as unknown as PrismaJson.ProductMetadata` al confine di persistenza. Tutti allineati al pattern blog/pages e voluti dalla spec (sottomoduli separati); non risolti.
- **Risolto:** rimossi i type alias inferiti senza consumatori (`ProductGetOne`, `ProductGetLastByRootId`, `ProductsGetByRootIds` in `products/types.ts`; `ReviewGetOne` in `reviews/types.ts`) — speculative generality.

**Spec**

- **`schemi stretti` / "rifiuto dei campi non previsti":** gli schemi usano `z.object` (strip dei campi sconosciuti) e le procedure mappano i campi in whitelist esplicita (`if (input.x !== undefined) data.x = ...`), quindi il mass-assignment è già impedito; i test lo codificano come "ignores fields outside the contract". Nessun `.strict()`: interpretazione accettata, non modificata (un `.strict()` rigetterebbe anche eventuali campi extra dei form RHF a runtime).
- **`getPublishedByRootId`** extra rispetto all'elenco procedure della spec: non è scope creep, è consumato da `use-product-root-id-query.ts` (modale/tirocinio prodotto) con test annessi.
- **Reviews product picker** (`use-product-options.ts`) usa `products.getMany` (richiede `products.read`): un ruolo con solo `reviews.manage` non popola il select prodotto. Gap teorico del modello permessi; l'admin reale ha entrambi. Non modificato.
- **`getMany` con filtro `status`:** `distinct: ["rootId"]` + `orderBy createdAt desc` mostra la versione più recente *che soddisfa il filtro*, semantica preservata dalla spec (L60: mantenere `distinct`). Non modificato.
- **`updateSeo`** connette l'`seoId` della versione live alla nuova `CHANGED`: comportamento identico al blog, esplicitamente richiesto dalla spec (L57/L65). Non un difetto.
- **Scope creep storico:** `5e3ba52` include doc `.agents/**` (laboratorio 1:1, launch, newsletter) estranee al refactor; commit già in storia, non riscrivibile in questo ticket.

Versioning gate, `unpublish`, `PRODUCT_CATEGORIES_PUBLISH`, `permissionProcedure` granulare, filtri nuqs, chiavi tRPC, scope di revalidation, relocation nei moduli e rimozione delle route REST risultano tutti presenti e corretti.

### Commit

Il ticket aggiunge la rimozione dei 4 type alias morti e questa documentazione; il resto del refactor è già nei commit `4b7175f`…`321e8b8`.
