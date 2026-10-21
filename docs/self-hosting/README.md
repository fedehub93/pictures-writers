# Migrazione da Vercel + Neon a VPS Hetzner + Coolify

Questa cartella contiene il piano completo, passo per passo, per spostare **Pictures Writers** da Vercel + NeonDB a una VPS Hetzner (CAX21) gestita con Coolify, **senza perdere nessuna funzionalità**.

> Stato del documento: scritto il **20 ottobre 2026** sullo stato attuale del repository.
> Rileggi sempre le sezioni "Verifica" prima di eseguire un comando in produzione.

---

## 1. Risultato atteso

```
PRIMA                                      DOPO
─────                                      ────
Browser                                    Browser
   │                                          │
   ▼                                          ▼
Vercel (Next.js serverless)                Traefik / Let's Encrypt (Coolify)
   │                                          │
   ├── NeonDB (Postgres + pooler)             ├── Next.js 16 (container, `next start`)
   ├── UploadThing (file)                     ├── PostgreSQL 18 (container, rete interna)
   ├── Stripe / Resend / SendGrid             ├── UploadThing (invariato, esterno)
   ├── Google Tag Manager / reCAPTCHA         ├── Stripe / Resend / SendGrid (invariati)
   └── cron-job.org (scheduler)               ├── GTM / reCAPTCHA (invariati)
                                              └── cron-job.org oppure cron della VPS
```

**Cosa resta esterno e non va migrato:** UploadThing (immagini, PDF, allegati), Stripe (checkout e webhook), Resend/SendGrid (email), Google Tag Manager/Analytics, Google reCAPTCHA, cron-job.org (trigger ogni 5 minuti).

**Cosa cambia:** il processo Node che esegue Next.js, il database PostgreSQL, il reverse proxy/TLS e il sistema di deploy.

---

## 2. La strategia: tre passaggi, non uno

La migrazione "big bang" (DNS + DB + app nello stesso momento) è quella che fa perdere dati e sonno. Qui si separano **app** e **database**:

| Fase | Cosa succede | Downtime | Rischio |
|---|---|---|---|
| **A. Collaudo** | VPS + Coolify + Postgres di test, app deployata su un sottodominio `staging`, DB ripristinato da un **branch Neon** | zero | nullo per la produzione |
| **B. Cutover app** | Il DNS del dominio reale punta alla VPS, ma la VPS usa **ancora Neon** | 0–5 min (TTL) | basso, rollback = DNS |
| **C. Cutover database** | Si ferma l'app, si fa il dump finale da Neon, si ripristina nel Postgres locale, si cambia `DATABASE_URL` | 5–30 min (dipende dalla dimensione) | medio, ma con rollback documentato |

Questa sequenza permette di verificare **tutta l'applicazione in produzione** prima di toccare il database. Se qualcosa non funziona nella fase B, si riporta il DNS su Vercel in pochi minuti.

> **Regola d'oro:** il dominio resta **lo stesso**. Non cambiare dominio durante la migrazione. Cookie di sessione, webhook Stripe/Resend, link nelle email, reCAPTCHA, SEO, canonical URL e `Settings.siteUrl` nel database dipendono dal dominio. Cambiarlo moltiplica i punti di rottura.

---

## 3. Costi realistici (ottobre 2026)

I prezzi Hetzner sono cambiati il **15 giugno 2026**. La configurazione scelta è **CAX21** (non CAX11): 8 GB danno margine ai build Next.js, che su 4 GB rischiano l'OOM.

| Voce | Netto/mese | Note |
|---|---:|---|
| CAX21 (4 vCPU ARM, 8 GB RAM, 80 GB NVMe) | €10,49 | Falkenstein / Norimberga / Helsinki |
| IPv4 | €0,50 | necessaria per la raggiungibilità universale |
| Backup automatici Hetzner (opzionali, +20%) | ~€2,10 | snapshot giornalieri/settimanali |
| **Totale senza backup** | **€10,99** | **~€13,41 IVA 22% inclusa** |
| **Totale con backup Hetzner** | **~€13,09** | **~€15,97 IVA 22% inclusa** |
| Backup su Cloudflare R2 / Backblaze B2 | €0–1 | R2: 10 GB gratis; B2: pochi centesimi per un DB piccolo |
| Coolify self-hosted | €0 | licenza gratuita |
| Dominio | invariato | già pagato |

Quindi: **~€13,40/mese IVA inclusa senza backup Hetzner**, **~€16/mese con i backup**. Resta comunque sotto il costo attuale di Neon + Vercel. Tieni i backup (€2,10) e aggiungi un backup su R2/B2: è l'assicurazione più economica dell'intero progetto.

