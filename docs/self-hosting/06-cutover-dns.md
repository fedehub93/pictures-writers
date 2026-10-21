# 06 — Cutover DNS e messa in produzione

Obiettivo: portare il dominio reale sulla VPS **mantenendo Neon** (fase B), verificare tutto in produzione, e solo dopo migrare il database (fase C, documento 05).

> **Regola:** il dominio non cambia. Cambia solo l'indirizzo IP a cui punta. Questo preserva cookie, sessioni, webhook, link nelle email, reCAPTCHA, SEO e canonical URL.

---

## 1. Prima del cutover: verifica lo stato dei DNS

### 1.1 Quali nameserver usi?

```powershell
# Windows PowerShell
Resolve-DnsName <DOMAIN> -Type NS
```

oppure:

```bash
dig NS <DOMAIN> +short
```

Tre scenari:

| Nameserver | Dove gestisci i record | Note |
|---|---|---|
| Cloudflare (`*.ns.cloudflare.com`) | Pannello Cloudflare | Puoi attivare/disattivare il proxy |
| Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) | Pannello Vercel → Domains → DNS Records | Puoi modificare gli A record da lì |
| Registrar / altro | Pannello del registrar | Esperienza variabile |

### 1.2 Record attuali

```bash
dig <DOMAIN> A +short
dig <DOMAIN> AAAA +short
dig www.<DOMAIN> A +short
dig www.<DOMAIN> CNAME +short
```

Su Vercel tipicamente vedrai:

- apex `A` → `76.76.21.21` (o un IP Vercel);
- `www` `CNAME` → `cname.vercel-dns.com`;
- eventuale `AAAA` Vercel.

Annotali: sono il tuo rollback.

### 1.3 Canonical: apex o www?

Guarda nel database:

```sql
SELECT "siteUrl" FROM "Settings" LIMIT 1;
```

Esempi:

- `https://pictureswriters.com` → canonical apex, `www` deve reindirizzare all'apex.
- `https://www.pictureswriters.com` → canonical www, l'apex deve reindirizzare a www.

Non cambiare questa scelta durante la migrazione. Farlo invaliderebbe cookie e canonical URL.

> **Due fonti di verità:** `NEXT_PUBLIC_APP_URL` (env, usata da auth/checkout/link) e `Settings.siteUrl` (DB, usata da sitemap/robots/JSON-LD/canonical). Devono puntare allo stesso dominio. Se il dominio resta invariato, non devi cambiarle; verifica solo che combacino.
>
> `trailingSlash: true` in `next.config.mjs` aggiunge lo slash alle **URL delle route** (e redirige `/blog` → `/blog/`). **Non** modifica `Settings.siteUrl` né `NEXT_PUBLIC_APP_URL`: quei valori restano senza slash finale, perché il codice aggiunge già i separatori (`${siteUrl}/...`). Se metti lo slash anche lì, ottieni `//`.

### 1.4 Abbassa il TTL

Almeno **24 ore prima**:

- porta il TTL dei record `A`/`AAAA`/`CNAME` a **300 secondi** (meglio 60 se il provider lo consente);
- attendi la scadenza del vecchio TTL (fino a 24–48 h, ma per un TTL già basso bastano poche ore).

Questo riduce la finestra di propagazione e rende il rollback quasi immediato.

### 1.5 Verifica i servizi esterni

| Servizio | Cosa verificare | Se il dominio non cambia |
|---|---|---|
| Stripe | Dashboard → Developers → Webhooks: endpoint `https://<DOMAIN>/api/webhooks/stripe/`, eventi `checkout.session.completed`, secret corretto | Nessuna modifica |
| Resend | Webhook inbound `https://<DOMAIN>/api/webhooks/resend/`, signing secret | Nessuna modifica |
| UploadThing | App attiva, token valido, eventuali allowed origins | Nessuna modifica |
| reCAPTCHA | Key v3, dominio autorizzato | Nessuna modifica |
| Google Tag Manager | Container attivo | Nessuna modifica |
| cron-job.org | Due job: `/api/scheduler/run/` e `/api/automations/run/`, header corretto | Nessuna modifica **se** i job usano `https://<DOMAIN>/...`; se usano l'URL `*.vercel.app`, aggiornali |
| Email transazionali | Domini SPF/DKIM verificati su SendGrid/Resend | Nessuna modifica (MX non toccati) |

