# CRO — Pictures Writers

**Document version:** v1
**Last updated:** 2026-09-22
**Status:** Fase 5 della roadmap SEO

---

## 1. Contesto e funnel di conversione

**Traffico dominante:** 899 nuovi utenti/mese da organic search (blog), ~1.000 utenti unici/mese, 2.400 visualizzazioni/mese. Traffico "freddo" informativo che atterra su articoli e hub pages.

**Funnel attuale (mappato su codice):**

```
Blog post (awareness) → [widget newsletter bottom | popup prodotto | CTA inline nel corpo]
  → Ebook gratuito (lead magnet, form 1 campo)          [awareness]
  → Laboratorio/Corso (form → Stripe)                    [consideration]
  → Editing Double View (form submission → Stripe)       [decision]
Home (brand/nav) → 2 CTA (Editing / Corsi) + form contatti
Shop → categoria → prodotto → submission → Stripe checkout
```

**Azioni di conversione attuali (con evento GTM già tracciato):**
- `newsletter_signup` — widget newsletter bottom dei post
- `ebook_download` — modal ebook gratuiti (dettaglio prodotto + popup)
- `contact_form_submission` — form contatti homepage
- `submit_product_form` (gtmEventName dal form) — submission editing/corsi
- Checkout Stripe → pagamento (evento da verificare in GA4)

**Vincolo CRO:** i dati di conversione (tasso, revenue) non sono ancora disponibili → la fase 5 imposta la base di misurazione prima delle ottimizzazioni. I deliverable copy (fase 4) vanno applicati in CMS in parallelo; questo documento riguarda **struttura, CTA placement, trust e friction** delle pagine.

---

## 2. Audit pagina per pagina

### 2.1 Homepage

**Elementi esistenti:** Hero (H1 "Vuoi diventare uno sceneggiatore?" + mission) → Reviews → Servizi → Ultimi articoli → Contatti.

**Problemi di conversione:**
1. **Il lead magnet (ebook gratuito) è assente dalla homepage** — il blocco con la CTA all'ebook è commentato nel codice (`hero-section.tsx:39-50`). Per una piattaforma content-driven con traffico freddo organico, il primo lavoro dell'homepage è catturare l'email: è il nostro unico asset sempre-convertente (500+ download), ma non è visibile sopra la piega.
2. **Due CTA primarie identiche, nessuna gerarchia** — "Servizi di Editing" e "Corsi & Masterclass" sono entrambi `bg-foreground`, stesso peso visivo (`hero-section.tsx:53-60`). Il visitatore freddo non ha un'azione "sicura" a basso impegno.
3. **Copy hero mission-generico** — "alimentare la tua fiamma creativa" / "sceneggiatore di successo": parla di noi, non del problema del lettore. La promessa differenziante (Double View, percorso tutto-in-uno, gratis per iniziare) non c'è.
4. **Form contatti con 4 campi in fondo alla pagina** — obiettivo di conversione poco prioritario; compete con newsletter/lead magnet.
5. **"Ultimi articoli" → CTA "Scopri di più"** — bottone debole (parola vietata nel deck copy).

### 2.2 Pagine servizio/editing (high ticket)

**Elementi esistenti:** badge "Analisi Double View" + H1 + tagline citazione ("") + confronto prezzo vs media mercato + card "Pronto a iniziare?" (2 consulenti, 7-10 gg, supporto) + CTA "Contattaci" → submission. Poi: "Cosa Analizziamo" (features) + sample + FAQ. `ServiceInfo` è l'unico punto CTA (`service-info.tsx:116-129`).

