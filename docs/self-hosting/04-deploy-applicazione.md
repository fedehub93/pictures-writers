# 04 — Deploy dell'applicazione su Coolify

Obiettivo: far girare Pictures Writers su Coolify con Nixpacks, collegata al PostgreSQL interno (o a Neon durante il collaudo), con migrazioni automatiche all'avvio e healthcheck.

> **Ordine obbligatorio:** il database deve esistere ed essere raggiungibile **prima** del primo build. Next.js legge il DB durante `next build` (vedi §7).

---

## 1. Prerequisiti

- [ ] VPS hardened (`02-vps-hardening.md`).
- [ ] Coolify installato e dashboard su HTTPS.
- [ ] PostgreSQL creato e **Healthy** (`03-coolify-postgres.md`).
- [ ] Dump di staging ripristinato (oppure DB di produzione Neon per la fase B).
- [ ] Variabili di produzione esportate da Vercel.
- [ ] Repository GitHub accessibile.
- [ ] Chiave `SECRETS_ENCRYPTION_KEY` disponibile.

---

## 2. Creazione dell'applicazione

In Coolify, dentro il progetto `pictures-writers`, environment `production`:

1. **+ New Resource** → **Application**.
2. **Source**:
   - GitHub App (consigliato per repo privati) oppure **Public Repository** con URL HTTPS.
   - Repository: `pictures-writers`.
   - Branch: `master` (il repo usa `master`, non `main`).
3. **Build Pack**: **Nixpacks** (se non disponibile, **Railpack**; il comportamento è simile).
4. **Name**: `pictures-writers-web`.
5. **Base Directory**: `/`.
6. **Ports Exposes**: `3000`.

### 2.1 Comandi

In **General → Build**:

| Campo | Valore |
|---|---|
| Install Command | `npm ci --include=dev` |
| Build Command | `npx prisma migrate deploy && npm run build` |
| Start Command | `sh scripts/start-production.sh` |

Perché queste scelte:

- **Nessun pin di npm**: `npm@12` richiede Node **≥ 24.15** (`^22.22.2 || ^24.15.0 || >=26`), ma il Node fornito da Nixpacks (nixpkgs pinnato) è **24.10.0**: `npm install -g npm@12.0.2` fallisce con `EBADENGINE` prima di `npm ci`. Usa l'npm incluso in Node (11.x): il `package-lock.json` è `lockfileVersion: 3` e `npm ci` funziona. Con un Dockerfile puoi pinnare `node:24.18.0-bookworm-slim` e allora anche npm 12 è installabile.
- **`npm ci --include=dev`**: Nixpacks imposta `NODE_ENV=production`, e in alcune configurazioni npm omette le devDependencies. Qui servono sia al build (TypeScript, Tailwind) sia a runtime (Prisma CLI per le migrazioni). `--include=dev` è esplicito e prevale su `NODE_ENV=production`, quindi **non** serve `NPM_CONFIG_PRODUCTION=false`.
- **`prisma migrate deploy` nel Build Command**: Next legge il DB durante `next build`. Se il nuovo codice usa una colonna/tabella appena aggiunta, il build fallirebbe finché la migrazione non è applicata. Per questo la migrazione va **prima** del build. È idempotente: se non ci sono migrazioni pendenti, termina subito.
- **`prisma migrate deploy` anche all'avvio**: è una rete di sicurezza per i riavvii e per i container creati da un'immagine già migrata. Idempotente.
- **Retry loop**: se il DB non è ancora pronto (riavvio del container Postgres), riprova per ~2,5 minuti invece di entrare in crash loop.
- **`npm run start`** = `next start`, che serve l'output di build e `public/`.

> **Non usare la "Pre-deployment command" di Coolify per le migrazioni.** Coolify la esegue nel container **vecchio** (che contiene le vecchie migrazioni) e la salta al primo deploy. Il risultato è che le nuove migrazioni non vengono applicate. Mettile nel Build Command (prima del build) e nello start command (rete di sicurezza), oppure in un job di migrazione dedicato.
>
> **Migrazioni distruttive:** durante il build il vecchio container sta ancora servendo. Una migrazione che elimina/rinomina colonne può rompere il vecchio codice e il build stesso. Usa il pattern expand/contract (`08-operations-runbook.md` §2.2) oppure una finestra di manutenzione.

