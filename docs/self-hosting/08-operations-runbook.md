# 08 — Runbook operativo

Tutto ciò che serve per gestire Pictures Writers sulla VPS dopo il cutover: deploy, rollback, backup, restore, monitoraggio, aggiornamenti, incidenti.

> Tieni questo file aperto durante le operazioni delicate. I comandi assumono accesso root alla VPS e Coolify su `https://coolify.<DOMAIN>`.

---

## 1. Rituali

### Ogni giorno (2 minuti)

- [ ] Coolify: app e DB **Healthy**.
- [ ] Ultimo backup DB: **Success**.
- [ ] Ultimo backup del volume media (se usi il driver `local`): **Success**.
- [ ] Errori ripetuti nei log runtime.
- [ ] Spazio disco < 80%.
- [ ] Uptime esterno: tutto verde.

### Ogni settimana (10 minuti)

- [ ] `docker system df` e pulizia se necessario.
- [ ] Log di scheduler e automazioni: run falliti?
- [ ] Email: bounce/anomalie?
- [ ] Webhook Stripe/Resend: eventi falliti?
- [ ] Certificato TLS: giorni alla scadenza.
- [ ] Aggiornamenti di sicurezza installati (unattended-upgrades).

### Ogni mese (30 minuti)

- [ ] Test di restore del backup in un DB usa-e-getta.
- [ ] Spazio del volume media e crescita della libreria (`du -sh` sul mount).
- [ ] Aggiornamento Coolify (dopo release notes) in finestra di manutenzione.
- [ ] Aggiornamento dipendenze npm (in branch, con test).
- [ ] Review accessi: utenti admin, chiavi SSH, token.
- [ ] Review costi Hetzner/S3.
- [ ] Controllo capacità: RAM, disco, connessioni DB.

### Ogni 3 mesi

- [ ] Restore completo su una VPS di test, DB e volume media.
- [ ] Rotazione dei segreti che si possono ruotare (vedi §9).
- [ ] Verifica GDPR/subprocessors (Hetzner, Cloudflare, Resend, Stripe, UploadThing finché restano Media sul provider).
- [ ] Aggiornamento major di PostgreSQL solo con procedura dedicata (mai in-place senza backup).

---

## 2. Deploy di una modifica

### 2.1 Flusso standard

1. Sviluppa e testa in locale (`npm run lint`, `npm run test:run`).
2. Push su `master` (o sul branch collegato).
3. Coolify crea il deploy automaticamente (se auto-deploy è attivo) oppure premi **Deploy**.
4. Il nuovo container:
   - esegue `prisma migrate deploy`;
   - avvia Next.js;
   - supera l'healthcheck.
5. Coolify ferma il vecchio container (rolling update).
6. Verifica:
   - home, login admin, una pagina, un prodotto;
   - log senza errori;
   - healthcheck.

### 2.2 Migrazioni sicure (expand/contract)

Durante un rolling update, **vecchio e nuovo container girano insieme**. Una migrazione distruttiva può rompere il vecchio.

Regole:

- **Aggiungere** colonne/tabelle/indici: sicuro.
- **Rinominare** o **eliminare** colonne: farlo in due deploy.
  1. Deploy A: aggiungi la nuova colonna, scrivi su entrambe, backfill.
  2. Deploy B: il codice legge solo la nuova; smetti di scrivere la vecchia.
  3. Deploy C: elimina la vecchia colonna.
- **Indici grandi**: usa `CREATE INDEX CONCURRENTLY` (fuori da transazione) e verifica il tempo.
- **Lock lunghi**: evita `ALTER TABLE` pesanti in orario di punta.
- **Backfill**: script idempotente, batch, con logging.
- **Test**: esegui la migrazione su una copia del DB prima della produzione.

Prisma genera SQL; controlla sempre il file in `prisma/migrations/` prima del deploy.

> **Ordine corretto in questa app:** la migrazione gira nel Build Command **prima** di `next build`, perché il prerender legge il DB. Durante il build il vecchio container sta ancora servendo: per questo le migrazioni devono essere retrocompatibili. Per una modifica distruttiva, ferma l'app o usa una finestra di manutenzione e expand/contract.

### 2.3 Se il deploy fallisce

Coolify tiene il vecchio container se il nuovo non è healthy. Il sito resta online.

1. Apri i log del deploy.
2. Correggi il codice o la migrazione.
3. Ridispiega.

Se il vecchio container è già stato fermato (nessun healthcheck o errore di rolling), usa **Rollback** (§3).

### 2.4 Modifica di variabili d'ambiente

- **Runtime only** (es. `STRIPE_API_KEY`): salva + **Restart**.
- **Build-time** (es. `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_*`): salva + **Deploy** (rebuild).
- **Segreti**: non incollarli nei log, non metterli in URL, non committarli.
- Dopo la modifica, verifica che il container abbia il valore:

  ```bash
  docker exec <APP_CONTAINER> printenv | sort | grep -E 'DATABASE_URL|NEXT_PUBLIC_APP_URL'
  ```

  (Evita di stampare segreti in terminali condivisi.)

### 2.5 Migrazione dei documenti Puck (Flex e Grid → Container)

Il passaggio a un solo blocco di layout elimina i tipi `Flex` e `Grid`: i documenti che li contengono vanno riscritti **prima** del deploy che li rimuove dal codice. Con la versione precedente ancora live un `Container` viene renderizzato correttamente; deployando prima, le pagine pubblicate mostrerebbero il placeholder del componente non trovato.

1. Anteprima, che non scrive nulla e riporta ogni versione che cambierebbe:

   ```bash
   npm run puck:migrate-layout-blocks:dry-run
   ```

2. Esecuzione, con la versione precedente ancora in produzione e in una finestra di basso traffico:

   ```bash
   npm run puck:migrate-layout-blocks
   ```

3. Solo dopo, deploy del codice che rimuove i due blocchi.

La trasformazione scrive nel rung desktop la modalità con cui il nodo veniva renderizzato (flex o grid) prima di cambiare il tipo, preserva le altre proprietà e i figli, ed è idempotente: una seconda esecuzione non riporta modifiche. `scanned` conta tutte le versioni di Page e Site region (bozze, correnti, live e storico); `documents` elenca le versioni modificate con i nodi toccati; `failed` elenca le righe non scritte e il motivo, senza interrompere il resto.

Entrambi i comandi leggono il `DATABASE_URL` dell'ambiente in cui girano. Il container ancora live è la versione precedente e non ha lo script: l'esecuzione avviene da un checkout del nuovo branch con `DATABASE_URL` puntato al database di produzione (tramite tunnel SSH sul database), oppure con `docker run --rm` dell'immagine nuova sulla rete del progetto Coolify. Non eseguirla dentro il container della versione precedente.

---

