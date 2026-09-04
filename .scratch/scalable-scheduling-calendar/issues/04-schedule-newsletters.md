# 04: Schedulare e inviare le newsletter

**What to build:** permettere all’editor di schedulare un `EmailSingleSend`, modificarne o annullarne l’invio, eseguirlo automaticamente tramite il worker comune e consultarlo nello stesso calendario dei Post.

**Blocked by:** None (Ticket 03: Rendere il calendario range-based e consultabile risolto)

**Status:** ready-for-agent

- [x] L’editor può creare una Scheduled action di tipo `SEND_EMAIL` per un EmailSingleSend valido.
- [x] L’editor può modificare l’orario o annullare l’invio prima dell’esecuzione.
- [x] La schedulazione rispetta il timezone del browser e gli intervalli di cinque minuti.
- [x] Al momento dell’esecuzione viene utilizzato l’ultimo subject e l’ultimo body salvato per l’EmailSingleSend.
- [x] Al momento dell’esecuzione viene utilizzata la configurazione aggiornata delle audience selezionate.
- [x] I contatti dell’audience vengono risolti dinamicamente al momento dell’invio e non copiati nella Scheduled action.
- [x] Più audience vengono gestite secondo una semantica esplicita e non viene utilizzata silenziosamente soltanto la prima.
- [x] Una newsletter incompleta o priva di audience/provider valido non produce una chiamata esterna e genera un errore persistito.
- [x] L’invio viene eseguito tramite un handler email del worker comune e non tramite logica duplicata nel calendario o nell’interfaccia.
- [x] Gli errori temporanei del provider producono retry limitati e gli errori permanenti producono uno stato terminale di errore.
- [x] La stessa Scheduled action non può generare due invii effettivi in caso di retry o richieste cron concorrenti.
- [x] La Scheduled action conserva l’orario pianificato, l’orario effettivo, i tentativi, l’errore e l’identificativo restituito dal provider quando disponibile.
- [x] Le newsletter pianificate, completate, fallite e annullate sono visibili nel calendario e nei relativi filtri.
- [x] Lo storico dell’invio rimane disponibile anche se l’EmailSingleSend viene riutilizzato per una futura nuova schedulazione.
- [x] Sono presenti test di integrazione su contenuto aggiornato, audience dinamica, audience multiple, retry, idempotenza e storico calendario.

## Comments

Implemented. Il campo `active` su `ScheduledAction` (con unique index parziale su `(targetType, targetId) WHERE active = true`) permette di storicizzare più invii per lo stesso EmailSingleSend. L’invio avviene tramite `handleSendEmail` (worker comune) che usa `sendSingleSend`: subject/body/audience letti all’esecuzione, una broadcast per audience, errore persistito senza chiamata esterna se il contenuto non è valido. Aggiunte procedure tRPC (`schedule`/`reschedule`/`cancelSchedule`/`getSchedule`) e UI in `WriteForm`. Test: `send-single-send.test.ts`, `schedule-single-send.test.ts`, `send-email-handler.test.ts`, `send-email-scheduling.test.ts`. Suite completa: 103 test verdi. `npm run lint` ha solo errori preesistenti al repo; nessun nuovo errore nei file aggiunti/modificati.

Follow-up (review): rimosso il partial unique index (non rappresentabile nel datamodel Prisma, fonte di drift potenziale). L’invariante “una sola Scheduled action attiva per target” è ora garantita a livello applicativo: `scheduleSingleSend` usa una transazione con `SELECT … FOR UPDATE` sulla riga `EmailSingleSend` + check dell’azione attiva + `createScheduledActionTx` (stesso pattern di `acquireRootLock` dei Post). Migration `20260904113000_drop_partial_active_unique`; `prisma migrate diff` = vuoto (schema e DB allineati). Aggiunto test race concorrente: 2 richieste parallele → 1 creazione, 1 CONFLICT. Suite: 104 test verdi.
