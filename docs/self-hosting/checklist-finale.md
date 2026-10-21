# Checklist finale — stampa e spunta

Data: ________  Operatore: ________  Dominio: ________  VPS IP: ________

---

## A. T-7 giorni

- [ ] Variabili di produzione esportate da Vercel nel password manager.
- [ ] `SECRETS_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `AUTOMATION_CREDENTIALS_KEY` copiate **identiche**.
- [ ] `.env.production` cancellato / non committato.
- [ ] Versione Neon annotata (`SHOW server_version`): __________
- [ ] Dimensione DB annotata: __________
- [ ] Branch Neon `staging` creato.
- [ ] TTL DNS abbassato a ≤300 s.
- [ ] Dominio canonical deciso: ☐ apex ☐ www
- [ ] `Settings.siteUrl` verificato: ______________________________
- [ ] Finestra di manutenzione scelta: __________________________
- [ ] Backup Hetzner attivo (se previsto).
- [ ] Bucket S3 per backup creato e validato in Coolify.

---

## B. VPS e Coolify

- [ ] CAX21 creato (4 vCPU, 8 GB, 80 GB), Ubuntu 24.04, ARM64 (`uname -m` = aarch64).
- [ ] IPv4 + IPv6 configurate.
- [ ] SSH solo chiave, password disabilitata.
- [ ] Firewall Hetzner attivo.
- [ ] UFW attivo.
- [ ] fail2ban attivo.
- [ ] Swap 4 GB attivo.
- [ ] Timezone `Europe/Rome`.
- [ ] Aggiornamenti di sicurezza configurati.
- [ ] Coolify installato, admin creato subito.
- [ ] 2FA Coolify attivo.
- [ ] Dashboard su `https://coolify.<DOMAIN>`.
- [ ] Porte 8000/6001/6002 chiuse.
- [ ] Notifiche Coolify attive.
- [ ] Docker log rotation configurata.
- [ ] Docker cleanup configurato.
- [ ] `/data/coolify/source/.env` salvato nel password manager.
- [ ] Snapshot `baseline` creato.

---

## C. Database

- [ ] PostgreSQL 18 creato (Neon 15.19 si migra con dump/restore).
- [ ] Encoding UTF8 e locale `C` verificati (`datcollate = C`, `datctype = C`).
- [ ] Volume persistente presente.
- [ ] Nessuna porta pubblica.
- [ ] URL interno copiato.
- [ ] DB Healthy.
- [ ] Dump di staging ripristinato.
- [ ] `_prisma_migrations` presente.
- [ ] Conteggi principali verificati.
- [ ] `ANALYZE` eseguito.
- [ ] Backup schedulato configurato.
- [ ] Primo backup eseguito con successo.
- [ ] Restore di test eseguito con successo.

---

## D. Deploy app (staging)

- [ ] Repository collegato.
- [ ] Build pack Nixpacks.
- [ ] Install: `npm ci --include=dev` (niente pin npm: npm 12 richiede Node ≥ 24.15, Nixpacks usa 24.10).
- [ ] Build: `npm run build`.
- [ ] Start: migrazioni + `npm run start`.
- [ ] Ports Exposes: 3000.
- [ ] `DATABASE_URL` in Build + Runtime.
- [ ] `NEXT_PUBLIC_*` in Build + Runtime.
- [ ] Segreti in Runtime (e build solo se necessario).
- [ ] `TZ=Europe/Rome`.
- [ ] `NODE_OPTIONS=--max-old-space-size=3072`.
- [ ] `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` impostata.
- [ ] Dominio `staging.<DOMAIN>` aggiunto.
- [ ] Certificato staging valido.
- [ ] Healthcheck configurato (`/api/health` o CMD).
- [ ] Build completato senza errori.
- [ ] Migrazioni applicate (`prisma migrate status`).
- [ ] App Healthy.
- [ ] Log senza errori.
- [ ] RAM/CPU stabili.

---

## E. Collaudo staging (dettaglio in 07)

