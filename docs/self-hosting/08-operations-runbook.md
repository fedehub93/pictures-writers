# 08 — Runbook operativo

Tutto ciò che serve per gestire Pictures Writers sulla VPS dopo il cutover: deploy, rollback, backup, restore, monitoraggio, aggiornamenti, incidenti.

> Tieni questo file aperto durante le operazioni delicate. I comandi assumono accesso root alla VPS e Coolify su `https://coolify.<DOMAIN>`.

---

## 1. Rituali

### Ogni giorno (2 minuti)

- [ ] Coolify: app e DB **Healthy**.
- [ ] Ultimo backup DB: **Success**.
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
- [ ] Aggiornamento Coolify (dopo release notes) in finestra di manutenzione.
- [ ] Aggiornamento dipendenze npm (in branch, con test).
- [ ] Review accessi: utenti admin, chiavi SSH, token.
- [ ] Review costi Hetzner/S3.
- [ ] Controllo capacità: RAM, disco, connessioni DB.

### Ogni 3 mesi

- [ ] Restore completo su una VPS di test.
- [ ] Rotazione dei segreti che si possono ruotare (vedi §9).
- [ ] Verifica GDPR/subprocessors (Hetzner, Cloudflare, Resend, Stripe, UploadThing).
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

### 3.3 Rollback DNS (solo fase B)

Se la VPS è irraggiungibile e Vercel è ancora attivo:

1. Riporta i record DNS ai valori Vercel.
2. Attendi il TTL.
3. Verifica.

Dopo la fase C, Vercel punta a Neon e non è un rollback del DB.

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
4. Verifica che i volumi Docker siano presenti.
5. Se il volume del DB è perso, ripristina l'ultimo dump S3.
6. Ricrea DNS se l'IP è cambiato.
7. Verifica TLS.

### 4.4 RPO/RTO realistici

| Scenario | RPO | RTO |
|---|---|---|
| Errore applicativo | 0 | minuti (rollback) |
| DB corrotto | fino a 24 h (backup giornaliero) | 30–90 min |
| VPS persa | fino a 24 h | 1–3 h (nuova VPS + restore) |
| Errore umano su file | 0 (git) | minuti |

Se ti serve un RPO più basso, aggiungi WAL archiving/PITR (pgBackRest/WAL-G) e testalo. Non improvvisare in emergenza.

---

## 4bis. Media: consegna, backfill metadati e rendition

### 4bis.1 Come vengono servite le immagini

La VPS **non** ottimizza le immagini durante una visita. Un loader custom di `next/image` (`src/modules/media/lib/image-loader.ts`) restituisce l'URL di una rendition già presente sul CDN di UploadThing, oppure l'originale quando la rendition non esiste ancora. Le rendition vengono prodotte dai job di processing (upload e backfill); finché non esistono, il loader serve l'originale. `/_next/image` e i vecchi oggetti in `.next/cache/images` non sono più usati.

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
- Le sorgenti non raggiungibili vengono riportate e saltate, senza interrompere il resto.
- Rieseguirlo è sicuro: le righe già complete vengono saltate (`updated: 0`).
- La concorrenza predefinita è 4; alzala solo se la VPS non ha altro carico.
- Il report finale elenca `scanned`, `updated`, `skipped` e i `failed` con il motivo.

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
- La concorrenza predefinita è **2**. Conta le immagini elaborate in parallelo, non le rendition: ogni immagine esegue in sequenza i tagli della scala. Alzala solo se la VPS è altrimenti inattiva; su 4 vCPU non conviene superare 2–4.
- È idempotente: le Media che hanno già un manifest di rendition vengono saltate, quindi rieseguirlo non duplica oggetti né riscrive righe.
- Una sorgente non raggiungibile o non decodificabile finisce nell'elenco `failed` con il motivo e non interrompe il resto. Le altre immagini continuano a essere elaborate.
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
6. **Storage file** su S3/MinIO se lasci UploadThing.

Non aggiungere repliche finché non hai una cache condivisa e una strategia per sessioni/scheduler. L'app è progettata per una singola istanza (ADR-0001).

---

## 11. Gestione dei costi

- Hetzner: CAX21 + IPv4 + backup + snapshot occasionali.
- S3: R2/B2, pochi centesimi.
- Dominio: invariato.
- Stripe/Resend/UploadThing: invariati.
- Controlla mensilmente il pannello Hetzner per volumi/snapshot dimenticati.
- Dopo 30 giorni dal cutover, cancella Vercel e Neon: è il risparmio vero.

---

## 12. Documentazione da tenere aggiornata

- Questo runbook.
- `checklist-finale.md` compilata con date.
- Inventario segreti (dove sono, non i valori).
- Registro deploy/incidenti (data, causa, fix).
- Versione DB e data ultimo restore test.
- Contatti provider (Stripe, Resend, Hetzner, registrar).
