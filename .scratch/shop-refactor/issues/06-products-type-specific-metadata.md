# 06: Products — type-specific metadata

**What to build:** i form specifici per tipo (ebook, affiliazione, servizio, webinar), con validazione tipizzata dei metadati e tipi/guard spostati nel modulo products.

**Blocked by:** 05 — Products: detail and core editing.

**Status:** resolved

- [x] Form per tipo in sottocartelle dedicate: ebook (autore/edizione/formati), affiliazione (url), servizio (tipo/prezzo competitor/target/feature), webinar (piattaforma/posti/lezioni).
- [x] Schemi metadata tipizzati (discriminated union) allineati ai tipi di dominio.
- [x] (TDD) test che metadati non validi per il tipo vengono rifiutati dalle procedure.
- [x] Tipi `ProductMetadata`/`EbookFormat` e type-guard spostati in `modules/shop/products/types.ts`; import di blog/widget/mails aggiornati.
- [x] Nessuna regressione sui form condivisi (details/pricing/gallery/FAQ/SEO).

## Comments

Delivered.

- Form per tipo in sottocartelle dedicate sotto `ui/admin/components/metadata/`: `product-metadata-form.tsx` fa da dispatcher su `ProductType` e sceglie `ebook/product-ebook-metadata-form` (autore/edizione/formati/publishedAt), `affiliate/product-affiliate-metadata-form` (url), `service/product-service-metadata-form` (tipo/prezzo competitor/target/feature), `webinar/product-webinar-metadata-form` (piattaforma/posti/lezioni/isOpen). I form scrivono via `useUpdateProductMetadata` → `products.update`.
- `schemas.ts` espone una discriminated union (`ebook`/`affiliate`/`webinar`/`service`) usata da `productUpdateSchema.metadata`, con `type` come literal del tipo di dominio. Allineati ai tipi di `types.ts`: `ebookMetadataSchema.publishedAt`/`author` sono nullable ma obbligatori (`author.imageUrl: string`) e `webinar lessons[].date` è `z.string()`, come `WebinarLesson.date`.
- Tipi `ProductMetadata`, `EbookFormat`, `EbookMetadata`, `AffiliateMetadata`, `WebinarMetadata`, `ServiceMetadata` e le type-guard (`isEbookMetadata`, `isAffiliateMetadata`, `isWebinarMetadata`, `isServiceMetadata`, `isValidEbookFormat`) vivono in `modules/shop/products/types.ts`. `src/types.ts` importa il tipo per `PrismaJson.ProductMetadata`; gli import di `src/data/widget.ts`, `src/data/ebook.ts`, `src/shared/components/widget/*`, `src/schemas/index.ts`, i renderer tiptap e le pagine pubbliche/draft puntano al modulo.
- Il form ebook ri-normalizza l'autore (campi mancanti → stringa vuota) per restare robusto su metadati legacy parziali.
- Coverage: `products-router.test.ts` 37 → 40 test (nuovi: ebook senza i campi nullable obbligatori, lesson date non stringa, lesson date ISO valida).
- Verified: `npx tsc --noEmit` pulito, `npm run test:run` (87 file, 715 test verdi), eslint pulito sui file toccati.
