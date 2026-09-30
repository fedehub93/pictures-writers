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
- Rilevanza > volume: la lista è ~700 iscritti → sequence corte e segmentate, meglio di tante email deboli
- Ogni email muove il percorso: link utili che approfondiscono il funnel (blog → ebook → corso → editing)

**Proof points utilizzabili (verificati, da product-marketing):** 700+ iscritti newsletter · 500+ download ebook gratuito · 7 recensioni media 5★ · metodo Double View (due consulenti che analizzano in modo indipendente) · consegna 7-10 giorni lavorativi · prezzo sotto la media del mercato (da €50 per un soggetto · laboratorio €200).

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
| **Sequence automatizzate multi-step** | ❌ | **Manca: nessun concetto di sequence/step per contatto** |
| Cron server-side per runner scheduler | ⚠️ | Vedi §9 gap / piano implementazione |

**Interazioni oggi tracciate** (chiavi di segmentazione disponibili):
- `user_subscribed` — iscrizione newsletter (dal widget)
- `ebook_downloaded` — download ebook gratuito (lead magnet)
- `webinar_purchased` — acquisto webinar
- `submit_product_form` — submission form corso/editing (senza dettaglio prodotto: gap)
- `submit_form` / `contact_requested` — form generici / contatti

**Nota doppio opt-in:** `subscribe.ts` crea il contatto con `emailVerified` già valorizzato e non esiste rotta che consumi il token: il "conferma sottoscrizione" è di fatto un soft opt-in (segnalazione di deliverability, non un gate). Da valutare se blindare prima di avviare le sequence (vedi §9).

---

## 3. Mappa del programma email (funnel → sequence)

```
Blog / SERP (freddo)
  → widget newsletter ────────────────┐
  → lead magnet ebook (form 1 campo) ─┴─► S2: Welcome newsletter (4 email)
                                       ou ► S1: Nurture post-ebook (6 email)  [high intent]
                                             │
  Corso/Laboratorio (consideration) ◄───────┘ (CTA E5-E6)
  Editing Double View (decision)     ◄────────
     │ acquisto │ acquisto │ acquisto
     ▼          ▼          ▼
S3a post-corso   S3b post-editing   S3c post-webinar   (orientamento → cross-sell → review)

Ogni 2 settimane: S4: Newsletter (broadcast via single send)
30-60 giorni inattivi: S5: Re-engagement
```

**Regola di non-sovrapposizione:** un contatto mai in due sequence contemporanee. Entrate in S1 e S3 escono dalle relative S2/S4 (exit condition), mai entrambe.

---

## 4. S1 — Nurture post-ebook (sequence prioritaria 🔴)

Entry point ad alto intent: il lead ha dato l'email per il lead magnet. È il flusso che deve portare a corso/editing secondo il funnel content-strategy. L'ebook viene consegnato già dall'email transazionale (`free_ebook_email`); la sequence inizia il giorno dopo.

```
Sequence Name: Nurture post-download ebook
Trigger: interazione `ebook_downloaded` (dopo l'email transazionale di consegna)
Goal: primo acquisto — laboratorio (€200) o editing soggetto/copione (da €50)
Length: 6 email
Timing: Day 1 / 3 / 5 / 7 / 9 / 12
Exit conditions: acquisto corso o editing (→ S3) · unsubscribe · hard bounce
Segment iniziale: contatti con `ebook_downloaded` e nessun acquisto
```

### Email 1 — Quick win ("il primo passo")
**Send:** Day 1
**Subject:** Il primo passo (piccolo) da fare oggi
**Preview:** Leggi l'ebook, sì — ma prima c'è un gesto da 10 minuti che ti sblocca.
**Body:**
> Hai scaricato l'ebook "Introduzione alla sceneggiatura cinematografica": ottima decisione. Ora non farlo diventare un'altra risorsa da tenere nel cassetto.
>
> Il primo passo non è "studiare tutto il manuale". È questo: **se il tuo soggetto fosse una sola frase, quale sarebbe?** Scrivila ora, da qualche parte. Non serve che sia perfetta: serve che esista.
>
> Se ti blocchi perché "è troppo poco per essere una storia", è normale: tutte le storie partono da lì. Questo articolo ti accompagna passo per passo nel costruire quella frase in un percorso completo:
>
> [Leggi: la guida in 10 step →] `/come-scrivere-una-sceneggiatura/`
>
> Nei prossimi giorni ti mando uno strumento alla volta: niente spam, solo quello che serve per non restare bloccati a metà.
**CTA:** Leggi la guida gratuita → `/come-scrivere-una-sceneggiatura/`
**Segment/Conditions:** ebook scaricato, niente acquisto

