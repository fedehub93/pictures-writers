# Email Marketing — Pictures Writers

**Document version:** v1
**Last updated:** 2026-09-23
**Status:** Fase 7 della roadmap SEO

---

## 1. Obiettivo di questa fase

Progettare il programma email di Pictures Writers: le sequence automatizzate che nutrono i lead dal primo contatto (blog → lead magnet) allo **store**: laboratorio/corso (consideration) e editing Double View (decision), più la cadenza newsletter e un flusso di re-engagement.

Fonte del contesto: `.agents/product-marketing.md` (audience, obiezioni, proof points), `.agents/content-strategy.md` (funnel, lead magnet), `.agents/copywriting.md` (CTA e copy già validati), `.agents/cro.md` (misurazione evento).

**Regole applicate (skill emails):**
- Una email, un lavoro: un CTA primario per email
- Valore prima della richiesta: i CTA commerciali arrivano dopo 2-3 email di valore
- Rilevanza > volume: la lista è ~800 iscritti → sequence corte e segmentate, meglio di tante email deboli
- Ogni email muove il percorso: link utili che approfondiscono il funnel (blog → ebook → corso → editing)

**Proof points utilizzabili (verificati, da product-marketing):** 800+ iscritti newsletter · 500+ download ebook gratuito · 7 recensioni media 5★ · metodo Double View (due consulenti che analizzano in modo indipendente) · consegna 7-10 giorni lavorativi · prezzo sotto la media del mercato (da €50 per un soggetto · laboratorio €200).

**Vincolo:** niente statistiche inventate; nessuna recensione/testimonianza non verifica esistente in piattaforma.

---

## 2. Stato dell'infrastruttura (cosa esiste già)

Mappato sul codice il 2026-09-23:

| Pezzo | Stato | File/modello |
|-------|-------|-------------|
| Email trans. subscription (doppio opt-in "soft") | ✅ | `mail.ts::sendSubscriptionEmail`, template configurato in `EmailSetting.subscriptionTemplateId` |
| Email trans. ebook gratuito (delivers lead magnet) | ✅ | `mail.ts::sendFreeEbookEmail`, `freeEbookTemplateId` |
| Email trans. acquisto webinar | ✅ | `mail.ts::sendWebinarPurchaseEmail`, `webinarTemplateId` |
| Template HTML (design nel admin Editor + bodyHtml, merge Handlebars) | ✅ | `EmailTemplate` (`designData` Json + `bodyHtml`) |
| Broadcast/campagne una-tantum | ✅ | `EmailSingleSend` + `EmailAudience` (segmenti sincronizzati su Resend, `externalId`) |
| Scheduling (post + single send) | ✅ | `ScheduledAction` + `scheduler-runner` + handler `SEND_EMAIL` (`EMAIL_SINGLE_SEND`) |
| Contatti + interazioni (segmentazione) | ✅ | `EmailContact`, `EmailContactInteraction` (unique per tipo per contatto) |
| Sync provider | ✅ | ResendAdapter (`createContactOnProvider`, sync audience/contatti) |
| **Sequence automatizzate multi-step** | ✅ | Motore **Automations** interno (`Automation` / `AutomationRun` / `AutomationRunStep`, canvas + trigger a evento, ADR-0004, `docs/automations.md`); **S1 pubblicata** su questo motore |
| Trigger eventi interni (download ebook / conferma iscrizione) | ✅ | `emitFormSubmitted` (form built-in ebook) e `emitSubscriptionConfirmed` → `enqueueEventRuns` (`src/modules/*/automations/emit.ts`) |
| Cron server-side (scheduler + automations pump) | ✅ | `/api/scheduler/run/` + `/api/automations/run/` via cron-job.org (`docs/automations.md`) |

**Interazioni oggi tracciate** (chiavi di segmentazione disponibili):
- `user_subscribed` — iscrizione newsletter **confermata** (impostata alla conferma via email, non alla richiesta dal widget)
- `ebook_downloaded` — download ebook gratuito (lead magnet)
- `webinar_purchased` — acquisto webinar
- `submit_product_form` — submission form corso/editing (senza dettaglio prodotto: gap)
- `submit_form` / `contact_requested` — form generici / contatti

**Nota doppio opt-in:** ✅ è ora un **gate reale**. `createContactByEmail` non imposta più `emailVerified` alla creazione (per nessun flusso); `newSubscription` (`src/actions/new-subscription.ts`) consuma il token di conferma, imposta `emailVerified`, aggiunge l'interazione `user_subscribed`, notifica l'admin ed emette il trigger interno `subscription.confirmed` **solo alla prima conferma** del contatto. `subscribe.ts` invia la mail di conferma e mantiene l'emit `form.submitted` come segnale di *richiesta* (non di iscrizione confermata). Vedi ADR-0007.

---

## 3. Mappa del programma email (funnel → sequence)

```
Blog / SERP (freddo)
  → widget newsletter ────────────────┐
  → lead magnet ebook (form 1 campo) ─┴─► S2: Welcome newsletter (4 email)
                                       ou ► S1: Nurture post-ebook (7 email)  [high intent]
                                             │
  Feedback gratuito (micro-commitment) ◄─────┤ (E4 — attrezzo intermedio, costo 0)
  Corso/Laboratorio (consideration)   ◄──────┤ (CTA E5-E7: laboratorio)
  Editing Double View (decision)      ◄──────┘ (conversione secondaria)
     │ acquisto │ acquisto │ acquisto
     ▼          ▼          ▼
S3a post-corso   S3b post-editing   S3c post-webinar   (orientamento → cross-sell → review)

Ogni settimana (piena/leggera): S4: Newsletter (broadcast via single send)
30-60 giorni inattivi: S5: Re-engagement
```

