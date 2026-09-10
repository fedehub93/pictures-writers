# 02: Aggiungere slash menu e trasformazioni dei blocchi testuali

**What to build:** L'autore deve poter digitare `/`, cercare un comando e inserire o trasformare i principali blocchi testuali senza lasciare il flusso di scrittura.

**Blocked by:** 01: Stabilizzare il writing surface Tiptap.

**Status:** ready-for-agent

- [ ] `/` apre il menu all'inizio di un blocco o dopo uno spazio in un contesto testuale valido.
- [ ] Il menu mostra i comandi disponibili quando la query è vuota e filtra per label, descrizione e keyword mentre l'autore digita.
- [ ] I comandi sono raggruppati e il popup resta confinato alla viewport con posizionamento vicino al cursore.
- [ ] Arrow Up/Down navigano i risultati, Enter conferma il comando ed Escape chiude senza modificare il documento.
- [ ] Il range completo `/query` viene rimosso prima dell'esecuzione e non viene salvato nel JSON del Post.
- [ ] Sono disponibili paragraph, Heading 1–4, elenco puntato, elenco numerato, blockquote, code block e divisore.
- [ ] Le trasformazioni preservano il testo corrente quando il comando lo consente.
- [ ] `TableContentNode` non compare nel catalogo dello slash menu.
- [ ] I comandi sono accessibili da tastiera e i risultati espongono nome e descrizione leggibili da assistive technology.
- [ ] Il seam Tiptap verifica filtro, inserimento, rimozione della query slash e JSON risultante.
- [ ] Sono eseguiti lint e test pertinenti.