### 2.2 Script di avvio (già nel repo)

Il repository contiene già `scripts/start-production.sh`, committato. Se dovesse mancare, crealo con:

```bash
#!/bin/sh
set -eu

attempt=0
until npx prisma migrate deploy; do
  attempt=$((attempt + 1))
  echo "[start] migrate failed (attempt ${attempt}/30), retrying in 5s..."
  if [ "$attempt" -ge 30 ]; then
    echo "[start] giving up after 30 attempts"
    exit 1
  fi
  sleep 5
done

echo "[start] migrations applied, starting Next.js"
exec npm run start
```

Rendilo eseguibile:

```bash
git update-index --chmod=+x scripts/start-production.sh
```

Start Command:

```bash
sh scripts/start-production.sh
```

Se il file non è eseguibile nel container, `sh scripts/start-production.sh` funziona comunque.

> **Windows:** assicurati che lo script abbia line endings **LF**, non CRLF. Aggiungi un `.gitattributes`:
>
> ```gitattributes
> *.sh text eol=lf
> ```
>
> Altrimenti l'errore sarà simile a `sh: ./scripts/start-production.sh: not found` o `\r: command not found`.

---

## 3. Variabili d'ambiente

Apri **Environment Variables** e usa la **Developer view** per incollare in blocco. Imposta lo **scope** (build/runtime) come indicato.

> Coolify, per default, rende una variabile disponibile **sia in build sia a runtime**. Va bene per la maggior parte dei casi. Per i segreti che non servono in build, imposta **Build time: Not available during build**.
>
> Le variabili `NEXT_PUBLIC_*` vengono **inlined nel bundle** durante `next build`: se le cambi, devi **rideployare** (non basta un restart).

### 3.1 Blocco per il collaudo (staging)

```dotenv
# ── Core ────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
TZ=Europe/Rome
NEXT_TELEMETRY_DISABLED=1

# ── Database (URL interno Coolify o Neon branch DIRECT) ─
# In fase B usa la connessione DIRECT di Neon, non la pooled:
# eviti i limiti del pooler sulle migrazioni. Una sola VPS non ha
# bisogno del pooler; il pool `pg` dell'app basta.
#
# ⚠️ Lo staging deve puntare a un BRANCH Neon o a un DB separato,
# MAI alla produzione: il Build Command esegue `prisma migrate deploy`.
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@postgres-<uuid>:5432/postgres?schema=public

# ── URL pubblico: per lo staging usa il sottodominio ────
NEXT_PUBLIC_APP_URL=https://staging.<DOMAIN>
BETTER_AUTH_URL=https://staging.<DOMAIN>

# ── Auth (NON rigenerare) ───────────────────────────────
BETTER_AUTH_SECRET=<VALORE_DA_VERCEL>

# ── Cifratura credenziali (NON rigenerare) ──────────────
SECRETS_ENCRYPTION_KEY=<VALORE_DA_VERCEL>
AUTOMATION_CREDENTIALS_KEY=<VALORE_DA_VERCEL>

# ── UploadThing ─────────────────────────────────────────
UPLOADTHING_TOKEN=<VALORE_DA_VERCEL>

# ── Stripe ──────────────────────────────────────────────
STRIPE_API_KEY=<VALORE_DA_VERCEL>
STRIPE_WEBHOOK_SECRET=<VALORE_DA_VERCEL>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<VALORE_DA_VERCEL>

# ── Email ───────────────────────────────────────────────
# NON servono:
# - NEXT_SENDGRID_KEY: l'invio usa EmailSetting.emailApiKey nel DB.
# - NEXT_RESEND_KEY / NEXT_RESEND_WEBHOOK_SECRET: la fonte è Integration (ADR-0023).
# Verifica le credenziali da Admin → Email Settings / Integrations dopo il restore.

# ── Analytics / Antibot ─────────────────────────────────
NEXT_GTAG_CONTAINER_ID=<VALORE_DA_VERCEL>
NEXT_GA_TRACKING_ID=<VALORE_DA_VERCEL>
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<VALORE_DA_VERCEL>
RECAPTCHA_SECRET_KEY=<VALORE_DA_VERCEL>

# ── Cron / scheduler ────────────────────────────────────
SCHEDULED_PUBLICATION_SECRET=<VALORE_DA_VERCEL>

# ── Build ───────────────────────────────────────────────
NIXPACKS_NODE_VERSION=24
NODE_OPTIONS=--max-old-space-size=3072
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<GENERA_UNA_VOLTA_E_CONSERVA>
```