### Email 2 — Story / Why
**Send:** Day 3
**Subject:** Perché abbiamo costruito Pictures Writers
**Preview:** Due consulenti, un metodo: la storia della "Double View".
**Body:**
> Ti raccontiamo da dove veniamo, perché ti aiuta a capire se questo posto fa per te.
>
> Quando scriviamo, ci chiediamo continuamente: "ma sarà buono?" Senza qualcuno che sappia leggere davvero, la domanda resta senza risposta. Le scuole costano tanto e non sempre sono accessibili; i pareri dei conoscenti sono affettuosi ma inutili; su internet le informazioni sono frammentate.
>
> Da qui nasce Pictures Writers: una piattaforma dove **imparare a scrivere, farti leggere da professionisti e crescere** — tutto in italiano, tutto nello stesso posto.
>
> Sul metodo "Double View" ci spieghiamo prossimamente. Per ora sappi questo: dietro a ogni servizio c'è la convinzione che scrivere non debba essere un mestiere solitario.
>
> [Leggi: come diventare sceneggiatore →] `/come-diventare-sceneggiatore-la-guida-definitiva/`
**CTA:** La guida definitiva al mestiere → `/come-diventare-sceneggiatore-la-guida-definitiva/`
**Segment/Conditions:** chi ha aperto la E1 (per chi non apre si continua comunque, il contenuto è brand-building)

### Email 3 — Social proof + expertise (Pagina Uno)
**Send:** Day 5
**Subject:** Cosa vedono due consulenti quando leggono un copione
**Preview:** La nostra serie Pagina Uno: i film che conosci, analizzati riga per riga.
**Body:**
> Ogni settimana analizziamo una sceneggiatura famosa — struttura, personaggi, dialoghi — e spieghiamo perché funziona. Si chiama serie **Pagina Uno**, ed è l'esercizio che ci alleniamo a fare ogni giorno sui nostri stessi lavori.
>
> Saper leggere una sceneggiatura come un professionista è l'abilità che poi restituiamo a chi ci affida il proprio soggetto. Ecco come la racconta chi ci ha già provato: **7 recensioni, media 5 stelle**, 500+ ebook scaricati e una community di 700+ sceneggiatori.
>
> Guarda un'analisi per capire il livello:
>
> [Scopri le analisi Pagina Uno →] (link hub Pagina Uno `/pagina-uno/`, quando pubblicata)
>
> E se vuoi capire come è fatta la *tua* sceneggiatura da quegli stessi occhi, alla fine del percorso ti aspettiamo: il metodo Double View, due consulenti, un solo parere applicabile.
**CTA:** Una pagina uno dei nostri film → `/pagina-uno/` (hub da creare; fallback: link a un post Pagina Uno esistente)
**Segment/Conditions:** tutti

### Email 4 — Problem deep-dive + obiezione
**Send:** Day 7
**Subject:** "Ho scritto tutto, ma non so se è buono"
**Preview:** Il copione che aspetta nel cassetto, la paura di farlo leggere: parliamone.
**Body:**
> È la frase che sentiamo più spesso. La storia ce l'hai: l'hai scritta, riscritta, cambiata di nuovo. E poi l'hai messa nel cassetto, perché "chissà se è davvero pronta".
>
> Il problema non è la tua sceneggiatura. È che **senza un parere qualificato non saprai mai se è pronta** — e intanto il tempo passa, il concorso scade, l'occasione si allontana.
>
> "Ma come faccio a fidarmi di uno sconosciuto che la legge?" Domanda giusta. Ecco perché il nostro servizio usa il metodo **Double View**: due consulenti la leggono separatamente, poi confrontano il loro lavoro e ti restituiscono un unico parere, con punti di forza e criticità concrete. Non è l'opinione di una persona: è il confronto di due sguardi.
>
> Prezzo sotto la media del mercato — da **€50 per un soggetto** — e risposta in 7-10 giorni lavorativi.
>
> [Come funziona il servizio →] `/shop/servizi-di-editing/soggetto-di-lungometraggio/`
**CTA:** Scopri come funziona → `/shop/servizi-di-editing/soggetto-di-lungometraggio/`
**Segment/Conditions:** tutti

