# 03: Pubblicare automaticamente i Post dovuti tramite cron-job.org

**What to build:** pubblicare automaticamente i Post `SCHEDULED` quando raggiungono l’orario previsto, usando un endpoint protetto ospitato su Vercel e un singolo cron job esterno su cron-job.org eseguito ogni cinque minuti.

**Blocked by:** 01 — Stabilizzare il workflow di pubblicazione dei Post; 02 — Gestire il ciclo di vita della Scheduled publication.

**Status:** ready-for-agent

- [ ] Esiste un endpoint applicativo dedicato alla scansione e pubblicazione dei Post dovuti.
- [ ] L’endpoint richiede un secret configurato in ambiente e rifiuta richieste prive del secret o con secret errato.
- [ ] L’endpoint cerca i Post `SCHEDULED` con data prevista minore o uguale all’istante corrente.
- [ ] La pubblicazione automatica usa l’ultima versione salvata e non una copia congelata al momento della schedulazione.
- [ ] Il workflow pubblica ogni Post dovuto in modo indipendente.
- [ ] Un errore su un Post non impedisce la pubblicazione degli altri Post dovuti.
- [ ] Il batch è limitato per evitare di superare i limiti di esecuzione delle Vercel Functions.
- [ ] I Post non ancora dovuti restano `SCHEDULED` e non vengono modificati.
- [ ] Dopo una pubblicazione automatica riuscita, il Post diventa `PUBLISHED`, la versione precedente non è più la versione pubblica latest, `scheduledAt` viene azzerato e `publishedAt` rappresenta il momento effettivo della pubblicazione.
- [ ] Un Post già pubblicato, eliminato o non più `SCHEDULED` viene ignorato senza effetti duplicati.
- [ ] Un Post incompleto o la cui pubblicazione fallisce resta `SCHEDULED` ed è nuovamente eleggibile al ciclo successivo.
- [ ] L’esecuzione automatica è idempotente anche in caso di richieste ripetute o concorrenti.
- [ ] Un Post `SCHEDULED` con data nel passato viene riconosciuto nell’interfaccia come pubblicazione da verificare.
- [ ] Le informazioni tecniche sugli errori vengono registrate nei log server senza introdurre lo stato `FAILED`.
- [ ] Sono presenti test di integrazione sul workflow automatico con orologio controllabile, più Post dovuti, Post futuri, errori parziali, retry e idempotenza.
- [ ] I test usano il database già configurato nel file `.env` come database di test del progetto.
- [ ] Le migration necessarie vengono eseguite su quel database prima dei test.
- [ ] Sono presenti test sul boundary HTTP dell’endpoint per autenticazione valida, autenticazione non valida, scansione riuscita ed errore infrastrutturale.
- [ ] È documentata la configurazione di un singolo cron job cron-job.org con metodo POST, header segreto e frequenza ogni cinque minuti.
- [ ] È documentato che Vercel ospita l’endpoint ma non esegue Vercel Cron per questa funzionalità.
- [ ] È documentato che il cron job esterno non crea una schedulazione per ogni Post.
- [ ] Il lint e gli altri controlli di validazione disponibili nel progetto restano verdi.
