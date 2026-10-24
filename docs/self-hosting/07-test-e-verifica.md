# 07 — Collaudo funzionale completo

Questa è la checklist che risponde alla domanda: **"funziona tutto come prima?"**

Eseguila due volte:

1. **Fase A** su `https://staging.<DOMAIN>` con database Neon branch.
2. **Fase B** su `https://<DOMAIN>` dopo il cutover DNS (ancora con Neon).

Ripeti almeno le sezioni 1–8 dopo la fase C (database locale).

> Usa un account admin di test e, dove possibile, dati di test. Non cancellare contenuti reali. Le prove distruttive vanno fatte solo sul branch Neon, non sulla produzione.

---

## 0. Infrastruttura

- [x] `https://<DOMAIN>/` risponde **200** (non 502/503/504).
- [x] Certificato valido, issuer Let's Encrypt, nessun warning.
- [x] `http://` reindirizza a `https://`.
- [x] `www` reindirizza al canonical corretto (o viceversa).
- [x] Coolify mostra l'app **Healthy**.
- [x] Log runtime senza errori ripetuti.
- [x] `docker stats` mostra RAM stabile (non in crescita continua).
- [x] `df -h /` ha spazio libero.
- [x] Il DB è raggiungibile dall'app.
- [x] `npx prisma migrate status` è pulito.
- [x] Il backup notturno è configurato e l'ultimo è **Success**.

---

## 1. Sito pubblico — base

- [x] Home: hero, navbar, footer, immagini, font.
- [x] Menu di navigazione: tutte le voci funzionano.
- [x] Ricerca (se presente) restituisce risultati.
- [x] Pagina 404 personalizzata.
- [x] Pagina 500 non esposta (test controllato).
- [x] `robots.txt` risponde e contiene `Sitemap:`.
- [x] `sitemap.xml` risponde, è XML valido, contiene URL assoluti corretti.
- [x] `llms.txt` e `llms-full.txt` rispondono.
- [x] JSON-LD Organization/WebSite nella home (controlla il sorgente).
- [x] Canonical URL corretto.
- [x] Open Graph/Twitter card presenti.
- [x] Google Tag Manager carica (Tag Assistant / DevTools Network).
- [x] Nessun errore CORS in console.
- [x] Console browser senza errori JavaScript bloccanti.

### 1.1 Redirect

- [x] `/sitemap-0.xml` → `/sitemap.xml` (301).
- [x] `/ebooks/...` → `/shop/ebooks/...` (301).
- [x] `/concorso-tre-colori-2025/` → `/concorso-tre-colori-2026/` (301).
- [x] URL senza trailing slash → con trailing slash (o redirect coerente).
- [x] `/assets/:id` serve il file da UploadThing (immagine/PDF).

---

## 2. Blog

- [x] Lista blog: paginazione, immagini, categorie, tag.
- [x] Categoria: elenco corretto.
- [x] Tag: elenco corretto.
- [x] Articolo: titolo, contenuto TipTap, immagini, embed YouTube, tabelle, link.
- [x] Articolo con autore: nome, avatar, bio.
- [x] Data di pubblicazione corretta (timezone Europe/Rome).
- [x] Articolo schedulato non visibile prima dell'ora.
- [x] Bozza accessibile solo agli admin (o via draft mode).
- [x] Contenuti correlati / latest news in home.
- [x] `revalidatePath` dopo modifica: la pagina si aggiorna senza rebuild.

---

## 3. Pagine CMS (Puck)

- [x] Una pagina statica esistente si apre.
- [x] Tutti i blocchi Puck renderizzano (testo, immagini, CTA, gallerie, embed).
- [x] Immagini da UploadThing visibili.
- [x] Link interni ed esterni funzionano.
- [x] Pagina con slug nuovo creata e pubblicata: raggiungibile subito (`dynamicParams`).
- [x] Modifica di un blocco: la pagina si aggiorna dopo il salvataggio/publish.
- [x] Pagina non pubblicata non accessibile.
- [x] SEO della pagina (title, description, OG) corretti.

---

## 4. Autenticazione e admin

- [x] Login con email/password funziona.
- [x] Logout funziona.
- [x] Sessione persistente dopo refresh e riavvio del browser.
- [x] Cookie `Secure`, `HttpOnly`, `SameSite` corretti (DevTools → Application → Cookies).
- [x] Password errata → messaggio corretto, nessun leak.
- [x] Reset password: email ricevuta, link funzionante, nuova password accettata.
- [x] Utente non autenticato su `/admin` → redirect al login.
- [x] Utente senza permessi non vede sezioni vietate.
- [x] Invito utente: email, accettazione, creazione utente.
- [x] Disattivazione utente: non può più fare login.
- [x] Activity log registra le azioni.
- [x] 2FA admin (se configurato) funziona.