### Email 5 — Solution framework / differenziazione (doppia via)
**Send:** Day 9
**Subject:** Due strade, a seconda di dove sei
**Preview:** Hai un'idea da sviluppare? Un copione da limare? Scegli la tua.
**Body:**
> A questo punto del percorso, ci sono due modi in cui ti puoi trovare:
>
> **1. Hai un'idea, ma non sai come portarla fino in fondo.**
> Il laboratorio di scrittura del soggetto è il percorso giusto: gruppo ristretto, esercitazioni, revisioni e confronto. Si parte dal concept e si arriva alla prima stesura con qualcuno che ti segue. €200, con un percorso che altrimenti faresti da solo.
>
> **2. Il testo c'è già, ti manca chi lo sa leggere.**
> Il servizio di editing con metodo Double View: due consulenti analizzano il tuo soggetto o la tua sceneggiatura e ti dicono esattamente dove la storia perde forza, e come aggiustarla.
>
> Scegli la tua strada — per entrambe vale la scelta che abbiamo fatto dal primo giorno: prezzi sotto la media del mercato, niente sorprese.
>
> [✍️ Scopri il laboratorio →] `/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/`
> [👁 Fai analizzare il tuo testo →] `/shop/servizi-di-editing/sceneggiatura-di-lungometraggio/`
**CTA:** doppia (laboratorio / editing) — unica eccezione, scelta consapevole: il lead è a un bivio e la *sua* risposta vale più di una CTA forzata
**Segment/Conditions:** tutti

### Email 6 — Conversion
**Send:** Day 12
**Subject:** Il prossimo passo è tuo
**Preview:** In tre righe: cosa abbiamo visto finora, e il modo più semplice per iniziare.
**Body:**
> Ti raccontiamo in breve dove siamo arrivati.
>
> Hai scaricato l'ebook, hai gli strumenti per non fermarti a metà, conosci il metodo Double View e sai quanto costa il confronto di due consulenti.
>
> Il prossimo passo non è "decidere se sei pronto". È scegliere la porta per cui passare:
>
> ▶ Se la tua storia è un'idea che aspetta di diventare soggetto → **[Scopri il laboratorio](/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/)**
>
> ▶ Se il testo c'è già e vuoi sapere se è pronto → **[Richiedi la tua analisi](/shop/servizi-di-editing/sceneggiatura-di-lungometraggio/)**
>
> Finora devi aver notato una cosa: qui non dobbiamo convincerti di niente. Ti mettiamo davanti la strada, e quando vuoi la camminiamo insieme. Media 5 stelle su 7 recensioni, tempi garantiti, prezzo sotto la media del mercato: se qualcosa non tornasse dopo la consegna, il supporto ti accompagna ad applicare il parere.
>
> Ci leggiamo presto.
>
> — Federico e il team di Pictures Writers
**CTA:** doppia (laboratorio / editing) — stessa logica della E5; se entrambe falliscono, esce dalla sequence automaticamente
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
> [Leggi: come scrivere una sceneggiatura →] `/come-scrivere-una-sceneggiatura/`
**CTA:** La guida gratuita in 10 step → `/come-scrivere-una-sceneggiatura/`

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

**Nota sulla cadenza (decisione da prendere in CMS):** il copy del widget newsletter applicato in CRO (§8.2 copywriting) promette "**ogni settimana**". Con una lista di ~700 e ritmo di produzione realistico, **settimanale è insostenibile**, e una promessa disattesa corrode la fiducia. Consiglio: **bi-settimanale** e allineare il copy del widget da "ogni settimana" a "ogni due settimane" (modifica testo in `newsletter.tsx` / admin). In alternativa, se si mantiene settimanale, serve un'email "leggera" (1 link) alternata all'email "piena".

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
| G1 | **Nessun motore sequence** | Nessun modello `EmailSequence` / `EmailSequenceStep` / `EmailSequenceRun`. Il runner scheduler (`SCHEDULER_TARGET_TYPES`) copre POST e SINGLE_SEND ma non l'invio singolo a un contatto con template + relativo step | `scheduler/*`, `prisma/schema.prisma` |
| G2 | **Interazioni incomplete** | `submit_product_form` senza tipo prodotto; mancano `course_purchased`, `editing_purchased`, `first_feedback_request` | `submit-product-form.ts`, `mail.ts`, checkout Stripe handler |
| G3 | **Hook post-acquisto** | Solo il webinar ha email di conferma; acquisti corso/editing non emettono email né interazione | stripe webhook / checkout success |
| G4 | **Token di conferma non consumato** | Soft opt-in: valutare gate doppio opt-in prima di S1/S2 (decisione business: conversioni vs deliverability) | `subscribe.ts`, eventuale rotta `/api/newsletter/confirm` |
| G5 | **Variabili template** | I template usano Handlebars; le sequence avranno bisogno di variabili aggiuntive (`firstName`, `urlSpecifica`, `daysCount`) | `mail.ts` / nuovo `send-sequence-step.ts` |