**Problemi:**
1. **CTA "Contattaci"** — non comunica valore, non dice cosa ottieni. Il deck copy prescrive "Richiedi il parere sul tuo copione" / "Fai analizzare il tuo soggetto".
2. **Un solo CTA, solo in alto** — la pagina servizio è lunga (features + sample + FAQ) ma non ripete l'azione nel corpo né in fondo. Il webinar invece ha CTA sticky mobile (`WebinarBottomCta`), il servizio NO: su mobile il CTA sparirà dallo schermo per tutta la lettura.
3. **Prova sociale non sopra la piega** — "7 recensioni, media 5★" non compare vicino al prezzo/CTA: c'è solo il carosello `ProductReviews` più in basso (e solo se il prodotto ha recensioni). Il prezzo è un punto di ansia; l'ancora di fiducia va lì.
4. **Nessun risk reversal / garanzia** — l'obiezione "e se non è utile?" resta senza risposta (nel product-marketing le obiezioni esistono ma non sono materializzate sulla pagina prodotto).
5. **Nessuna "cosa ricevi" esplicita** — il sample c'è (`ServiceSample`), ma "report PDF + punti di forza + criticità + tempi" è promesso nel deck, non garantito in UI strutturata.

### 2.3 Pagina ebook (lead magnet)

**Elementi esistenti:** badge "Scaricato più di 500 volte" + prezzo + descrizione + form 1 campo in modal ("Scarica con 1-Click"). Flusso pulito e a bassa frizione.

**Problemi minori:**
1. **Bottone "Close" in inglese** nella modal (`free-ebook-modal.tsx:180`) — incoerenza di lingua.
2. **Micro-copy CTA** ("Scarica con 1-Click" vs "Scarica l'ebook gratuito") — da A/B testare (il secondo dichiara valore = gratis).
3. **Modal priva di CTA secondaria** — dopo il download nessun next step verso corso/editing.

### 2.4 Blog post (hub + spoke)

**Elementi esistenti:** sidebar con widget per categoria, widget bottom (autori → newsletter → tag in ordine admin), popup prodotto auto-open (`WidgetProductPop`, `if(true)` + localStorage 24h), CTA inline nel corpo (fase copy, da applicare).

**Problemi:**
1. **Widget newsletter = copy generico e bottone "Iscriviti"** — il deck copy (§8) ha il testo e il bottone pronti ("Sì, voglio scrivere meglio"); testo hardcoded nel componente.
2. **Popup time-based su tutti i post** — `if(true)` forza il popup dopo `autoOpenDelay` su ogni articolo (max 1×/24h per utente). Rischio anneoiamento + mancata conversione se scatta quando il lettore non è interessato. Da testare trigger alternativi (scorrimento, exit-intent) e target solo post awareness.
3. **Nessun "articoli correlati"** — dopo l'articolo il lettore ha solo newsletter/tag; il deep-linking interno (strategia content-strategy §6) è un lever di engagement non sfruttato in UI.
4. **CTA finale del post** — tolto il fatto che dipende dal CMS; assicurare che i finali "spero ti sia stato utile" siano sostituiti (checklist copy §9).

### 2.5 Pagine hub (category blog)

Struttura basata su widget sidebar + paginazione. Il CTA principale su pagine elenco/category dovrebbe essere un banner newsletter/lead magnet in cima o sotto l'header, non solo in sidebar (perimetro mobile).

---

## 3. Quick Wins (implementare subito, basso sforzo)

| # | Intervento | Dove | Tipo | Effetto atteso |
|---|-----------|------|------|----------------|
| 1 | Riaprire la CTA **ebook gratuito** nell'hero della homepage (blocco già commentato), testo dal deck copy: "Scarica l'ebook gratuito" → `/shop/ebooks/introduzione-alla-sceneggiatura/` | `hero-section.tsx` | Codice | +lead (email) da traffico diretto/brand |
| 2 | CTA servizio: **"Contattaci" → "Richiedi il parere sul tuo copione"** (o "Fai analizzare il tuo soggetto" per i soggetti) | `service-info.tsx:122-123` | Codice | +CTR su CTA principale |
| 3 | Aggiungere **sintesi rating (media ★5 su 7 recensioni)** accanto al prezzo nella card servizio (aggregateRating esiste già nei dati) | `service-info.tsx` | Codice | riduce ansia sul prezzo |
| 4 | Widget newsletter: testo nuovo + bottone **"Sì, voglio scrivere meglio"** e messaggio successo personalizzato (deck copy §8) | `newsletter.tsx` | Codice | +subscribe da post |
| 5 | Modal ebook: **"Close" → "Chiudi"**, valutare CTA secondaria post-download | `free-ebook-modal.tsx:180` | Codice | coerenza lingua |
| 6 | Popup blog: impostare `actionType = FILL_FORM` sul widget (rootId ebook), `autoOpenDelay` più alto (es. 15-20s) e verificare che sia attivo SOLO su post awareness in admin | `widget` admin + `product-pop.tsx` | CMS | meno friction percepita, conversioni più qualificate |
| 7 | Hub/category blog: banner **lead magnet/email** sotto l'header, in cima alla lista (non solo sidebar) | admin/template | CMS | +capture su traffico elenco |