**Regola di non-sovrapposizione:** un contatto mai in due sequence contemporanee. Entrate in S1 e S3 escono dalle relative S2/S4 (exit condition), mai entrambe.

---

## 4. S1 — Nurture post-ebook (sequence prioritaria 🔴)

Entry point ad alto intent: il lead ha dato l'email per il lead magnet. È il flusso che deve portare alla conversione primaria — l'iscrizione al **laboratorio di scrittura di un soggetto** — con l'editing come conversione secondaria per chi ha già un testo. L'ebook viene consegnato già dall'email transazionale (`free_ebook_email`); la sequence inizia il giorno dopo.

```
Sequence Name: Nurture post-download ebook
Trigger: interazione `ebook_downloaded` (dopo l'email transazionale di consegna)
Goal: iscrizione al laboratorio di scrittura di un soggetto (€200) — conversione primaria; editing come conversione secondaria per chi ha già un testo
Attrezzo intermedio: feedback gratuito sulla prima pagina (asset già live, costo di implementazione 0) — micro-commitment tra la fase di valore (E1-E3) e l'ask commerciale (E5-E7)
Length: 7 email
Timing: Day 1 / 3 / 5 / 7 / 9 / 11 / 14
Exit conditions: acquisto corso o editing (→ S3) · unsubscribe · hard bounce
Segment iniziale: contatti con `ebook_downloaded` e nessun acquisto
Nota: la richiesta di feedback (E4) NON è un'uscita — è una micro-conversione intermedia; il contatto resta in S1 e riceve l'ask sul laboratorio (E5-E7)
```

**Stato:** ✅ implementata e pubblicata sul motore Automations interno (trigger evento sul form built-in ebook).

### Email 1 — Quick win ("il primo passo")
**Send:** Day 1
**Subject:** Il primo passo (piccolo) da fare oggi
**Preview:** Leggi l'ebook, sì — ma prima c'è un gesto da 10 minuti che ti sblocca.
**Body:**
> Ciao,
> hai scaricato l'ebook "Introduzione alla sceneggiatura cinematografica". Ottima decisione: ora non lasciarlo in un cassetto.
>
> Il primo passo non è studiare tutto il manuale.
> È una riga sola, e bastano dieci minuti:
>
> **Se il tuo soggetto fosse una frase, quale sarebbe?**
>
> Scrivila adesso, dove capita.
> Non deve essere perfetta. Deve esistere.
>
> Se ti sembra "troppo poco per essere una storia", è normale: tutte le storie partono da lì.
>
> Nella guida completa vedi come quella frase diventa un percorso, passo per passo.
>
> **[Inizia dalla guida completa →]** `/come-scrivere-una-sceneggiatura/`
>
> Nei prossimi giorni ti mando uno strumento alla volta.
> Niente spam: solo quello che serve per non bloccarti a metà.
>
> A presto,
> Federico e il team di Pictures Writers
**CTA:** Inizia dalla guida completa → `/come-scrivere-una-sceneggiatura/`
**Segment/Conditions:** ebook scaricato, niente acquisto

### Email 2 — Roadmap ("la mappa")
**Send:** Day 3
**Subject:** La mappa che avremmo voluto avere
**Preview:** Non è fortuna: è un percorso, con tappe precise. Ecco l'ordine giusto.
**Body:**
> Diventare sceneggiatori non è questione di fortuna.
> È un percorso, con tappe precise: cosa studiare, cosa scrivere, a quali concorsi partecipare, come farti leggere.
>
> Il problema più grande, per chi inizia, non è il talento.
> Sono le informazioni frammentate.
>
> Un tutorial qui. Un capitolo di manuale là. Il consiglio di un amico.
> Mai il percorso completo, nell'ordine giusto.
>
> Per questo abbiamo messo insieme la mappa che avremmo voluto avere quando abbiamo iniziato:
>
> - **8 tappe**, dalla formazione alla prima produzione
> - Le **verità scomode** che gli altri non raccontano (quanto si guadagna davvero, come funzionano oggi agenzie e case di produzione)
> - L'**ordine giusto** per non disperdere tempo ed energia
>
> È la stessa mappa che usiamo ogni giorno con la nostra community di 800+ sceneggiatori.
>
> **[Scopri le 8 tappe: come diventare sceneggiatore →]** `/come-diventare-sceneggiatore-la-guida-definitiva/`
>
> Nei prossimi giorni ti mostriamo uno strumento alla volta. Niente rumore: solo quello che serve a non disperderti.
>
> A presto,
> Federico e il team di Pictures Writers
**CTA:** Scopri le 8 tappe → `/come-diventare-sceneggiatore-la-guida-definitiva/`
**Segment/Conditions:** tutti

### Email 3 — Social proof + expertise (Pagina Uno)
**Send:** Day 5
**Subject:** Come si smonta una sceneggiatura (e cosa impari)
**Preview:** La nostra serie Pagina Uno: i film che conosci, analizzati riga per riga.
**Body:**
> Ogni settimana prendiamo una sceneggiatura famosa e la smontiamo: struttura, personaggi, dialoghi. Perché funziona, riga per riga.
>
> Si chiama **Pagina Uno**, ed è l'esercizio che facciamo ogni giorno sui nostri stessi lavori.
>
> E non lo diciamo solo noi:
>
> - **7 recensioni**, media **5 stelle**
> - **500+** ebook scaricati
> - una community di **800+** sceneggiatori
>
> Guarda le analisi per capire il livello: film che conosci, letti con gli occhi di chi scrive.
>
> **[Scopri la serie Pagina Uno →]** `/blog/pagina-uno/`
>
> La prossima tappa arriva tra due giorni: come mettere il tuo lavoro — anche solo una pagina — sotto quegli stessi occhi.
>
> A presto,
> Federico e il team di Pictures Writers
**CTA:** Scopri la serie Pagina Uno → `/blog/pagina-uno/` (in futuro hub dedicato `/pagina-uno/`)
**Segment/Conditions:** tutti

