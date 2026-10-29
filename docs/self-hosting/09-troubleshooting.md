# 09 — Troubleshooting

Sintomo → causa → rimedio. I comandi presuppongono accesso root alla VPS.

Prima di tutto, tre comandi che risolvono metà dei problemi:

```bash
# Stato app e DB in Coolify
docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Image}}'

# Log app (ultimi 200)
docker logs --tail=200 <APP_CONTAINER>

# Spazio e memoria
df -h /
free -h
```

---

## 1. Build

### `npm ci` → `EUSAGE` / `Invalid: lock file's ... does not satisfy`

**Causa:** npm diverso da quello che ha generato `package-lock.json`, oppure Node troppo vecchio.

**Rimedio:** su Nixpacks usa `npm ci --include=dev` **senza pin**. Il lockfile è `lockfileVersion: 3` e l'npm incluso in Node (11.x) lo legge correttamente.

> **Non** usare `npm install -g npm@12.0.2` su Nixpacks: npm 12 richiede Node `^22.22.2 || ^24.15.0 || >=26.0.0`, mentre il nixpkgs pinnato da Nixpacks fornisce Node **24.10.0**. Il risultato è `npm error notsup Required: {"node":"^22.22.2 || ^24.15.0 || >=26.0.0"} Actual: {"npm":"11.6.1","node":"v24.10.0"}` e il build si ferma prima di `npm ci`. Con un Dockerfile pinnato a `node:24.18.0-bookworm-slim` il pin torna possibile.

### `The Server Reference ID did not match the expected format`

**Causa:** quasi sempre richieste esterne con header `Next-Action` inventato (scanner che sondano Next.js), non un problema del build. Next si aspetta ID di 42 caratteri e riceve token casuali; la richiesta viene rifiutata.

**Rimedio:** nessuno, se il sito funziona. Se invece l'errore ricompare **mentre navighi**, allora c'è un disallineamento tra build e runtime su `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: deve essere identica in build e runtime e non deve cambiare tra i deploy.

### `ERESOLVE unable to resolve dependency tree`

**Causa:** conflitto di peer dependencies / override.

**Rimedio:**

- Non usare `--legacy-peer-deps` alla cieca.
- Confronta con un build locale funzionante: usa la stessa versione di npm e Node.
- Controlla `overrides` in `package.json`.

### `prisma generate` → `Environment variable not found: DATABASE_URL`

**Causa:** `prisma.config.ts` usa `env('DATABASE_URL')` e la variabile non è disponibile in build.

**Rimedio:** in Coolify, imposta `DATABASE_URL` con scope **Build + Runtime**. Non serve che il DB sia raggiungibile per `generate`, ma la variabile deve esistere.

### `P1001: Can't reach database server`

**Causa:** il container di build non raggiunge il DB.

**Rimedio:**

1. Verifica che app e DB siano nello stesso progetto/environment/network.
2. Usa l'URL **interno** di Coolify, non `localhost`.
3. Riavvia il DB e riprova.
4. Se persiste, vedi `04-deploy-applicazione.md` §7.
5. Fallback: build fuori da Coolify (appendice B).

### `getaddrinfo ENOTFOUND postgres-...`

**Causa:** hostname interno non risolvibile dal build (rete diversa o container non pronto).

**Rimedio:** stessa rete; verifica il nome esatto in Coolify → DB → General → Internal URL. Se il DB è stato ricreato, l'hostname può essere cambiato.

### `Killed` / exit code 137 / `JavaScript heap out of memory`

**Causa:** RAM esaurita durante `next build` (Turbopack).

**Rimedio:**

1. `free -h`, `dmesg | tail`.
2. Swap 4–8 GB.
3. `NODE_OPTIONS=--max-old-space-size=3072`.
4. Evita build concorrenti.
5. Prova `npm run build-webpack` (Webpack invece di Turbopack).
6. CAX31 (16 GB) o build esterno.

### `Cannot find module 'sharp'` / `Invalid ELF header` / `wrong ELF class`

**Causa:** binario nativo per architettura sbagliata (x86 su ARM o viceversa).

**Rimedio:**