---

## 4. High-Impact Changes (priorità a medio termine)

1. **CTA sticky mobile per i servizi di editing** — replicare `WebinarBottomCta` (fisso in basso su mobile) sulle pagine servizio: prezzo + "Richiedi il parere". È il passaggio ad alto valore; oggi su mobile il CTA esce dallo schermo.
2. **Ripetere il CTA a metà e fine della pagina servizio** — dopo "Cosa Analizziamo" e dopo le FAQ: "Pronto? Richiedi il parere sul tuo copione". Il percorso di lettura lungo deve sempre scontrarsi con un'azione.
3. **Homepage: gerarchia CTA + messaggio matching**
   - Primaria (lead): "Scarica l'ebook gratuito" → ebook
   - Secondarie: "Scopri l'editing Double View", "Guarda i corsi"
   - Oppure hero con doppia via "Sono alle prime armi / Ho già un copione" (segmentazione per intent) — da testare.
4. **Blocco "Cosa ricevi esattamente"** sul servizio (report Double View, cosa contiene, tempi, cosa NON include, se revisione) — rassicurazione prezzo. Il sample c'è: estrarlo in vista con 2-3 screenshot di esempio.
5. **Risk reversal sulla pagina servizio** — una riga garanzia/fiducia: "Prezzo sotto la media del mercato, confronto esplicito sulla pagina" (già presente) + eventuale "se il report non ti è utile, ti aiutiamo ad applicarlo" (supporto post-consegna già citato → da rendere una mini-garanzia).
6. **Articoli correlati in fondo al post** — widget "Potrebbe interessarti" (stessa categoria/hub) per alimentare il deep-linking della content-strategy e aumentare profondità sessione.
7. **Funnel anti-abbondono checkout** — oggi editing e corsi hanno un form submission *prima* del checkout Stripe con campi gestiti da admin. Ridurre i campi all'essenziale e mostrare il riepilogo (già presente) sopra il fold: quantità di campo = attrito diretto su transazioni da ed abs.

---

## 5. Test Ideas (ipotesi da verificare, non assumere)

| # | Ipotesi | Variante A (control) | Variante B | Metrica |
|---|---------|----------------------|------------|---------|
| T1 | Il lead magnet in hero supera la doppia CTA pagata | Hero: 2 CTA pagate (attuale) | Hero: CTA ebook primaria + 1 secondaria | `newsletter_signup` / `ebook_download` da homepage |
| T2 | La CTA esperienziale batte quella funzionale | "Contattaci" | "Richiedi il parere sul tuo copione" | Click su CTA (evento custom) |
| T3 | La prova sociale sopra la piega riduce ansia prezzo | Card senza rating | Card con "★5 su 7 recensioni" | Click CTA / avvio submission |
| T4 | Popup a tempo vs trigger scroll sul blog | Popup time-based (attuale) | Popup dopo 50% scroll post | `newsletter_signup` + bounce |
| T5 | "Scarica con 1-Click" vs "Scarica l'ebook gratuito" | 1-Click | "Scarica l'ebook gratuito" | Click → download completati |
| T6 | CTA sticky mobile sui servizi di editing | Nessuna CTA sticky | CTA sticky bottom | Click CTA mobile |

**Regola di esecuzione:** 1 test alla volta per pagina, basare su traffico organico, durata 2-4 settimane, confrontare con evento GTM esistente (mai pagina totali). Le varianti headline delle hub sono già nel deck copy (§3.6, §4.2).

---