- [ ] Home, blog, articolo, pagina Puck.
- [ ] Shop, prodotto, checkout hosted.
- [ ] Checkout embedded.
- [ ] Login/logout/reset password.
- [ ] Admin: post, pagina, prodotto, categoria, tag.
- [ ] Scheduling + endpoint scheduler.
- [ ] Upload immagine/PDF.
- [ ] Cancellazione media.
- [ ] Form contatti + reCAPTCHA.
- [ ] Newsletter + unsubscribe.
- [ ] Email outbound (reset, invito, acquisto).
- [ ] Email inbound + allegati.
- [ ] Email marketing (audience, template, single send).
- [ ] Automazioni (manuale, cron, webhook).
- [ ] Ads, widget, dashboard.
- [ ] SEO: sitemap, robots, canonical, JSON-LD.
- [ ] `/api/database/backup/` protetto o rimosso.
- [ ] Performance accettabile.
- [ ] Backup/restore testato.

**Stop:** se una voce critica è KO, non passare alla fase F.

---

## F. Cutover app (DNS, ancora Neon)

- [ ] `NEXT_PUBLIC_APP_URL=https://<DOMAIN>`.
- [ ] `BETTER_AUTH_URL=https://<DOMAIN>`.
- [ ] Domini produzione aggiunti in Coolify.
- [ ] Deploy completato **prima** del cambio DNS.
- [ ] Record A apex → `<VPS_IP>`.
- [ ] Record www → `<VPS_IP>` / CNAME.
- [ ] AAAA Vercel rimosso o corretto.
- [ ] `dig @1.1.1.1` restituisce `<VPS_IP>`.
- [ ] Certificato Let's Encrypt emesso.
- [ ] HTTP → HTTPS.
- [ ] www → canonical (o viceversa).
- [ ] Home/blog/shop/prodotto OK.
- [ ] Login admin OK.
- [ ] Salvataggio contenuto OK.
- [ ] Upload OK.
- [ ] Form + reCAPTCHA OK.
- [ ] Stripe test OK.
- [ ] Email test OK.
- [ ] Cron scheduler/automazioni OK.
- [ ] Log puliti.
- [ ] Rollback DNS annotato e pronto.

**Osserva per 24–72 ore prima della fase G.**

---

## G. Cutover database (finestra di manutenzione)

- [ ] Backup Neon/branch `pre-cutover`.
- [ ] App fermata.
- [ ] Nessuna connessione attiva a Neon.
- [ ] Dump finale direct Neon creato.
- [ ] Checksum del dump salvato.
- [ ] `_prisma_migrations` presente nel dump.
- [ ] Restore nel Postgres locale completato.
- [ ] Conteggi confrontati con Neon.
- [ ] `Settings.siteUrl` corretto.
- [ ] Integrazioni presenti.
- [ ] `ANALYZE` eseguito.
- [ ] `DATABASE_URL` cambiato all'URL interno.
- [ ] App riavviata.
- [ ] `prisma migrate status` pulito.
- [ ] Healthcheck Healthy.
- [ ] Smoke test (home, login, post, prodotto).
- [ ] Redeploy rolling eseguito.
- [ ] Cron riattivati e funzionanti.
- [ ] Backup notturno riuscito.
- [ ] Dump Neon conservato off-site.

**Rollback:** se il restore/verify fallisce prima delle scritture locali, rimetti `DATABASE_URL` a Neon e avvia.

---

## H. Post-cutover (72 ore)

- [ ] Errori log sotto controllo.
- [ ] Nessun `P1001`/`P2024`/`too many connections`.
- [ ] Latenza stabile.
- [ ] Disco < 80%.
- [ ] RAM stabile.
- [ ] Backup ogni notte.
- [ ] Webhook Stripe/Resend arrivano.
- [ ] Email outbound/inbound OK.
- [ ] Scheduler e automazioni OK.
- [ ] Google Search Console senza errori gravi.
- [ ] Core Web Vitals accettabili.
- [ ] Certificato con scadenza futura.
- [ ] Documentato l'orario dello switch DB.

---

## I. Pulizia (dopo 30 giorni)

- [ ] Nessun rollback necessario.
- [ ] Dump finale conservato (cifrato) o archiviato.
- [ ] Vercel: progetto sospeso/cancellato.
- [ ] Neon: progetto cancellato.
- [ ] DNS: record vecchi rimossi.
- [ ] Segreti ruotati dove necessario.
- [ ] Runbook aggiornato con date e lezioni apprese.
- [ ] Costi verificati (Hetzner, S3, provider).

---

## J. Contatti e informazioni utili

| Voce | Valore |
|---|---|
| Dominio | |
| VPS IPv4 | |
| VPS IPv6 | |
| Coolify URL | |
| DB container | |
| App container | |
| Ultimo backup DB | |
| Ultimo restore test | |
| Data cutover app | |
| Data cutover DB | |
| Note | |
