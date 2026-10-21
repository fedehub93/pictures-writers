# 00 — Percorso step by step (da zero alla produzione)

**Questa è l'unica guida da seguire in ordine.** I file `01`–`09` sono approfondimenti e reference: non devi leggerli tutti prima di iniziare.

- `01` non è un passo operativo: è l'analisi di cosa gira oggi. Leggilo solo se vuoi capire il perché delle scelte.
- `02`–`07` sono i passi operativi, ma in questo file trovi la sequenza esatta e i collegamenti alle sezioni.
- `08`–`09`, appendici e `checklist-finale` si usano dopo o quando serve.

Legenda: ⏱ tempo indicativo · ✅ condizione per proseguire · 📖 approfondimento.

---

## Come usare questo documento

Segui le fasi **0 → 9** in ordine. Dopo ogni fase c'è un **gate**: se non è soddisfatto, non passare alla fase successiva.

Percorso consigliato (quello descritto qui): **app prima su VPS + Neon, database locale dopo**. È il più sicuro e ti permette di verificare tutto in produzione prima di toccare i dati.

Se accetti 30–60 minuti di downtime e vuoi fare tutto in una volta, puoi saltare la fase 7 e unire fase 6 + 8, ma perdii il rollback semplice. Per la prima migrazione, non te lo consiglio.

---

## Glossario rapido

- **Branch Neon**: non è un branch Git. È una copia indipendente del database (schema + dati) in un certo momento, con il suo endpoint e la sua connection string. Creandolo dal branch di produzione (di solito `main` o `production`) puoi testare e scrivere senza toccare la produzione. Non sostituisce un backup: per quello serve anche un dump.
- **Connessione direct vs pooled**: Neon mostra due URL. La **direct** (host senza `-pooler`) è una connessione normale al database. La **pooled** passa da PgBouncer (transaction mode), utile per ambienti serverless ma può interferire con le migrazioni Prisma. Sulla VPS usa la **direct**.
- **Canonical**: il dominio “ufficiale” del sito, ad esempio `https://example.com` oppure `https://www.example.com`. Serve a evitare contenuti duplicati per la SEO. Si riflette in `Settings.siteUrl` (DB), nei redirect del proxy e in `NEXT_PUBLIC_APP_URL`. Non cambiarlo durante la migrazione.
- **TTL DNS**: per quanti secondi i resolver e i browser tengono in cache un record DNS. Se è `3600`, dopo il cambio IP qualcuno può ancora vedere il vecchio server per un'ora. Portalo a `300` secondi prima del cutover, così propagazione e rollback sono rapidi.
- **Backup Hetzner vs dump su S3**: il backup Hetzner è un'immagine dell'intera VPS (disco, Docker, volumi): copre la perdita del server, ma è grossolano e non protegge da una cancellazione logica o da una migrazione sbagliata. Il dump `pg_dump` di Coolify è un backup **logico** del database; caricarlo su S3/R2/B2 lo mette **off-site**, così sopravvive alla perdita della VPS. Servono entrambi.

---

## Checkpoint del progetto (20–21 ottobre 2026)

Stato attuale (21 ottobre 2026): **fasi 0–4 completate**. App in staging su `https://staging.pictureswriters.com`, PostgreSQL 18 di Coolify con il dump del branch Neon `staging` ripristinato e verificato, healthcheck attivo. Prossimo passo: **fase 5 (collaudo)**.

Stato fase 0: **quasi completa**.

Fatto:

- Neon: PostgreSQL **15.19**, database **54 MB**, encoding **UTF8**, locale **C/C**, sola estensione `plpgsql`.
- Branch Neon creato; connessione **direct** disponibile.
- Server scelto: **CAX21** (4 vCPU, 8 GB, 80 GB) invece di CAX11, per avere margine sui build Next.js.
- Canonical: **apex** `https://pictureswriters.com`; `www` → apex.
- TTL DNS attuale: **900 s** (da abbassare a 300 s prima del cutover).
- Backup: per ora manuale; il backup locale schedulato di Coolify si configura in fase 2.
- Coolify installato: **v4.4.6**, dashboard `https://coolify.pictureswriters.com` con HTTPS, 2FA attivo, porte 8000/6001/6002 chiuse.
- PostgreSQL di destinazione: **18** (Coolify 4.4.6 non offre più la 15). Database applicativo `pictures_writers` creato da `template0` con locale `C`/`UTF8`; backup notturno locale attivo, S3 da aggiungere appena disponibile.
- Export env Vercel fatto; alcune variabili erano `[SENSITIVE]`. `NEXT_RESEND_KEY`, `NEXT_RESEND_WEBHOOK_SECRET`, `NEXT_SENDGRID_KEY` e `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK` **non servono**.