> Se durante il collaudo usi `staging.<DOMAIN>`, ricordati di aggiungerlo:
> - ai domini autorizzati della key reCAPTCHA (altrimenti i form falliscono);
> - agli allowed origins di UploadThing, se configurati;
> - a un eventuale webhook Stripe di test.
>
> Per la produzione, rimuovi o disabilita le configurazioni di staging dopo il cutover.

---

## 2. Timeline consigliata

### T-7 giorni

- [ ] Fase A completata e collaudata.
- [ ] Fase B pronta: app su VPS con Neon, dominio di staging funzionante.
- [ ] TTL DNS abbassato.
- [ ] Backup Neon recente.
- [ ] `checklist-finale.md` stampata.
- [ ] Finestra di cutover comunicata (se necessario).

### T-1 giorno

- [ ] Verifica che l'app su staging usi Neon e che i dati siano aggiornati.
- [ ] Verifica healthcheck, log, CPU/RAM.
- [ ] Verifica che il certificato di staging sia valido.
- [ ] Prepara le variabili di produzione (`NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`).
- [ ] Non fare deploy di codice quel giorno, se puoi evitarlo.
- [ ] Annota l'IP Vercel per il rollback.

### T-0 (cutover app)

1. **Prepara l'app per la produzione** (senza cambiare ancora il DNS):
   - In Coolify, imposta `NEXT_PUBLIC_APP_URL=https://<DOMAIN>` e `BETTER_AUTH_URL=https://<DOMAIN>`.
   - Aggiungi i domini `https://<DOMAIN>` e `https://www.<DOMAIN>` (con redirect) in Coolify.
   - Fai **Deploy** e attendi che il build finisca.
   - Il container sarà healthy sul dominio di staging; il certificato per il dominio di produzione non può essere emesso finché il DNS punta a Vercel. È normale.
2. **Verifica il build** nei log: nessun errore, healthcheck OK.
   > Da questo momento il login su `staging.<DOMAIN>` non è più affidabile: il client di autenticazione nel bundle punta a `https://<DOMAIN>`, che fino al cambio DNS è ancora Vercel. È atteso. Usa i log e le pagine pubbliche per verificare lo staging; il login lo testerai dopo il cambio DNS.
3. **Cambia i record DNS**:
   - apex `A` → `<VPS_IP>`;
   - `www` `CNAME` → `<DOMAIN>` (oppure `A` → `<VPS_IP>`);
   - rimuovi eventuali `AAAA` Vercel se la VPS non ha IPv6 configurato o se l'IPv6 non funziona. Un `AAAA` rotto causa errori intermittenti e può impedire l'emissione del certificato.
4. **Attendi la propagazione**:

   ```bash
   dig @1.1.1.1 <DOMAIN> A +short
   dig @8.8.8.8 <DOMAIN> A +short
   dig @1.1.1.1 www.<DOMAIN> A +short
   ```

   Devono restituire `<VPS_IP>`.

