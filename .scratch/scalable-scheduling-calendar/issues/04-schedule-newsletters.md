# 04: Schedulare e inviare le newsletter

**What to build:** permettere all’editor di schedulare un `EmailSingleSend`, modificarne o annullarne l’invio, eseguirlo automaticamente tramite il worker comune e consultarlo nello stesso calendario dei Post.

**Blocked by:** None (Ticket 03: Rendere il calendario range-based e consultabile risolto)

**Status:** ready-for-agent

- [ ] L’editor può creare una Scheduled action di tipo `SEND_EMAIL` per un EmailSingleSend valido.
- [ ] L’editor può modificare l’orario o annullare l’invio prima dell’esecuzione.
- [ ] La schedulazione rispetta il timezone del browser e gli intervalli di cinque minuti.
- [ ] Al momento dell’esecuzione viene utilizzato l’ultimo subject e l’ultimo body salvato per l’EmailSingleSend.
- [ ] Al momento dell’esecuzione viene utilizzata la configurazione aggiornata delle audience selezionate.
- [ ] I contatti dell’audience vengono risolti dinamicamente al momento dell’invio e non copiati nella Scheduled action.
- [ ] Più audience vengono gestite secondo una semantica esplicita e non viene utilizzata silenziosamente soltanto la prima.
- [ ] Una newsletter incompleta o priva di audience/provider valido non produce una chiamata esterna e genera un errore persistito.
- [ ] L’invio viene eseguito tramite un handler email del worker comune e non tramite logica duplicata nel calendario o nell’interfaccia.
- [ ] Gli errori temporanei del provider producono retry limitati e gli errori permanenti producono uno stato terminale di errore.
- [ ] La stessa Scheduled action non può generare due invii effettivi in caso di retry o richieste cron concorrenti.
- [ ] La Scheduled action conserva l’orario pianificato, l’orario effettivo, i tentativi, l’errore e l’identificativo restituito dal provider quando disponibile.
- [ ] Le newsletter pianificate, completate, fallite e annullate sono visibili nel calendario e nei relativi filtri.
- [ ] Lo storico dell’invio rimane disponibile anche se l’EmailSingleSend viene riutilizzato per una futura nuova schedulazione.
- [ ] Sono presenti test di integrazione su contenuto aggiornato, audience dinamica, audience multiple, retry, idempotenza e storico calendario.