> Se le sessioni create su Vercel devono restare valide, il dominio e `BETTER_AUTH_SECRET` devono essere gli stessi. Con lo stesso DB e lo stesso dominio, i cookie continuano a funzionare.

---

## 5. Contenuti e versioning

- [x] Creazione nuovo post (root + versione).
- [x] Salvataggio bozza.
- [x] Anteprima.
- [x] Pubblicazione immediata.
- [x] Modifica di un post pubblicato → nuova versione.
- [x] Ripristino di una versione precedente.
- [x] Cambio slug: redirect/gestione corretta.
- [x] Categorie e tag: assegnazione, creazione, modifica, cancellazione.
- [x] SEO per post/categoria/tag/pagina/prodotto.
- [x] Immagine di copertina.
- [x] Autori multipli.

### 5.1 Scheduling

- [ ] Creazione di un post schedulato a +2 minuti.
- [ ] Il post non è visibile prima.
- [ ] Chiamata manuale:

  ```bash
  curl -i -X POST https://<DOMAIN>/api/scheduler/run/ \
    -H "x-scheduled-publication-secret: <SCHEDULED_PUBLICATION_SECRET>"
  ```

  Deve rispondere **200** e riportare l'azione processata.
- [ ] Il post risulta pubblicato.
- [ ] La pagina pubblica si aggiorna (revalidate).
- [ ] Il cron reale (cron-job.org) ha girato nell'intervallo previsto (log).

---

## 6. Media e UploadThing

- [x] Upload immagine dal media manager.
- [x] Upload PDF.
- [x] Limiti di dimensione rispettati (4 MB immagini, 16 MB PDF).
- [x] Anteprima immagine.
- [x] Modifica alt text / nome.
- [x] Cancellazione singola.
- [x] Cancellazione multipla (bulk).
- [x] Il file cancellato non è più raggiungibile.
- [x] L'URL `/assets/:id` funziona.
- [x] Le immagini di copertina/hero usano il blur placeholder letto da `Media.metadata`, senza errori nei log e senza `sharp` nel render.
- [x] Upload da un form pubblico (submission).
- [x] Upload di un allegato email (composer).

> Se il dominio di staging è diverso, verifica che UploadThing consenta l'origine. In caso di errore CORS/403, aggiungi il dominio nelle impostazioni dell'app UploadThing.

---

## 7. Form e reCAPTCHA
46938513-3ca0-49ba-b42a-462abf22e5d6
- [x] Form contatti: invio, validazione, messaggio di successo.
- [x] reCAPTCHA v3: token generato, verifica server-side con score ≥ 0.7.
- [x] Form newsletter: iscrizione, email di conferma (se Double Opt-In).
- [x] Unsubscribe: link funzionante, contatto aggiornato.
- [x] Form di submission prodotto: upload + invio.
- [x] Form builder: form pubblicato, invio, salvataggio submission.
- [x] Notifica admin / email di conferma.
- [x] Submission visibile in admin.
- [x] Export/lettura submission.
- [x] Rate limiting/antispam (se presente) non blocca utenti legittimi.

> Se stai testando su staging, la key reCAPTCHA potrebbe rifiutare il dominio. Aggiungi `staging.<DOMAIN>` ai domini autorizzati della key oppure testa i form dopo il cutover DNS.

---

## 8. Shop e Stripe

### 8.1 Catalogo

- [x] Categoria prodotto.
- [x] Prodotto ebook: dettaglio, prezzo, copertina, FAQ, descrizione TipTap.
- [x] Prodotto webinar: data, ora, timezone, informazioni.
- [x] Prodotto servizio.
- [x] Recensioni: visualizzazione, invio, moderazione.
- [x] Prodotti correlati.
- [x] JSON-LD Product/Event/Course valido.

### 8.2 Checkout hosted

- [x] Click su acquisto → redirect a Stripe Checkout.
- [x] `success_url` e `cancel_url` puntano al dominio corretto.
- [x] Pagamento con carta di test (solo se Stripe è in test mode).
- [x] Webhook `checkout.session.completed` ricevuto (Stripe Dashboard → Webhooks → eventi).
- [x] Record `Purchase` creato.
- [x] Email di acquisto inviata.
- [x] Download ebook funzionante.
- [x] Accesso al contenuto sbloccato.

### 8.3 Checkout embedded

- [x] Il form embedded si carica.
- [x] `return_url` corretto.
- [x] Pagamento completato.
- [x] Webhook e `Purchase` creati.