Da chiudere (non bloccano la fase 1):

- [ ] Confermare di avere i valori reali di `SECRETS_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `AUTOMATION_CREDENTIALS_KEY` e delle altre env necessarie (Stripe, UploadThing, ecc.) nel password manager.
- [ ] Portare il TTL a **300 s** e attendere almeno 15 minuti (vecchio TTL) prima del cutover.
- [ ] Configurare il backup locale schedulato in fase 2 e scaricare il primo dump sul PC.

**Puoi iniziare la fase 1.** Non passare alla fase 4/6/8 finché i tre segreti critici non sono confermati.

---

## Fase 0 — Preparazione (⏱ 45–90 minuti)

Obiettivo: avere tutti i valori, i backup e le informazioni prima di creare qualcosa.

- [ ] **Esporta le variabili di produzione da Vercel** nel password manager:

  ```powershell
  npm i -g vercel
  vercel login
  vercel link
  vercel env ls production
  vercel env pull .env.production --environment=production
  ```

  Copia i valori nel password manager, poi cancella `.env.production` e verifica `git status`.

- [ ] **Annota i tre segreti che non devono cambiare:**
  - `SECRETS_ENCRYPTION_KEY`
  - `BETTER_AUTH_SECRET`
  - `AUTOMATION_CREDENTIALS_KEY`

  Se cambiano, le integrazioni/sessioni esistenti si rompono. Devono essere copiati **identici**.

- [ ] **Controlla Neon** (versione, dimensione, branch):

  ```sql
  SHOW server_version;
  SELECT pg_size_pretty(pg_database_size(current_database()));
  ```

  Annota la major (qui **15**) e la dimensione (qui **54 MB**). Ti servono per pianificare il dump/restore: Coolify offre PostgreSQL 16–18, quindi si usa la **18** (destinazione più nuova, dump da 15 ripristinabile).

- [ ] **Crea un branch Neon `pre-cutover`** dal branch di produzione (di solito `main` o `production`): è una copia del database, non un branch Git. Se vuoi, crea anche `staging` per il collaudo. Il branch ha una **sua** connection string e non modifica la produzione.

- [ ] **Individua la connessione direct del branch** che userai (Neon → branch → Connect → Connection Details). È l'URL con host **senza** `-pooler`. In fase B la userai sulla VPS; per lo staging userai quella del branch `staging`.

- [ ] **Decidi il canonical**: il dominio preferito tra apex (`https://example.com`) e `www` (`https://www.example.com`). Guarda quale dei due reindirizza all'altro e controlla `Settings.siteUrl` nel DB. Non cambiarlo durante la migrazione.

- [ ] **Abbassa il TTL DNS a 300 s** sui record `A`/`AAAA`/`CNAME` del dominio, dal pannello del provider DNS (Cloudflare, Vercel DNS o registrar). Fallo almeno 24 h prima del cutover; dopo la migrazione potrai rialzarlo.

- [ ] **Crea un bucket S3** (Cloudflare R2, Backblaze B2 o Hetzner Object Storage) per i **dump logici** del database. Non sostituisce il backup Hetzner della VPS: serve a conservare una copia off-site che sopravvive alla perdita o alla corruzione del server. Con 54 MB è praticamente gratis.

- [ ] **Stampa `checklist-finale.md`** e tienila aperta.

✅ Gate: hai nel password manager tutte le env di produzione, i tre segreti critici, la versione/dimensione di Neon e il canonical scelto.

📖 Dettaglio: `01-analisi-e-piano.md` §4–6, `appendice-a-variabili-ambiente.md`.

---

## Fase 1 — VPS e hardening (⏱ 1–2 ore)

