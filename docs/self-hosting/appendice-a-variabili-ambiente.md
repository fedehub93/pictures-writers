# Appendice A — Variabili d'ambiente

Riferimento completo per Coolify. Nessun valore reale è incluso: usa il password manager e il pannello Vercel.

---

## 1. Come impostarle in Coolify

1. App → **Environment Variables**.
2. Usa **Developer view** per incollare un blocco `.env`.
3. Per ogni variabile imposta:
   - **Build time**: available / not available;
   - **Runtime**: available / not available;
   - **Locked** per i segreti (impedisce la copia accidentale).
4. Salva.
5. Se hai cambiato una variabile **build-time** o una `NEXT_PUBLIC_*`: **Deploy** (rebuild).
6. Se hai cambiato solo una variabile **runtime**: **Restart**.

> Coolify, di default, rende una variabile disponibile sia in build sia a runtime. Va bene per la maggior parte dei casi. Per i segreti non necessari in build, restringi lo scope.

---

## 2. Regole importanti

- **Niente slash finale** in `NEXT_PUBLIC_APP_URL` e `BETTER_AUTH_URL`. Il codice costruisce URL come `${APP_URL}/shop/...`: uno slash finale produrrebbe `//`.
- Le `NEXT_PUBLIC_*` sono **pubbliche** e vengono **inlined** nel bundle: chiunque può vederle. Non metterci segreti.
- Cambiare una `NEXT_PUBLIC_*` richiede un **nuovo build**, non un semplice restart.
- `DATABASE_URL` serve anche in build (Prisma + prerender).
- Non committare `.env`, `.env.production`, `.env.local`.
- Non incollare segreti in chat, issue, log o screenshot.

---

## 3. Tabella completa

### 3.1 Core

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `NODE_ENV` | `production` | ✅ | ✅ | ❌ | Necessaria per il comportamento di produzione |
| `PORT` | `3000` | ❌ | ✅ | ❌ | Coolify la imposta anche da sé |
| `HOSTNAME` | `0.0.0.0` | ❌ | ✅ | ❌ | Importante per l'ascolto nel container |
| `TZ` | `Europe/Rome` | ✅ | ✅ | ❌ | Coerenza date/log; utile anche nel prerender |
| `NEXT_TELEMETRY_DISABLED` | `1` | ❌ | ✅ | ❌ | Disattiva la telemetria |
| `NEXT_PUBLIC_APP_URL` | `https://<DOMAIN>` | ✅ | ✅ | ❌ | **Senza slash finale**; usata in link, checkout, auth client |
| `BETTER_AUTH_URL` | `https://<DOMAIN>` | ❌ | ✅ | ❌ | **Senza slash finale** |

### 3.2 Database

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `DATABASE_URL` | `postgresql://postgres:<PASS>@postgres-<uuid>:5432/postgres?schema=public` | ✅ | ✅ | ✅ | URL interno Coolify (fase C) o Neon (fase B) |

Formati:

```dotenv
# Coolify interno (consigliato in produzione)
DATABASE_URL=postgresql://postgres:<PASSWORD>@postgres-<UUID>:5432/postgres?schema=public

# Neon direct (consigliata in fase B: runtime, build e migrazioni)
DATABASE_URL=postgresql://<USER>:<PASSWORD>@ep-<...>.<region>.aws.neon.tech/<DB>?sslmode=require&channel_binding=require

# Neon pooled (se proprio ti serve: host con "-pooler")
# DATABASE_URL=postgresql://<USER>:<PASSWORD>@ep-<...>-pooler.<region>.aws.neon.tech/<DB>?sslmode=require&channel_binding=require
```

> In fase B usa la connessione **direct**. Il pooler Neon (transaction mode) può dare problemi con `prisma migrate deploy` e le advisory lock. Una singola VPS non ha bisogno del pooler.

Se la password contiene caratteri speciali (`@`, `:`, `/`, `?`, `#`), codificala in URL (`%40`, `%3A`, ecc.) oppure usa una password alfanumerica.

### 3.2.1 `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK`

In Vercel potrebbe esistere questa variabile, marcata "Sensitive". **Non serve in Coolify** se usi:

- la connessione **direct** di Neon (fase B);
- il PostgreSQL locale (fase C).

Era probabilmente impostata a `true` per far funzionare `prisma migrate deploy` attraverso il pooler Neon. Con una connessione diretta le advisory lock funzionano e non va disabilitata. **Non impostarla** a `[SENSITIVE]`: se proprio ti serve, il valore è `true`, ma preferisci cambiare connessione. Vedi `09-troubleshooting.md` §3.

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK` | `true` | ✅ | ❌ | ❌ | Solo se le migrazioni si bloccano con un pooler; **non necessaria** con direct/local |

### 3.3 Auth

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `BETTER_AUTH_SECRET` | `<stringa lunga casuale>` | ❌ | ✅ | ✅ | **Non rigenerare** se vuoi mantenere le sessioni |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | `<base64 32 byte>` | ✅ | ✅ | ✅ | Genera una volta e conserva; evita errori durante rolling update |

Generazione:

```bash
openssl rand -base64 32
```

### 3.4 Cifratura credenziali

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `SECRETS_ENCRYPTION_KEY` | `<valore attuale>` | ❌ | ✅ | ✅ | **Non rigenerare**: decifra `Integration.secretEncrypted` |
| `AUTOMATION_CREDENTIALS_KEY` | `<valore attuale>` | ❌ | ✅ | ✅ | Decifra credenziali legacy automazioni |

> Senza queste chiavi, un backup del DB non basta a recuperare le credenziali delle integrazioni. Vanno conservate **insieme** al backup. Vedi `docs/integrations-runbook.md`.

### 3.5 UploadThing

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `UPLOADTHING_TOKEN` | `<token>` | ❌ | ✅ | ✅ | Invariato |

### 3.6 Stripe

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `STRIPE_API_KEY` | `sk_live_...` | ❌ | ✅ | ✅ | Server |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ❌ | ✅ | ✅ | Deve corrispondere all'endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | ✅ | ✅ | ❌ | Pubblica |

### 3.7 Email

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `NEXT_SENDGRID_KEY` | `SG....` | — | — | — | **Non necessaria**: l'invio usa `EmailSetting.emailApiKey` nel DB. La env è solo un default (client) nel form |
| `NEXT_RESEND_KEY` | — | — | — | — | **Obsoleta**: non è letta dal codice. La fonte è solo `Integration` nel DB (ADR-0023) |
| `NEXT_RESEND_WEBHOOK_SECRET` | — | — | — | — | **Obsoleta**: il webhook secret è in `Integration` |

### 3.8 Analytics e reCAPTCHA

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `NEXT_GTAG_CONTAINER_ID` | `GTM-XXXXXX` | ✅ | ✅ | ❌ | Letta nel layout home, che viene prerenderizzato |
| `NEXT_GA_TRACKING_ID` | `G-XXXXXXXXXX` | ✅ | ✅ | ❌ | Attualmente non usata nel codice; impostala per coerenza |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | `<site key>` | ✅ | ✅ | ❌ | Pubblica; vincolata ai domini |
| `RECAPTCHA_SECRET_KEY` | `<secret key>` | ❌ | ✅ | ✅ | Server |

### 3.9 Scheduler e automazioni

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `SCHEDULED_PUBLICATION_SECRET` | `<stringa lunga>` | ❌ | ✅ | ✅ | Stesso valore nei cron-job.org |
| `AUTOMATIONS_DEV_PUMP` | non impostare | ❌ | ❌ | ❌ | Solo sviluppo |
| `AUTOMATIONS_DEV_PUMP_INTERVAL_MS` | non impostare | ❌ | ❌ | ❌ | Solo sviluppo |

### 3.10 Build (Nixpacks)

| Variabile | Esempio | Build | Runtime | Segreta | Note |
|---|---|:---:|:---:|:---:|---|
| `NIXPACKS_NODE_VERSION` | `24` | ✅ | ❌ | ❌ | Coerente con `.nvmrc` 24.18.0 (Nixpacks usa però 24.10.0) |
| `NODE_OPTIONS` | `--max-old-space-size=3072` | ✅ | ❌ | ❌ | Evita OOM |
| `NEXT_TELEMETRY_DISABLED` | `1` | ✅ | ✅ | ❌ | |

---

## 4. Blocco pronto (produzione)

```dotenv
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
TZ=Europe/Rome
NEXT_TELEMETRY_DISABLED=1