> Il CAX11 (2 vCPU, 4 GB, €5,99 netti) è il **minimo sindacale**: Coolify + Postgres + build Next.js su 4 GB è tirato. Se vuoi risparmiare è l'unica alternativa sensata, ma con CAX21 eviti gli OOM durante build e deploy rolling.

---

## 4. I dieci punti critici specifici di questa applicazione

Questi non sono consigli generici: derivano dal codice di Pictures Writers.

1. **Il build di Next.js legge il database.** `generateStaticParams`, `sitemap.ts`, `robots.ts` e i layout chiamano `getSettings()`/Prisma durante `next build`. Se il DB non è raggiungibile dal container di build, il deploy fallisce. Per lo stesso motivo il **Build Command deve eseguire `prisma migrate deploy` prima di `next build`**: se il nuovo codice usa una colonna nuova, il prerender fallirebbe. Vedi `04-deploy-applicazione.md`.
2. **`prisma.config.ts` usa `env('DATABASE_URL')`.** Anche `prisma generate` (eseguito dal `postinstall`) richiede `DATABASE_URL` in fase di build.
3. **`SECRETS_ENCRYPTION_KEY` non va rigenerata.** Le credenziali delle integrazioni sono cifrate nel DB con questa chiave. Se cambia, le integrazioni (Resend, ecc.) non si decifrano più e vanno reinserite a mano. Vedi `docs/integrations-runbook.md`.
4. **`BETTER_AUTH_SECRET` non va cambiato** se vuoi mantenere valide le sessioni esistenti (e comunque va copiato identico).
5. **`AUTOMATION_CREDENTIALS_KEY`** serve per le credenziali legacy delle automazioni: copiala identica.
6. **La VPS è ARM64.** Sharp e Prisma devono essere compilati/scaricati per `linux-arm64`. Se costruisci l'immagine su una macchina x86 (es. GitHub Actions), devi usare `--platform linux/arm64` e aggiungere il target Prisma corretto.
7. **`package-lock.json` è generato con npm 12.0.2, ma su Nixpacks non puoi installare npm 12.** npm 12 richiede Node ≥ 24.15 e il nixpkgs pinnato da Nixpacks fornisce 24.10.0: `npm install -g npm@12.0.2` fallisce con `EBADENGINE`. Usa l'npm incluso in Node con `npm ci --include=dev` (il lockfile è `lockfileVersion: 3`). Inoltre Nixpacks imposta `NODE_ENV=production`: `--include=dev` è necessario, altrimenti il build non trova TypeScript/Tailwind e a runtime manca la Prisma CLI. `NPM_CONFIG_PRODUCTION=false` non serve.
8. **Una sola istanza.** La cache ISR di Next è locale (`in-memory` + disco). Con più repliche senza cache handler condiviso vedresti contenuti vecchi. Tieni **1 replica** (vedi ADR-0001).
9. **Server Actions + rolling update.** L'app usa le Server Actions. Imposta una `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` stabile in build, altrimenti durante un deploy con due container sovrapposti le action della vecchia pagina possono fallire.
10. **UploadThing resta esterno.** Il DB contiene solo URL. La migrazione non sposta i file: non cancellare l'app UploadThing. Se in futuro vuoi tagliare anche quel costo, è un progetto separato (S3/MinIO) e richiede la riscrittura degli URL nel DB.

---

## 5. Indice dei documenti

**Se vuoi solo la sequenza operativa, apri [`00-step-by-step.md`](./00-step-by-step.md) e segui quello.** Gli altri file sono approfondimenti: non devi leggerli tutti prima di iniziare.

| File | Contenuto | Quando leggerlo |
|---|---|---|
| [`00-step-by-step.md`](./00-step-by-step.md) | **La guida lineare da seguire: fase 0 → 9, comandi, gate e collegamenti** | **Per primo** |
| [`01-analisi-e-piano.md`](./01-analisi-e-piano.md) | Inventario completo di cosa gira oggi, dipendenze, segreti, decisioni, cronologia | Come reference, non è un passo operativo |
| [`02-vps-hardening.md`](./02-vps-hardening.md) | Creazione CAX21, SSH, firewall, swap, Docker, hardening | Fase 1 |
| [`03-coolify-postgres.md`](./03-coolify-postgres.md) | Installazione Coolify, dashboard, progetto, PostgreSQL 18, backup | Fase 2–3 |
| [`04-deploy-applicazione.md`](./04-deploy-applicazione.md) | Deploy Next.js su Coolify, Nixpacks, env, migrazioni, build, ARM | Fase 4 |
| [`05-migrazione-database.md`](./05-migrazione-database.md) | Dump da Neon, restore su Postgres locale, verifica, switch | Fase 8 |
| [`06-cutover-dns.md`](./06-cutover-dns.md) | Timeline, DNS, TLS, Vercel, Cloudflare, rollback | Fase 6 |
| [`07-test-e-verifica.md`](./07-test-e-verifica.md) | Checklist funzionale completa (pubblica, admin, shop, email, automazioni) | Fase 5 |
| [`08-operations-runbook.md`](./08-operations-runbook.md) | Deploy, rollback, backup, restore, monitoraggio, incidenti, update | Dopo il cutover, per sempre |
| [`09-troubleshooting.md`](./09-troubleshooting.md) | Sintomo → causa → rimedio | Quando qualcosa non va |
| [`appendice-a-variabili-ambiente.md`](./appendice-a-variabili-ambiente.md) | Tabella completa delle variabili, scope build/runtime, valori | Durante il deploy |
| [`appendice-b-dockerfile.md`](./appendice-b-dockerfile.md) | Dockerfile standalone alternativo, build ARM, entrypoint migrazioni | Se Nixpacks non basta |
| [`appendice-c-comandi.md`](./appendice-c-comandi.md) | Comandi copia-incolla: dump, restore, verifiche, cron, log, emergency | Sempre |
| [`checklist-finale.md`](./checklist-finale.md) | Checklist stampabile pre/post cutover | Giorno del cutover |

