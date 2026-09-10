# 05: Aggiungere metriche editoriali e autosave efficiente

**What to build:** L'autore deve vedere word count e reading time mentre scrive, con un autosave affidabile ma silenzioso e senza lavoro duplicato a ogni transazione.

**Blocked by:** 01: Stabilizzare il writing surface Tiptap.

**Status:** ready-for-agent

- [ ] Word count e reading time vengono calcolati dal documento Tiptap corrente e mostrati sotto l'editor.
- [ ] Le metriche sono aggiornate su contenuto vuoto e non vuoto, non vengono persistite e non introducono campi nel Post.
- [ ] La stima del reading time usa una regola deterministica e arrotonda in modo coerente per contenuti non vuoti.
- [ ] Una sequenza ravvicinata di modifiche produce un autosave debounced, non una richiesta per ogni transazione.
- [ ] Il bridge Tiptap/React Hook Form non pianifica percorsi duplicati per lo stesso aggiornamento.
- [ ] Il successo dell'autosave non mostra un toast a ogni modifica.
- [ ] Lo stato del Post comunica almeno salvataggio in corso, salvato ed errore; gli errori restano visibili.
- [ ] Le invalidazioni di query non necessarie dopo un aggiornamento del body vengono evitate.
- [ ] Metriche, menu e toolbar sottoscrivono solo lo stato necessario e non causano render inutili dell'intero editor.
- [ ] Il test sul seam Tiptap verifica word count, reading time e comportamento debounced osservabile.
- [ ] Sono eseguiti lint e test pertinenti.
