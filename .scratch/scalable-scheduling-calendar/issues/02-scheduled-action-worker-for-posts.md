# 02: Portare la Scheduled publication dei Post su ScheduledAction

**What to build:** mantenere invariato il comportamento visibile della Scheduled publication dei Post, ma rappresentare ed eseguire ogni pubblicazione tramite il nuovo modello `ScheduledAction` e il worker comune.

**Blocked by:** 01 — Rendere affidabile la Scheduled publication dei Post

**Status:** ready-for-agent

- [ ] La schedulazione di un Post crea una `ScheduledAction` con tipo, target, orario previsto, timezone e chiave di idempotenza.
- [ ] La `ScheduledAction` conserva gli stati operativi separati da `ContentStatus`, inclusi elaborazione, retry, successo, errore e annullamento.
- [ ] Il worker individua le azioni dovute in un batch limitato.
- [ ] Il worker acquisisce ogni azione in modo atomico e concorrente tramite claim e lease.
- [ ] Un’interruzione del worker non lascia un’azione bloccata indefinitamente: un lease scaduto consente il recupero.
- [ ] La Scheduled publication usa l’ultima versione salvata ed eleggibile del Post al momento dell’esecuzione.
- [ ] L’esecuzione di una stessa `ScheduledAction` è idempotente e non pubblica lo stesso Post due volte.
- [ ] Errori temporanei e permanenti producono rispettivamente retry limitati o stato terminale di errore.
- [ ] Un errore su un Post non impedisce l’elaborazione degli altri Post dovuti nello stesso batch.
- [ ] I Post già schedulati prima della migrazione vengono rappresentati correttamente nel nuovo modello.
- [ ] I dati legacy della Scheduled publication restano sincronizzati durante la fase di compatibilità.
- [ ] L’endpoint cron esistente continua a funzionare come boundary compatibile verso il worker comune.
- [ ] Sono presenti test di integrazione su claim, lease, retry, idempotenza, batch, backfill e compatibilità del comportamento Post.
