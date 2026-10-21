# 01 — Analisi, inventario e piano

Questo documento fotografa **tutto ciò che Pictures Writers usa oggi** e stabilisce cosa va migrato, cosa resta esterno e cosa può rompersi. Serve a non scoprire a metà strada una funzione dimenticata.

---

## 1. Stack attuale

| Componente | Oggi | Note |
|---|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) | `next build` + `next start` |
| Runtime Node | Node 24.18.0 (`.nvmrc`) | npm 12.0.2 (vedi workflow CI) |
| Database | PostgreSQL su **Neon**, con pooler (`-pooler` nell'host) | Prisma 7 + `@prisma/adapter-pg` |
| ORM | Prisma 7, client generato in `generated/prisma` | `query_compiler_fast_bg.wasm` |
| Auth | Better Auth + adapter Prisma | sessioni nel DB, cookie |
| Pagamenti | Stripe Checkout (hosted + embedded) + webhook | endpoint `/api/webhooks/stripe/` |
| Email | SendGrid + Resend | credenziali anche nel DB (`Integration`) |
| File | UploadThing | immagini, PDF, allegati email |
| Page builder | Puck | dati nel DB |
| Editor | TipTap | dati nel DB (JSON/HTML) |
| Analytics | Google Tag Manager / GA | script lato client |
| Antibot | Google reCAPTCHA v3 | vincolato al dominio |
| Job ricorrenti | **cron-job.org** ogni 5 min | scheduler + automazioni |
| Deploy | Vercel | build serverless |
| DNS/TLS | Vercel | certificati automatici |

### Versioni rilevanti

- `next`: `^16.3.4`
- `prisma` / `@prisma/client`: `^7.10.0`
- `better-auth`: `^1.7.2`
- `stripe`: `^20.4.0`
- `uploadthing`: `^7.7.4`
- `sharp`: `^0.35.3`
- `pg`: `^8.23.0`

---

## 2. Superfici applicative da verificare

### Sito pubblico

- Home, pagine CMS create con Puck (`/[...slug]/`).
- Blog: lista, categoria, tag, articolo (`/blog/[slug]/`), bozze (`/draft/[...slug]/`).
- Shop: categorie, prodotti ebook/webinar/servizi, dettaglio, submission, checkout hosted ed embedded, download ebook.
- Form contatti/newsletter/iscrizione, unsubscribe.
- Recensioni, widget, pubblicità (campaign/block/item).
- SEO: `sitemap.xml`, `robots.txt`, JSON-LD, canonical, `llms.txt`, `llms-full.txt`.
- Analytics (GTM), reCAPTCHA.
- Redirect in `next.config.mjs` (`/ebooks/*`, `/sitemap-0.xml`, concorso 2025→2026).
- Rewrite `/assets/:id` → UploadThing.

### Admin

- Login Better Auth, reset password via email.
- Ruoli, permessi, inviti, utenti, activity log.
- Post e pagine con versioning (root + version), scheduling.
- Categorie, tag, SEO.
- Prodotti, categorie prodotto, recensioni, ordini.
- Media library (UploadThing).
- Form e submissions.
- Email marketing: audience, contatti, template, single send, log.
- Inbox/conversazioni email (Resend inbound + allegati).
- Integrazioni (Resend, credenziali cifrate nel DB).
- Automazioni (canvas, run, step, trigger manuale/cron/webhook).
- Impostazioni sito, lingua, widget, ads, dashboard.
- Pulsante "Build website" (in realtà `revalidateContent("all")`, non un rebuild).

### Endpoint e job

| Endpoint | Metodo | Autenticazione | Chi lo chiama |
|---|---|---|---|
| `/api/scheduler/run/` | POST | header `x-scheduled-publication-secret` | cron-job.org ogni 5 min |
| `/api/automations/run/` | POST | stesso header | cron-job.org ogni 1–5 min |
| `/api/automations/webhook/[automationId]/` | POST | header `x-automation-secret` | sistemi esterni |
| `/api/webhooks/stripe/` | POST | firma Stripe | Stripe |
| `/api/webhooks/resend/` | POST | firma Svix | Resend |
| `/api/auth/[...all]/` | * | Better Auth | browser/admin |
| `/api/trpc/[trpc]/` | * | sessione | browser/admin |
| `/api/uploadthing/` | * | token UploadThing + auth | browser |
| `/api/media/*`, `/api/admin/*`, `/api/settings/*`, `/api/users/*`, `/api/posts`, `/api/products/*`, `/api/invitations/*`, `/api/newsletter/*` | * | sessione/admin | admin e sito |
| `/api/database/backup/` | GET | **nessuna** | ⚠️ vedi sicurezza |

> ⚠️ **Problema di sicurezza preesistente:** `src/app/api/database/backup/route.ts` è un endpoint **pubblico** che esporta in JSON diverse tabelle (incluse `User` e contatti email). Su Vercel è già raggiungibile. Inoltre, essendo un `GET` senza `dynamic`, Next potrebbe **prerenderizzarlo** durante il build e servirne una fotografia statica. Va rimosso, protetto con `authAdmin()` o marcato `force-dynamic` **prima** del deploy. Non è un problema causato dalla VPS, ma un'occasione per sistemarlo. Vedi §9.

---

## 3. Flussi a runtime che dipendono dall'infrastruttura

### 3.1 Build-time

Durante `next build` l'app **legge il database**:

- `src/app/(home)/layout.tsx` → `getSettings()` (navbar/footer/SEO).
- `src/app/(home)/(routes)/blog/[slug]/page.tsx` → `generateStaticParams`.
- `src/app/(home)/(routes)/[...slug]/page.tsx` → `generateStaticParams` (pagine Puck).
- `src/app/(home)/(routes)/shop/[categorySlug]/[productSlug]/page.tsx` → `generateStaticParams`.
- `src/app/(home)/(routes)/shop/[categorySlug]/[productSlug]/submission/page.tsx` → `generateStaticParams`.
- `src/app/(home)/(routes)/draft/[...slug]/page.tsx` → `generateStaticParams` (dynamic).
- `src/app/sitemap.ts` e `src/app/robots.ts` → `getSettings()` + query.
- `prisma generate` (`postinstall`) → `prisma.config.ts` → `env('DATABASE_URL')`.

Conseguenza: **il container di build deve raggiungere PostgreSQL**. Non è un dettaglio: è la causa numero uno dei deploy falliti su Coolify. Vedi `04-deploy-applicazione.md` §7.

### 3.2 Runtime

- ISR (`revalidate = 86400`) + `revalidatePath` on-demand (ADR-0001). Cache locale dell'istanza.
- `revalidateContent()` chiama `revalidatePath` su path e layout.
- Scheduler e automazioni girano **solo** quando un cron chiama gli endpoint. Non ci sono processi in background nel container (il pump di sviluppo è disattivato in produzione).
- UploadThing: il browser carica i file **direttamente** su UploadThing; il server riceve solo i metadati. Gli allegati inbound di Resend vengono copiati su UploadThing dal server.
- Le email escono verso SendGrid/Resend.
- Stripe: checkout verso Stripe, webhook in ingresso.
- `sharp` viene usato **a runtime** per generare i placeholder delle immagini (`src/lib/image.ts`), leggendo da `public/` o da URL remoti.
- `date-fns-tz` + `Settings.timezone` per scheduling e automazioni.

### 3.3 Cosa non esiste (e quindi non va migrato)

- Nessun `vercel.json`, nessun Vercel Cron.
- Nessun uso di `waitUntil`, `after()`, `unstable_cache`, Edge Runtime.
- Nessun WebSocket/queue esterna.
- Nessun filesystem persistente usato per gli upload (tutto su UploadThing).
- `@vercel/speed-insights` è installato ma **commentato** in `src/app/(home)/layout.tsx`.
- `maxDuration` è dichiarato in due route ma su self-hosting viene ignorato (nessun limite serverless: i job possono durare di più).
- `src/lib/vercel.ts` contiene `triggerWebhookBuild`, ma **non è più chiamato da nessuna parte**. Il pulsante admin "Build website" usa `revalidateContent("all")`. Il campo `Settings.deployWebhookUrl` è quindi vestigiale: puoi lasciarlo o svuotarlo, non influenza il deploy.
- Non ci sono Vercel Cron né `vercel.json`.

---

## 4. Variabili d'ambiente: inventario

Elenco completo ricavato dal codice e dal `.env` (senza valori). Dettaglio in `appendice-a-variabili-ambiente.md`.

| Variabile | Serve a | Build | Runtime | Sensibile | Note |
|---|---|:---:|:---:|:---:|---|
| `DATABASE_URL` | Prisma + adapter pg | ✅ | ✅ | ✅ | **deve puntare al DB raggiungibile in build** |
| `NEXT_PUBLIC_APP_URL` | URL pubblico, link email, checkout, auth client | ✅ | ✅ | ❌ | inlined nel bundle: cambiarla richiede rebuild |
| `BETTER_AUTH_URL` | base URL Better Auth | ❌ | ✅ | ❌ | stesso dominio |
| `BETTER_AUTH_SECRET` | firma sessioni | ❌ | ✅ | ✅ | **non rigenerare** |
| `SECRETS_ENCRYPTION_KEY` | cifratura credenziali integrazioni | ❌ | ✅ | ✅ | **non rigenerare** |
| `AUTOMATION_CREDENTIALS_KEY` | decrypt credenziali legacy automazioni | ❌ | ✅ | ✅ | copiare identica |
| `UPLOADTHING_TOKEN` | UploadThing | ❌ | ✅ | ✅ | invariato |
| `STRIPE_API_KEY` | Stripe server | ❌ | ✅ | ✅ | invariato |
| `STRIPE_WEBHOOK_SECRET` | verifica webhook | ❌ | ✅ | ✅ | invariato se l'endpoint non cambia |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client | ✅ | ✅ | ❌ | |
| `NEXT_SENDGRID_KEY` | **non necessaria a runtime** | — | — | — | L'invio usa `EmailSetting.emailApiKey` nel DB; la env è solo un default (client) nel form impostazioni |
| `NEXT_RESEND_KEY` | **obsoleta** | — | — | — | non è letta dal codice: la fonte è solo `Integration` nel DB (ADR-0023) |
| `NEXT_RESEND_WEBHOOK_SECRET` | **obsoleta** | — | — | — | non è letta dal codice: il webhook secret è in `Integration` |
| `NEXT_GTAG_CONTAINER_ID` | GTM | ❌ | ✅ | ❌ | |
| `NEXT_GA_TRACKING_ID` | GA | ❌ | ✅ | ❌ | |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA client | ✅ | ✅ | ❌ | |
| `RECAPTCHA_SECRET_KEY` | verifica reCAPTCHA | ❌ | ✅ | ✅ | |
| `SCHEDULED_PUBLICATION_SECRET` | scheduler + automazioni | ❌ | ✅ | ✅ | stesso valore nei cron |
| `AUTOMATIONS_DEV_PUMP` | pump solo sviluppo | ❌ | ✅ | ❌ | non impostare in produzione |
| `AUTOMATIONS_DEV_PUMP_INTERVAL_MS` | idem | ❌ | ✅ | ❌ | non impostare in produzione |
| `NODE_ENV` | Next | ✅ | ✅ | ❌ | `production` |
| `PORT` | porta | ❌ | ✅ | ❌ | `3000` |
| `HOSTNAME` | bind | ❌ | ✅ | ❌ | `0.0.0.0` |
| `TZ` | timezone processo | ❌ | ✅ | ❌ | `Europe/Rome` |
| `NEXT_TELEMETRY_DISABLED` | telemetria Next | ❌ | ✅ | ❌ | `1` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | stabilità Server Actions | ✅ | ✅ | ✅ | consigliata, stabile |
| `NODE_OPTIONS` | memoria build | ✅ | ❌ | ❌ | `--max-old-space-size=3072` |
| `NIXPACKS_NODE_VERSION` | versione Node | ✅ | ❌ | ❌ | `24` |

> `NEXT_RUNTIME` e `VERCEL_URL` sono variabili interne: non vanno impostate.
> `VERCEL_URL` è usata solo in `src/trpc/client.tsx`; senza di essa il client usa l'URL relativo nel browser e `http://localhost:3000` sul server. Su una singola VPS `localhost:3000` è corretto dentro il container. Vedi §8 per l'hardening opzionale.

---

## 5. Segreti da copiare **esattamente**

Questi valori non sono "configurazione": sono chiavi crittografiche. Se cambiano, si rompono dati esistenti.

| Segreto | Cosa succede se cambia |
|---|---|
| `SECRETS_ENCRYPTION_KEY` | Le credenziali in `Integration.secretEncrypted` non si decifrano. Resend/SendGrid nel DB diventano inutilizzabili. Vanno reinserite a mano. |
| `AUTOMATION_CREDENTIALS_KEY` | Le credenziali legacy delle automazioni non si decifrano. |
| `BETTER_AUTH_SECRET` | Le sessioni esistenti possono invalidarsi; i token di reset password in volo non valgono più. |
| `STRIPE_WEBHOOK_SECRET` | I webhook Stripe falliscono con 400 (se cambi endpoint, Stripe genera un nuovo secret: è normale, ma va aggiornato). |
| `SCHEDULED_PUBLICATION_SECRET` | I cron ricevono 401. |

**Procedura sicura:** esporta le variabili da Vercel in un password manager, poi inseriscile in Coolify. Non passare dal copia-incolla in chat o da file non cifrati.

```powershell
# Sul tuo PC, con Vercel CLI già autenticato
vercel env pull .env.production --environment=production
```

Il file `.env.production` è gitignorato? Verifica: `.env*.local`, `.env`, `.env.test` sono ignorati, ma `.env.production` **non** è esplicitamente ignorato. Aggiungilo a `.gitignore` o cancellalo subito dopo l'uso. Meglio: `vercel env ls production` per l'elenco e copia manuale nel password manager.

---

## 6. Database: cosa sapere prima di toccarlo

> ⚠️ **Il `.env` locale di questo progetto punta a Neon.** Non eseguire `prisma migrate dev`, `prisma migrate reset`, seed distruttivi o test che scrivono/cancellano dati contro quel database: è probabilmente la produzione. Per lo sviluppo usa un branch Neon dedicato o il Postgres locale di `docker-compose.yml`.

### 6.1 Versione e connessione

Neon espone due URL:

- **Pooled** (`...-pooler...`): quella usata oggi dall'app su Vercel. Non ideale per dump/migrazioni (transaction mode).
- **Direct**: usala per `pg_dump`, `pg_restore`, `prisma migrate` e, in fase B, per l'app sulla VPS. Una singola istanza non ha bisogno del pooler.

Trova la versione:

```sql
SHOW server_version;
SELECT version();
```

Il Postgres di destinazione deve essere **della stessa major version o superiore**. Se Neon è 17, crea Postgres 17 in Coolify. Se è 18, crea Postgres 18.

### 6.2 Dimensioni

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;

SELECT relname AS table,
       pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 15;
```

Un DB di blog/CMS con qualche migliaio di contatti e immagini remote è tipicamente **< 200 MB**. Il dump richiede pochi secondi; il restore 1–5 minuti. Se è molto più grande, pianifica una finestra più lunga.

### 6.3 Cosa contiene il dump

- Schema completo + dati.
- La tabella `_prisma_migrations` (fondamentale: dice a Prisma quali migrazioni sono già applicate).
- Enum, indici, vincoli, foreign key.
- **Non** contiene i file di UploadThing (sono esterni).
- **Non** contiene i segreti cifrati in chiaro: contiene i blob cifrati con `SECRETS_ENCRYPTION_KEY`.

### 6.4 Estensioni

Le migrazioni usano `gen_random_uuid()`, funzione **built-in** da PostgreSQL 13. Non serve `pgcrypto`, `citext`, `uuid-ossp` o altre estensioni. Buona notizia: il restore non richiede superuser per estensioni.

### 6.5 Branch Neon per il collaudo

Neon permette di creare un **branch** (copia copy-on-write) del database in pochi secondi. Usalo per la fase A:

- Branch `staging` dal branch di produzione.
- La VPS si connette al branch `staging`, non alla produzione.
- Puoi fare test distruttivi (pubblicare, cancellare, inviare email di test) senza toccare i dati reali.
- I dati del branch sono una fotografia: non riflettono le scritture successive. Va bene per il collaudo.

Questo è il modo più sicuro per provare l'app senza duplicare subito il DB.

---

## 7. Decisioni architetturali

| Decisione | Scelta | Perché |
|---|---|---|
| Orchestratore | **Coolify self-hosted** | Interfaccia web, deploy Git, TLS automatico, backup DB, log, rollback. |
| Build | **Nixpacks** (fallback Dockerfile) | Nessuna modifica al repo, `node_modules` completo (Prisma CLI, sharp, handlebars), meno sorprese. |
| DB | **PostgreSQL 18** in container Coolify | Coolify 4.4.6 non offre più la 15; Neon (15.19) si migra con dump/restore; rete interna; backup schedulati. |
| DB esposto? | **No** | Solo rete Docker interna. Accesso eccezionale via tunnel SSH. |
| App replicas | **1** | Cache ISR locale; scheduler con lease ma inutile rischiare. |
| Cache | **Locale, nessun Redis** | ADR-0001. Redis si aggiunge solo se si scala. |
| File | **UploadThing invariato** | Nessuna migrazione file, nessun rischio. |
| Cron | **cron-job.org invariato** (poi opzionale cron VPS) | Il dominio resta lo stesso: nessuna modifica ai job. |
| Dominio | **Invariato** | Cookie, webhook, email, SEO, reCAPTCHA. |
| TLS | **Let's Encrypt via Traefik (Coolify)** | Automatico, rinnovo incluso. |
| Backup DB | **Coolify schedulato + S3 (R2/B2)** | Il CAX21 non ha PITR come Neon: i backup vanno testati. |
| Monitoring | **Coolify notifications + uptime esterno** | Se la VPS muore, Coolify non può avvisarti: serve un check esterno. |

---

## 8. Hardening opzionale del codice (consigliato, non bloccante)

Piccole modifiche che rendono l'app più solida su self-hosting. Non sono necessarie per migrare, ma sono a basso rischio.

1. **`src/trpc/client.tsx`**: sostituire il ramo `VERCEL_URL` con un fallback esplicito.

   ```ts
   function getUrl() {
     if (typeof window !== "undefined") return "/api/trpc";
     return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/trpc`;
   }
   ```

   Su VPS `localhost:3000` funziona, quindi non è urgente. Ma eliminare il riferimento a Vercel rende il comportamento prevedibile.

2. **Healthcheck**: aggiungere `src/app/api/health/route.ts` (vedi `04-deploy-applicazione.md` §6). Serve a Coolify per il rolling update.

3. **`/api/database/backup`**: rimuoverlo o proteggerlo con `authAdmin()`. È pubblico e scarica PII.

4. **`next.config.mjs`**: rimuovere `outputFileTracingIncludes` se si passa a `output: "standalone"`? No: lascialo, è innocuo; con Prisma 7 il client è in `generated/prisma`. Se usi standalone, verifica che il WASM del query compiler sia incluso (vedi appendice B).

5. **`package.json`**: aggiungere `"engines": { "node": ">=24 <25" }` per rendere esplicita la versione a Nixpacks e ai futuri manutentori.

Queste modifiche si possono fare **prima** del cutover, in un branch separato, e testare su Vercel. Non mescolarle con la migrazione infrastrutturale se vuoi isolare le cause di errore.

---

## 9. Rischi e mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Build non raggiunge il DB | Media | Alto | Stessa rete Docker; verifica in fase A; fallback documentato |
| OOM durante il build su CAX21 | Bassa | Medio | Swap 4 GB + `NODE_OPTIONS`; fallback build esterno |
| `npm ci` rifiuta il lockfile / npm 12 non installabile | Media | Medio | Usa l'npm incluso in Node (`npm ci --include=dev`); pin npm 12 solo con Node ≥ 24.15 |
| Prisma/sharp binari sbagliati (x86 vs ARM) | Media | Alto | Build nativo sulla VPS ARM; mai cross-build senza `--platform` |
| Perdita dati tra dump e switch | Bassa | Critico | Fermare l'app durante il dump finale; backup Neon conservato |
| Webhook Stripe/Resend rotti | Bassa | Alto | Dominio invariato; test firmati; secret invariati |
| Sessioni admin perse | Bassa | Medio | Stesso dominio + stesso `BETTER_AUTH_SECRET` + stesso DB |
| Integrazioni illeggibili | Bassa | Alto | Non rigenerare `SECRETS_ENCRYPTION_KEY` |
| Backup mai testati | Alta (se non fatti) | Critico | Restore di prova su DB usa-e-getta |
| VPS compromessa | Bassa | Critico | Firewall provider, SSH key, no DB pubblico, update |
| Certificato TLS non emesso | Bassa | Alto | DNS corretto, porte 80/443, DNS-only la prima volta |
| Cron non aggiornati | Bassa | Medio | Stesso dominio; verifica manuale dopo il cutover |
| Disco pieno (immagini Docker) | Media | Alto | Docker cleanup + retention + monitoring |

---

## 10. Cose da fare **oggi**, prima di creare la VPS

- [ ] Esportare le variabili di produzione da Vercel nel password manager.
- [ ] Verificare che `.env.production` non finisca su Git.
- [ ] Annotare la versione di Neon (`SHOW server_version`).
- [ ] Annotare la dimensione del DB.
- [ ] Creare un branch Neon `staging` (o `pre-migration`).
- [ ] Verificare quale dominio è canonical: apex o `www` (guarda `Settings.siteUrl` nel DB e la configurazione Vercel).
- [ ] Abbassare il TTL dei record DNS a 300 s (meglio 60 s) **almeno 24 h prima** del cutover.
- [ ] Verificare le credenziali di Stripe, Resend, UploadThing, reCAPTCHA.
- [ ] Decidere la finestra per il cutover DB (orario di basso traffico).
- [ ] Leggere `07-test-e-verifica.md` e stampare `checklist-finale.md`.
- [ ] Non toccare ancora Vercel/Neon.

---

## 11. Cronologia consigliata

```
Giorno 1     VPS + hardening + Coolify + Postgres
Giorno 2     Deploy app su staging (Neon branch) + primo build
Giorno 3     Collaudo funzionale completo
Giorno 4     Cutover DNS (app su VPS, ancora Neon)
Giorno 4-10  Monitoraggio in produzione, fix
Giorno 10    Backup finale Neon + cutover DB locale
Giorno 10-40 Monitoraggio, backup testati, rollback ancora disponibile
Giorno 40    Spegnimento Vercel e Neon
```

Puoi dilatare i tempi quanto vuoi. La cosa importante è **non superare la fase B senza aver testato** la fase A.
