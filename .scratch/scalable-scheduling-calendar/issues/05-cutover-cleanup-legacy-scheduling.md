# 05: Completare il cutover e rimuovere le duplicazioni legacy

**What to build:** completare la transizione al modello `ScheduledAction`, eliminando i percorsi duplicati della vecchia schedulazione Post senza modificare il comportamento osservabile per Post e newsletter.

**Blocked by:** 02 — Portare la Scheduled publication dei Post su ScheduledAction; 03 — Rendere il calendario range-based e consultabile; 04 — Schedulare e inviare le newsletter

**Status:** ready-for-agent

- [ ] Esiste un solo percorso operativo per acquisire ed eseguire Scheduled action.
- [ ] Il worker legacy non può processare gli stessi Post insieme al worker comune.
- [ ] Le mutation e i boundary pubblici non creano schedulazioni duplicate o stati divergenti.
- [ ] La sincronizzazione dei campi legacy viene rimossa o resa esplicitamente di sola compatibilità quando non è più necessaria.
- [ ] I campi e le transizioni legacy vengono rimossi soltanto dopo aver verificato il backfill e l’assenza di Scheduled action incoerenti.
- [ ] La documentazione descrive il cron come trigger del worker comune per Post e newsletter.
- [ ] Il comportamento della Scheduled publication dei Post resta compatibile con quello precedente.
- [ ] Lo storico delle Scheduled action già completate, fallite o annullate viene preservato.
- [ ] Sono presenti test di regressione sull’intero flusso Post, newsletter, cron, calendario e migrazione.
- [ ] Social, ruoli e permissions restano fuori dal cutover e non vengono modificati.