> **In produzione Stripe è live:** non usare la carta 4242. Crea un prodotto di test da €1, acquista, verifica e rimborsa. Oppure configura chiavi/test webhook su staging. Non testare con importi reali alti.

### 8.4 Webhook

```bash
# Verifica che l'endpoint risponda (senza firma valida otterrai 400, è normale)
curl -i -X POST https://<DOMAIN>/api/webhooks/stripe/ -H "Content-Type: application/json" -d '{}'
```

- [x] Stripe Dashboard mostra l'endpoint come **Enabled**.
- [x] Gli eventi recenti hanno risposta **200**.
- [x] Il signing secret corrisponde a `STRIPE_WEBHOOK_SECRET`.

---

## 9. Email in uscita

- [x] Email di reset password.
- [x] Email di invito.
- [x] Email di acquisto webinar/ebook.
- [x] Email di conferma form/newsletter.
- [x] Template con variabili Handlebars renderizzate.
- [x] Immagini e link nelle email puntano al dominio corretto.
- [x] Header `From`, `Reply-To`, `List-Unsubscribe` corretti.
- [x] Nessun finire in spam (controlla authentication SPF/DKIM/DMARC).
- [x] Log SendGrid/Resend mostrano consegna.

> La configurazione del provider è **nel database**, non nelle env:
> - **SendGrid**: `EmailSetting.emailApiKey` (Admin → Email Settings);
> - **Resend**: riga `Integration` (Admin → Integrations), cifrata con `SECRETS_ENCRYPTION_KEY`.
>
> `NEXT_SENDGRID_KEY`, `NEXT_RESEND_KEY` e `NEXT_RESEND_WEBHOOK_SECRET` non sono la fonte usata a runtime. Se il provider risulta "not configured" o le credenziali non si decifrano, reinseriscile dalla UI. Non basta copiare le env.

---

## 10. Email inbound e conversazioni

- [x] Invia un'email all'indirizzo configurato su Resend.
- [x] Il webhook Resend risponde **200**.
- [x] La conversazione appare in **Admin → Inbox**.
- [x] Il corpo dell'email è leggibile.
- [x] Gli allegati vengono copiati su UploadThing e sono scaricabili.
- [x] La risposta dall'inbox viene inviata.
- [x] Lo stato letto/non letto funziona.
- [x] Assegnazione/permessi per account email.
- [x] Un'email con allegato grande (entro i limiti) funziona.

---

## 11. Email marketing

- [x] Creazione audience.
- [x] Import contatti (CSV/API).
- [x] Sincronizzazione contatti.
- [x] Creazione template (editor email).
- [x] Anteprima template.
- [x] Invio test.
- [x] Single send a un'audience di test.
- [x] Log invii.
- [x] Unsubscribe.
- [x] Schedulazione di un single send + esecuzione via scheduler.
- [x] Statistiche/eventi provider (se configurati).

---

## 12. Automazioni

- [x] Creazione automazione con trigger manuale.
- [x] Aggiunta nodi (azione email, HTTP request, conditional, wait, ecc.).
- [x] Publish della versione.
- [x] "Run now": il run parte, gli step si eseguono.
- [x] Wait: il run resta `RUNNING` e riprende dopo il tempo previsto.
- [x] Trigger cron: enqueued al tick successivo.
- [x] Trigger webhook:

  ```bash
  curl -i -X POST https://<DOMAIN>/api/automations/webhook/<AUTOMATION_ID>/ \
    -H "x-automation-secret: <SEGRETO>" \
    -H "Content-Type: application/json" \
    -d '{"test":true}'
  ```

- [x] Esecuzione manuale del pump:

  ```bash
  curl -i -X POST https://<DOMAIN>/api/automations/run/ \
    -H "x-scheduled-publication-secret: <SCHEDULED_PUBLICATION_SECRET>"
  ```

- [x] Run/step visibili in admin con stato corretto.
- [x] Retry su errore transitorio.
- [x] Idempotenza email (nessun doppio invio).
- [x] Credenziali/ integrazioni usate dai nodi funzionano.

> Il pump di sviluppo (`AUTOMATIONS_DEV_PUMP`) è disattivato in produzione. Se i run restano `PENDING`, il cron non sta chiamando l'endpoint o il secret è errato.

---

## 13. Pubblicità, widget, dashboard

- [x] Campagne ads: creazione, blocchi, item, ordinamento.
- [x] Gli annunci renderizzano nelle posizioni pubbliche.
- [x] Widget: creazione, configurazione, rendering.
- [x] Dashboard admin: widget, layout, contatori.
- [x] Notifiche admin.
- [x] Impostazioni globali: nome sito, logo, social, script, timezone.
- [x] Lingue.
- [x] Activity log.