## 6. Base di misurazione (prerequisito CRO)

Prima di ottimizzare, garantire la catena di misurazione (oggi i singoli eventi esistono):

1. **Funnel GA4:** `newsletter_signup` / `ebook_download` → `submit_product_form` → `checkout started` → `purchase` (verificare che i passi Stripe emettano eventi GA4; se assenti, aggiungerli).
2. **Evento custom click CTA** sulle pagine servizio (per test T2/T3): `cta_click` con `cta_id`/`page`.
3. **Dashboard mensile**: CTR hub da GSC (prima/dopo copy), tasso `newsletter_signup` per pagina, download ebook, submission, conversione submission→pagamento.
4. **Baseline 30 giorni** prima di muovere gli switch big (hero, sticky CTA).

---

## 7. Priorità di esecuzione (30 giorni)

**Settimana 1-2 (Quick Wins):**
1. Ebook CTA in hero (QW1) + gerarchia CTA homepage (HIC3 parziale)
2. CTA servizio riscritto (QW2) + rating sopra la piega (QW3)
3. Newsletter widget nuovo copy/bottone (QW4) + modal fixes (QW5)
4. Popup admin config corretto (QW6)

**Settimana 3-4 (High-Impact):**
5. CTA sticky mobile servizi (HIC1) + ripetizione CTA mid/fine pagina (HIC2)
6. "Cosa ricevi esattamente" sul servizio (HIC4) + risk reversal (HIC5)
7. Articoli correlati (HIC6)
8. Verifica funnel GA4 + prima baseline (Sez. 6)

**Dopo (dipende dai risultati):** test A/B T1-T6 selezionati dai dati della baseline.

---

## 8. Consegne condivise con altre fasi

- **Copy (fase 4):** i micro-copy CTA di questo documento usano le stesse formule del deck copy. Da applicare in CMS in parallelo (checklist copy §9).
- **Content (fase 3):** gli "articoli correlati" (HIC6) implementano la regola internal linking §6 della content strategy.
- **Schema/ai-seo (fasi 6/8):** l'`aggregateRating` esposto da `ProductJsonLd` è la stessa fonte del rating che consigliamo in UI (QW3) — coerenza rich snippet ↔ pagina.

---

## Changelog
- v1 (2026-09-22) — Audit CRO pagine (home, servizio, ebook, blog, category), quick wins, high-impact, test ideas, base di misurazione GA4.