Genera `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` una volta:

```bash
openssl rand -base64 32
```

Deve essere una stringa base64 valida di 32 byte. **Non cambiarla** a ogni deploy: serve a far funzionare le Server Actions tra il container vecchio e quello nuovo durante un rolling update.

### 3.2 Blocco per la produzione

Al momento del cutover cambia solo:

```dotenv
NEXT_PUBLIC_APP_URL=https://<DOMAIN>
BETTER_AUTH_URL=https://<DOMAIN>
```

e rideploya. Il resto resta identico.

> Se in futuro cambi `NEXT_PUBLIC_APP_URL`, ricorda che il valore è **cotto nel bundle**: serve sempre un nuovo build.

### 3.3 Scope consigliati

| Variabile | Build | Runtime |
|---|:---:|:---:|
| `DATABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_*` | ✅ | ✅ |
| `TZ` | ✅ | ✅ |
| `NEXT_GTAG_CONTAINER_ID` | ✅ | ✅ |
| `BETTER_AUTH_URL` | ❌ | ✅ |
| `BETTER_AUTH_SECRET` | ❌ | ✅ |
| `SECRETS_ENCRYPTION_KEY` | ❌ | ✅ |
| `AUTOMATION_CREDENTIALS_KEY` | ❌ | ✅ |
| `UPLOADTHING_TOKEN` | ❌ | ✅ |
| `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET` | ❌ | ✅ |
| `NEXT_SENDGRID_KEY` / `NEXT_RESEND_*` | ❌ | ✅ |
| `RECAPTCHA_SECRET_KEY` | ❌ | ✅ |
| `SCHEDULED_PUBLICATION_SECRET` | ❌ | ✅ |
| `NIXPACKS_NODE_VERSION` / `NODE_OPTIONS` | ✅ | ❌ (NODE_OPTIONS può restare anche runtime) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | ✅ | ✅ |

> **Attenzione alle variabili lette in Server Components prerenderizzati.** `src/app/(home)/layout.tsx` legge `NEXT_GTAG_CONTAINER_ID` e `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` e viene prerenderizzato: quei valori finiscono nell'HTML di build. Devono essere presenti **in build**, altrimenti GTM/reCAPTCHA spariscono dal sito statico. Vale lo stesso per `TZ` se il rendering delle date lo usa.
>
> `DATABASE_URL` in build è inevitabile con questo codice: `prisma generate` e il prerender leggono il DB. Coolify la passa come build arg: chi ha accesso alle immagini Docker sul server può vederla. Per un progetto singolo è accettabile; per hardening avanzato vedi `appendice-b-dockerfile.md` (BuildKit secrets / utente DB dedicato).

---

## 4. Dominio e TLS

### 4.1 Staging

Crea il record DNS:

```
staging.<DOMAIN>   A   <VPS_IP>
```

In Coolify: **Domains → Add domain**:

- Protocol: `https`
- Domain: `staging.<DOMAIN>`
- Port: `3000`
- Redirect HTTP → HTTPS: attivo

Attendi il certificato Let's Encrypt (può richiedere 1–2 minuti). Verifica:

```bash
curl -I https://staging.<DOMAIN>
```

### 4.2 Produzione (al cutover)

Aggiungi:

- `https://<DOMAIN>` (apex)
- `https://www.<DOMAIN>` con **www redirect** verso l'apex (o il contrario, se il canonical attuale è `www`).

Controlla nel DB:

```sql
SELECT "siteUrl" FROM "Settings" LIMIT 1;
```