Obiettivo: CAX21 pronta, sicura, con swap e firewall.

- [ ] Crea il server Hetzner **CAX21** (4 vCPU, 8 GB RAM, 80 GB), Ubuntu 24.04, ARM64, IPv4, backup opzionali.
- [ ] Aggiungi la tua chiave SSH.
- [ ] Accedi come root e verifica `uname -m` → `aarch64`.
- [ ] Aggiorna il sistema, installa i pacchetti base, imposta `Europe/Rome`.
- [ ] Hardening SSH (solo chiave, niente password).
- [ ] Firewall Hetzner + UFW: 22, 80, 443; 8000/6001/6002 solo dal tuo IP per ora.
- [ ] fail2ban.
- [ ] **Swap 4 GB** (raccomandato anche sul CAX21, come rete di sicurezza).
- [ ] Crea uno snapshot Hetzner `baseline`.

✅ Gate: rientri in SSH solo con la chiave, `free -h` mostra lo swap, `ufw status` è attivo, le porte 80/443 sono raggiungibili.

📖 Dettaglio e comandi: `02-vps-hardening.md`.

---

## Fase 2 — Coolify e PostgreSQL (⏱ 1–2 ore)

Obiettivo: Coolify installato, progetto creato, PostgreSQL 18 (Neon è 15.19; migrazione con dump/restore) healthy, backup configurati.

- [ ] Installa Coolify con admin pre-creato (evita la registrazione aperta).
- [ ] Accedi subito, attiva 2FA, salva `/data/coolify/source/.env` nel password manager.
- [ ] Imposta il dominio `coolify.<DOMAIN>` e verifica HTTPS.
- [ ] Chiudi le porte 8000/6001/6002.
- [ ] Disattiva l'auto-update di Coolify.
- [ ] Configura le notifiche (deploy/backup/disco).
- [ ] Crea il progetto `pictures-writers` ed environment `production`.
- [ ] Crea **PostgreSQL 18** (major più recente offerta da Coolify; Neon 15.19 si migra con dump/restore) nella stessa rete del futuro app.
- [ ] Imposta `--locale=C --encoding=UTF8` negli **Initial database arguments** **prima del primo avvio**. Se il cluster è già inizializzato, crea il database applicativo con `TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`.
- [ ] Nessuna porta pubblica per il DB.
- [ ] Copia l'**URL interno** del DB (host/porta/credenziali comuni; cambia solo il nome del database nel percorso).
- [ ] Configura il backup giornaliero locale e fai **Back up now**. Se il bucket S3 non è ancora pronto, aggiungi S3 alla stessa schedule appena disponibile.
- [ ] Verifica che il backup sia **Success** e > 0 byte.

✅ Gate: dashboard su HTTPS, DB **Healthy**, URL interno copiato, primo backup riuscito.

📖 Dettaglio: `03-coolify-postgres.md` §1–4.

---

## Fase 3 — Database di staging (⏱ 30–60 minuti)

Obiettivo: un DB di test con i dati reali, senza toccare la produzione.

- [ ] Crea il dump dal branch Neon `staging` (connessione **direct**).
- [ ] Verifica che il dump contenga `_prisma_migrations`.
- [ ] Ripristinalo nel Postgres di Coolify.
- [ ] Verifica `_prisma_migrations` e i conteggi principali.
- [ ] Esegui `ANALYZE`.

✅ Gate: il DB locale ha le stesse tabelle/conteggi del branch; `_prisma_migrations` non è vuota.

📖 Comandi esatti: `03-coolify-postgres.md` §3.

---

## Fase 4 — Deploy dell'app in staging (⏱ 2–4 ore, build inclusi)

Obiettivo: app identica alla produzione, ma su `staging.<DOMAIN>` e con il DB di staging.