### Email 4 — Attrezzo intermedio: il feedback gratuito (micro-commitment)
**Send:** Day 7
**Subject:** Il tuo lavoro sotto gli occhi di un consulente (gratis)
**Preview:** Non serve un copione finito: solo la prima pagina. La leggiamo e ti diciamo cosa vediamo.
**Body:**
> Fin qui: la guida, la mappa, le analisi di Pagina Uno.
>
> Ora il passo che cambia tutto: **scrivere qualcosa e farlo leggere a un professionista.**
>
> So cosa stai pensando:
>
> - "non sono pronto"
> - "non ho ancora una sceneggiatura"
>
> Non serve. Ti basta **la prima pagina**.
>
> La scena in cui il tuo protagonista entra nel mondo della storia.
>
> Mandacela.
>
> La leggiamo come leggiamo i copioni che arrivano in studio:
>
> - cosa funziona
> - cosa frena
> - da dove ripartire
>
> È lo stesso occhio della serie Pagina Uno, applicato al tuo testo. **Gratis.**
>
> **[Richiedi il feedback gratuito →]** `/feedback-gratuito-sceneggiatura/`
>
> La prossima tappa arriva tra due giorni: perché l'idea, da sola, non basta.
>
> A presto,
> Federico e il team di Pictures Writers
**CTA:** Richiedi il feedback gratuito → `/feedback-gratuito-sceneggiatura/`
**Segment/Conditions:** tutti · se richiede il feedback → tag `first_feedback_request` (resta in S1, non esce)

### Email 5 — L'idea senza metodo → il laboratorio
**Send:** Day 9
**Subject:** "Ho l'idea, ma non so da dove cominciare"
**Preview:** L'idea giusta non basta: senza metodo resta un'idea. Ecco come diventa un soggetto.
**Body:**
> C'è una frase che sentiamo spesso:
> "Ho un'idea, prima o poi la scrivo."
>
> Poi passa il tempo. E l'idea resta lì.
>
> Non è pigrizia, né mancanza di talento. È che tra l'idea e un soggetto scritto c'è un **metodo** — e nessuno te lo ha mai mostrato.
>
> Il **laboratorio di scrittura di un soggetto** è quel metodo, applicato passo per passo:
>
> - **Gruppo ristretto:** il tuo lavoro viene guardato davvero.
> - **Dal concept alla storia:** protagonista, conflitto, finale.
> - **Esercitazioni e revisioni:** scrivi tra le sessioni, ricevi riscontri, correggi.
> - **Fino alla prima stesura:** con una struttura che regge, non appunti sparsi.
>
> Da soli è il modo più sicuro per non arrivare mai alla parola "fine". Con qualcuno che ti segue e un gruppo con cui confrontarti, cambia tutto.
>
> **€200**, sotto la media del mercato.
>
> **[Scopri il laboratorio →]** `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/`
>
> Nella prossima email: lo dicono loro, meglio di noi.
>
> A presto,
> Federico e il team di Pictures Writers
**CTA:** Scopri il laboratorio → `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/`
**Segment/Conditions:** tutti

### Email 6 — Recensioni (social proof)
**Send:** Day 11
**Subject:** Lo dicono meglio di noi
**Preview:** Due voci da chi ha finito il laboratorio: cosa cambia, cosa ottieni.
**Body:**
> Il modo migliore per capire se il laboratorio fa per te? Sentirlo raccontare da chi l'ha già fatto.
>
> *"Federico e Lorenzo sono due professionisti generosi e disponibili. Mi hanno guidato passo passo nella creazione di un soggetto cinematografico. Sono stati un ottimo duo per ragionare ad alta voce sulla storia e darle struttura prima di darle forma scritta."* **[…]**
>
> *"Il corso di scrittura di soggetti mi ha fatto notevolmente migliorare nella redazione di documenti di analisi e sintesi in pochissimo tempo. Inoltre mi ha posto in condizione di partecipare fin da subito al Premio Solinas."*
>
> Media: **5 stelle** su 7 recensioni.
>
> **[Leggi le recensioni →]** `/#testimonianze`
>
> La prossima email è l'ultima: il passo da fare.
>
> A presto,
> Federico e il team di Pictures Writers
**CTA:** Leggi le recensioni → `/#testimonianze`
**Segment/Conditions:** tutti

### Email 7 — Conversione
**Send:** Day 14
**Subject:** Il momento giusto per iniziare è adesso
**Preview:** L'idea aspetta da mesi. C'è un modo per non farla aspettare ancora.
**Body:**
> La tua idea aspetta da mesi.
> Un soggetto finito ha una data.
>
> Il **laboratorio di scrittura di un soggetto** è il percorso dal concept alla prima stesura: gruppo ristretto, esercitazioni, revisioni.
>
> Il prossimo passo non è "decidere se sei pronto". È **iniziare**.
>
> **[Iscriviti al laboratorio →]** `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/`
>
> Prezzo sotto la media del mercato. Media 5 stelle su 7 recensioni. Il metodo Double View — due consulenti — al servizio di ogni testo.
>
> Hai già una sceneggiatura pronta e cerchi solo un parere? Per te c'è il [servizio di editing](/shop/servizi-di-editing/sceneggiatura-di-lungometraggio/).
>
> Ci vediamo in laboratorio.
>
> — Federico e il team di Pictures Writers
**CTA:** Iscriviti al laboratorio (primaria, singola) → `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/` · editing: una riga secondaria solo per chi ha già un testo
**Segment/Conditions:** tutti

---

