# 09: End-to-end verification and docs

**What to build:** verifica finale dell'intero refactor e allineamento della documentazione.

**Blocked by:** 08 — Contract and cleanup.

**Status:** ready-for-agent

- [ ] `npx vitest run` verde su tutta la suite; `npx tsc --noEmit` e lint puliti.
- [ ] Accettazione manuale create → edit → publish → unpublish per prodotto, categoria e recensione.
- [ ] Pagine pubbliche shop invariate; verifica revalidation di `/shop` e `/sitemap.xml` dopo publish/unpublish di prodotto/categoria; revalidation di `/` e `/shop` dopo publish/unpublish di review.
- [ ] `CONTEXT.md` allineato (termini Product / Product category / Review) e spec `.scratch/shop-refactor/spec.md` referenziata.
- [ ] Nessun residuo del vecchio sistema (route REST shop, helper duplicati, codice morto).

## Comments