- [ ] Crea l'applicazione in Coolify dal repo, branch `master`, **Nixpacks**.
- [ ] `Ports Exposes`: `3000`.
- [ ] Install Command: `npm ci --include=dev`.
- [ ] Build Command: `npx prisma migrate deploy && npm run build`.
- [ ] Start Command: `sh scripts/start-production.sh`.
- [ ] Inserisci tutte le env (blocco in `04` §3.1).
- [ ] `NEXT_PUBLIC_APP_URL` e `BETTER_AUTH_URL` = `https://staging.<DOMAIN>`.
- [ ] `DATABASE_URL` = DB di staging (Neon branch direct o URL interno Coolify).
- [ ] Aggiungi il dominio `staging.<DOMAIN>` in Coolify.
- [ ] Configura l'healthcheck (`/api/health` o CMD con `node fetch`).
- [ ] Deploy.
- [ ] Verifica nei log: `npm ci`, `prisma generate`, `prisma migrate deploy`, `next build`, `Ready`.
- [ ] Verifica healthcheck **Healthy**.
- [ ] Apri `https://staging.<DOMAIN>/`.
- [ ] Esegui `npx prisma migrate status` dal terminale del container.

✅ Gate: sito raggiungibile in HTTPS, healthcheck healthy, log senza errori (a parte i `Server Reference ID did not match` generati da scanner esterni), migrazioni pulite.

📖 Dettaglio: `04-deploy-applicazione.md` §2–6. Se il build non raggiunge il DB: §7.

---

## Fase 5 — Collaudo (⏱ 2–3 ore)

Obiettivo: dimostrare che **tutte** le funzioni operano come su Vercel.

- [ ] Infrastruttura e sito pubblico.
- [ ] Blog, pagine Puck, shop, prodotti.
- [ ] Login/logout/reset password, ruoli, inviti.
- [ ] Creazione/modifica/pubblicazione contenuti.
- [ ] Scheduling + endpoint scheduler.
- [ ] UploadThing (upload, delete, rewrite `/assets/:id`).
- [ ] Form + reCAPTCHA.
- [ ] Email outbound.
- [ ] Email inbound + allegati.
- [ ] Email marketing.
- [ ] Automazioni (manuale, cron, webhook).
- [ ] Stripe hosted + embedded + webhook.
- [ ] Ads, widget, dashboard.
- [ ] SEO: sitemap, robots, canonical, JSON-LD.
- [ ] Backup/restore test.

✅ Gate: nessuna voce **critica** KO. Le voci minori si possono correggere dopo, ma vanno annotate.

📖 Checklist completa: `07-test-e-verifica.md` e `checklist-finale.md` sezione E.

**Stop:** se qualcosa di critico non funziona, non passare alla fase 6.

---

## Fase 6 — Cutover dell'app (⏱ 30 min + propagazione DNS)

Obiettivo: il dominio reale punta alla VPS, ma l'app usa **ancora Neon**. Zero perdita dati.

- [ ] In Coolify, imposta `NEXT_PUBLIC_APP_URL=https://<DOMAIN>` e `BETTER_AUTH_URL=https://<DOMAIN>`.
- [ ] Aggiungi i domini `https://<DOMAIN>` e `https://www.<DOMAIN>` (con redirect).
- [ ] Fai **Deploy** e attendi il build (il certificato del dominio prod arriverà dopo il DNS).
- [ ] Verifica i log del build.
- [ ] Cambia i record DNS:
  - apex `A` → `<VPS_IP>`
  - `www` → `<VPS_IP>` o CNAME
  - rimuovi gli `AAAA` Vercel se non usi IPv6 sulla VPS
- [ ] Attendi la propagazione:

  ```bash
  dig @1.1.1.1 <DOMAIN> A +short
  dig @8.8.8.8 <DOMAIN> A +short
  ```

- [ ] Attendi il certificato Let's Encrypt (30 s–2 min).
- [ ] Verifica HTTPS e issuer:

  ```bash
  curl -I https://<DOMAIN>/
  echo | openssl s_client -servername <DOMAIN> -connect <DOMAIN>:443 2>/dev/null | openssl x509 -noout -issuer -dates
  ```

- [ ] Verifica redirect HTTP→HTTPS e `www`→canonical.
- [ ] Smoke test: home, blog, shop, login admin, upload, form, Stripe test, email test, cron.
- [ ] Annota i valori DNS Vercel per il rollback.

✅ Gate: sito in HTTPS sul dominio reale, login/admin funzionanti, Stripe/email/cron verificati.

**Rollback:** riporta i DNS ai valori Vercel. Sei ancora su Neon, quindi nessun dato perso.

