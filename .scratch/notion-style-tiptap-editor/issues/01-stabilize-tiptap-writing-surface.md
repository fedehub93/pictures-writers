# 01: Stabilizzare il writing surface Tiptap

**What to build:** La superficie di scrittura Tiptap del blog deve diventare più minimalista e configurabile, senza cambiare il formato JSON del Post o rompere i nodi già persistiti.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] La toolbar è compatta, sticky all'interno del contenitore dell'editor e visibile di default.
- [x] Il componente editor espone una configurazione booleana per nascondere completamente la toolbar senza duplicare il componente.
- [x] Il placeholder appare solo su un documento vuoto e invita a scrivere o usare `/`.
- [x] Gli articoli Tiptap già esistenti vengono caricati e modificati mantenendo il JSON e gli attributi dei nodi custom.
- [x] `TableContentNode` resta registrato per compatibilità, modifica e rendering, ma non viene aggiunto a nuove superfici di inserimento.
- [x] Il percorso Slate non cambia comportamento.
- [x] Il seam di integrazione Tiptap è predisposto per testare il documento risultante con lo stesso set di estensioni usato in produzione.
- [x] Le dipendenze Tiptap aggiunte per questa iniziativa usano versioni compatibili con il resto della linea Tiptap del progetto.
- [x] Sono eseguiti lint e test pertinenti, senza regressioni nel renderer pubblico.