NEXT_PUBLIC_APP_URL=https://<DOMAIN>
BETTER_AUTH_URL=https://<DOMAIN>

DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@postgres-<UUID>:5432/postgres?schema=public

BETTER_AUTH_SECRET=<DA_VERCEL>
SECRETS_ENCRYPTION_KEY=<DA_VERCEL>
AUTOMATION_CREDENTIALS_KEY=<DA_VERCEL>
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<GENERATA>

UPLOADTHING_TOKEN=<DA_VERCEL>

STRIPE_API_KEY=<DA_VERCEL>
STRIPE_WEBHOOK_SECRET=<DA_VERCEL>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<DA_VERCEL>

# Email: nessuna di queste serve a runtime.
# - SendGrid: EmailSetting.emailApiKey nel DB
# - Resend: Integration nel DB
# Verifica da Admin → Email Settings / Integrations dopo il restore.

NEXT_GTAG_CONTAINER_ID=<DA_VERCEL>
NEXT_GA_TRACKING_ID=<DA_VERCEL>
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<DA_VERCEL>
RECAPTCHA_SECRET_KEY=<DA_VERCEL>

SCHEDULED_PUBLICATION_SECRET=<DA_VERCEL>

NIXPACKS_NODE_VERSION=24
NODE_OPTIONS=--max-old-space-size=3072
```

Per lo staging cambia solo:

```dotenv
NEXT_PUBLIC_APP_URL=https://staging.<DOMAIN>
BETTER_AUTH_URL=https://staging.<DOMAIN>
```

---

## 5. Estrazione da Vercel

### Opzione A — CLI (comoda)

```powershell
npm i -g vercel
vercel login
vercel link
vercel env ls production
vercel env pull .env.production --environment=production
```

Poi:

- copia i valori nel password manager;
- **cancella** `.env.production` dal disco;
- verifica che non sia tracciato: `git status`.

> `.env.production` non è nel `.gitignore` attuale. Aggiungilo o cancellalo subito.

### Opzione B — Dashboard

Vercel → Project → Settings → Environment Variables → Production. Copia una per una.

### Cosa NON copiare

- `VERCEL_URL`, `VERCEL_ENV`, `VERCEL_REGION`, `NEXT_RUNTIME`.
- Variabili di sviluppo (`NEXT_PUBLIC_APP_URL=http://localhost:3000`).
- `DATABASE_URL` di Neon **pooled** per il DB locale (usa l'URL interno Coolify).
- `AUTOMATIONS_DEV_PUMP`.

---

## 6. Verifica che l'app veda le variabili

```bash
docker exec <APP_CONTAINER> printenv | sort | grep -E \
  '^(NODE_ENV|PORT|HOSTNAME|TZ|NEXT_PUBLIC_APP_URL|BETTER_AUTH_URL|DATABASE_URL|NEXT_SERVER_ACTIONS_ENCRYPTION_KEY)='
```

Per le variabili `NEXT_PUBLIC_*`, ricorda che il valore usato dal browser è quello **al momento del build**. Se hai cambiato la variabile ma non hai rideployato, il browser usa ancora il vecchio valore.

---

## 7. Errori comuni

| Errore | Causa | Rimedio |
|---|---|---|
| `Environment variable not found: DATABASE_URL` in build | scope build mancante | Build + Runtime |
| Link/checkout con `//` | slash finale nell'URL | Togli lo slash |
| Login su dominio sbagliato | `NEXT_PUBLIC_APP_URL` vecchio | Cambia + **Deploy** |
| Cookie non impostati | `BETTER_AUTH_URL` http o dominio diverso | https + dominio corretto |
| Integrazioni "not configured" | credenziali nel DB, non env | Admin → Integrations |
| Webhook 400 | secret errato | Copia il signing secret corretto |
| `Failed to find Server Action` | chiave cambiata tra build | Chiave stabile + redeploy |
| Variabile visibile nel bundle | è `NEXT_PUBLIC_*` | Non metterci segreti |