### Note implementazione (2026-09-22)
- **Ebook CTA in hero (QW1):** implementato e mantenuto. Hero confermata nella versione "lead magnet" che raccoglie email (paragrafo ebook + botten "Vai all'Ebook" → `/shop/ebooks/introduzione-alla-sceneggiatura/`, testo + `size="lg"`). La hero resta intatta per non disturbare la raccolta email.
- **Anchor verso le recensioni (hero):** aggiunto in fondo alla hero, centrato, come badge "Cosa dicono i nostri studenti" + `ChevronDownCircleIcon` animate-bounce → `#testimonianze` (anchor nativo, senza smooth: accettato). Terminologia allineata all'H2 della sezione reviews.
- **Recensioni (reviews-section.tsx):** corretti gli errori ESLint `react/no-unescaped-entities` sulla citazione d'apertura (virgolette → `&ldquo;`/`&rdquo;`). Lint pulito su tutta la home.
- **Percorso a pagamento in home (HIC3):** i link a laboratori/corsi e consulenze di editing NON stanno più nella hero (rimossi per scelta). È stata aggiunta una **CTA band a tutta larghezza subito dopo le recensioni** (`src/app/(home)/_components/services-cta.tsx`): sfondo scuro per marcare il momento "decision", due card (Editing Double View → `/shop/servizi-di-editing/`; Laboratori & Corsi → `/shop/corsi-di-sceneggiatura/`). **Decisione di gerarchia:** Editing a sinistra con CTA piena ("Richiedi il parere sulla tua storia"), Corsi a destra in outline ("Scopri i laboratori") — Editing resta il servizio di punta (metodo Double View); swap valutato e scartato per coerenza con "I nostri servizi" e con la priorità di business. Il terzo blocco in "I nostri servizi" (stesse CTA) resta come percorso secondario in fondo.
- **Struttura home attuale:** Hero (lead magnet + anchor recensioni) → Reviews (trust) → CTA band (consideration/decision) → I nostri servizi (editoriale) → Ultimi articoli → Contatti.
- **QW2 — CTA servizio riscritta:** `service-info.tsx` "Contattaci" → **"Richiedi il parere sulla tua storia"** (variazione del deck per l'oggetto utente). Rimosso anche l'hover `bg-primary-foreground` dal bottone.
- **QW5 — modal ebook:** "Close" → **"Chiudi"** in `free-ebook-modal.tsx`.
- **QW4 — widget newsletter (`src/shared/components/widget/newsletter.tsx`):** applicato il copy del deck §8 — box "Entra nella community di sceneggiatori… strumenti concreti per scrivere meglio" + 3 bullet (guide/concorsi/laboratori), bottone **"Sì, voglio scrivere meglio"**, messaggio successo personalizzato ("Benvenuto a bordo! Controlla la tua inbox…"). Sistemato anche il warning `no-unused-vars` (`catch (_error)`). **Remainder CMS:** label §8.1 ("Strumenti settimanali per sceneggiatori") è configurabile da admin, da aggiornare nei widget del blog.
- **QW3 (rating ★5 su 7 vicino al prezzo):** posticipato — decisione esplicita, da fare più avanti.
- **Lint:** corretti errori `react/no-unescaped-entities` residuali su `service-info.tsx` (Analisi "Double View" + tagline) e warning `no-unused-vars` su `free-ebook-modal.tsx` (`catch (_error)`). Tutti i file toccati ora passano `npm run lint`.
- **HIC1 — CTA sticky mobile servizi (2026-09-23):** `WebinarBottomCta` rinominato in **`ProductBottomCta`** e spostato in `_components/product-bottom-cta.tsx` (condiviso tra webinar e servizi). `Service` ora riceve `discountedPrice` e `acquisitionMode` (già passati da `page.tsx`), renderizza la barra fissa mobile con CTA **"Richiedi la tua analisi"** → `submission`. Aggiunto `pb-24 lg:pb-0` al wrapper per non coprire il footer su mobile (stesso pattern di `submission`/`pb-28`) e `whitespace-nowrap` sui bottoni per evitare overflow su schermi piccoli.
- **HIC2 — CTA ripetuta mid/fine servizio (2026-09-23):** nuovo componente client **`ServiceCtaBand`** (`service/service-cta-band.tsx`): band scura con H2 "Pronto? Richiedi la tua analisi", posizionata dopo "Cosa Analizziamo" (variant `mid`) e in fondo dopo le FAQ (variant `final`, con riga rassicurazione 2 consulenti / 7-10 gg / supporto post-consegna). Emette evento GTM **`cta_click`** con `cta_id: "service_mid_cta" | "service_final_cta"` → base di misurazione Sez. 6 avviata. La band finale è sempre renderizzata (anche senza FAQ).
- **Homepage — gerarchia CTA invertita (2026-09-23):** in `services-cta.tsx` **Laboratori & Corsi ora è la CTA primaria** (sinistra, bottone pieno), Editing Double View secondaria (destra, outline). Motivo: conversione corsi 13:1 vs editing (decisione strategica, da confermare con split revenue in GA4). Copy intro riordinata di conseguenza ("Un'idea da portare fino in fondo, oppure una storia che aspetta già un'analisi").
- **Copy CTA editing uniformata (2026-09-23):** sostituita ovunque **"Richiedi il parere sulla tua storia" → "Richiedi la tua analisi"** (scelta utente: "parere" passivo, CTA lunga per lo sticky mobile; coincidente con il brand "Analisi Double View"). Applicata a `service-info`, `ServiceCtaBand` (H2/button/`cta_label`), sticky mobile e card editing di home. Rimosso anche "parere" dalle descrizioni testuali (`services.tsx`, `services-cta.tsx`: "un'analisi unica", "L'analisi di due consulenti").