# 06: Products — type-specific metadata

**What to build:** i form specifici per tipo (ebook, affiliazione, servizio, webinar), con validazione tipizzata dei metadati e tipi/guard spostati nel modulo products.

**Blocked by:** 05 — Products: detail and core editing.

**Status:** ready-for-agent

- [ ] Form per tipo in sottocartelle dedicate: ebook (autore/edizione/formati), affiliazione (url), servizio (tipo/prezzo competitor/target/feature), webinar (piattaforma/posti/lezioni).
- [ ] Schemi metadata tipizzati (discriminated union) allineati ai tipi di dominio.
- [ ] (TDD) test che metadati non validi per il tipo vengono rifiutati dalle procedure.
- [ ] Tipi `ProductMetadata`/`EbookFormat` e type-guard spostati in `modules/shop/products/types.ts`; import di blog/widget/mails aggiornati.
- [ ] Nessuna regressione sui form condivisi (details/pricing/gallery/FAQ/SEO).

## Comments