### Opzioni di implementazione (MVP)

**Opzione A — Runner piggyback su `ScheduledAction` (consigliata, basso rischio):**
1. Nuovo `ScheduledActionType.SEND_TEMPLATE_EMAIL` (o riuso `SEND_EMAIL` con `targetType` diverso es. `EMAIL_CONTACT`).
2. Nuovo handler `send-email-template-handler` che legge `EmailTemplateId` + email destinatario + variabili dall'azione, invia via `sendEmail` (stessa logica di `mail.ts`), registra log/step completion.
3. Al click su `ebook_downloaded` / `user_subscribed` / acquisto: si pianificano gli step futuri (es. `createContactSequenceRuns`) creando le `ScheduledAction` per i day 1/3/5/7/9/12.
4. Exit conditions: nell'handler, prima dell'invio controllo interazioni (`ebook_downloaded` + acquist...) → salta se dovuto.
- Pro: riusa scheduler già testato, contabilità Reminder, niente nuovo cron. Mapping coperto da `schedule-single-send.ts` come pattern.

**Opzione B — Resend Automations (API esterna):** le sequence diventano workflow su Resend (automations + events). Pro: zero modelli sequence in DB, motore robusto. Contro: logica di business nel provider, meno controllabile dagli admin, dipendenza vendor; da valutare quando il volume cresce.

**Consiglio: Opzione A per le prime 2 sequence (S1, poi S2), Opzione B come follow-up se il team preferisce risorse esterne.**

### Checklist di configurazione admin (senza codice, subito)
- [ ] Template `EmailTemplate` da creare nell'editor admin per ogni email S1 (6) e S2 (4) — copy e CTA sono su questo documento.
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
- Conversioni per sequence: **S1 → % che acquista corso o editing entro 30 giorni dalla E6**

### Eventi GA4 da verificare/aggiungere per la catena
`newsletter_signup`/`ebook_download` → `cta_click` (email link → destino prodotto/articolo) → `submit_product_form` → `purchase`. Le email vanno taggate con UTM: `utm_source=email&utm_medium=sequence&utm_campaign=S1-E5` (tutti i link dei template).

### A/B test (1 variabile alla volta, poi documentare)
| Test | Oggetto | Metrica |
|------|---------|---------|
| T-E1 | Subject E1 S1: "Il primo passo (piccolo) da fare oggi" vs "10 minuti per sbloccare la tua storia" | Open rate |
| T-E6 | CTA finale S1: doppia (laboratorio/editing) vs singola (editing) | CTR + conversioni |
| T-CAD | Cadenza newsletter: settimanale vs bi-settimanale (dopo allineamento copy widget) | Unsubscribe + retention apertura |
| T-SUBJ | Pattern subject: "come fare" vs domanda ("Non sai se il tuo copione è pronto?") | Open rate E4 S1 |

### KPI a 60 giorni (per dashboard)
- Crescita iscritti newsletter mese su mese (fonte GSC pagine hub + CRO quick wins)
- Tasso di conversione S1 → acquisto (prima baseline quando G2/G3 saranno chiusi)
- Numero recensioni raccolte via S3b (obiettivo: >7 per consolidare il proof point)
- Unsubscribe rate medio sotto soglia

---

## Changelog
- v1 (2026-09-23) — Programma email fase 7: S1 nurture post-ebook (6), S2 welcome newsletter (4), S3 post-acquisto (3 flussi), S4 newsletter cadence, S5 re-engagement. Copy completa, mappatura infrastruttura, gap (G1-G5) e piano implementazione MVP (Opzione A su `ScheduledAction`), test e metriche.