## 3. Rollback dell'app

### 3.1 Rollback immagine (preferito)

Coolify conserva le immagini precedenti (in base alla retention).

1. App → **Deployments** (o **Rollbacks**).
2. Seleziona il deployment precedente.
3. **Rollback**.
4. Verifica healthcheck e sito.

Il DB **non** viene ripristinato: se la migrazione ha cambiato lo schema, assicurati che il codice vecchio sia compatibile. In caso contrario, ripristina anche il DB (raro; di solito si corregge in avanti).

### 3.2 Rollback via Git

```bash
git revert <commit>
git push
```

Coolify ricostruisce. Più lento ma tracciabile.

### 3.3 Se la VPS è irraggiungibile

Non esiste più un fallback DNS verso Vercel/Neon: la produzione è la VPS. Il ripristino passa da Hetzner/Coolify (riavvio del server, restore dello snapshot o ripristino del backup del database), non da un cambio di record DNS.

---

## 4. Backup e restore

### 4.1 Backup

- Coolify: database → Backups → schedule giornaliero + S3.
- Hetzner: backup automatici dell'intera VPS (se attivi).
- Coolify config: `/data/coolify/source/.env` nel password manager.

### 4.2 Restore di un backup in produzione

> Operazione distruttiva: sostituisce i dati del DB. Fallo solo se necessario.

1. Ferma l'app.
2. Fai un backup **del DB attuale** (anche se corrotto, può servire).
3. Scarica il dump da S3 o usalo dal path locale.
4. Ripristina:

   ```bash
   docker cp /path/backup.dump <DB_CONTAINER>:/tmp/restore.dump
   docker exec -it <DB_CONTAINER> \
     pg_restore -U postgres -d postgres \
       --no-owner --no-privileges \
       --clean --if-exists \
       --single-transaction --exit-on-error \
       /tmp/restore.dump
   ```

5. Verifica `_prisma_migrations` e i conteggi.
6. Avvia l'app; esegui `npx prisma migrate status`.
7. Smoke test.
8. Annota l'incidente e la perdita di dati (RPO).

### 4.3 Restore dell'intera VPS

1. Crea una nuova VPS dallo snapshot Hetzner (o reinstalla).
2. Ripristina `/data/coolify/source/.env`.
3. Riavvia Coolify.
4. Verifica che i volumi Docker siano presenti, incluso il volume `media-storage` montato su `/data/media`.
5. Se il volume del DB è perso, ripristina l'ultimo dump S3. Se il volume media è perso, ripristinalo dall'archivio (4bis.5) prima di avviare l'app.
6. Ricrea DNS se l'IP è cambiato.
7. Verifica TLS.
8. Esegui `npm run media:audit` e un paio di richieste a un Media locale e a uno storico.

### 4.4 RPO/RTO realistici

| Scenario | RPO | RTO |
|---|---|---|
| Errore applicativo | 0 | minuti (rollback) |
| DB corrotto | fino a 24 h (backup giornaliero) | 30–90 min |
| Volume media perso | fino a 24 h (backup del volume, oggi locale alla VPS; off-site non ancora attivo) | 30–90 min |
| VPS persa | fino a 24 h | 1–3 h (nuova VPS + restore) |
| Errore umano su file | 0 (git) | minuti |

Se ti serve un RPO più basso, aggiungi WAL archiving/PITR (pgBackRest/WAL-G) e testalo. Non improvvisare in emergenza.

### 4.5 Restore di un dump in sviluppo

Il dump di produzione contiene utenti veri, contenuti veri e **token di sessione in chiaro**: la
colonna `token` di `Session` non è un hash. Se il `.env` di sviluppo condivide
`BETTER_AUTH_SECRET` con la produzione, quel token vale anche là, e il dominio di produzione è
scritto in questo stesso repo. Quindi, subito dopo un restore e prima di aprire qualunque
sessione:

1. Svuota le righe che sono credenziali:

   ```bash
   Get-Content scripts/sanitize-dev-dump.sql | npm run -s dev:db:psql
   ```

   Rimuove `Session`, `Verification`, `Credential` e `Integration`; utenti, account e contenuti
   restano, quindi il sito locale si vede e il login funziona.

2. Non copiare **nessuna** variabile di produzione nel `.env` di sviluppo. In particolare
   `BETTER_AUTH_SECRET`, `SECRETS_ENCRYPTION_KEY`, `AUTOMATION_CREDENTIALS_KEY`,
   `SCHEDULED_PUBLICATION_SECRET` e le chiavi di Resend, SendGrid e UploadThing. Le chiavi di
   terze parti vivono solo in Coolify; in sviluppo si usano chiavi separate o vuote.

3. Con chiavi di cifratura diverse, le righe con `secretEncrypted` sono illeggibili in locale: è
   il comportamento voluto, e il passo 1 le elimina comunque.

Un agente non lavora su questo database: `npm run dev:agent` usa `pictures_writers_agent`, come
spiegano `AGENTS.md` e `docs/agents/browser-probe.md`.

---

## 4bis. Media: consegna, backfill, volume e audit

### 4bis.1 Come vengono serviti i media

La VPS **non** ottimizza le immagini durante una visita. Le rendition AVIF/WebP sono già state prodotte al momento dell'upload (o dal backfill); il loader custom di `next/image` (`src/modules/media/lib/image-loader.ts`) restituisce l'indirizzo della rendition già presente, oppure l'originale quando la rendition non esiste ancora. `/_next/image` e i vecchi oggetti in `.next/cache/images` non sono più usati.

La consegna passa dalla route `GET /media/<key>`: un Media scritto dal driver `local` viene letto dal volume e inviato con `Content-Type`, `ETag`, `Cache-Control` e `Accept-Ranges`; un Media remoto riceve un `302` verso il CDN del provider. Ogni riga conserva il driver che l'ha scritta, quindi una libreria mista (Media storici su UploadThing, nuovi Media su disco) funziona senza migrazione e senza riscrivere indirizzi. Un Media storico con indirizzo assoluto non passa dalla route: il browser va direttamente al provider.

La scala delle larghezze è una costante condivisa (`src/modules/media/lib/image-ladder.mjs`) tra `next.config.mjs` e il processore: il loader non può chiedere una larghezza che non venga generata.

### 4bis.2 Backfill dei metadati

Dopo il primo deploy che include il modello `Media` arricchito, le immagini storiche non hanno MIME, dimensioni, checksum né placeholder. Il job li calcola una volta, in modo idempotente:

```bash
# anteprima: legge le sorgenti ma non scrive
MEDIA_BACKFILL_DRY_RUN=1 npm run media:backfill-metadata

# esecuzione (finestra di basso traffico)
MEDIA_BACKFILL_CONCURRENCY=4 npm run media:backfill-metadata
```

