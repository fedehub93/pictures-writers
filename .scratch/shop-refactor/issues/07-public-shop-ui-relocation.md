# 07: Public shop UI relocation

**What to build:** spostare i componenti presentazionali pubblici dello shop dentro i moduli, lasciando in `app/` solo `page.tsx`/`layout.tsx` sottili. Refactor a comportamento invariato.

**Blocked by:** 03 — Product categories end-to-end; 04 — Products: server, list, create and publish; 05 — Products: detail and core editing.

**Status:** ready-for-agent

- [ ] Landing shop, card categoria/prodotto, dettaglio prodotto per tipo (ebook/servizio/webinar), JSON-LD (`product`/`course`/`event`) e helper SEO spostati nei moduli.
- [ ] Le route pubbliche restano `page.tsx`/`layout.tsx` sottili che usano le query del modulo.
- [ ] Rendering pubblico identico a prima; paginazione pubblica invariata (pagina 1).
- [ ] Nessun import residuo dai vecchi helper in `src/data` per products/categories.
- [ ] `tsc` e lint verdi dopo lo spostamento.

## Comments