Il valore deve corrispondere al dominio canonical. Se oggi è `https://www.example.com`, mantieni `www` come canonical e reindirizza l'apex.

> Con Cloudflare: durante il primo rilascio TLS usa **DNS only** (nuvola grigia). Dopo che il certificato è emesso e il sito funziona, puoi attivare il proxy con SSL/TLS **Full (strict)**. Non attivare "Flexible": causerebbe loop di redirect.

---

## 5. Healthcheck

Coolify usa l'healthcheck per il rolling update e per rimuovere i container non pronti dal proxy.

### 5.1 Opzione A (consigliata): endpoint dedicato

Il repo contiene già `src/app/api/health/route.ts`:

```ts
import "server-only";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts: Date.now() });
  } catch (error) {
    console.error("[HEALTH]", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
```

In Next 16 i Route Handler `GET` non sono cacheati di default, quindi **non** serve `export const dynamic = "force-dynamic"`.

Configura in Coolify **Healthcheck**:

- Check type: **HTTP**
- Method: `GET`
- Scheme: `http`
- Host: `localhost`
- Port: `3000`
- Path: `/api/health`
- Interval: `30`
- Timeout: `5`
- Retries: `3`
- Start period: `300` (lascia tempo a migrazioni + avvio; il retry loop può durare fino a ~2,5 min)

> **L'HTTP check di Coolify richiede `curl` o `wget` dentro l'immagine.** Con Nixpacks di solito c'è; verifica dal terminale del container:
> ```bash
> command -v curl || command -v wget
> ```
> Se mancano entrambi, usa l'opzione B (Node `fetch`) oppure aggiungi `curl` all'immagine.
>
> L'endpoint controlla anche il DB: se il DB è giù, il container è "unhealthy". È corretto per un readiness check, ma Traefik potrebbe rispondere 404/No available server invece di una pagina di errore. Se preferisci un check solo di processo, usa l'opzione B.

### 5.2 Opzione B: check di processo senza modificare il codice

Coolify **CMD** healthcheck:

```bash
node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
```

Node 24 include `fetch`, quindi non serve `curl` nell'immagine. Questo check renderizza la home (legge il DB), quindi non è leggerissimo. L'opzione A è meglio.

---

## 6. Primo deploy

### 6.1 Sequenza

> Se il DB è **completamente vuoto**, il Build Command (`prisma migrate deploy`) crea lo schema e l'app parte con le impostazioni di default. È utile per un'installazione nuova, ma **non** recupera i dati: per la migrazione reale serve il restore del dump (`05-migrazione-database.md`).

1. Verifica che il DB abbia lo schema e i dati (`_prisma_migrations` presente).
2. Controlla le variabili d'ambiente (soprattutto `DATABASE_URL` e `NEXT_PUBLIC_APP_URL`).
3. Premi **Deploy**.
4. Apri i log di build e cerca:
   - `npm ci` completato;
   - `prisma generate` completato;
   - `prisma migrate deploy` completato (Build Command);
   - `next build` completato;
   - eventuali `P1001`/`ENOTFOUND` (DB non raggiungibile).
5. Al termine, apri i log runtime:
   - `migrate deploy` (no-op o applica le nuove);
   - `Ready on http://0.0.0.0:3000`.
6. Verifica lo stato **Healthy**.
7. Apri `https://staging.<DOMAIN>/`.

### 6.2 Se il build fallisce perché il DB non è raggiungibile

È il problema più comune. Le cause e le soluzioni sono in §7.

### 6.3 Verifica migrazioni

Dal terminale del container (Coolify → Terminal):

```bash
npx prisma migrate status
```

Deve dire che lo schema è aggiornato e non ci sono migrazioni pendenti.

---

## 7. Il build deve raggiungere il database

### 7.1 Perché

`next build` esegue:

- `generateStaticParams` per blog, prodotti, pagine Puck;
- `getSettings()` nei layout;
- `sitemap.ts` e `robots.ts`.

Queste chiamate aprono connessioni Prisma. Se il DB non risponde, il build termina con errore.

### 7.2 Soluzione principale: stessa rete

Coolify documenta che, con Nixpacks, un'app può raggiungere un database **nella stessa rete** usando l'URL interno. Assicurati che:

- app e DB siano nello stesso progetto;
- stesso environment;
- stessa destination network.

### 7.3 Se fallisce (`P1001`, `ENOTFOUND`, timeout)

Nell'ordine:

1. **Controlla l'hostname** nell'URL interno: deve essere quello che vedi in Coolify, non `localhost`.
2. **Controlla la rete**: General → Network dell'app e del DB. Devono combaciare.
3. **Riavvia il DB** e riprova (a volte il container non è pronto).
4. **Verifica dal terminale dell'app** (dopo un deploy riuscito) con `node -e ...` (§2.5 di `03-coolify-postgres.md`). Se dal container funziona ma dal build no, è un problema di rete del build.
5. **Fallback temporaneo e controllato**: pubblica la porta del DB **solo su localhost** o su un IP privato, e usa quell'URL per il build. Non lasciarla pubblica oltre il build.
   - In Coolify, per il DB, evita "Public port" (apre un proxy TCP su Internet).
   - Se devi farlo, limita la sorgente nel firewall Hetzner al solo IP della VPS e rimuovi la regola subito dopo.
6. **Fallback definitivo**: costruisci l'immagine fuori da Coolify (GitHub Actions ARM o build server), con un `DATABASE_URL` raggiungibile in build, e deploya l'immagine da registry. Vedi `appendice-b-dockerfile.md`.

> **Non** aggirare il problema rendendo tutte le pagine `force-dynamic`: perderesti la cache ISR e cambieresti il comportamento dell'app. Non è necessario.

### 7.4 Build con DB di produzione Neon (fase B)

Nella fase B la VPS usa Neon: il build raggiunge Neon via Internet. Funziona senza rete Docker. Assicurati che:

- usi la connessione **direct** di Neon (host **senza** `-pooler`). Il pooler di Neon lavora in transaction mode e può interferire con le migrazioni Prisma e con le advisory lock. Una singola VPS non ha bisogno del pooler: il pool `pg` dell'app (default 10 connessioni) è sufficiente.
- il firewall della VPS permetta l'uscita HTTPS/5432 (outbound è aperto di default).
- Neon non abbia IP allowlist che escluda la VPS.

Se in fase B vedi errori di migrazione o di connessione, è quasi sempre il pooler: passa all'URL direct.

---

## 8. ARM64, sharp e Prisma

La VPS è `aarch64`. Nixpacks costruisce **sulla VPS**, quindi `npm ci` scarica i binari ARM corretti. Non serve altro.

Se invece costruisci l'immagine su una macchina x86:

- usa `docker buildx build --platform linux/arm64`;
- verifica che `sharp` installi `@img/sharp-linux-arm64`;
- il client Prisma generato contiene `query_compiler_fast_bg.wasm` (portabile) e, se presenti, binari nativi per il target. Il campo `binaryTargets` del repo include `native` e `rhel-openssl-3.0.x`: con cross-build da x86 il target `native` sarebbe x86. Aggiungi `linux-arm64-openssl-3.0.x` o costruisci su ARM.

Controlla nei log di build:

```bash
uname -m   # deve stampare aarch64
```

---

## 9. Memoria e velocità del build

Il CAX21 ha 8 GB. Next 16 + Turbopack + TypeScript possono arrivare a 2–4 GB durante il build, quindi c'è margine; se alzi `NODE_OPTIONS` a 4096 monitora comunque `free -h`.

Misure già incluse:

- swap 4 GB (`02-vps-hardening.md`);
- `NODE_OPTIONS=--max-old-space-size=3072`;
- build cache Docker attiva.

Se il build viene ucciso (`Killed`, `OOM`, exit 137):

1. Verifica `free -h` e `dmesg | tail`.
2. Aumenta lo swap a 6–8 GB **temporaneamente**.
3. Riduci la concorrenza del build (evita altri deploy in parallelo).
4. Prova il build Webpack: `npm run build-webpack` (a volte consuma meno memoria di Turbopack, a costo di essere più lento).
5. Passa a CAX31 (16 GB) — è la soluzione definitiva.
6. Oppure costruisci in GitHub Actions su runner ARM e push su GHCR (appendice B).