- Il job processa solo `MediaType.IMAGE`; PDF, audio e video restano intatti.
- Ogni riga viene letta attraverso il driver registrato su di essa, non attraverso quello attivo: una libreria mista (Media storici su UploadThing e Media scritti su disco) si elabora in un'unica esecuzione. Una riga il cui driver non è configurato su questa istanza, o il cui nome questa build non conosce, finisce in `failed` con il motivo e il resto continua.
- Le sorgenti non raggiungibili vengono riportate e saltate, senza interrompere il resto.
- Rieseguirlo è sicuro: le righe già complete vengono saltate (`updated: 0`).
- La concorrenza predefinita è 4; alzala solo se la VPS non ha altro carico.
- Il report finale elenca `scanned`, `updated`, `skipped` e i `failed` con il motivo.
- Il comando esce con codice `1` se `failed` non è vuoto, anche in dry-run: un gate di deploy può fidarsi del codice invece di leggere il report.

Finché il backfill non è completo il loader serve gli originali: nessuna immagine rotta e nessun blocco del deploy.

### 4bis.3 Backfill delle rendition

Le immagini caricate dopo il deploy che include il processore hanno già le rendition. Le immagini storiche no: fino a quando non vengono elaborate, il loader restituisce il loro originale. Il job genera, una volta sola, l'originale normalizzato e l'intera scala di rendition (AVIF e WebP per ogni larghezza) per tutte le `Media` di tipo immagine che ne sono prive.

**Quando eseguirlo.** Dopo il backfill dei metadati (4bis.2), una sola volta, in una finestra di basso traffico (notte o domenica). Non durante un deploy: il job genera circa 8.000–10.000 oggetti e usa CPU per `sharp`. Non è pianificato: resta un comando manuale.

```bash
# anteprima: elenca solo le Media in attesa, non legge né scrive nulla
MEDIA_BACKFILL_DRY_RUN=1 npm run media:backfill-renditions

# esecuzione (finestra di basso traffico)
MEDIA_RENDITION_BACKFILL_CONCURRENCY=2 npm run media:backfill-renditions
```

Dentro il container dell'app:

```bash
docker exec -it <APP_CONTAINER> npm run media:backfill-renditions
```

- Processa solo `MediaType.IMAGE`; PDF, audio e video non vengono toccati.
- Legge e scrive ogni riga attraverso il driver registrato su di essa: una libreria mista elabora in un'unica esecuzione le Media storiche del provider e quelle locali. Una riga il cui driver non è configurato qui, o il cui nome questa build non conosce, finisce in `failed` con il motivo e non interrompe il run.
- La concorrenza predefinita è **2**. Conta le immagini elaborate in parallelo, non le rendition: ogni immagine esegue in sequenza i tagli della scala. Alzala solo se la VPS è altrimenti inattiva; su 4 vCPU non conviene superare 2–4.
- È idempotente: le Media che hanno già un manifest di rendition vengono saltate, quindi rieseguirlo non duplica oggetti né riscrive righe.
- Una sorgente non raggiungibile o non decodificabile finisce nell'elenco `failed` con il motivo e non interrompe il resto. Le altre immagini continuano a essere elaborate.
- Un Media elaborato attraverso il provider conserva gli indirizzi del provider nel manifest delle rendition (`?mt=`); uno elaborato su disco porta indirizzi relativi `/media/...`.
- Il comando esce con codice `1` se `failed` non è vuoto. Un'anteprima non legge gli oggetti, ma segnala già le righe il cui driver non è configurato qui.
- Se un'immagine fallisce, il job rimuove gli oggetti parziali della nuova revisione quando il prefisso era vuoto; l'originale gi� in consegna non viene mai rimosso. L'immagine continua a essere servita come prima e un rerun sovrascrive eventuali rendition orfane.
- L'originale storico **non viene cancellato**: gli URL assoluti dentro Puck, TipTap, email e annunci continuano a funzionare. Solo gli URL della libreria (e quindi le pagine che usano la relazione `Media`) passano alle rendition.
- Un'immagine archiviata viene elaborata ma continua a essere servita come originale; ripristinandola, il loader torna a usare le rendition.

**Come leggere il report.** Alla fine il comando stampa un JSON:

| Campo | Significato |
|---|---|
| `scanned` | Media immagine esaminate (escluse le altre tipologie). |
| `processed` | Media elaborate con successo in questa esecuzione. |
| `skipped` | Media che avevano già le rendition: non sono state toccate. |
| `pending` | Lavoro trovato all'avvio: in dry-run è l'anteprima, in esecuzione reale corrisponde a `processed + failed`. |
| `failed` | Sorgenti non elaborate, con `mediaId`, `name` e `reason` (es. `source not found in storage`, `no readable storage key`, immagine non decodificabile). |
| `dryRun` | `true` se è stata un'anteprima. |

Esempio di esecuzione completa:

```json
{
  "scanned": 2,
  "processed": 1,
  "skipped": 0,
  "pending": [
    { "mediaId": "0f...", "name": "cover.jpg" },
    { "mediaId": "3a...", "name": "missing.jpg" }
  ],
  "failed": [
    { "mediaId": "3a...", "name": "missing.jpg", "reason": "source not found in storage" }
  ],
  "dryRun": false
}
```

Se `failed` non è vuoto, controlla che l'oggetto esista ancora sul provider con la chiave indicata: un URL UploadThing cancellato non è recuperabile. Le Media fallite restano servite come originali e possono essere riprovate con lo stesso comando.

**Verifica.** Dopo il run, dal sito controlla che una pagina con immagine storica serva un URL di rendition (`.avif`/`.webp` sul CDN) invece dell'originale, e che il media library mostri ancora una sola riga per file. Il job non modifica i contenuti: se un URL assoluto dentro un testo punta ancora all'originale, è atteso.

### 4bis.4 Driver locale: volume persistente

Il driver `local` scrive sotto `MEDIA_STORAGE_LOCAL_ROOT`. In produzione quel percorso deve stare su un **volume Docker persistente**: senza volume, ogni redeploy cancella i file caricati. La produzione corrente monta un volume `media-storage` su `/data/media` e imposta:

```bash
MEDIA_STORAGE_LOCAL_ROOT=/data/media
```

Non serve impostare `MEDIA_STORAGE_DRIVER=local`: il driver attivo per i nuovi upload si sceglie in **Admin → Media** e vive in `Settings.storageDriver`; la variabile è solo il fallback di un'Installazione che non ha ancora scelto, e il fallback è `local`. Un'Installazione già sul provider registra `uploadthing` esplicitamente (setting o variabile) prima di adottare questo codice. `MEDIA_STORAGE_LOCAL_PUBLIC_URL` non esiste più: gli indirizzi locali sono sempre `/media/<key>`.