- Costruisci sulla VPS ARM (Nixpacks nativo).
- Se cross-build: `--platform linux/arm64`.
- Elimina `node_modules` e reinstalla nell'ambiente corretto.
- Verifica `node -e "console.log(require('sharp').versions)"`.

### `Module not found: Can't resolve 'handlebars'`

**Causa:** alias Turbopack/Webpack non applicato o dipendenza mancante.

**Rimedio:** verifica che `next.config.mjs` contenga l'alias e che `handlebars` sia installato. Con Nixpacks (node_modules completo) funziona; con standalone verifica il tracing (appendice B).

### Build ok ma `next: not found` all'avvio

**Causa:** start command eseguito in una directory sbagliata o `node_modules/.bin` non nel PATH.

**Rimedio:** usa `npm run start` (che risolve `next`), non `next start` nudo. Verifica il working directory (`/app` con Nixpacks).

### `prisma: not found` all'avvio / `npx prisma` scarica ogni volta

**Causa:** Nixpacks ha installato solo le dipendenze di produzione, oppure ha rimosso le devDependencies dopo il build.

**Rimedio:**

1. Install Command: `npm ci --include=dev` (basta: `--include=dev` prevale su `NODE_ENV=production`).
2. Se persiste, usa il Dockerfile B.1 (`appendice-b-dockerfile.md`), che mantiene `node_modules` completo.
3. Non usare `npx --yes prisma@...` a ogni avvio: scarica ~100 MB e richiede rete.

### `Failed to fetch font` / `next/font` errore di rete

**Causa:** `next/font/google` scarica i font durante il build e il container non ha accesso a Internet (o Google Fonts è bloccato).

**Rimedio:** verifica l'uscita dalla VPS (`curl -I https://fonts.googleapis.com`), il DNS del container di build e eventuali firewall. In alternativa, self-hosta i font con `next/font/local` (modifica al codice).

### Build lentissimo

**Causa:** CPU condivisa, swap, cache fredda.

**Rimedio:** primo build 5–15 min è normale; abilita la build cache; evita deploy concorrenti; considera un build server.

---

## 2. Runtime

### 502 Bad Gateway

**Cause:**

- app non in ascolto su `0.0.0.0:3000`;
- container unhealthy;
- porta sbagliata in Coolify;
- crash loop.

**Rimedio:**

```bash
docker logs --tail=200 <APP_CONTAINER>
docker exec <APP_CONTAINER> sh -c 'command -v curl || command -v wget'
docker exec <APP_CONTAINER> node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>console.log(r.status)).catch(console.error)"
```

- `Ports Exposes` = `3000`.
- `HOSTNAME=0.0.0.0`.
- `npm run start` (non `next dev`).

### 404 / `No available server`

**Causa:** Traefik non ha container healthy per quel dominio.

**Rimedio:**

- Healthcheck fallisce → correggilo o disabilitalo temporaneamente.
- Dominio non associato all'app.
- Container unhealthy per DB/migrazioni.

### Container in restart loop

**Causa:** start command fallisce (migrazioni, env mancanti, porta occupata).

**Rimedio:** log del container; correggi la causa; aumenta lo start period dell'healthcheck.

### L'app risponde ma il DB no (`P1001` a runtime)

**Causa:** `DATABASE_URL` errata o DB fermo.

**Rimedio:**

```bash
docker exec <APP_CONTAINER> node -e "const {Client}=require('pg'); const c=new Client({connectionString:process.env.DATABASE_URL}); c.connect().then(()=>console.log('OK')).catch(e=>{console.error(e.message);process.exit(1)}).finally(()=>c.end())"
```

### `P2021: The table ... does not exist`

**Causa:** migrazioni non applicate o DB sbagliato.

**Rimedio:**

```bash
docker exec <APP_CONTAINER> npx prisma migrate status
docker exec <APP_CONTAINER> npx prisma migrate deploy
```

Se il DB è vuoto: hai puntato al database sbagliato o non hai ripristinato il dump.

### `P2024: Timed out fetching a new connection from the pool`

**Causa:** pool esaurito, query lente, connessioni leaked, `max_connections` basso.

**Rimedio:**