---

## 14. SEO e metadati

- [x] `Settings.siteUrl` è il dominio di produzione (non staging).
- [x] `sitemap.xml` contiene solo URL del dominio corretto.
- [x] `robots.txt` non blocca il sito.
- [x] Canonical su home, blog, prodotto, pagina.
- [x] `hreflang` (se presente) corretto.
- [x] JSON-LD valido (Rich Results Test).
- [x] OG image raggiungibile.
- [x] 404 restituisce status 404 (non 200).
- [x] Redirect 301/308 corretti.
- [x] Nessun mixed content (HTTP su pagina HTTPS).

---

## 15. Sicurezza

- [x] `https://<DOMAIN>/api/database/backup/` **non** scarica dati senza autenticazione (oggi lo fa: vedi §15.1).
- [x] Le API admin rispondono 401/403 senza sessione.
- [x] `/admin` non è indicizzato.
- [x] Il DB non è raggiungibile da Internet (`nmap`/`nc` sulla porta 5432).
- [x] Coolify dashboard su HTTPS, 2FA attivo, registrazione chiusa.
- [x] Porte 8000/6001/6002 chiuse.
- [x] SSH solo chiave, password disabilitata.
- [x] fail2ban attivo.
- [x] Firewall Hetzner attivo.
- [x] Nessun segreto nei log o nel repo.
- [x] `.env.production` non committato.
- [x] UploadThing token non esposto al client.
- [x] Header di sicurezza (CSP/HSTS) presenti o consapevolmente assenti.

### 15.1 Correzione consigliata

`src/app/api/database/backup/route.ts` è pubblico. Prima del cutover:

- rimuovilo, oppure
- aggiungi `authAdmin()` e limita ai soli admin, oppure
- proteggilo con un secret header.

È un problema preesistente, ma sulla VPS è ancora più visibile. Essendo un `GET` senza `dynamic`, potrebbe anche essere **prerenderizzato** durante `next build`: in quel caso l'output statico conterrebbe dati del DB. Se non lo rimuovi, aggiungi almeno `export const dynamic = "force-dynamic"` e l'autenticazione, poi ricostruisci.

---

## 16. Performance

- [x] TTFB home < 500 ms (da Europa).
- [x] LCP < 2,5 s su 4G simulated.
- [x] CLS < 0,1.
- [x] INP < 200 ms.
- [x] Le pagine ISR sono servite dalla cache (secondo hit più veloce).
- [x] `revalidatePath` invalida correttamente.
- [x] Il DB risponde in < 20 ms per query semplici.
- [x] RAM del container stabile dopo 30 min.
- [x] Nessun memory leak evidente (grafici Coolify).
- [x] Build non ucciso da OOM.

Confronto:

```bash
for i in 1 2 3; do
  curl -o /dev/null -s -w "run=$i ttfb=%{time_starttransfer} total=%{time_total}\n" https://<DOMAIN>/
done
```

---

## 17. Backup e restore (test reale)

- [x] Il backup schedulato è partito.
- [x] Il file su S3 esiste ed è > 0.
- [x] Scarica il file e ripristinalo in un DB usa-e-getta.
- [x] L'app in staging punta al DB ripristinato e funziona.
- [x] Cancella il DB di test.
- [x] Annota data, dimensione e durata del restore nel runbook.

---

## 18. Firma del collaudo

| Area | Esito | Note | Data |
|---|---|---|---|
| Infrastruttura | ☐ OK ☐ KO | | |
| Sito pubblico | ☐ OK ☐ KO | | |
| Blog | ☐ OK ☐ KO | | |
| Pagine Puck | ☐ OK ☐ KO | | |
| Auth/admin | ☐ OK ☐ KO | | |
| Contenuti/versioning | ☐ OK ☐ KO | | |
| Media/UploadThing | ☐ OK ☐ KO | | |
| Form/reCAPTCHA | ☐ OK ☐ KO | | |
| Shop/Stripe | ☐ OK ☐ KO | | |
| Email outbound | ☐ OK ☐ KO | | |
| Email inbound | ☐ OK ☐ KO | | |
| Email marketing | ☐ OK ☐ KO | | |
| Automazioni | ☐ OK ☐ KO | | |
| Ads/widget/dashboard | ☐ OK ☐ KO | | |
| SEO | ☐ OK ☐ KO | | |
| Sicurezza | ☐ OK ☐ KO | | |
| Performance | ☐ OK ☐ KO | | |
| Backup/restore | ☐ OK ☐ KO | | |

**Regola:** se una voce critica è KO, non passare alla fase successiva. Le voci non critiche (es. un widget raro) si possono correggere dopo, ma vanno annotate.