Verifica del mount:

```bash
docker volume ls | grep media-storage
docker inspect <APP_CONTAINER> --format '{{json .Mounts}}'
```

Il container scrive come root. Se ricrei il volume, verifica che sia scrivibile prima di scegliere `local`. Un file caricato dopo il mount deve restare servibile dopo un redeploy.

### 4bis.5 Backup e restore del volume media

Il backup del database **non** contiene i file su disco: il volume va incluso nella stessa pianificazione. Programma un backup giornaliero del volume (in Coolify, se la versione offre il backup dei volumi, altrimenti con un job sul server che esegue il comando sotto) e verifica che l'ultimo run sia `Success`, che l'archivio abbia dimensione > 0 e che sia scaricabile.

> **Stato attuale (novembre 2026):** il backup schedulato del volume è locale alla VPS; non esiste ancora una copia off-site. Finché non la aggiungi, la perdita della VPS copre anche i file locali, a meno che gli snapshot Hetzner siano attivi.

Backup manuale equivalente (nome reale del volume da `docker volume ls`, app ferma o finestra di basso traffico):

```bash
docker run --rm -v <MEDIA_VOLUME>:/data -v "$PWD":/backup alpine \
  sh -c 'tar -czf /backup/media-storage-$(date +%F).tar.gz -C /data .'
```

Conserva l'archivio fuori dalla VPS: la copia off-site è il passo successivo (scarica l'archivio o caricalo su R2/B2/S3). Tieni insieme dump del DB e archivio del volume: uno senza l'altro non ricostruisce la libreria.

Restore in produzione:

1. Ferma l'app.
2. Fai comunque un backup del volume attuale.
3. Estrai l'archivio in un volume **vuoto** (non sopra quello vecchio):

   ```bash
   docker run --rm -v <MEDIA_VOLUME_RESTORE>:/data -v "$PWD":/backup alpine \
     sh -c 'tar -xzf /backup/media-storage-YYYY-MM-DD.tar.gz -C /data'
   ```

4. Verifica il contenuto (`docker run --rm -v <MEDIA_VOLUME_RESTORE>:/data alpine find /data -type f | wc -l`) e sostituisci il volume montato dall'app, oppure svuota quello vecchio e ricopia.
5. Avvia l'app ed esegui l'audit (4bis.6): `unresolved: 0`, `missing=0`, `orphaned=0`.
6. Apri dal sito un Media locale e un Media storico e verifica che rispondano 200.

Il drill completo — restore in uno scratch environment e file servito dal suo indirizzo — va eseguito almeno una volta e poi ogni 3 mesi, come il restore del DB.

### 4bis.6 Audit della libreria

Prima e dopo ogni cambio di driver, e dopo un restore del volume, esegui il controllo read-only:

```bash
npm run media:audit
```

Dentro il container:

```bash
docker exec -it <APP_CONTAINER> npm run media:audit
```

Legge ogni file registrato, risolve il driver registrato sul file e stampa un report come questo (esempio):

```txt
files: 723
drivers: local=3 uploadthing=720
configured drivers: local uploadthing
unconfigured drivers: none
bytes: accounted=377135934 localAccounted=31781 localOnDisk=31781 localDifference=0
objects: accounted=35 onDisk=35 missing=0 orphaned=0
unresolved: 0
```

| Campo | Significato |
|---|---|
| `files` | Ogni file registrato, di qualunque ruolo: Media, allegato, avatar. |
| `drivers` | File per driver registrato; `unknown` per un nome che questa build non conosce. |
| `configured drivers` | Driver con credenziali su questa istanza. |
| `unconfigured drivers` | Driver registrati su qualche file ma senza credenziali su questa istanza (es. `uploadthing` senza `UPLOADTHING_TOKEN`). |
| `bytes` | Byte contabilizzati sull'intera libreria, byte delle sole righe locali, byte realmente sul volume e differenza (`localOnDisk - localAccounted`). |
| `objects` | Oggetti locali contabilizzati, presenti sul volume, mancanti e orfani. |
| `unresolved` | File che non si risolvono, con id e motivo (`unknown-driver`, `driver-unconfigured`, `no-storage-key`, `no-stored-file`, `object-missing`). |

Prima del backfill della posizione (4bis.8) ogni Media è ancora senza record e compare in `unresolved` come `no-stored-file`: il comando esce `1`. Non è un guasto, è il gate che chiede il comando, e la consegna intanto funziona perché ripiega sulle colonne della Media. Dopo 4bis.8 la lista deve essere vuota.

I file locali sono verificati uno per uno sul volume; le righe remote solo tramite configurazione e presenza di una chiave leggibile, perché un comando read-only non deve scaricare 720 oggetti dal provider. Il comando **esce 1** se `unresolved` non è vuoto, quindi può fare da gate di deploy. Gli oggetti orfani sono riportati ma non fanno fallire il comando: ogni file si risolve comunque. Il report contiene solo id e aggregati, mai chiavi, indirizzi o nomi.

Un `uploadthing` non configurato compare in `unresolved` anche se gli URL assoluti dei Media storici continuano a rispondere: significa che questa istanza non può cancellare né rielaborare quei file. Rimetti il token prima di un'operazione che tocca i byte.

### 4bis.7 Ordine di attivazione del driver locale

1. **Codice e migrazioni.** Prima del deploy, registra esplicitamente il driver attuale dell'Installazione esistente (`Settings.storageDriver = uploadthing`, oppure `MEDIA_STORAGE_DRIVER=uploadthing`): il default del codice è ora `local`, e un'Installazione senza scelta scriverebbe i nuovi upload su disco. Con la scelta esplicita, il deploy non cambia nulla.
2. **Volume e backup.** Monta il volume, imposta `MEDIA_STORAGE_LOCAL_ROOT`, programma il backup del volume. Carica un file di prova e verifica che sopravviva a un redeploy.
3. **Drill di restore.** Ripristina il volume in uno scratch environment e servi un file. Annota data e esito.
4. **Scelta.** Solo allora seleziona `local` in **Admin → Media**. I nuovi upload vanno su disco, i Media esistenti restano sul provider. Esegui `npm run media:audit`.
5. **Ritorno.** Per tornare indietro seleziona `uploadthing`: i file già locali continuano a essere serviti dal volume e i nuovi upload tornano al provider.

> Il backfill della posizione (4bis.8) precede lo sweep, la scelta `local` e il re-home: senza,
> l'audit resta rosso e le fasi successive partirebbero da una posizione non verificata.

### 4bis.8 Primo deploy del modello stored-file e backfill della posizione