## 5. S2 — Welcome newsletter (punto di ingresso a basso intent)

Per chi si iscrive dalla newsletter **senza** aver scaricato l'ebook. Converte l'iscritto "curioso" in un percorso utile e, se interessato, lo porta a scaricare l'ebook → da lì entra nella S1.

```
Sequence Name: Welcome newsletter
Trigger: interazione `user_subscribed` (dopo conferma) e nessun `ebook_downloaded`
Goal: attivare il curioso → aggancio ebook gratuito → merge in S1
Length: 4 email
Timing: Day 0 (immediata) / 2 / 5 / 8
Exit conditions: scarica ebook → merge in S1 (reset alle E1) · unsubscribe · bounce
```

### Email 1 — Benvenuto + cosa aspettarsi
**Send:** Day 0 (immediata)
**Subject:** Benvenuto tra gli sceneggiatori di Pictures Writers
**Preview:** Ogni settimana uno strumento concreto per scrivere meglio. Ecco cosa aspettarti.
**Body:**
> Bentornato: ora sei ufficialmente dentro la community.
>
> Ogni settimana nella tua inbox trovi strumenti concreti per scrivere meglio:
> - Guide pratiche e analisi dei film che fanno scuola
> - Scadenze e aggiornamenti sui concorsi di sceneggiatura
> - Notizie su laboratori e servizi di editing
>
> Niente rumore: solo quello che serve al mestiere.
>
> Per iniziare bene, parti dalla guida che usiamo con tutti quelli che ci chiedono "da dove comincio":
>
> [Leggi: come scrivere una sceneggiatura (guida completa) →] `/come-scrivere-una-sceneggiatura/`
**CTA:** La guida completa gratuita → `/come-scrivere-una-sceneggiatura/`

### Email 2 — Primo strumento
**Send:** Day 2
**Subject:** Il metodo 3 atti che spiega (quasi) tutti i film
**Preview:** Un solo concetto, esempi compresi, per capire com'è fatta una storia.
**Body:**
> Cominciamo con la struttura, perché senza struttura non c'è storia.
>
> La [struttura in 3 atti](/la-struttura-in-tre-atti-di-una-sceneggiatura/) ha un solo compito: dare un inizio, un conflitto e una soluzione alla tua idea. Non è una gabbia: è lo scheletro che tiene in piedi tutto il resto.
>
> Se la guardi una volta con gli esempi giusti, poi la riconosci ovunque — anche nei film che già conosci. E quando la riconosci, la sai usare.
>
> [Scopri la struttura in 3 atti →] `/la-struttura-in-tre-atti-di-una-sceneggiatura/`
**CTA:** Leggi la guida → `/la-struttura-in-tre-atti-di-una-sceneggiatura/`

### Email 3 — Lead magnet: chiudi il gap verso l'ebook
**Send:** Day 5
**Subject:** Il percorso completo, da tenere sempre con te
**Preview:** Un solo oggetto che riunisce tutto: l'ebook gratuito per sceneggiatori.
**Body:**
> Parliamoci chiaro: le email sono ottime, ma servono con te sul tavolo mentre scrivi.
>
> L'ebook "Introduzione alla sceneggiatura cinematografica" è proprio questo: il percorso completo — idea, soggetto, struttura, personaggi — in formato da consultare mentre lavori. Gratis, perché per noi la porta d'ingresso del mestiere deve restare aperta.
>
> [📘 Scarica l'ebook gratuito →] `/shop/ebooks/introduzione-alla-sceneggiatura/`
>
> *Dopo il download, la prossima email ti aspetta con il primo passo concreto.* (→ apre la S1)
**CTA:** Scarica l'ebook gratuito → `/shop/ebooks/introduzione-alla-sceneggiatura/`
**Exit/merge:** se clicca e completa il form, `ebook_downloaded` → entra in S1 (E1) e abbandona S2

### Email 4 — Community + prossimi passi
**Send:** Day 8
**Subject:** Non sei più da solo con il tuo copione
**Preview:** Community, laboratorio, editing: dove ci trovi quando sei pronto.
**Body:**
> Scrivere è un mestiere solitario solo se lo fai da solo.
>
> Quando sarai pronto a muoverti, qui trovi tutto nello stesso posto:
> - **Laboratorio di scrittura del soggetto**: un gruppo ristretto per portare l'idea fino alla prima stesura → `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/`
> - **Editing Double View**: due consulenti che analizzano la tua sceneggiatura → `/shop/servizi-di-editing/sceneggiatura-di-lungometraggio/`
> - E le newsletter settimanali, dove ci ritroviamo.
>
> Il prossimo strumento arriva regolarmente. Ci vediamo lì.
**CTA:** Scopri il laboratorio → `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/`
**Exit:** a fine S2 se nessuna interazione → dopo 30 giorni valutare: merge in S1 se ha scaricato l'ebook, altrimenti S5 re-engagement

---

## 6. S3 — Post-acquisto (orientamento → cross-sell → review)

Trigger: acquisto corso, editing o webinar. Oggi solo `webinar_purchased` è tracciato (**gap**: registrare `course_purchased`, `editing_purchased` — vedi §9). Queste sequence vanno a regime quando i dati di interazione saranno completi.

### S3a — Post-corso/laboratorio

```
Trigger: acquisto laboratorio
Goal: orientare, ridurre abbandono, cross-sell editing a fine percorso
Length: 4
Timing: Day 0 / 1 / 5 / fine corso (trigger manuale o a +30 gg)
```

1. **Conferma + cosa succede ora** (Day 0, transazionale): accedi, primo materiale, info sul gruppo. CTA: entra nel laboratorio.
2. **Preparati al laboratorio** (Day 1): soggetto in una frase, cosa portare, come lavorare tra le sessioni.
3. **Supporto & community** (Day 5): come chiedere aiuto, dove confrontarti con gli altri.
4. **Cross-sell editing** (fine corso): "Hai trasformato l'idea in un soggetto. Il prossimo passo? Un parere professionale prima di proporlo." → `/shop/servizi-di-editing/soggetto-di-lungometraggio/`. Poi richiesta recensione.

### S3b — Post-editing (Double View)

```
Trigger: acquisto editing (gap: da tracciare)
Goal: gestire attesa, raccogliere recensione, cross-sell formazione
Length: 3
Timing: Day 0 / Day 5 / Day 10-12
```

1. **Conferma + aspettative** (Day 0, transazionale): due consulenti al lavoro, tempi 7-10 giorni, cosa riceverai nel report. CTA nessuna (acknowledgement).
2. **Stato lavori** (Day 5): "I tuoi consulenti stanno lavorando sul tuo testo. Nel frattempo, un'analisi di esempio per capire cosa guardano." → link Pagina Uno. CTA: leggi un'analisi.
3. **Follow-up + review + cross-sell** (Day 10-12): consegna avvenuta → come applicare il parere, risposta a dubbi sul report, richiesta recensione (media 5★ da presidiare), e se il soggetto era il punto di partenza: il laboratorio per chi vuole continuare a scrivere → `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/`.

### S3c — Post-webinar

```
Trigger: `webinar_purchased` (già tracciato)
Goal: promemoria, accesso, cross-sell
Length: 3
```

1. **Conferma** (Day 0): già esistente (`sendWebinarPurchaseEmail`): estendere con link calendario/accesso.
2. **Promemoria** (Day prima): data/ora, come collegarsi, cosa portare.
3. **Follow-up** (Day dopo): mini-riassunto/registrazione, CTA verso laboratorio o editing per chi ha partecipato.

**Regole cross-sell sullo stesso modello:** editing → proponi corsi; corsi → proponi editing; mai lo stesso prodotto due volte.

---

## 7. S4 — Newsletter (cadenza broadcast)

```
Sequence Name: Newsletter "Strumenti per sceneggiatori"
Formato: EmailSingleSend programmata (scheduler SEND_EMAIL) su audience newsletter
Cadenza consigliata: ogni 2 settimane (vedi nota sotto)
Goal: valore continuo + opportunità micro-conversione (corsi/editing/concorsi)
Exit: unsubscribe · bounce
```

**Nota sulla cadenza (decisa):** il copy del widget newsletter e l'hub `come-scrivere-una-sceneggiatura` promettono "**ogni settimana**". Decisione: **settimanale confermata**, resa sostenibile col **formato alternato piena/leggera** (una email "piena" ogni due invii, una "leggera" con 1 solo link nell'altra). Nessuna modifica di copy necessaria su widget o hub. Vedi §7 per i tipi alternati.