5. **Attendi il certificato** (Traefik/Let's Encrypt, 30 s–2 min). Verifica:

   ```bash
   curl -I https://<DOMAIN>
   echo | openssl s_client -servername <DOMAIN> -connect <DOMAIN>:443 2>/dev/null | openssl x509 -noout -issuer -subject -dates
   ```

   L'issuer deve essere Let's Encrypt (o la CA configurata), non un certificato self-signed di Traefik.

6. **Verifica redirect e canonical**:
   - `https://www.<DOMAIN>/` → redirect 301/308 verso l'apex (o viceversa, secondo il canonical);
   - `http://<DOMAIN>/` → redirect HTTPS;
   - trailing slash coerente (`/blog/`, non `/blog`), come su Vercel.

7. **Smoke test** (dettaglio in `07-test-e-verifica.md`):
   - home, blog, un articolo, una pagina Puck, shop, un prodotto;
   - login admin;
   - salvataggio di un contenuto;
   - upload immagine;
   - form contatto (reCAPTCHA);
   - checkout Stripe con carta di test;
   - un'email transazionale di test;
   - scheduler manuale con header;
   - un'automazione manuale.

8. **Monitora** per 30–60 minuti:
   - log runtime;
   - error rate (Coolify + eventuale uptime);
   - CPU/RAM;
   - risposta dei cron.

### T+1 giorno

- [ ] Verifica che i cron abbiano girato (log scheduler).
- [ ] Verifica che i webhook Stripe/Resend siano arrivati.
- [ ] Controlla Google Search Console per errori di scansione (facoltativo).
- [ ] Confronta Core Web Vitals prima/dopo.
- [ ] Non cancellare Vercel/Neon.

### T+3…10 giorni

- [ ] Monitoraggio stabile.
- [ ] Backup notturni riusciti.
- [ ] Procedi con la fase C (documento 05) in una finestra di basso traffico.

---

## 3. Cloudflare

### 3.1 Primo rilascio: DNS only

Durante il primo cutover, imposta i record su **DNS only** (nuvola grigia). Motivi:

- Let's Encrypt HTTP-01 funziona senza intermediari;
- vedi subito se il problema è DNS/origine;
- eviti loop di redirect e problemi di "Full/Flexible".

### 3.2 Dopo il certificato: proxy opzionale

Se vuoi il proxy Cloudflare:

- SSL/TLS mode: **Full (strict)** (l'origine ha un certificato valido).
- **Always Use HTTPS**: attivo.
- **Automatic HTTPS Rewrites**: attivo.
- Non usare **Flexible**: causerebbe un loop (Cloudflare parla HTTP all'origine, Traefik redirige a HTTPS).
- Se usi il proxy, il vero IP client arriva in `CF-Connecting-IP` / `X-Forwarded-For`. Next/Traefik lo gestiscono; se in futuro aggiungi rate limiting, usalo.
- Le regole di cache: **non** cachare HTML dinamico o l'admin. Lascia che sia Next a impostare `Cache-Control`. Puoi cachare `/_next/static/*` e i file statici.
- Se attivi il proxy, verifica che il certificato origine continui a rinnovarsi: Let's Encrypt HTTP-01 passa attraverso Cloudflare (porta 80 proxata), quindi di solito funziona. In caso di problemi, usa DNS-01 o disattiva temporaneamente il proxy al rinnovo.

### 3.3 Errore comune

| Sintomo | Causa | Rimedio |
|---|---|---|
| `ERR_TOO_MANY_REDIRECTS` | Cloudflare "Flexible" + redirect HTTPS di Traefik | Imposta Full (strict) |
| 522 / timeout | IP origine errato o firewall | Verifica A record e porte 80/443 |
| 526 invalid certificate | Full (strict) ma certificato origine non valido/scaduto | Attendi/riemetti il certificato, verifica DNS |

---

## 4. Vercel: cosa fare e cosa non fare

### Durante la fase B

- **Non** cancellare il progetto Vercel.
- **Non** rimuovere il dominio personalizzato da Vercel: ti serve per il rollback. Vercel continuerà a mostrare un avviso di configurazione DNS errata: ignorabile.
- **Disabilita l'auto-deploy** da Git (Settings → Git → ignora o disconnetti), per evitare che un push ricostruisca Vercel mentre la produzione è sulla VPS. Se lo lasci attivo, non è pericoloso finché il DNS punta alla VPS, ma è confusione inutile.
- **Non** usare Vercel per scrivere dati: dopo il cutover, la produzione è la VPS. Se Vercel resta raggiungibile via `*.vercel.app`, chiunque conosca quell'URL potrebbe creare contenuti sul DB condiviso. Disabilita l'accesso o accetta il rischio per pochi giorni. Meglio: proteggi il deployment Vercel con "Deployment Protection" o scollega il dominio.

### Rollback (fase B)

1. Riporta i record DNS ai valori Vercel annotati.
2. Attendi il TTL (300 s).
3. Verifica `dig`.
4. Vercel è ancora lì: il sito torna online.
5. Non serve toccare Neon: entrambe le app usano lo stesso DB.

> Se durante la fase B hai scritto dati tramite la VPS, quei dati sono su Neon e quindi anche Vercel li vede. Il rollback è coerente.

### Dopo la fase C

Vercel non è più un rollback del database: punta a Neon, che non riceve più le scritture. Tienilo spento e, dopo 30 giorni, cancellalo.

---

## 5. SEO e URL

- Il dominio è lo stesso: nessun cambio di canonical.
- `trailingSlash: true` è già nel codice: Coolify/Traefik non deve rimuovere gli slash.
- I redirect in `next.config.mjs` (`/ebooks/*`, `/sitemap-0.xml`, concorso 2025→2026) funzionano allo stesso modo.
- `sitemap.xml` e `robots.txt` sono generati a runtime/build dal DB: verifica che contengano il dominio corretto (dipende da `Settings.siteUrl`, non da `NEXT_PUBLIC_APP_URL`).
- Se usi Cloudflare, non cachare `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`.
- Non cambiare `Settings.siteUrl` durante la migrazione. Se il dominio resta lo stesso, non c'è nulla da aggiornare.
- Dopo il cutover, controlla Search Console per errori 5xx/redirect. Non serve reinviare la sitemap se l'URL è invariato, ma puoi farlo per accelerare.

---

## 6. Performance: cosa aspettarsi

Vantaggi della VPS:

- Nessun cold start serverless.
- Processo Node sempre caldo.
- Latenza di rete bassa verso il DB (stessa macchina) dopo la fase C.
- Cache ISR persistente tra le richieste (finché il container vive).
- Nessun limite di esecuzione serverless (i job possono durare più di 60 s).

Attenzione:

- Una sola istanza: nessuna scalabilità orizzontale automatica. Per questo sito va bene.
- Il disco è locale: la cache ISR si perde a ogni deploy/restart (accettato da ADR-0001).
- Le immagini sono `unoptimized: true`, quindi la VPS non fa ottimizzazione immagini (come su Vercel). I file arrivano da UploadThing.
- `sharp` viene usato per i placeholder: consuma CPU al primo render di una pagina con immagini remote. Con una cache ISR calda è trascurabile.

Misure da fare prima/dopo:

```bash
# TTFB e tempi di risposta
curl -o /dev/null -s -w "dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" https://<DOMAIN>/
```

Confronta con Vercel. Usa Lighthouse/PageSpeed Insights per LCP/CLS/INP.

---

## 7. Comunicazione e manutenzione

Se il sito ha utenti:

- Annuncia una finestra di 15–30 minuti per la fase C (database), non per la fase B (DNS, di solito trasparente).
- Durante la fase C il sito mostra 502/503: è normale.
- Se usi una pagina di manutenzione, mettila prima dello stop e rimuovila dopo.

---

## 8. Checklist del cutover (riassunto)

- [ ] TTL basso da ≥24 h.
- [ ] App su VPS con Neon, staging collaudato.
- [ ] Env di produzione impostate, build completato.
- [ ] Domini aggiunti in Coolify.
- [ ] DNS apex + www → VPS.
- [ ] AAAA rimosso o corretto.
- [ ] Certificato Let's Encrypt valido.
- [ ] Redirect HTTP→HTTPS e www→apex (o viceversa).
- [ ] Home/blog/pagine/shop/prodotti OK.
- [ ] Login admin OK.
- [ ] Upload OK.
- [ ] Form + reCAPTCHA OK.
- [ ] Stripe test OK.
- [ ] Email test OK.
- [ ] Cron scheduler/automazioni OK.
- [ ] Log senza errori.
- [ ] Rollback DNS annotato e testato mentalmente.
- [ ] Vercel e Neon ancora attivi.
