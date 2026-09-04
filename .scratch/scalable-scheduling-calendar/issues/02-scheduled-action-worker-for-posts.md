# 02: Portare la Scheduled publication dei Post su ScheduledAction

**What to build:** mantenere invariato il comportamento visibile della Scheduled publication dei Post, ma rappresentare ed eseguire ogni pubblicazione tramite il nuovo modello `ScheduledAction` e il worker comune.

**Blocked by:** None (Ticket 01: Rendere affidabile la Scheduled publication dei Post risolto)

**Status:** ready-for-human

- [x] La schedulazione di un Post crea una `ScheduledAction` con tipo, target, orario previsto, timezone e chiave di idempotenza.
- [x] La `ScheduledAction` conserva gli stati operativi separati da `ContentStatus`, inclusi elaborazione, retry, successo, errore e annullamento.
- [x] Il worker individua le azioni dovute in un batch limitato.
- [x] Il worker acquisisce ogni azione in modo atomico e concorrente tramite claim e lease.
- [x] Un’interruzione del worker non lascia un’azione bloccata indefinitamente: un lease scaduto consente il recupero.
- [x] La Scheduled publication usa l’ultima versione salvata ed eleggibile del Post al momento dell’esecuzione.
- [x] L’esecuzione di una stessa `ScheduledAction` è idempotente e non pubblica lo stesso Post due volte.
- [x] Errori temporanei e permanenti producono rispettivamente retry limitati o stato terminale di errore.
- [x] Un errore su un Post non impedisce l’elaborazione degli altri Post dovuti nello stesso batch.
- [x] I Post già schedulati prima della migrazione vengono rappresentati correttamente nel nuovo modello.
- [x] I dati legacy della Scheduled publication restano sincronizzati durante la fase di compatibilità.
- [x] L’endpoint cron esistente continua a funzionare come boundary compatibile verso il worker comune.
- [x] Sono presenti test di integrazione su claim, lease, retry, idempotenza, batch, backfill e compatibilità del comportamento Post.