---

## 6. Prerequisiti

- Accesso al repository GitHub (o deploy key).
- Accesso al pannello Vercel (per esportare le variabili d'ambiente di produzione).
- Accesso al pannello Neon (per il dump e il branch di test).
- Accesso al DNS del dominio (Cloudflare, Aruba, Register, ecc.).
- Accesso a Stripe, Resend, UploadThing, Google reCAPTCHA (per verificare le configurazioni).
- Una chiave SSH (meglio se già esistente).
- Un password manager dove mettere le variabili sensibili.
- Possibilmente una finestra di basso traffico per la fase C (database).

---

## 7. Cosa NON fare

- **Non** copiare il `.env` locale sul server: il `.env` di sviluppo ha `NEXT_PUBLIC_APP_URL=http://localhost:3000` e il DB di sviluppo. Le variabili di produzione vanno prese da Vercel.
- **Non** rigenerare `SECRETS_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `AUTOMATION_CREDENTIALS_KEY`.
- **Non** esporre PostgreSQL su Internet "solo per il dump". Usa un tunnel SSH o un container temporaneo.
- **Non** cancellare Vercel e Neon il giorno stesso. Tienili per 30 giorni come rollback.
- **Non** mettere più di una replica finché non hai una cache condivisa.
- **Non** mettere il DB e l'app su reti Docker diverse: il build deve poter raggiungere il DB.
- **Non** usare Cloudflare con proxy arancione attivo durante il primo rilascio TLS: prima DNS-only, poi eventualmente proxy.
- **Non** fare il cutover del database senza aver fatto e **testato** un restore completo.

---

## 8. Aspetti legali e privacy (GDPR)

- Hetzner diventa un **nuovo sub-processor**: se la privacy policy del sito elenca Vercel/Neon come fornitori, va aggiornata (Hetzner Cloud, location Germania/Finlandia, UE).
- I backup del database contengono dati personali (utenti, contatti email, submission): vanno cifrati a riposo e conservati con accesso limitato. Preferisci bucket S3 privati e, se possibile, cifratura lato client.
- Conserva il DPA/accordo di trattamento con Hetzner e con gli altri provider.
- Non conservare dump contenenti PII sul disco della VPS più del necessario.

---

## 9. Tempo stimato

| Fase | Tempo attivo | Tempo calendario |
|---|---:|---:|
| VPS + hardening | 1–2 h | giorno 1 |
| Coolify + Postgres | 1–2 h | giorno 1 |
| Deploy + primo build | 2–4 h (build lenti) | giorno 2 |
| Collaudo funzionale | 2–3 h | giorno 2–3 |
| Cutover app (DNS) | 30 min + propagazione | giorno 3–4 |
| Cutover DB | 1–2 h | giorno 4–7 |
| Monitoraggio e pulizia | 1 h | +30 giorni |

Non c'è fretta: la fase B può restare in piedi per giorni/settimane con la VPS che usa Neon. Più tempo osservi, meno rischi corri nella fase C.

---

## 10. Convenzioni usate nei documenti

- `<DOMAIN>` = il dominio di produzione, es. `pictureswriters.com`.
- `<VPS_IP>` = IPv4 pubblico della VPS.
- `<DB_CONTAINER>` = nome del container PostgreSQL creato da Coolify (lo vedi in `docker ps`).
- `<DB_PASSWORD>` = password generata da Coolify.
- I comandi preceduti da `#` sono da eseguire come root sulla VPS.
- I comandi PowerShell sono indicati come tali.
- "Vercel" = il deployment attuale; "VPS" = il nuovo server.
- Non sono riportati valori di segreti reali: mai.