```sql
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
SELECT pid, state, query_start, query FROM pg_stat_activity WHERE state <> 'idle';
```

- Riavvia l'app per liberare il pool.
- Riduci query lente.
- Aumenta `max_connections` con cautela.
- Non creare un `PrismaClient` per richiesta (il codice usa un singleton globale: va bene).

### `too many connections`

**Causa:** più processi/container o connessioni idle.

**Rimedio:** riavvia app; controlla `pg_stat_activity`; aumenta `max_connections` o usa un pooler.

---

## 3. Migrazioni Prisma

### `P3009: migrate found failed migrations`

**Causa:** una migrazione è fallita e ha lasciato lo stato "failed" in `_prisma_migrations`.

**Rimedio:**

1. Leggi l'errore nei log.
2. Correggi la causa (SQL, lock, dati).
3. Su un DB di test, applica la correzione.
4. In produzione, valuta `prisma migrate resolve --rolled-back <migration>` o `--applied`, a seconda dei casi, **dopo aver capito** lo stato reale.
5. Non cancellare righe da `_prisma_migrations` alla cieca.

### `P3018: A migration failed to apply`

Leggi il messaggio SQL. Cause comuni: colonna già esistente, tipo incompatibile, lock timeout, dati che violano un vincolo.

### Drift / schema non allineato

```bash
docker exec <APP_CONTAINER> npx prisma migrate status
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script
```

Non usare `migrate reset` in produzione.

### Migrazione lenta / lock

- Evita `ALTER TABLE` pesanti in orario di punta.
- Usa `CREATE INDEX CONCURRENTLY`.
- Controlla `pg_locks` e `pg_stat_activity`.

### `prisma migrate deploy` si blocca / "advisory lock"

**Causa:** un'altra migrazione o un deploy concorrente tiene la advisory lock, oppure `DATABASE_URL` punta a un pooler invece che al PostgreSQL interno di Coolify.

**Rimedio:**

1. Usa l'URL interno del servizio Postgres Coolify (host senza `-pooler`).
2. Assicurati che non ci siano due deploy o due `migrate deploy` in parallelo.
3. Solo come ultima risorsa, imposta `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=true` **temporaneamente** e toglila appena possibile: disabilitare le lock riduce la protezione contro migrazioni concorrenti.

### Una variabile Coolify è "Locked"

**Causa:** in Coolify una variabile può essere marcata **Locked** per impedirne la copia accidentale; il valore resta disponibile al container ma non è leggibile dalla UI.

**Rimedio:** recuperala dal password manager o dal provider (Stripe, UploadThing, Resend, ecc.) e ruotala se il valore è perso. Vedi `appendice-a-variabili-ambiente.md`.

---

## 4. Autenticazione

### Login non funziona / 401

- `BETTER_AUTH_URL` = `https://<DOMAIN>`.
- `NEXT_PUBLIC_APP_URL` = `https://<DOMAIN>` (e rebuild fatto).
- Stesso `BETTER_AUTH_SECRET` e stesso DB delle sessioni.
- Cookie presenti? DevTools → Application → Cookies.
- L'utente esiste ed è `ACTIVE`.

### Redirect loop su `/admin`

- Cookie `Secure` su HTTP (proxy non invia `X-Forwarded-Proto: https`).
- Cloudflare "Flexible" → passa a Full (strict).
- `BETTER_AUTH_URL` con `http://` invece di `https://`.
- Dominio apex vs www diverso dal cookie.

### Sessioni perse dopo il cutover

- `BETTER_AUTH_SECRET` cambiato → ripristina il valore originale (se possibile) o accetta il re-login.
- Dominio cambiato → i cookie non valgono più. Per questo il dominio deve restare lo stesso.

### Reset password: link non valido

- Link scaduto.
- `NEXT_PUBLIC_APP_URL`/`BETTER_AUTH_URL` errati: il link punta al dominio sbagliato.
- `BETTER_AUTH_SECRET` cambiato dopo l'emissione del token.

---

## 5. DNS e TLS

### Certificato non emesso