Il modello `StoredFile` è la porta che fa leggere a consegna, quota, audit, libreria admin e
backfill la posizione da un solo posto. Il codice può essere deployato **prima** che il backfill
sia stato eseguito: la consegna ripiega sulle colonne della Media, quindi nessuna immagine si
spegne. Quello che non può essere verde prima è l'audit, perché ogni Media senza record compare
come `no-stored-file`. Questo è quindi il passo una tantum che chiude il primo deploy e che
permette, dopo, di togliere le colonne di storage dalla Media.

Va eseguito una volta, in una finestra di basso traffico, prima dello sweep degli indirizzi e del
re-home. Il comando non riscrive nessuna riga `Media`.

> Questa sezione registra il gate eseguito il 20 novembre 2026 sulla Installation. Dalla release B
> della contrazione `media:backfill-files` non esiste più: il comando non va rieseguito, e i
> passaggi che lo invocano restano come traccia di ciò che è stato verificato.

1. **Registra il driver attivo, prima del deploy.** Il fallback del codice è `local`:
   un'Installazione che non ha mai scelto scriverebbe i nuovi upload sul disco. Su questa
   Installazione imposta `MEDIA_STORAGE_DRIVER=uploadthing` in Coolify (`UPLOADTHING_TOKEN` è già
   presente) e riavvia, come in 4bis.7, passo 1. La variabile è la registrazione esplicita:
   se la togli, il fallback torna `local` e i nuovi upload finiscono sul disco.

   ```bash
   docker exec <APP_CONTAINER> printenv MEDIA_STORAGE_DRIVER   # uploadthing
   ```

2. **Deploya il branch con migrazioni e volume.** Le migrazioni girano nel Build Command prima di
   `next build`. Quelle di questo branch sono additive (tabelle `StoredFile`, `Attachment`,
   `StoragePurgeEntry`, colonne su `Settings`; nessuna colonna che il vecchio container legge
   viene rimossa), quindi il rolling update è sicuro. Il volume `media-storage` deve essere
   montato su `/data/media` con `MEDIA_STORAGE_LOCAL_ROOT=/data/media` (4bis.4), anche se per ora
   gli upload vanno al provider: serve al re-home e ai file locali.

   ```bash
   docker inspect <APP_CONTAINER> --format '{{json .Mounts}}'
   docker exec <APP_CONTAINER> printenv MEDIA_STORAGE_DRIVER MEDIA_STORAGE_LOCAL_ROOT
   docker exec -i <DB_CONTAINER> psql -U postgres -d postgres -At \
     -c "SELECT coalesce((SELECT \"storageDriver\" FROM \"Settings\" LIMIT 1), '(unset)');"
   ```

   La scelta salvata dal selettore (`Settings.storageDriver`) è `uploadthing` o `(unset)`, nel
   qual caso vale la variabile; `local` è un errore da correggere prima di procedere. In
   **Admin → Media** il driver attivo deve risultare UploadThing.