**Formula template (email piena):**
1. **Pillola di tecnica** (1 concetto + 1 esempio) → link hub/pillola
2. **Un'analisi Pagina Uno** (film diverso) → lemma dimostrazione expertise
3. **Una scadenza concorsi** (durante i periodi concorsi: Giu/Set/Ott...) → per la pillar opportunità
4. **CTA di fondo** (rotazione): laboratorio / editing (subject A/B vedi §10)

**Tipi alternati (per non annoiare):**
| T | Contenuto | CTA |
|---|-----------|-----|
| Piena (1 ogni 2 invii) | pillola + analisi + concorso | soft (laboratorio/editing) |
| Leggera (l'altra) | 1 risorsa forte + 1 riga | 1 link soltanto |
| Speciale (1/trimestre) | sondaggio/scadenze stagionali (es. "Concorsi 2027", pilota statale) | partecipazione → ebook/concorso |

**Segmentation newsletter:** stessa email per tutti i subscriber, ma audience separate: (a) `fans` → già clienti, (b) `lead` → mai acquistato. A parità di contenuto educativo, cambia solo il CTA di fondo.

---

## 8. S5 — Re-engagement

```
Trigger: 30-60 giorni senza apertura di email (o senza interazioni) tra chi NON ha mai acquistato
Goal: riattivare o ripulire la lista
Length: 3-4 email in 2 settimane
Exit: click su qualsiasi link → torna in cadenza · "Non scrivetemi più" → unsubscribe
```

1. **Check-in** — "Ci siamo persi?" / Preview: "Da qualche settimana non ti trovo nelle email: è tutto a posto?" Corpo: interesse genuino + un link leggero (una struttura in 3 atti o un'analisi).
2. **Reminder di valore** — "Probabilmente ti è sfuggito questo" → la migliore analisi/guida dell'ultimo mese (una sola, forte).
3. **Incentivo** (solo per chi è entrato via ebook e non ha acquistato) — "Un regalo per tornare a scrivere": check-list/template dedicato (lead magnet in cantiere, content-strategy §5) o sconto primo editing. *Attenzione: sconti solo se la marginalità lo permette — decisione business, da confermare.*
4. **Ultima email** — "Niente spam, solo rispetto": due pulsanti chiari — "Rimani" (re-sottoscrive) / "Non scrivetemi più" (unsubscribe 1 click). Da qui in poi silenzio per questo segmento.

**Regola bonus:** chi non apre le ultime 2 newsletter e non risponde alla S5 → pausa indefinita (inattivazione, non unsubscribe). Lista pulita = deliverability migliore.

---

## 9. Gap infrastruttura + piano di implementazione

La fase 7 è un deliverable di design; le righe sotto preparano l'implementazione (da schedulare con priorità, in ordine).

### Gap tecnici rilevati
| # | Gap | Dettaglio | Dove |
|---|-----|-----------|------|
| G1 | ✅ **Chiuso — motore sequence** | Costruito il motore **Automations** interno (`Automation` / `AutomationRun` / `AutomationRunStep`, canvas + trigger a evento, ADR-0004, `docs/automations.md`). La **S1** è pubblicata su questo motore; non serve più il worker "sequence" immaginato dalle opzioni A/B | `src/modules/automations/*`, `prisma/schema.prisma` |
| G2 | **Interazioni incomplete** | `submit_product_form` senza tipo prodotto; mancano `course_purchased`, `editing_purchased`, `first_feedback_request` | `submit-product-form.ts`, `mail.ts`, checkout Stripe handler |
| G3 | **Hook post-acquisto** | Solo il webinar ha email di conferma; acquisti corso/editing non emettono email né interazione | stripe webhook / checkout success |
| G4 | ✅ **Chiuso — doppio opt-in come gate** | `createContactByEmail` non imposta più `emailVerified`; `newSubscription` consuma il token, imposta `emailVerified`, sposta `user_subscribed`/notifica alla conferma ed emette `subscription.confirmed` (solo prima conferma, idempotenza per `contactId`). Trigger separato da `form.submitted`. Vedi ADR-0007 | `src/actions/new-subscription.ts`, `src/data/email-contact.ts` |
| G5 | **Variabili template** | I template usano Handlebars; le sequence avranno bisogno di variabili aggiuntive (`firstName`, `urlSpecifica`, `daysCount`) | `mail.ts` / nuovo `send-sequence-step.ts` |

### Opzioni di implementazione (MVP)

> **Aggiornamento (2026-10-01):** la **S1 è stata implementata sul motore Automations interno** (canvas visuale + trigger a evento; nessun modello `EmailSequence` dedicato). Le opzioni A/B sotto restano come riferimento per S2-S5 o per evoluzioni future, ma non sono la strada seguita per S1.

**Opzione A — Runner piggyback su `ScheduledAction` (consigliata, basso rischio):**
1. Nuovo `ScheduledActionType.SEND_TEMPLATE_EMAIL` (o riuso `SEND_EMAIL` con `targetType` diverso es. `EMAIL_CONTACT`).
2. Nuovo handler `send-email-template-handler` che legge `EmailTemplateId` + email destinatario + variabili dall'azione, invia via `sendEmail` (stessa logica di `mail.ts`), registra log/step completion.
3. Al click su `ebook_downloaded` / `user_subscribed` / acquisto: si pianificano gli step futuri (es. `createContactSequenceRuns`) creando le `ScheduledAction` per i day 1/3/5/7/9/12.
4. Exit conditions: nell'handler, prima dell'invio controllo interazioni (`ebook_downloaded` + acquist...) → salta se dovuto.
- Pro: riusa scheduler già testato, contabilità Reminder, niente nuovo cron. Mapping coperto da `schedule-single-send.ts` come pattern.

**Opzione B — Resend Automations (API esterna):** le sequence diventano workflow su Resend (automations + events). Pro: zero modelli sequence in DB, motore robusto. Contro: logica di business nel provider, meno controllabile dagli admin, dipendenza vendor; da valutare quando il volume cresce.

**Consiglio: Opzione A per le prime 2 sequence (S1, poi S2), Opzione B come follow-up se il team preferisce risorse esterne.**

### Checklist di configurazione admin (senza codice, subito)
- [x] Template `EmailTemplate` per ogni email **S1 (7)**: creati nell'editor admin.
- [ ] Template `EmailTemplate` per ogni email **S2 (4)** — copy e CTA sono su questo documento.
- [ ] S3: nel frattempo, conferma acquisti e promemoria via email manuali usando i template S3, finché G1-G3 non sono chiusi.
- [ ] Audience/segmenti su Resend: `newsletter`, `ebook_lead`, `clienti` (per S4 di fondo).
- [ ] `EmailSetting`: rivedere `maxEmailsPerDay` (rispetto al piano di invio: liste piccole, soglia prudente) e `emailSenderName`.
- [ ] Verificare dominio/from su Resend e warm-up (skill resend: limiti giorno per domini nuovi).
- [ ] Footer di ogni template: link di disiscrizione funzionante + motivo della ricezione (GDPR / D.Lgs. 196/2003). Resend aggiunge `List-Unsubscribe` sui broadcast; per le email singole (sequence) va inserito manualmente.
- [ ] Decisione: cadenza newsletter settimanale vs bi-settimanale → allineare widget (§7).

---

## 10. Test e metriche

### Baseline
- Open rate: **target 25-40%** (benchmark skill 20-40%)
- Click rate: **target 3-8%** (benchmark 2-5%, sequence nutrimento più alte)
- Unsubscribe: **< 0.5%** per invio
- Conversioni per sequence: **S1 → % che si iscrive al laboratorio entro 30 giorni dalla E7** (editing = conversione secondaria)
- Micro-conversione intermedia: **% che richiede il feedback gratuito (E4)** e, tra questi, **% che poi acquista il laboratorio** (misura se l'attrezzo intermedio alza la conversione finale o la diluisce)

### Eventi GA4 da verificare/aggiungere per la catena
`newsletter_signup`/`ebook_download` → `cta_click` (email link → destino prodotto/articolo) → `submit_product_form` → `purchase`. Le email vanno taggate con UTM: `utm_source=email&utm_medium=sequence&utm_campaign=S1-E5` (tutti i link dei template).

### A/B test (1 variabile alla volta, poi documentare)
| Test | Oggetto | Metrica |
|------|---------|---------|
| T-E1 | Subject E1 S1: "Il primo passo (piccolo) da fare oggi" vs "10 minuti per sbloccare la tua storia" | Open rate |
| T-INT | **Attrezzo intermedio in S1**: E4 feedback gratuito (esistente) vs E4 template/checklist soggetto (da costruire) | Click E4 + conversione al laboratorio |
| T-E7 | CTA finale S1: doppia (laboratorio/editing) vs singola (laboratorio) | CTR + conversioni |
| T-CAD | Cadenza newsletter: settimanale vs bi-settimanale (dopo allineamento copy widget) | Unsubscribe + retention apertura |
| T-SUBJ | Pattern subject: "come fare" vs domanda ("Non sai se il tuo copione è pronto?") | Open rate E5 S1 |

### KPI a 60 giorni (per dashboard)
- Crescita iscritti newsletter mese su mese (fonte GSC pagine hub + CRO quick wins)
- Richieste di feedback gratuito via S1-E4 (nuova micro-conversione da tracciare, richiede chiusura G2)
- Tasso di conversione S1 → acquisto (prima baseline quando G2/G3 saranno chiusi)
- Numero recensioni raccolte via S3b (obiettivo: >7 per consolidare il proof point)
- Unsubscribe rate medio sotto soglia

---

## Changelog
- v1 (2026-09-23) — Programma email fase 7: S1 nurture post-ebook (6), S2 welcome newsletter (4), S3 post-acquisto (3 flussi), S4 newsletter cadence, S5 re-engagement. Copy completa, mappatura infrastruttura, gap (G1-G5) e piano implementazione MVP (Opzione A su `ScheduledAction`), test e metriche.
- v2 (2026-09-30) — Allineamento all'hub aggiornato: l'articolo `/come-scrivere-una-sceneggiatura/` è ora "la guida completa" (SERP v2, vedi `.agents/serp-come-scrivere-una-sceneggiatura.md`), non più "10 step". Aggiornati i CTA di S1-E1 e S2-E1. L'hub ora promuove esso stesso la cadenza settimanale della newsletter e rimanda a ebook, laboratorio ed editing: rafforza il funnel. Nota: la cadenza settimanale è ora promessa in più punti (hub + widget) → la decisione di §7/§9 va riconfermata.
- v3 (2026-10-01) — Allineamento al rientro dopo l'aggiornamento dei due hub pillar. Proof point community aggiornato a **800+** (canonico). **S1 ridisegnata**: E2 da brand story a "roadmap/mappa" (hub 1B `come-diventare-sceneggiatore`), E4 dal servizio a pagamento al **feedback gratuito sulla prima pagina** (`/feedback-gratuito-sceneggiatura/`). E3 punta a `/blog/pagina-uno/`. Cadenza **settimanale confermata** con formato alternato piena/leggera (nessuna modifica di copy).
- v4 (2026-10-01) — **Conversione primaria di S1 fissata sul laboratorio di scrittura di un soggetto (€200)**; l'editing scende a conversione secondaria. Ricadute: E4 riscritta sul problema "l'idea c'è, manca il metodo" (niente più feedback gratuito, che resta un asset fuori S1); E5 diventa "come funziona il laboratorio" (CTA singola); E6 conversione a CTA singola sul laboratorio con l'editing citato in una riga. Aggiornati goal/mappa/metriche di §4/§3/§10.
- v5 (2026-10-01) — **Attrezzo intermedio di S1 scelto: feedback gratuito sulla prima pagina** (asset già live, costo di implementazione 0), inserito come micro-conversione tra la fase di valore (E1-E3) e l'ask commerciale. S1 passa da 6 a 7 email: nuova E4 (feedback), vecchie E4-E6 → E5-E7, timing Day 1/3/5/7/9/11/14. La richiesta di feedback non è un'uscita (tag `first_feedback_request`, resta in S1). Aggiornati mappa §3, checklist §9, metriche e A/B §10 (nuovo test T-INT feedback vs template/checklist). Il **template/checklist soggetto** (content-strategy §5) resta da costruire per un futuro swap A/B: così si confrontano i dati dei due attrezzi.
- v6 (2026-10-01) — **S1-E2 riscritta per scansionabilità** (era un unico blocco di testo): hook breve, problema-frammentazione isolato in righe brevi, le 8 tappe in bullet. CTA resa concreta (**"Scopri le 8 tappe"**, destinazione invariata hub 1B) e aggiunto **sign-off di chiusura** coerente con E1/E7 ("uno strumento alla volta / niente rumore"), che aggancia la E3.
- v7 (2026-10-01) — **S1-E3 riscritta per scansionabilità** + **CTA riconsiderata**: da indice analisi a **guida step-by-step** `/come-analizzare-una-sceneggiatura/` ("Impara a leggere un copione come un professionista"), perché l'email promette una *capacità*, non una vetrina; la serie Pagina Uno resta la prova (proof point in bullet + esempio concreto `/scomporre-il-primo-atto-little-miss-sunshine/`) e l'indice `/blog/pagina-uno/` scende a link secondario. Il vecchio paragrafo finale (Double View) diventa sign-off che aggancia la E4.
- v8 (2026-10-01) — **S1-E3 riportata a solo Pagina Uno.** La guida `/come-analizzare-una-sceneggiatura/` (didattica, molto più approfondita) e le scomposizioni Little Miss Sunshine escono dall'email: due registri diversi nello stesso invio ("mostrare" vs "insegnare") si annullavano. E3 resta l'email di *showcase/expertise*: proof point in bullet + CTA unica alla serie `/blog/pagina-uno/`. La guida resta disponibile per un touchpoint didattico dedicato (es. una newsletter "piena" della S4).
- v9 (2026-10-01) — **S1-E4 riscritta per mobile:** paragrafi spezzati (nessun blocco oltre ~2 righe su smartphone, prima i tre paragrafi di apertura erano 5-6-6 righe), obiezioni e "cosa funziona/frena/ripartire" in bullet. CTA armonizzata e resa concreta: **"Richiedi il feedback gratuito"** (il bottone e il campo CTA non coincidevano più: *"Scopri come funziona"* vs *"Manda la tua prima pagina"*). Sign-off che aggancia la E5.
- v10 (2026-10-01) — **S1-E6 alleggerita per mobile:** bullet accorciate (ogni voce ~1-2 righe, prima 3-4), intro ridotta a una riga, paragrafo finale spezzato in due. Aggiunto sign-off che aggancia la E7. *(Eseguita per errore: l'intento era la E5.)*
- v11 (2026-10-01) — **S1-E5 riscritta per mobile** (l'email realmente richiesta): i tre paragrafi-muro (fino a 6 righe) spezzati in blocchi da 1-2 righe, il "metodo che manca" trasformato in bullet (organizzazione/structure/documenti/concept), paragrafo finale accorciato. CTA armonizzata sul testo del bottone (**"Scopri come funziona il laboratorio"**). Aggiunto sign-off.
- v12 (2026-10-01) — **S1-E5: aggiunta chiusura dopo la CTA** (mancava una riga di raccordo prima della firma): "Nella prossima email ti raccontiamo come si lavora, passo per passo." → aggancia la E6.
- v13 (2026-10-01) — **S1-E5: CTA accorciata** per farla stare su una riga in mobile: da "Scopri come funziona il laboratorio" a **"Scopri il laboratorio"**. Regola: tenere il testo del bottone ≲20-22 caratteri.
- v14 (2026-10-01) — **S1-E6: hook di apertura.** L'incipit "Come funziona il laboratorio, in concreto" era un'etichetta e ripeteva il subject. Sostituito con un hook **self-contained** (ogni email si regge da sola: open rate <100%, lettori che entrano a metà sequence): "Trasformare un'idea in un soggetto scritto non è fortuna: è un metodo. Ecco come si applica, passo per passo."
- v15 (2026-10-01) — **S1: un solo ask diretto (opzione 1) + E7 alleggerita.** E6 da "Iscriviti al laboratorio" a **"Scopri il laboratorio"** (soft: E6 fa *capire*, l'ask diretto resta solo in E7), coerentemente con il tema stato apertura/lista d'attesa. **E7 riscritta per mobile e resa self-contained:** via il recap "Hai l'idea / Hai capito / Hai visto" (rimando alle email precedenti) e il "Quello che ci siamo detti in questi giorni"; nuova apertura "La tua idea aspetta da mesi. Un soggetto finito ha una data.", blocchi corti, trust line compatta (prezzo/5 stelle/Double View) e editing come riga secondaria.
- v16 (2026-10-01) — **S1 ristrutturata sulla prova sociale.** E5 e E6 erano in gran parte sovrapposte (entrambe spiegavano il laboratorio): **fuse nella nuova E5** "L'idea senza metodo → il laboratorio" (problema + metodo + prezzo, una sola lista di bullet, hook self-contained), e lo slot liberato è diventato la **nuova E6 Recensioni** (due testimonianze reali fornite dal cliente + CTA a `/#testimonianze`, la sezione "Cosa dicono i nostri studenti" della homepage; niente pagina recensioni dedicata). Sequenza sempre a **7 email**; finestra finale: problema/soluzione (E5) → prova sociale (E6) → conversione (E7). Recensioni riportate fedelmente (R1 con taglio segnalato da `[…]`).
- v17 (2026-10-01) — **Audit oggetto/preview delle 7 email S1** rispetto ai body riscritti (v6-v16). Unico disallineamento: **E3**, il cui oggetto era rimasto sull'angolo Double View ("Cosa vedono due consulenti quando leggono un copione") mentre dopo v7/v8 il body è tornato a essere solo Pagina Uno (showcase/expertise). Nuovo oggetto: **"Come si smonta una sceneggiatura (e cosa impari)"** (evita di duplicare la preview che cita già "i film che conosci, analizzati riga per riga"); preview invariata. E1, E2, E4, E5, E6, E7 risultano coerenti. Resta aperta una nota minore su **E1**: la preview promette un "gesto da 10 minuti" non quantificato nel body.
- v18 (2026-10-01) — **S1-E1: allineato il body alla preview.** Aggiunta la quantificazione nella riga del primo passo ("È una riga sola, e bastano dieci minuti:"), così la promessa dei "10 minuti" della preview (`emails.md:97`) trova riscontro nel corpo. Audit oggetto/preview S1 chiuso: nessun disallineamento residuo.
- v19 (2026-10-01) — **S1 implementata e pubblicata.** La sequence post-ebook è costruita sul **motore Automations interno** (canvas + trigger evento, `Automation`/`AutomationRun`/`AutomationRunStep`, `docs/automations.md`), non sul worker immaginato in §9 opzioni A/B: **G1 chiuso**. Trigger via evento interno sul form built-in ebook (`emitFormSubmitted`); idempotenza per `contactId` (ADR-0005). Template delle 7 email creati nell'editor admin. Aggiornati: §2 (tabella infrastruttura), §4 (stato S1), §9 (G1 + nota sulle opzioni MVP, checklist). S2-S5 restano da implementare.
- v20 (2026-10-01) — **Doppio opt-in chiuso (§2/G4).** Il token di conferma ora viene consumato: `createContactByEmail` non imposta più `emailVerified`; `newSubscription` imposta `emailVerified`, sposta `user_subscribed`/notifica alla conferma ed emette il nuovo trigger interno `subscription.confirmed` (solo prima conferma, idempotenza per `contactId`). `subscribe.ts` mantiene l'emit `form.submitted` come segnale di richiesta. Vedi ADR-0007. Nessun gap infrastrutturale bloccante residuo per S1/S2 (restano G2/G3/G5).