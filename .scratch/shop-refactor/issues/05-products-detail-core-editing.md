# 05: Products — detail and core editing

**What to build:** la pagina dettaglio prodotto e i form di editing di base, collegati alle procedure tRPC, senza più passare dalle route REST.

**Blocked by:** 04 — Products: server, list, create and publish.

**Status:** ready-for-agent

- [ ] Vista dettaglio con form core: details (titolo/slug/categoria/descrizione tiptap), pricing (acquisition mode/prezzo), gallery, FAQ, SEO, image, status.
- [ ] Modifica di un prodotto **pubblicato** → nuova versione `CHANGED`; modifica di una bozza → in place; comportamento verificato end-to-end.
- [ ] Salvataggio atomico di gallery, FAQ e SEO insieme ai campi principali.
- [ ] Nessuna chiamata residua alle vecchie route REST admin products dai form.
- [ ] Autorizzazione coerente con i permessi del router.

## Comments
