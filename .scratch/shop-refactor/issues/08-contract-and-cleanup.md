# 08: Contract and cleanup

**What to build:** rimuovere la vecchia impalcatura REST e il codice morto/duplicato, aggiornando tutti i consumatori. È la fase di "contract" dopo che i nuovi moduli sono in uso.

**Blocked by:** 02 — Reviews module end-to-end; 03 — Product categories end-to-end; 04 — Products: server, list, create and publish; 05 — Products: detail and core editing; 06 — Products: type-specific metadata; 07 — Public shop UI relocation.

**Status:** ready-for-agent

- [ ] Rimosse le route REST admin shop (products, categories, reviews).
- [ ] Rimossi `src/data/product.ts`, `src/data/product-category.ts`, `src/data/ebook.ts`, `src/lib/product.ts`, `src/lib/shop/product-category.ts`; chiamanti aggiornati (widget, ads, sitemap, SEO, tiptap renderers, automations, modali, admin hooks).
- [ ] Rimossi l'albero `app/(home)/(routes)/draft/shop/**` e il codice morto (`product-metadata.tsx`, form di submission legacy).
- [ ] Consolidati i componenti duplicati (galleria, box-info).
- [ ] Nessun riferimento pendente a route/helper rimossi; `tsc`, lint e test verdi.

## Comments
