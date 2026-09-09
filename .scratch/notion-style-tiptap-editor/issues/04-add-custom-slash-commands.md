# 04: Aggiungere contenuti custom allo slash menu

**What to build:** L'autore deve poter inserire immagini, video YouTube, prodotti e info box dallo slash menu, riutilizzando i modal e i nodi già supportati dal blog.

**Blocked by:** 02: Aggiungere slash menu e trasformazioni dei blocchi testuali.

**Status:** ready-for-agent

- [ ] Il comando Immagine apre il media picker esistente.
- [ ] Il comando Video apre il modal URL esistente.
- [ ] Il comando Prodotto apre il product selector esistente.
- [ ] Il comando Info box inserisce il nodo custom esistente con i suoi attributi di default.
- [ ] Il range `/query` viene rimosso prima dell'apertura dei modal.
- [ ] Il contenuto selezionato dal modal viene inserito nella posizione corretta del documento.
- [ ] I nomi dei nodi e gli attributi restano compatibili con il renderer pubblico e con i Post già persistiti.
- [ ] `TableContentNode` resta escluso dal catalogo.
- [ ] Il seam Tiptap usa fake dei contratti dei modal e verifica il JSON risultante senza dipendere dalla loro UI o da nuovi endpoint.
- [ ] La validazione manuale conferma che l'apertura dei modal non perde il contesto dell'editor.
- [ ] Sono eseguiti lint e test pertinenti.