📖 Dettaglio: `06-cutover-dns.md`.

---

## Fase 7 — Osservazione (⏱ 24–72 ore)

Obiettivo: capire se la VPS è stabile **prima** di spostare il database.

- [ ] Errori nei log sotto controllo.
- [ ] CPU/RAM stabili.
- [ ] Disco < 80%.
- [ ] Backup notturni riusciti.
- [ ] Cron scheduler/automazioni girano.
- [ ] Webhook Stripe/Resend arrivano.
- [ ] Nessun rollback necessario.

✅ Gate: 24–72 h senza incidenti. Solo ora passa alla fase 8.

---

## Fase 8 — Cutover del database (⏱ 1–2 ore, finestra di manutenzione)

Obiettivo: spostare i dati da Neon al PostgreSQL locale, con rollback semplice.

- [ ] Annuncia la finestra (il sito sarà fermo 5–30 min).
- [ ] **Ferma l'app** in Coolify.
- [ ] Verifica che non ci siano connessioni attive su Neon.
- [ ] Dump finale da Neon **direct**.
- [ ] Verifica `_prisma_migrations` nel dump e salva lo SHA256.
- [ ] Ripristina nel Postgres locale (`--no-owner --no-privileges --clean --if-exists --single-transaction`).
- [ ] Verifica conteggi, `_prisma_migrations`, `Settings.siteUrl`, `Settings.timezone`, `Integration`.
- [ ] `ANALYZE`.
- [ ] Cambia `DATABASE_URL` all'URL interno Coolify.
- [ ] **Restart** dell'app (le migrazioni sono no-op).
- [ ] Verifica healthcheck e smoke test.
- [ ] Fai un **Deploy rolling** per rigenerare le pagine statiche contro il DB locale.
- [ ] Verifica di nuovo login, post, prodotto, email, cron.
- [ ] Verifica che il backup notturno successivo sia riuscito.
- [ ] Conserva il dump Neon off-site per 30 giorni.

✅ Gate: app stabile sul DB locale, backup riuscito, nessun errore `P1001`/`P2024`.

**Rollback:** se fallisce prima che l'app scriva sul DB locale, rimetti `DATABASE_URL` a Neon e riavvia. Dopo le prime scritture locali, il rollback richiede un restore verso Neon (vedi `05` §4).

📖 Dettaglio: `05-migrazione-database.md`.

---

## Fase 9 — Post-cutover e pulizia (⏱ 72 ore + 30 giorni)

- [ ] Monitora per 72 ore.
- [ ] Testa un restore completo del backup.
- [ ] Controlla Search Console e Core Web Vitals.
- [ ] Aggiorna privacy policy/subprocessors (Hetzner).
- [ ] Dopo 30 giorni senza problemi: sospendi/cancella Vercel.
- [ ] Dopo 30 giorni: cancella Neon.
- [ ] Rimuovi i record DNS vecchi.
- [ ] Aggiorna il runbook con date e lezioni apprese.

✅ Fine.

---

## Se hai fretta: percorso minimo

Puoi saltare, senza rompere nulla:

- branch Neon di staging (usa direttamente un dump del branch `pre-cutover`);
- dominio `staging.<DOMAIN>` (testa dopo il cutover DNS);
- Dockerfile alternativo (usa Nixpacks);
- Cloudflare proxy (tieni DNS-only);
- PITR/WAL-G (rimandalo);
- sezione GDPR (falla dopo, ma non dimenticarla).

Non puoi saltare:

- backup e test di restore;
- i tre segreti critici;
- migrazioni prima del build;
- verifica di Stripe/email/cron dopo il cutover;
- una finestra di manutenzione per il dump finale.

---

## Ordine di lettura consigliato

1. **Questo file** (00) — la sequenza.
2. `checklist-finale.md` — da spuntare mentre lavori.
3. `02`, `03`, `04` — quando arrivi alle fasi 1–4.
4. `07` — durante la fase 5.
5. `06` — durante la fase 6.
6. `05` — durante la fase 8.
7. `08` — dopo il cutover, come runbook.
8. `09` — solo se qualcosa non va.
9. `01` e appendici — consultazione.

Se segui questo file e spunti la checklist, non devi leggere il resto in anticipo.