3. **Anteprima, esecuzione, e una seconda esecuzione.** Dentro il container nuovo:

   ```bash
   docker exec -it -e MEDIA_BACKFILL_DRY_RUN=1 <APP_CONTAINER> npm run media:backfill-files
   docker exec -it <APP_CONTAINER> npm run media:backfill-files
   ```

   Usa la variabile e non `-- --dry-run`: il passaggio degli argomenti dopo `--` non è affidabile
   su ogni shell (su Windows/PowerShell l'anteprima girerebbe come esecuzione reale), mentre la
   variabile è la stessa forma già usata dagli altri due backfill e vale ovunque. Il report deve
   dire `dryRun: true`; se dice `false`, l'anteprima non era un'anteprima.

   Un Media con indirizzo assoluto riceve quell'indirizzo come `remoteUrl`; il legacy
   `/assets/<key>` riceve l'indirizzo del provider che quell'URL rappresenta; un Media locale
   lascia `remoteUrl` nullo. Un Media con chiave illeggibile finisce in `failed` con il motivo e
   non viene perso in silenzio. Il comando esce `1` se `failed` non è vuoto.

   Sui 725 Media misurati il 20 novembre 2026 il primo run riporta:

   ```json
   {
     "scanned": 725,
     "created": 725,
     "skipped": 0,
     "failed": [],
     "dryRun": false
   }
   ```

   Esegui di nuovo lo stesso comando: deve riportare `created: 0`, `skipped: 725`. È la prova,
   sui dati veri, che non nascono duplicati. Se `failed` non è vuoto, fermati e indaga quel Media
   prima di proseguire: il gate chiede un record per Media, 725 su 725 alla misura, non 724.

   > La migrazione `add_attachment_and_avatar_role` copia già in `StoredFile` gli allegati email
   > storici. Sono file registrati ma non Media, quindi non compaiono in `scanned`/`created`; si
   > vedono solo nel conteggio `files` dell'audit.

4. **Verifica conteggi, indirizzi remoti e duplicati.**

   Il comando registra ogni indirizzo assoluto come `remoteUrl`. La consegna sa ripiegare sulle
   colonne della Media, quindi senza questo controllo un record con `remoteUrl` nullo resterebbe
   invisibile e la posizione non sarebbe davvero provata:

   ```sql
   SELECT
     (SELECT count(*) FROM "Media") AS media,
     (SELECT count(*) FROM "StoredFile" WHERE kind = 'MEDIA') AS media_files,
     (SELECT count(*) FROM "Media" m WHERE NOT EXISTS (
        SELECT 1 FROM "StoredFile" f WHERE f."mediaId" = m.id)) AS media_without_record,
     (SELECT count(*) FROM "StoredFile"
        WHERE kind = 'MEDIA' AND "remoteUrl" IS NULL) AS without_remote_url,
     (SELECT count(*) FROM (
        SELECT "mediaId" FROM "StoredFile"
        WHERE "mediaId" IS NOT NULL
        GROUP BY "mediaId" HAVING count(*) > 1) d) AS duplicated_roles,
     (SELECT count(*) FROM (
        SELECT "key" FROM "StoredFile"
        GROUP BY "key" HAVING count(*) > 1) k) AS duplicated_keys;
   ```

   Atteso: `media_files = media` (sui 725 misurati il 20 novembre 2026 `media = 725`),
   `media_without_record = 0`, `without_remote_url = 0`, `duplicated_roles = 0`,
   `duplicated_keys = 0`. Se `media` differisce, annota il numero vero: è la libreria, non il
   ticket. Le due unique rendono i duplicati impossibili per costruzione: la prova sui dati è il
   rerun del passo 3.

   Ogni riga deve inoltre nominare uno dei due host del provider: alla misura erano 706 sul più
   recente e 19 sul più vecchio, quindi un host inatteso o un terzo host è un segnale.

   ```sql
   SELECT split_part(split_part("remoteUrl", '//', 2), '/', 1) AS host, count(*)
   FROM "StoredFile"
   WHERE kind = 'MEDIA' AND "remoteUrl" IS NOT NULL
   GROUP BY 1 ORDER BY 2 DESC;
   ```

5. **Ogni Media risolve sul suo indirizzo canonico.** L'indirizzo canonico è `/media/<key>`.
   Segui i redirect con `-L`: la risposta finale è `200`. Finché i byte sono sul provider la
   catena passa dal `302` verso il `remoteUrl` registrato (i 720 coprono due host storici, non uno
   solo) e si chiude sul provider; dopo il re-home la stessa richiesta risponde `200` senza passare
   da nessun provider. Senza `-L` vedi i soli redirect (il trailing slash e il salto al provider),
   non un errore. Libreria e contenuti puntano ancora agli indirizzi assoluti del provider finché
   non passa lo sweep: questo controllo prova che l'indirizzo canonico di ogni file esiste e
   risolve, che è ciò da cui lo sweep dipende. Estrai le chiavi ed esegui il controllo su tutte:

   ```bash
   docker exec -i <DB_CONTAINER> psql -U postgres -d postgres -At \
     -c "SELECT key FROM \"StoredFile\" WHERE kind = 'MEDIA' ORDER BY key;" \
     > /tmp/media-keys.txt
   wc -l /tmp/media-keys.txt          # 725

   while IFS= read -r key; do
     code=$(curl -sL -o /dev/null -w '%{http_code}' "https://<DOMAIN>/media/${key}")
     [ "$code" = "200" ] || echo "$key $code"
   done < /tmp/media-keys.txt
   ```

   L'output atteso del ciclo è vuoto: nessuna riga stampata significa 725 risposte `200` seguendo
   il redirect. Una chiave stampata è un file da indagare **prima** dello sweep.

6. **Audit verde.**

   ```bash
   docker exec -it <APP_CONTAINER> npm run media:audit
   ```

   Atteso per i 725 Media appena registrati più l'allegato email storico che la migrazione ha già
   copiato (una libreria con altri allegati porta `files` più in alto, e file caricati dopo il
   deploy lo alzano ancora):

   ```txt
   files: 726
   drivers: uploadthing=726
   configured drivers: local uploadthing
   unconfigured drivers: none
   unresolved: 0
   ```

   Il numero che chiude il gate è `unresolved: 0`. `bytes.accounted` è il totale dell'intera
   libreria, originali più rendition: non è zero e non cambia con il provider. `localAccounted`,
   `localOnDisk` e gli oggetti locali valgono zero finché i byte sono sul provider; un file di
   prova rimasto sul volume compare come orfano senza far fallire il comando. Un
   `unconfigured drivers:
   uploadthing` significa che il container non vede `UPLOADTHING_TOKEN`: rimettilo prima di
   toccare i byte. Se `unresolved` elenca un file con `unknown-driver`, è tipicamente un allegato
   email storico la cui URL non era né del provider né `/files/` e che la migrazione ha
   registrato sul driver `external`: va risolto o rimosso a mano, perché nessun driver di questa
   build sa cancellarne l'oggetto.

7. **Dump e prova di restore.** Il record deve sopravvivere a un dump e a un restore, altrimenti
   non è un dato di produzione:

   ```bash
   docker exec -it <DB_CONTAINER> pg_dump -U postgres -d postgres -Fc \
     -f /tmp/pw-after-backfill.dump
   docker cp <DB_CONTAINER>:/tmp/pw-after-backfill.dump ~/pw-after-backfill.dump

   docker run -d --name pw-restore-test -e POSTGRES_PASSWORD=test \
     -p 127.0.0.1:55432:5432 postgres:18
   sleep 5
   docker cp ~/pw-after-backfill.dump pw-restore-test:/tmp/backup.dump
   docker exec -it pw-restore-test pg_restore -U postgres -d postgres \
     --no-owner --no-privileges --clean --if-exists /tmp/backup.dump
   docker exec -it pw-restore-test psql -U postgres -d postgres -c \
     "SELECT count(*) AS media_files,
             count(*) FILTER (WHERE \"mediaId\" IS NULL) AS without_media,
             count(*) FILTER (WHERE \"remoteUrl\" IS NULL) AS without_remote_url
      FROM \"StoredFile\" WHERE kind = 'MEDIA';"
   ```

   Atteso `725 | 0 | 0`: count, legame alla Media e indirizzo remoto sopravvivono al dump. Poi
   `docker rm -f pw-restore-test`, cancella il dump di prova (o conservalo
   fuori dal repository come backup), e annota data ed esito. Il dump di restore usa-e-getta è
   lo stesso schema dell'appendice C §10.

**Se qualcosa va storto.** Il backfill è ripartibile e idempotente: si rilancia senza duplicare.
Un rollback dell'app non cancella i record e il vecchio codice li ignora; il comando non ha
riscritto nessuna riga `Media`, quindi non c'è nulla da annullare. Non eseguire sweep, re-home o
la rimozione delle colonne prima che i passi 4–6 siano verdi: sono quelli che provano la
posizione, e ticket 14 (le colonne tolte) dipende da questo gate.

### 4bis.9 Contrazione della Media: due deploy

Togliere dalla `Media` le colonne di storage (`key`, `url`, `size`, `mimeType`, `checksum`,
`storageDriver`) non si può fare nello stesso deploy che smette di usarle: durante il rolling
update il container **precedente** sta ancora servendo e le legge e le scrive. La contrazione è
quindi due release. La release A è il commit `723d7e57`; la release B è quella che porta la
migrazione `contract_media_columns` e non contiene più i due comandi una tantum.

**Release A — il codice smette di leggere e di scrivere le colonne.** La sua migrazione rende
solo `Media.url` nullable (`relax_media_url`), così il codice può creare una riga senza quella
colonna; nessuna colonna viene tolta. Il codice compone ogni indirizzo dal record e dal manifest e
non tocca più le colonne, che restano congelate agli ultimi valori scritti dalla release 13. Il
comando di avvio esegue `media:backfill-manifest-urls` **prima** di `next start`: il server non ha
mai bisogno di `Media.url`, e se il comando riporta un errore il deploy si ferma e Coolify tiene
su il container precedente. Non aspettarsi alcun cambio visibile: sito, libreria, form e email
funzionano come prima.

Dopo che A è live, esegui il comando una seconda volta a mano: copre un upload che il vecchio
container ha scritto durante lo switch. Questo passo vale solo finché gira A: dalla release B il
comando è ritirato e non esiste più.

```bash
docker exec -it <APP_CONTAINER> npm run media:backfill-manifest-urls
```

Il report deve avere `failed: []` e `updated: 0` (la prima esecuzione è già avvenuta all'avvio).
Verifica che nessuna rendition di una riga con manifest resti senza indirizzo (0 righe):

```sql
SELECT count(*) FROM "Media" m
WHERE jsonb_typeof(m."renditions") = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(m."renditions") e
    WHERE e->>'url' IS NULL
  );
```

Poi chiedi una rendition remota a mano: `/media/<key>/<revision>/<width>.<format>` deve rispondere
`302` verso il provider, non `404`. `npm run media:audit` deve essere verde. Fai un dump prima di
B: dopo B non si torna alla release 13 senza ripristinare il database.

Se l'audit elenca una Media `no-stored-file`, è una riga che il container della release 13 ha
inserito durante lo switch senza il record: rilancia `media:backfill-files` finché A è ancora live
(il comando esiste solo in A) e non passare a B prima che l'audit torni verde. Da B in poi una
Media senza record resta un errore dell'audit, non una riga che il deploy può ricostruire.

**Release B — il contratto.** La migrazione toglie le sei colonne; il codice non le usava più, e B
ritira anche i due comandi una tantum (`media:backfill-files` e `media:backfill-manifest-urls`) e
lo step di avvio. Il container precedente è la release A, che non legge né scrive quelle colonne,
quindi il rolling update è sicuro. Verifica dopo il deploy:

- home, un post, un prodotto, la libreria admin e il picker;
- un file locale e una rendition locale (200), una rendition ancora remota (302);
- un replace e una cancellazione su un file di prova;
- audit verde.

**Se qualcosa va storto.** In A il rollback alla 13 è sicuro finché, dopo che A è live, non sono
stati fatti upload o replace: A non aggiorna più le colonne specchio, quindi la 13 vedrebbe una
riga nuova senza `url`. Con upload già avvenuti si va avanti con B, non indietro. Il backfill del
manifest è ripartibile e non muove byte. Dopo B l'unico rollback è ripristinare il dump preso prima
del deploy B.

---

## 5. Monitoraggio e alert

### 5.1 Coolify

Abilita le notifiche per:

- deployment failed;
- backup failed;
- disk usage high;
- server unreachable.

### 5.2 Uptime esterno

Un monitor sulla VPS non può avvisarti se la VPS è giù. Usa un servizio esterno (Better Stack, UptimeRobot, Hetzner?):

- `https://<DOMAIN>/` ogni 1–5 min;
- `https://<DOMAIN>/api/health` (se aggiunto);
- alert su email/Telegram.

### 5.3 Metriche utili

```bash
# Risorse container
docker stats --no-stream

# Disco
df -h /
docker system df

# Memoria/swap
free -h
vmstat 1 5

# Errori recenti app
docker logs --since 1h <APP_CONTAINER> 2>&1 | grep -iE 'error|exception|fatal' | tail -50

# Connessioni DB
docker exec -it <DB_CONTAINER> psql -U postgres -d postgres -c \
  "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# Query lente (se pg_stat_statements è attivo)
docker exec -it <DB_CONTAINER> psql -U postgres -d postgres -c \
  "SELECT calls, total_exec_time, mean_exec_time, query FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### 5.4 Log

- Coolify → Runtime Logs (live).
- `docker logs --tail=500 <APP_CONTAINER>`.
- Log rotation configurata (10 MB × 3 file).
- Per conservarli: log drain di Coolify verso un servizio esterno (opzionale).

---

## 6. Aggiornamenti

### 6.1 Sistema operativo

`unattended-upgrades` installa le patch di sicurezza. Riavvia quando richiesto, in finestra di manutenzione:

```bash
apt update && apt -y upgrade
# se richiesto
reboot
```

Prima del riavvio:

- verifica i backup;
- avvisa se necessario;
- dopo il riavvio, verifica Coolify, app, DB, TLS.

### 6.2 Coolify

1. Leggi le release notes.
2. Fai uno snapshot Hetzner.
3. Backup del DB.
4. Aggiorna da **Settings → Update**.
5. Verifica dashboard, app, deploy.
6. Se qualcosa si rompe, ripristina lo snapshot.

Non attivare l'auto-update in produzione.

### 6.3 PostgreSQL

**Mai** aggiornare la major in-place senza procedura. Per una major:

1. Backup completo + test di restore.
2. Nuovo container con la nuova major.
3. `pg_dump`/`pg_restore` (o `pg_upgrade` con downtime).
4. Verifica applicazione.
5. Solo dopo, rimuovi il vecchio.

Per le minor, l'immagine aggiornata è di solito compatibile; riavvia in finestra di manutenzione.

### 6.4 Node.js / dipendenze

- Node: cambia `NIXPACKS_NODE_VERSION` e `.nvmrc`, testa in staging.
- npm: nessun pin su Coolify/Nixpacks (npm 12 richiede Node ≥ 24.15, Nixpacks usa 24.10). Con un Dockerfile pinnato a `node:24.18.0` puoi tornare a npm 12.
- Dipendenze: branch + `npm ci` + lint + test + deploy staging + collaudo mirato.
- Next.js: leggi le note di migrazione (questa versione ha breaking changes).

---

## 7. Incidenti: playbook

### 7.1 Sito giù (502/503/504)

1. Coolify: app Healthy? Container running?
2. Log runtime.
3. `docker ps` e `docker stats`.
4. Se il container è in crash loop: `docker logs`.
5. Cause comuni:
   - DB non raggiungibile → verifica DB container e `DATABASE_URL`;
   - OOM → `dmesg`, aumenta RAM/limita build;
   - porta sbagliata → `Ports Exposes=3000`;
   - migrazione fallita → log di `prisma migrate deploy`.
6. Se non risolvi in 10 minuti: rollback all'immagine precedente.
7. Se la VPS è irraggiungibile: verifica Hetzner console, reboot, snapshot.

### 7.2 Database giù

1. Coolify: DB Healthy?
2. `docker logs <DB_CONTAINER>`.
3. Disco pieno? `df -h`.
4. Riavvia il container dal pannello.
5. Se il volume è corrotto: restore dall'ultimo backup.
6. Dopo il riavvio, verifica connessioni e app.

### 7.3 Disco pieno

```bash
df -h /
du -sh /var/lib/docker/* | sort -h | tail
docker system df
```

Pulizia sicura:

```bash
# immagini dangling
docker image prune -f

# build cache
docker builder prune -f

# container fermati
docker container prune -f
```

**Non** usare `--volumes` senza aver verificato i volumi.

Cause comuni: immagini vecchie, build cache, log non ruotati, dump dimenticati in `/root/dumps`.

### 7.4 Memoria esaurita / OOM

```bash
free -h
dmesg | tail -50
docker stats --no-stream
```

- Riavvia l'app.
- Riduci la concorrenza dei build.
- Aumenta lo swap (temporaneo).
- Passa a CAX31.
- Verifica memory leak: RAM in crescita costante → restart periodico o fix.

### 7.5 Certificato TLS scaduto/non emesso

```bash
curl -I https://<DOMAIN>
echo | openssl s_client -servername <DOMAIN> -connect <DOMAIN>:443 2>/dev/null | openssl x509 -noout -issuer -dates
```

- DNS corretto? `dig` da resolver pubblico.
- Porte 80/443 aperte?
- Cloudflare: Full (strict), non Flexible.
- Coolify → Domains → redeploy per forzare l'emissione.
- Log Traefik: `docker logs <traefik-container>`.

### 7.6 Email non arrivano

1. Admin → Integrations: provider abilitato e test connection OK.
2. Log SendGrid/Resend.
3. `NEXT_PUBLIC_APP_URL` corretto (link nelle email).
4. SPF/DKIM/DMARC del dominio.
5. Webhook Resend inbound: firma e secret.
6. Limiti provider (giornalieri, reputazione).

### 7.7 Webhook Stripe falliscono

1. Stripe Dashboard → Webhooks → eventi recenti.
2. URL corretto e endpoint abilitato.
3. `STRIPE_WEBHOOK_SECRET` corrisponde.
4. Risposta 200; se 400, firma/secret; se 500, log app.
5. body non modificato dal proxy (Traefik non lo altera).

### 7.8 Cron non girano

1. cron-job.org: job attivi, URL corretto, header corretto.
2. Chiamata manuale con `curl`.
3. Secret uguale a `SCHEDULED_PUBLICATION_SECRET`.
4. App raggiungibile.
5. Log `/api/scheduler/run/` e `/api/automations/run/`.

### 7.9 Login rotto / redirect loop

1. `BETTER_AUTH_URL` = `https://<DOMAIN>`.
2. `NEXT_PUBLIC_APP_URL` = `https://<DOMAIN>` e rebuild fatto.
3. Cookie: dominio corretto, `Secure`, `SameSite`.
4. Proxy: `X-Forwarded-Proto: https`.
5. Stesso `BETTER_AUTH_SECRET` e stesso DB.
6. Prova in incognito.

### 7.10 Contenuti vecchi dopo una modifica

1. `revalidatePath` è stato chiamato? (publish/unpublish/schedule)
2. Una sola replica?
3. Cache ISR locale: un restart la svuota; un redeploy la rigenera.
4. Pulsante admin "Build website" (revalidate all) come emergenza.
5. Cloudflare non deve cachare HTML.

### 7.11 Alta CPU / sito lento

1. `docker stats`, `top`.
2. Query DB lente (`pg_stat_activity`, `pg_stat_statements`).
3. Immagini/placeholder sharp su pagine non in cache.
4. Build in corso sulla stessa VPS (competono per CPU).
5. Bot/crawler: rate limit su Cloudflare.
6. Se cronico: CAX31.

---

## 8. Sicurezza operativa

- SSH solo chiave; niente password.
- Firewall Hetzner + UFW; DB mai pubblico.
- Coolify: 2FA, HTTPS, registrazione chiusa, utenti minimi.
- Segreti nel password manager, mai in chat/repo/log.
- Backup cifrati se contengono PII (contatti email).
- `/api/database/backup/` protetto o rimosso.
- Accesso umano al DB solo via tunnel SSH, con ruolo `gui_rw` (niente superuser): vedi `appendice-d-gui-database.md`.
- Aggiornamenti di sicurezza automatici.
- Controlla `docker ps` per container inattesi.
- Monitora accessi SSH falliti (`fail2ban-client status sshd`).

---

## 9. Rotazione dei segreti

| Segreto | Procedura | Impatto |
|---|---|---|
| `SCHEDULED_PUBLICATION_SECRET` | Genera nuovo, aggiorna Coolify e cron-job.org, redeploy/restart | I cron con il vecchio secret ricevono 401 finché non aggiorni |
| `STRIPE_WEBHOOK_SECRET` | Crea/ruota l'endpoint su Stripe, copia il nuovo secret, restart | Eventi persi durante la finestra |
| `BETTER_AUTH_SECRET` | Nuovo valore, restart | Tutte le sessioni invalidate |
| `SECRETS_ENCRYPTION_KEY` | **Non ruotare senza migrazione**: richiede ri-cifratura dei blob nel DB | Integrazioni illeggibili se fatto male |
| `AUTOMATION_CREDENTIALS_KEY` | Idem | Credenziali legacy illeggibili |
| Chiavi SSH | Nuova chiave, aggiungi, testa, rimuovi la vecchia | Nessuno se fatto in ordine |
| Token UploadThing/Stripe/Resend | Ruota dal provider, aggiorna env/DB, test | Funzioni esterne |

**Regola:** ruota un segreto alla volta, in finestra controllata, e verifica subito.

---

## 10. Capacità e scaling

### Segnali che il CAX21 non basta

- Build uccisi regolarmente da OOM.
- RAM > 90% con swap attivo.
- CPU > 80% per lunghi periodi.
- Disco > 80%.
- Latenza DB in crescita.

### Percorso di crescita

1. **CAX31** (8 vCPU, 16 GB): upgrade dal pannello Hetzner, riavvio, verifica. È la soluzione più semplice.
2. **Build server separato** (Coolify supporta server di build): tiene i build fuori dalla produzione.
3. **Cache condivisa** (Redis cache handler) se aggiungi repliche.
4. **DB separato** su un'altra VPS o servizio gestito, se il DB cresce.
5. **CDN** (Cloudflare) per asset statici.
6. **Storage file** su S3/R2: il driver non esiste ancora; oggi la scelta è tra il volume locale e UploadThing. Aggiungerlo richiede un driver che rispetti il contratto di storage (`src/modules/media/server/storage/driver.ts`), non una riscrittura dei contenuti.

Non aggiungere repliche finché non hai una cache condivisa e una strategia per sessioni/scheduler. L'app è progettata per una singola istanza (ADR-0001).

---

## 11. Gestione dei costi

- Hetzner: CAX21 + IPv4 + backup + snapshot occasionali.
- S3: R2/B2, pochi centesimi.
- Dominio: invariato.
- Stripe/Resend: invariati.
- UploadThing: il piano del provider dipende dai Media ancora ospitati; il volume locale consuma disco Hetzner. Spostare i Media storici è un progetto separato.
- Controlla mensilmente il pannello Hetzner per volumi/snapshot dimenticati.
- Vercel e Neon sono già stati cancellati: la produzione e il database vivono solo su Hetzner/Coolify.

---

## 12. Documentazione da tenere aggiornata

- Questo runbook.
- `checklist-finale.md` compilata con date.
- Inventario segreti (dove sono, non i valori).
- Registro deploy/incidenti (data, causa, fix).
- Versione DB e data ultimo restore test.
- Contatti provider (Stripe, Resend, Hetzner, registrar).