```bash
dig @1.1.1.1 <DOMAIN> A +short

# Raggiungibilità HTTP (un 404 da Next va bene: significa che la porta 80 risponde)
curl -I http://<DOMAIN>/

docker logs <TRAEFIK_CONTAINER> 2>&1 | tail -100
```

Cause:

- DNS non punta alla VPS;
- porta 80 chiusa;
- Cloudflare proxy/Flexible;
- AAAA rotto;
- rate limit Let's Encrypt (troppi tentativi).

### `ERR_TOO_MANY_REDIRECTS`

Cloudflare Flexible + redirect HTTPS. Imposta **Full (strict)**.

### `NET::ERR_CERT_AUTHORITY_INVALID`

Traefik sta servendo il certificato self-signed perché Let's Encrypt non è riuscito. Controlla DNS/porte/log.

### `522 Connection timed out` (Cloudflare)

IP origine errato o firewall che blocca Cloudflare. Verifica A record e porte 80/443.

---

## 6. Stripe

### Webhook 400

- `STRIPE_WEBHOOK_SECRET` errato.
- Body modificato (non dovrebbe accadere con Traefik).
- Endpoint URL sbagliato.

### Webhook 500

- Errore applicativo nel handler.
- DB non raggiungibile.
- `sendWebinarPurchaseEmail` fallisce.

**Rimedio:** log app + Stripe Dashboard → eventi → retry.

### Checkout: `success_url` sbagliato

`NEXT_PUBLIC_APP_URL` errato o build non aggiornato. Correggi e rideploya.

### Pagamento riuscito ma `Purchase` non creato

Webhook non arrivato o fallito. Controlla Stripe → Webhooks → eventi; riprova l'evento.

---

## 7. UploadThing

### 403 / CORS sull'upload

- Dominio non consentito nell'app UploadThing.
- Token errato.
- Cookie/auth non presenti (route protetta).

**Rimedio:** verifica `UPLOADTHING_TOKEN`, allowed origins, sessione admin.

### Immagine caricata ma non visibile

- URL `ufs.sh` bloccato da CSP/proxy.
- Rewrite `/assets/:id` non funzionante.
- File cancellato.

### `sharp` non genera il placeholder

- Errore di rete nel fetch dell'immagine remota.
- Binario sharp mancante/sbagliato.
- L'errore è silenziato (fallback a un pixel): controlla i log.

---

## 8. Email

### Resend "not configured"

La fonte è la riga `Integration` nel DB, non solo `NEXT_RESEND_KEY`. Vai in **Admin → Integrations → Resend**, inserisci le credenziali, abilita, **Test connection**. Vedi `docs/integrations-runbook.md`.

### Email inviate ma in spam

- SPF/DKIM/DMARC.
- `From` non allineato al dominio.
- Link a dominio diverso.
- Contenuto/ reputazione.

### Inbound webhook 400

- Header Svix mancanti.
- Timestamp fuori tolleranza (5 min).
- Secret errato.
- Payload modificato.

### Allegati inbound non salvati

- UploadThing token errato.
- Limite dimensione.
- Errore di rete.

---

## 9. Scheduler e automazioni

### I run restano `PENDING`

- Il cron non chiama `/api/automations/run/`.
- Secret errato (401).
- App ferma.
- `AUTOMATIONS_DEV_PUMP` non impostato in produzione (corretto: non deve esserci).

**Test manuale:**

```bash
curl -i -X POST https://<DOMAIN>/api/automations/run/ \
  -H "x-scheduled-publication-secret: <SECRET>"
```

### Post schedulati non pubblicati

- Cron non attivo.
- Secret errato.
- Azione in `RETRY_WAIT` per errore transitorio.
- Controlla `ScheduledAction`:

```sql
SELECT id, type, status, "scheduledAt", "retryAt", "lastError"
FROM "ScheduledAction"
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Doppio invio email

- Idempotenza per `(runId, stepId)`; verifica che il run/step sia lo stesso.
- Due istanze dell'app? Tieni 1 replica.
- Due cron che chiamano lo stesso endpoint? Le lease dovrebbero proteggere, ma evita duplicati.

---

## 10. Cache e contenuti

### Contenuto vecchio dopo publish

- `revalidatePath` non chiamato.
- Più repliche (non dovrebbe).
- Cloudflare che cachea HTML.
- Cache ISR: restart/redeploy.

### La home non mostra le ultime news

`revalidateContent("all")` o il path `/` non è stato invalidato. Usa il pulsante admin o redeploy.

### `sitemap.xml` con URL sbagliati

`Settings.siteUrl` nel DB. Aggiornalo dall'admin (Impostazioni) se il dominio è cambiato. Non è `NEXT_PUBLIC_APP_URL`.

---

## 11. Prestazioni e risorse

### RAM in crescita costante

- Memory leak (riavvia e monitora).
- Cache ISR grande.
- Troppe connessioni/query.
- Build in corso.

### CPU al 100%

- Build in corso.
- Crawler/bot.
- Query pesanti.
- `sharp` su molte immagini non cachate.

### Disco pieno

```bash
df -h /
docker system df
du -sh /var/lib/docker/* | sort -h | tail
```

Pulizia sicura: `docker image prune -f`, `docker builder prune -f`, `docker container prune -f`. **Mai** `--volumes` senza verifica.

---

## 12. Restore / dump

### `pg_restore: error: unrecognized configuration parameter "transaction_timeout"`

Dump da PostgreSQL più recente di `pg_restore`. Usa l'immagine della stessa major o superiore.

### `role "..." does not exist`

Manca `--no-owner`. Rifai il restore con `--no-owner --no-privileges`.

### `database is being accessed by other users`

Ferma l'app e chiudi le sessioni:

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database() AND pid <> pg_backend_pid();
```

### `_prisma_migrations` mancante

Dump incompleto. Non avviare l'app. Rifai il dump.

---

## 13. Coolify

### Dashboard irraggiungibile

```bash
docker ps | grep coolify
cd /data/coolify/source && docker compose ps
docker compose up -d
```

Se hai chiuso le porte 8000/6001/6002, usa il dominio `https://coolify.<DOMAIN>`. Se anche quello è giù, riapri temporaneamente 8000 dal firewall Hetzner e accedi via IP.

### Deploy bloccato

- Build in corso (CPU).
- Coda di deploy.
- Container precedente non si ferma.
- Guarda i log del deployment.

### Volume del DB sparito

**Ferma tutto.** Non creare un nuovo volume sopra quello vecchio. Verifica `docker volume ls` e i mount. Ripristina il backup.

---

## 14. Errori ARM specifici

| Errore | Causa | Rimedio |
|---|---|---|
| `Exec format error` | Immagine x86 su ARM | Ricostruisci per `linux/arm64` |
| `sharp` crash | Binario x86 | Reinstalla su ARM |
| Prisma engine error | Target sbagliato | Build nativo o aggiungi `linux-arm64-openssl-3.0.x` |
| `Illegal instruction` | Binario compilato per CPU diversa | Ricostruisci sull'hardware corretto |
| `libssl.so` / `openssl` mancante | Immagine minimale senza OpenSSL | Installa `openssl` nell'immagine (Dockerfile) o usa un'immagine Debian slim |

---

## 15. Diagnostica rapida: script

```bash
#!/bin/sh
echo "=== DATA ==="; date
echo "=== UPTIME ==="; uptime
echo "=== MEMORY ==="; free -h
echo "=== DISK ==="; df -h /
echo "=== DOCKER ==="; docker ps --format '{{.Names}}\t{{.Status}}'
echo "=== APP LOGS ==="; docker logs --tail=50 <APP_CONTAINER> 2>&1
echo "=== DB LOGS ==="; docker logs --tail=30 <DB_CONTAINER> 2>&1
echo "=== HTTP ==="; curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://<DOMAIN>/
echo "=== HEALTH ==="; curl -s -o /dev/null -w "%{http_code}\n" https://<DOMAIN>/api/health
echo "=== CERT ==="; echo | openssl s_client -servername <DOMAIN> -connect <DOMAIN>:443 2>/dev/null | openssl x509 -noout -dates
echo "=== DOCKER DF ==="; docker system df
```

Se nulla funziona e il tempo stringe: **rollback all'immagine precedente**, poi diagnosi con calma.