Primo build: 5–15 minuti. Build successivi con cache: 3–8 minuti.

---

## 10. Rolling update, Server Actions e cache

### 10.1 Rolling update

Con healthcheck configurato e **nessuna porta host pubblicata**, Coolify avvia il nuovo container, attende l'healthcheck e poi ferma il vecchio. Requisiti:

- **Container naming**: lascia il default (timestamp), non "consistent name".
- **Nessun port mapping** sull'app (Coolify usa Traefik, non pubblica 3000 sull'host).
- **Stop Grace Period**: 30 s (default) o 60 s.
- **Healthcheck**: obbligatorio per un rolling update utile.

### 10.2 Server Actions

Imposta `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (build+runtime) e non cambiarla. Senza, ogni build genera una chiave diversa e le Server Actions di una pagina vecchia possono fallire sul nuovo container.

### 10.3 Cache ISR

Lascia la cache locale. **Non** montare volumi su `.next/cache` al primo rilascio: se vuoi persisterla tra i deploy, fallo dopo aver verificato che tutto funzioni, montando `/app/.next/cache`. Con una sola replica e `revalidatePath` attivo, la perdita della cache a ogni deploy è accettabile (le pagine si rigenerano alla prima richiesta).

---

## 11. Verifica post-deploy (staging)

- [ ] `https://staging.<DOMAIN>/` risponde 200.
- [ ] Logo, CSS, immagini e font si caricano.
- [ ] Una pagina blog e un prodotto si aprono.
- [ ] `https://staging.<DOMAIN>/sitemap.xml` risponde e contiene URL con il dominio corretto (attenzione: `Settings.siteUrl` punta ancora alla produzione; per lo staging è normale).
- [ ] `https://staging.<DOMAIN>/robots.txt` risponde.
- [ ] Login admin funziona (con un utente di test del branch Neon).
- [ ] Upload di un'immagine su UploadThing funziona.
- [ ] Salvataggio di un post/pagina funziona.
- [ ] `npx prisma migrate status` è pulito.
- [ ] Log senza errori ricorrenti.
- [ ] Healthcheck **Healthy**.
- [ ] CPU/RAM stabili dopo 10 minuti (`htop`, `docker stats`).

Poi passa a `07-test-e-verifica.md` per il collaudo completo.

---

## 12. Errori tipici del deploy

| Sintomo | Causa probabile | Rimedio |
|---|---|---|
| `npm install -g npm@12` → `EBADENGINE` | npm 12 richiede Node ≥ 24.15, Nixpacks usa 24.10 | Togli il pin: `npm ci --include=dev` |
| `next: not found` / `prisma: not found` | devDependencies omesse | `npm ci --include=dev` |
| `prisma generate` → manca `DATABASE_URL` | env non disponibile in build | Metti `DATABASE_URL` in build |
| `P1001` / `ENOTFOUND` durante `next build` | DB non raggiungibile dal build | §7 |
| `Killed` / exit 137 | OOM | Swap, `NODE_OPTIONS`, CAX31 |
| `Cannot find module 'sharp'` / `Invalid ELF` | Binario x86 su ARM | Build nativo ARM |
| `Failed to find Server Action` | Chiave Server Actions cambiata | `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` stabile |
| `The Server Reference ID did not match the expected format` (log, app sana) | Richieste esterne con header `Next-Action` inventato (scanner) | Nessuna: Next rifiuta la richiesta. Verifica che non ricompaia mentre navighi |
| 502 / `No available server` | Container unhealthy o porta errata | Log, healthcheck, `Ports Exposes=3000` |
| Certificato non emesso | DNS errato o porte 80/443 chiuse | `dig`, firewall |
| Login redirect loop | `BETTER_AUTH_URL` / cookie / proxy | URL https corretto, `X-Forwarded-Proto` |
| Pagine vecchie dopo un deploy | Cache ISR / più repliche | 1 replica, `revalidatePath`, cache |
| Build lentissimo | CPU condivisa + swap | Normale al primo build; CAX31 |

Per la diagnosi completa: `09-troubleshooting.md`.
