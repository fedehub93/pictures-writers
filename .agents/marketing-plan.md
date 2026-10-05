# Pictures Writers — Piano di Marketing v1

**Preparato con:** metodologia `marketing-plan` (fCMO / framework AARRR, 13 sezioni)
**Per:** Federico Verrengia e il team di Pictures Writers
**Data:** 2026-10-02
**Orizzonte:** ottobre 2026 – settembre 2027
**Status:** Bozza v1 — per revisione del team

> Come leggere questo documento. Le sezioni 4–8 (Acquisition, Activation, Retention, Referral, Revenue) dicono *cosa facciamo*. La sezione 12 è il menù completo di *cosa è possibile* (139 tattiche). La sezione 9 è ciò che parte subito. Ogni riferimento interno usa `§N`.

---

## 1. Executive summary

Il piano ottimizza una cosa sola: **convertire la macchina di contenuti che Pictures Writers già possiede in clienti paganti tracciati**. Non ci serve più traffico a tutti i costi, né un canale nuovo. Ci serve capire — con numeri veri — dove si perde la persona che legge un articolo e non arriva mai al laboratorio, al corso o all'editing. Tutto il resto del piano è costruito attorno a questa conversione.

**Tre grandi scommesse, in ordine di leva.**

1. **Chiudere il buco tra lead e cliente pagante.** Abbiamo 226 articoli, due hub riscritti a regola d'arte, 800+ iscritti e un'offerta chiara (laboratorio €300, editing Double View da €50). Il top-funnel è già tracciato: GTM/GA4 registrano newsletter, download ebook, submit dei form e i click sulle CTA. Quello che manca è l'anello finale — le conversioni a pagamento si chiudono **fuori dal sito, via email e bonifico**, quindi il ricavo non è visibile in analytics. Prima mossa assoluta: attribuire la conversione pagata (riconciliazione dei pagamenti offline o evento server-side) e completare le interazioni interne (`course_purchased`, `editing_purchased`, tipo-prodotto nel form). Finché non esiste, sappiamo quanti lead entrano ma non quale contenuto porta ricavo.
2. **Sfruttare il vantaggio asimmetrico dell'AI search.** Il sito è già server-rendered e le nostre fondamenta di agent-readiness sono in piedi (`llms.txt`, robots policy, Organization JSON-LD, is-agentic 68/100). Nel mondo anglofono la sceneggiatura è satura; in italiano siamo una nicchia quasi vuota. Chiuderemo la roadmap AI (§4, Move 2): answer block da 40–60 parole, FAQ sui hub, `/pricing.md`, e — soprattutto — **dati originali** (il sondaggio "Cosa pensano gli sceneggiatori italiani") che nessun concorrente italiano possiede. I dati originali sono l'asset che gli LLM citano e che i concorrenti non possono copiare.
3. **Compilare il percorso, non i singoli pezzi.** Il percorso esiste già: articolo → lead magnet → email → feedback gratuito sulla prima pagina → laboratorio → editing. I lead magnet (5 template) e il laboratorio 1:1 sono i pezzi mancanti che rendono il percorso continuo invece che spezzato. Il feedback gratuito sulla prima pagina è il nostro micro-impegno a costo zero: è l'attrezzo che converte meglio di qualsiasi sconto.

**Come sarà tra dodici mesi, ragionevolmente.**

- Ogni euro di ricavo è attribuito a un canale e a un contenuto. Esiste un tasso lead→cliente, non una sensazione.
- La newsletter passa da 800 a 1.500+ iscritti, alimentata dai 5 lead magnet e dal percorso email S1/S2 già attivo.
- Il cluster "Come scrivere" e "Come diventare sceneggiatore" produce posizionamenti stabili in pagina 1 e citazioni negli AI Overview.
- Il **Laboratorio 1:1** è lanciato come prodotto stabile a coorti (max 5 posti), con il gruppo a €300 allineato.
- Le sequenze S1, S2 e S4 sono già live; S3 (post-acquisto) e S5 (re-engagement) si aggiungono nel corso dell'anno; le recensioni passano da 7 a 15+.
- Il capitolo dati originali produce il primo report "Stato della sceneggiatura italiana", asset di autorità e di PR.
- I canali organici (blog + newsletter + passaparola studenti) generano la grande maggioranza dei nuovi clienti, con il paid ancora spento — per scelta, non per mancanza.

**Priorità dei primi 90 giorni** (il resto del documento le rende eseguibili):

1. Rendere misurabile la conversione pagata: riconciliare/attribuire i pagamenti offline (email + bonifico) e completare le interazioni interne (`course_purchased`, `editing_purchased`, tipo-prodotto nel form).
2. Produrre i 5 lead magnet e metterli nel funnel con CTA su hub e articoli.
3. Attivare le sequenze post-acquisto S3 (finora bloccate dalle interazioni mancanti) e leggere i dati di S2.
4. Lanciare il Laboratorio 1:1 (pagina prodotto + waitlist) come coorte con scadenza.
5. Eseguire la finestra laboratori di ottobre (8→27 ott, avvio 3/11) con la newsletter già scritta.
6. Chiudere i quick win CRO rimasti e verificare la gerarchia CTA homepage con i dati di ricavo.

Tutto il resto compone sopra queste sei.

---

## 2. Quadro strategico

Questa sezione distilla posizionamento, ICP e voce in una pagina che chiunque del team può leggere per orientarsi. Il dettaglio completo vive in `.agents/product-marketing.md`.

### Cos'è Pictures Writers, in una frase

La piattaforma italiana dedicata alla formazione e alla crescita professionale degli sceneggiatori cinematografici e televisivi: editing con il metodo Double View, corsi e masterclass, ebook pratici e una community di supporto, tutto in un unico posto.

### La categoria che rivendichiamo

Non siamo una scuola di sceneggiatura e non siamo un freelancer dell'editing. **Rivendichiamo una categoria nuova: la piattaforma che accompagna lo sceneggiatore dall'ispirazione al copione finito.**

Il frame che definisce la categoria: *le scuole ti vendono un calendario, i freelancer ti vendono un parere, i libri ti vendono teoria. Noi ti accompagniamo in un percorso continuo — impari, ricevi feedback, migliori, torni — dentro un solo ecosistema italiano.* Il metodo **Double View** (due consulenti che analizzano la sceneggiatura in modo indipendente e poi confrontano il parere) è il simbolo concreto di questa promessa: non l'opinione di una persona sola, ma due occhi esperti.

### Per chi siamo (ICP distillato)

Sceneggiatori italiani, aspiranti e professionisti. Tre profili (da `.agents/product-marketing.md`):

- **Aspirante**: non sa da dove iniziare, informazioni frammentate → vuole un percorso chiaro dalla teoria alla pratica.
- **Alle prime armi**: ha scritto qualcosa, non sa se è buono, è isolato → vuole un feedback qualificato e costruttivo.
- **Professionista**: poco tempo, rete ristretta → vuole un parere esterno rapido (7–10 giorni) e specializzato.

- **Problema dichiarato:** "Non so da dove iniziare / non so se è buono / non ho nessuno che mi dia un parere onesto."
- **Problema reale:** solitudine nel processo creativo e assenza di un riferimento italiano strutturato.
- **Cosa comprano davvero:** non un corso — la sensazione di non essere soli, la certezza di crescere, e un percorso che non li faccia abbandonare.

### La logica del modello di business

Vendita diretta di servizi (editing Double View), corsi/laboratori (€300) e prodotti digitali (ebook, webinar), con un funnel content-led: il blog porta traffico organico → il lead magnet gratuito cattura l'email → la sequenza email (S1 nurture post-ebook, S2 welcome) nutre → il laboratorio o l'editing monetizza. Un programma di affiliazione Amazon aggiunge ricavi indiretti. Il motore è **la newsletter proprietaria**: la 800+ iscritti è il canale che non dipende dall'algoritmo. L'intero piano è costruito per far comporre questo asset (audience → contenuto → conversione), non per comprare traffico.

> **Market-quality gate (problema × frequenza).** Scrivere una sceneggiatura è un **problema grande ma a bassa frequenza**: è enormemente importante quando accade, ma accade sporadicamente (un soggetto, un copione, un concorso ogni tanto). Questo ci colloca nel quadrante "grande problema / bassa frequenza": vincibile, ma **costoso da tenere top-of-mind con il paid**. La conseguenza strategica è netta: la newsletter e il contenuto organico sono i meccanismi giusti per restare presenti; il paid sarebbe una tassa ricorrente per ricordare a qualcuno un bisogno che non sente oggi. Per questo il paid è rimandato (§10, §13).

### Voce del brand (non negoziabile)

Da `.agents/product-marketing.md`, valida per ogni sezione e ogni copy:

- **Tono:** italiano caldo, professionale ma accessibile, ispirazionale senza essere retorico.
- **Stile:** diretto e conversazionale, uso del "tu", parole semplici ma precise, niente linguaggio accademico.
- **Personalità:** esperto ma empatico, appassionato di scrittura, community-oriented, pratico, italiano con orgoglio.
- **Parole da usare:** sceneggiatura, copione, editing, consulenza, feedback, Double View, percorso, formazione, pratica, crescita, community, ispirazione.
- **Parole da evitare:** "corso online generico", "lezione", "scuola" (siamo più di una scuola), "prodotto", "servizio generico".
- **CTA:** mai pressante, al massimo un invito. Firmato nel collettivo ("il team di Pictures Writers"), non in prima persona.

Questa voce vincola ogni riga del piano. In caso di dubbio: riscrivi più caldo e più concreto.

---

## 3. Stato attuale

Da dove partiamo: team, budget, cosa è già in moto, cosa è bloccato, con il punteggio sul rubric a 17 sezioni.

### Composizione del team (superficie di marketing)

| Persona | Ruolo | Superficie di marketing |
|---|---|---|
| **Federico Verrengia** | Fondatore, autore, operatore | Tutto: copy, SEO, contenuti, email, prodotto, admin, prezzi, relazioni (Autore nel JSON-LD; firma "Federico e il team") |
| **Lorenzo Carapezzi** | Co-autore / collaboratore | Contenuti e autorevolezza (esposto nel BlogPosting JSON-LD; "Federico e Lorenzo") |
| **Studenti passati (13)** | Audience | Testimonial, passaparola, upsell al 1:1 — non forza lavoro |
| **Hire futuro** | (da definire) | Primo innesto quando i ricavi lo giustificano |

**Nessuna figura dedicata al marketing.** Federico copre strategia + esecuzione con l'aiuto degli strumenti. Al Tier attuale (vedi sotto) questo è corretto: il piano deve eseguire con il team attuale + la stack già in casa. Il primo innesto — quando i ricavi lo sostengono — è un profilo ibrido contenuti + lifecycle (Manager/Lead), non un VP/CMO, e va valutato dopo che la misurazione e i lead magnet hanno prodotto i primi dati di conversione.

### Budget di marketing (attuale)

- **Paid acquisition:** €0 (per scelta; vedi §4 e §10).
- **Tooling:** ~€0–100/mese. Hosting, dominio, caselle email, invio transazionale (Resend/SendGrid), UploadThing, Stripe (commissioni per transazione), GA4/GTM/GSC gratuiti. Il motore email/automation e l'admin sono interni (nessun costo SaaS ricorrente).
- **Contenuti:** costo = tempo di Federico (non monetizzato).
- **Collaboratori:** occasionali (es. Lorenzo), non retainer ricorrenti.

**Tier:** **Tier 1 — bootstrap / pre-seed** per `funding-stage-unlocks.md`. Paid €0, tooling minimo, founder-led. **Implicazione:** i 90 giorni devono produrre risultati senza tirare leve che richiedono budget. E-commerce a bassa frequenza: nessun paid finché unit economics non sono misurate.

### Fase di crescita

Modello content + commerce one-off (non subscription SaaS). Equivalente: **Fase 1–2 early** (≈ €0–10K/anno di ricavo equivalente), con un vincolo dominante chiaro: **non l'acquisizione, ma la conversione e la misurazione**. Arrivano ~1.000 utenti unici/mese e non sappiamo quanti diventano clienti. Il collo di bottiglia è tra Awareness e Revenue, non a monte.

### Cosa è già fatto (da riconoscere e su cui costruire)

| Asset | Stato | Leva di marketing |
|---|---|---|
| 226 articoli pubblicati (3 categorie, 16 tag) | Live | Base SEO ampia; serve fiocco (hub + interlinking) |
| Hub 1A "Come scrivere una sceneggiatura" | Riscritto e pubblicato (22/09/2026) | Pillar SEO centrale; baseline 98 impr., 0 click, pos. 10.94 |
| Hub 1B "Come diventare sceneggiatore" | Riscritto e pubblicato (01/10/2026) | Pillar formazione; struttura SERP-first + FAQ |
| 800+ iscritti newsletter | Live | Canale proprietario; base di ricavo |
| 500+ download ebook gratuito | Live | Lead magnet di ingresso funzionante |
| 7 recensioni, media 5★ | Live | Prova sociale; da portare a 15+ |
| Metodo Double View | Live | Differenziatore unico; prezzo sotto mercato |
| Feedback gratuito prima pagina | Live (`/feedback-gratuito-sceneggiatura/`) | Micro-impegno a costo 0, asset di conversione |
| Infrastruttura email + Automations engine | Live | S1, S2 e S4 pubblicate; S3/S5 progettate |
| Tracciamento GTM/GA4 | Live | Eventi `newsletter_signup`, `ebook_download`, `cta_click`, submit form |
| S1 nurture post-ebook (7 email) | Implementata e pubblicata | Motore di conversione ebook→laboratorio |
| S2 welcome newsletter (4 email) | Implementata e pubblicata | Onboarding iscritto → ebook → merge in S1 |
| S4 newsletter (playbook + numeri di ottobre) | Live | Ritmo settimanale, 4 numeri + 1 Extra scritti |
| Fondamenta AI/agent-readiness | Live (68/100) | `llms.txt`, `llms-full.txt`, robots policy, Organization JSON-LD, OG |
| Schema JSON-LD (Product, Course, Event, FAQ, ItemList, Breadcrumb) | Live | Rich result + citabilità AI |
| Piano di lancio Laboratorio 1:1 | Progettato (no date) | Nuova offerta pronta per Q1 |
| CRO quick win (hero, banda CTA, gerarchia laboratori prima) | Implementati (22–23/09) | Conversione homepage |
| Programma affiliazione Amazon | Live (indiretto) | Ricavo passivo |

### Cosa è in corso (progettato ma non spedito)

| Elemento | Stato | Blocco |
|---|---|---|
| 5 lead magnet (Template Soggetto, Scaletta 6-12-6, Checklist Format, Logline, Calendario Concorsi 2027) | Progettati | Da produrre (PDF + pagina) |
| Pagina One hub `/pagina-uno` | Progettato | Da creare; link in attesa |
| Laboratorio 1:1 | Progettato | Naming, date, sistema prenotazione slot |
| S3 post-acquisto (corso/editing) | Progettato | Gap interazioni G2/G3 |
| S5 re-engagement | Progettato | Gap interazioni + decisione incentivo |
| Attribuzione della conversione pagata (offline via email/bonifico) | Assente | Stripe presente nel codice ma non in uso: nessun evento `purchase` online |

### Cosa è bloccato (e va sbloccato questo trimestre)

| Problema | Costo dell'inazione | Azione |
|---|---|---|
| Conversione pagata non attribuita (bonifico/email) | Sappiamo quanti lead entrano, non quanti pagano né da quale contenuto | Riconciliare i pagamenti offline + evento server-side o marker “pagato” in admin (§5, §8, §9) |
| Interazioni G2 mancanti (`course_purchased`, `editing_purchased`, `first_feedback_request`) | S3/S5 impossibili; ricavi non attribuibili al funnel | Aggiungere gli eventi (sett. 1–2) |
| Nessun lead magnet oltre all'ebook | Il funnel cattura solo dal blog verso un unico asset | Produrre i 5 template (§4, Move 3) |
| 1:1 senza date/naming/prenotazione | Il prodotto più redditizio resta fermo | Chiudere naming, date, sistema slot (§5, §8) |
| Prezzo S1-E5 template a €200 vs €300 reale | Email pubblicata con prezzo sbagliato | Riallineare il template a €300 (immediato) |
| Pagina uno hub non live | Link in sospeso nei due hub; cluster analisi incompleto | Creare `/pagina-uno` (§4) |
| Q4 2027 (lug–set) senza calendario | Buco nella programmazione a 9 mesi | Estendere il calendario in Q3 (§10) |

### Snapshot rubric (17 sezioni) — *scored from materials*

Punteggio 0–5 da materiali esistenti (`.agents/*`), non da audit formale. Federico può contestare qualsiasi voce con dati migliori.

| # | Sezione | Punteggio | Note |
|---|---|---|---|
| 1 | Positioning | **4** | Nicchia chiara + Double View distintivo; articolazione esterna da rafforzare |
| 2 | Customer research | **2** | VOC catturata nei materiali; nessuna pratica di ricerca continua |
| 3 | Homepage | **3** | Gerarchia CTA corretta (lab prima); copy hero e prova sociale da affinare |
| 4 | Sales / product pages | **3** | Pagine esistono con FAQ + schema; prezzo vs mercato da rendere più esplicito |
| 5 | Conversion pages | **3** | Feedback gratuito + servizi; mancano pagine dedicate ai lead magnet |
| 6 | Competitor comparison | **2** | Pianificate (CSC vs Holden vs Bottega), non ancora live |
| 7 | Resources / content | **4** | 226 articoli, 2 hub riscritti, calendario 60/30/10 |
| 8 | Onboarding | **3** | S2 live; percorso ebook→S1 attivo; post-acquisto da completare |
| 9 | Email lifecycle | **4** | S1, S2 e S4 live; restano S3/S5 |
| 10 | Sales material | **2** | Testimonial + pagine servizio; materiale di vendita strutturato assente (impatto basso nel B2C) |
| 11 | Messaging | **4** | Voce documentata e coerente; "siamo più di una scuola" da consolidare ovunque |
| 12 | Pricing | **3** | Listino chiaro (€300 / da €50); non testato, margini non riconciliati |
| 13 | CRO | **2** | Piano e quick win fatti; nessun test eseguito, nessuna strumentazione |
| 14 | GTM launches | **2** | Laboratori a coorti funzionano; 1:1 non lanciato, nessun playbook riutilizzabile |
| 15 | Ads | **0** | Nessun paid — riflette il Tier, non una debolezza (da non penalizzare) |
| 16 | SEO | **3** | Base ampia ma traffico minimo (1.000 utenti/mese, 0 click su hub); cluster in costruzione |
| 17 | Internationalization | **1** | Italiano-only, esplicitamente rimandato (§13) |

**Totale: 45 / 85 (53%).**

**Lettura della forma.** Forte su **voce (11), contenuti (7), posizionamento (1)** — la "testa" del brand è solida e distintiva. Debole su **misurazione e conversione (13), onboarding (8), lancio (14) e competitor (6)** — la "coda" operativa che trasforma l'attenzione in ricavi non è ancora cablata. La forma dice esattamente dove va il piano: **Activation + Revenue sono le sezioni più lunghe**, perché lì è il buco più largo. Acquisition resta importante ma è già in gran parte costruita.

---

## 4. Acquisition

> *"Come gli sconosciuti scoprono Pictures Writers?"*

### Stato attuale

Acquisizione quasi interamente organica:

- **Ricerca organica:** 226 articoli; 2.400 visualizzazioni/mese, ~1.000 utenti unici/mese, 899 nuovi utenti/mese da organic search. Due hub riscritti. Ma traffico basso e 0 click sugli hub (posizione media ~11): siamo vicini, non in pagina 1.
- **Newsletter:** 800+ iscritti, widget blog; ultima programmazione ferma da 2–3 mesi (riattivata a ottobre).
- **Social rented:** Instagram/LinkedIn ad hoc, nessuna cadenza strutturata.
- **Borrowed:** guest post/podcast potenziali (Molly Bloom, Bottega Finzioni) non attivati.
- **Affiliazione Amazon:** passiva.
- **Paid:** spento.

**Diagnosi:** non è un problema di canale mancante. È un problema di **finitura e amplificazione** di ciò che esiste: manca la pagina 1 sui keyword core, mancano i lead magnet, e i contenuti non sono atomizzati sui social.

### Il piano

**Move 1 — Chiudere i cluster SEO (motore principale).**
Eseguire il calendario di `.agents/content-strategy.md`: completare i cluster 1A (Come scrivere) e 1B (Formazione) con gli spoke pianificati, creare l'hub `/pagina-uno`, pubblicare 4–6 nuove analisi a trimestre. Regola: ogni spoke linka l'hub e viceversa (interlinking), ogni articolo ha una CTA verso un lead magnet. Obiettivo: portare "sceneggiatura" e "come scrivere una sceneggiatura" dalla posizione ~11 alla pagina 1, e aumentare il CTR da 0%.

**Move 2 — Chiudere la roadmap AI/agent-readiness (vantaggio asimmetrico).**
Da `.agents/ai-seo.md` §7.2: (a) answer block da 40–60 parole su 6 pagine chiave; (b) FAQ + `FAQPage` sui hub (non solo prodotti); (c) `/pricing.md` con il listino editing; (d) **dati originali**: il sondaggio "Cosa pensano gli sceneggiatori italiani" → report "Stato della sceneggiatura italiana"; (e) presenza off-site (3 articoli LinkedIn, 3 analisi Pagina Uno su YouTube con trascrizione, 5 pitch podcast). I dati originali sono la mossa a leva più alta: nessun concorrente italiano li ha, e gli LLM citano statistiche (+37%) e fonti (+40%).

**Move 3 — Costruire i 5 lead magnet (carburante del funnel).**
Template Soggetto, Template Scaletta 6-12-6, Checklist Format, Template Logline, Calendario Concorsi 2027. Ognuno: PDF + pagina di atterraggio + CTA su 2–3 articoli affini. Trasformano il traffico in email, che è l'asset che non dipende dall'algoritmo. Calendario Concorsi è il più "fresco" e ricorrente (aggiornamento annuale).

**Move 4 — Newsletter come canale di acquisizione, non solo di retention.**
Ottimizzare il widget (già fatto in parte in CRO), aggiungere CTA al lead magnet in fondo a ogni articolo, e usare la welcome S2 per convertire il nuovo iscritto in fruitore del percorso. Il "monthly newsletter" (#49) qui è innanzitutto un cattura-email.

**Move 5 — Social rented a bassa frequenza, ad alta atomizzazione.**
Regola ORB di content-strategy: ogni long post → 3–5 clip social, 1 email, 1 video, 1 infografica, 1 PDF. Cadenza: Lun quote/scena, Mer pillola tecnica, Ven suggerimento pratico/BTS Double View. LinkedIn come articoli lunghi (autorità), Instagram per pillole, YouTube per le analisi Pagina Uno (con trascrizione = SEO). Bassa frequenza, alta resa per unità di sforzo.

**Move 6 — Borrowed: podcast e collaborazioni (a costo ~0).**
Un pitch podcast al mese; cross-promo con Molly Bloom / Bottega Finzioni; guest post su testate di settore. Ogni apparizione è un backlink + un prestito di fiducia.

**Move 7 — Affiliazione Amazon (passiva, da non ottimizzare).**
Resta come ricavo indiretto. Nessuna priorità operativa nel 12 mesi.

**Move 8 — Paid layer (rimandato, esplicitamente).**
Held. Non attivare prima di: (a) conversione pagata attribuita, (b) pagina 1 su almeno un keyword core, (c) almeno 2 lead magnet live, (d) unit economics note. Il quadrante "grande problema / bassa frequenza" rende il paid strutturalmente caro per noi: meglio restare organici finché i ricavi non finanziano un test vero.

### Mosse di acquisizione nei 90 giorni

- **Sett. 1–2:** Attribuire la conversione pagata offline; produrre lead magnet 1 (Template Soggetto) e 2 (Calendario Concorsi 2027); pagina One hub in costruzione.
- **Sett. 3–4:** Pubblicare `/pagina-uno`; produrre lead magnet 3–4 (Scaletta, Checklist Format); avviare i pitch podcast (1); atomizzare i 2 hub in clip social.
- **Sett. 5–8:** 4 spoke nuovi fra 1A/1B; lead magnet 5 (Logline); prima analisi Pagina Uno video con trascrizione; articolo LinkedIn di autorità #1.
- **Sett. 9–12:** 4 nuove analisi Pagina Uno; sondaggio social "sceneggiatura italiana"; `/pricing.md` live; articolo LinkedIn #2; audit GSC e aggiornamento interlinking.

### Prospettiva acquisizione a 12 mesi

- **Q1 (ott–dic 2026):** cluster 1A/1B completati; 5 lead magnet live; `/pagina-uno` live; dati originali avviati; utenti organici 1.000→1.200/mese.
- **Q2 (gen–mar 2027):** contenuto a cadenza trimestrale stabile; prime posizioni stabili in pagina 1 su keyword di coda; articoli LinkedIn in cadenza; podcast attivi.
- **Q3 (apr–giu 2027):** il cluster "Come scrivere" produce traffico stabile; report "Stato della sceneggiatura italiana" pubblicato; YouTube Pagina Uno con trascrizioni indicizzate.
- **Q4 (lug–set 2027):** estensione contenuti (misurata in Q3); nuova S-curve di canale valutata (community o programmatico); paid pilot solo se unit economics lo giustificano.

### Skill + strumenti

- **Skill:** `content-strategy`, `seo-audit`, `ai-seo`, `schema`, `competitors`, `social`, `launch`, `copywriting`, `analytics`, `marketing-psychology`.
- **Strumenti:** GA4 + GTM + GSC (gratuiti), Resend/SendGrid, admin interno (Puck/TipTap), UploadThing (Stripe presente ma non in uso). MCP/API consigliati da cablare in Q1: **GA4 MCP**, **Ahrefs o DataForSEO API** (keyword/posizioni), **Typefully** (cadenza social). Stato: **non ancora cablati** → voce in §13.

---

## 5. Activation

> *"Una volta che qualcuno ci prova, vive un'esperienza che lo porta a convertirsi?"*

### Stato attuale

Il percorso esiste ma ha interruzioni: blog → (widget newsletter / popup / CTA) → ebook/template → email → feedback gratuito → laboratorio/editing. Il top-funnel è **già tracciato** in GTM/GA4 (newsletter, download, submit, `cta_click`): sappiamo quante iscrizioni e download avvengono. Il buco è a valle: la conversione a pagamento è **offline** (email + bonifico), quindi non sappiamo quante richieste diventano clienti. Problemi noti (da `.agents/cro.md`): popup blog non configurato bene, form a 4 campi, prova sociale non above-the-fold sulle pagine servizio. Sul fronte email, S1 e S2 sono live: chi si iscrive riceve già l'onboarding.

### Il piano

**Move 1 — Completare la misurazione dove manca (prerequisito di tutto).**
Il top-funnel è già tracciato via GTM/GA4 (`newsletter_signup`, `ebook_download`, `cta_click`, submit dei form). Il buco è a valle: la conversione a pagamento si chiude **offline (email + bonifico)**, quindi non esiste un evento `purchase` e non possiamo attribuire il ricavo a un contenuto o a una sequenza. Mancano anche il **tipo-prodotto** nel `submit_product_form` e le interazioni interne `course_purchased`/`editing_purchased`. Da fare: (a) chiudere il loop del pagamento offline — marker “pagato” in admin/CRM + evento server-side (GA4 Measurement Protocol) o riconciliazione manuale; (b) aggiungere il tipo-prodotto al form; (c) emettere le interazioni di acquisto. È la mossa #1 del trimestre.

**Move 2 — Misurare e ottimizzare la welcome S2 (ora live).**
S2 è già pubblicata. Il passo successivo è leggerla con i dati: tasso di apertura e clic per email, quanti scaricano l'ebook e passano a S1, dove si perde la persona. Ottimizzare oggetto e CTA delle 4 email (Day 0/2/5/8) sui primi dati.

**Move 3 — Rendere il feedback gratuito il micro-impegno centrale.**
È a costo zero e già live. Va messo dove la persona ha appena ricevuto valore: dopo aver letto un articolo su struttura/dialogo, dopo E4 di S1, sulle pagine dei servizi. Logica: "prima pagina gratis" = assaggio del Double View = ponte naturale all'editing a pagamento.

**Move 4 — Completare i quick win CRO e le pagine di conversione.**
Chiudere i residui di `.agents/cro.md`: rating vicino al prezzo, CTA sticky mobile sull'editing, doppia CTA, "Cosa ricevi esattamente", risk reversal, articoli correlati. Creare le pagine di atterraggio dei 5 lead magnet (una per asset).

**Move 5 — Verificare la gerarchia CTA homepage con i dati di ricavo.**
La gerarchia è stata invertita (Laboratori & Corsi primari, Editing secondario) sulla base di un rapporto corsi:editing di 13:1 da confermare. Appena la misurazione è live, verificare con lo split di ricavo reale in GA4 e correggere se necessario.

**Move 6 — Ottimizzare il flusso richiesta→preventivo→pagamento (offline).**
Non c'è un checkout online: la conversione si chiude via email e bonifico. Ottimizzare il passaggio tra submit del form, risposta via email, istruzioni di pagamento e conferma: chiarezza su cosa si riceve, tempi (7–10 giorni per l'editing), istruzioni bonifico semplici, conferma rapida. Cross-cut con Revenue.

### Mosse di attivazione nei 90 giorni

- **Sett. 1–2:** Attribuire la conversione pagata (pagamenti offline) + tipo-prodotto e interazioni di acquisto. Baseline lead→cliente.
- **Sett. 3–4:** Lettura dei primi dati di S2 e ottimizzazione. Prime pagine lead magnet.
- **Sett. 5–8:** Quick win CRO residui. CTA feedback gratuito sugli articoli di struttura/dialogo.
- **Sett. 9–12:** Prima lettura conversione blog→newsletter→lead magnet; verifica gerarchia homepage.

### Prospettiva attivazione a 12 mesi

- **Q1:** Conversione pagata attribuita; S2 monitorata e ottimizzata; tasso lead→cliente noto.
- **Q2:** Tasso newsletter→lead magnet noto; prime A/B sul copy delle CTA; flusso richiesta→pagamento ottimizzato.
- **Q3:** Attivazione stabile; test su form (campi, micro-copy) e popup.
- **Q4:** Onboarding non più il collo di bottiglia; focus su Retention/Referral.

### Skill + strumenti

- **Skill:** `onboarding`, `signup`, `cro`, `popups`, `copywriting`, `copy-editing`, `ab-testing`, `marketing-psychology`.
- **Strumenti:** GA4/GTM, admin interno (Puck/TipTap), sistema email/Automations, Stripe (potenziale, non in uso). MCP consigliati: **GA4 MCP**; per il pagamento offline serve (a) un marker in admin/CRM e (b) un evento server-side via GA4 Measurement Protocol.

---

## 6. Retention

> *"Una volta che qualcuno si converte, resta e si approfondisce?"*

### Stato attuale

S1 (nurture post-ebook) e S2 (welcome) sono live. S4 (newsletter) ha un playbook e i numeri di ottobre scritti. S3 (post-acquisto) e S5 (re-engagement) sono progettate ma bloccate dai gap di tracking. Sul lato relazione: 7 recensioni 5★, 13 studenti passati (base per upsell e passaparola). Manca la raccolta sistematica di recensioni post-acquisto e la segmentazione `fans` vs `lead` (progettata in S4).

### Il piano

**Move 1 — Completare il percorso email (S3 e S5).**
S1, S2 e S4 sono già live. I prossimi tasselli sono il post-acquisto (S3) e il re-engagement (S5); S4 prosegue a cadenza settimanale (già promessa nel widget e negli hub) con formato alternato piena/leggera, più lo speciale trimestrale.

**Move 2 — Sbloccare S3 (post-acquisto) sfruttando i nuovi eventi.**
Con `course_purchased` e `editing_purchased` cablati: S3a post-laboratorio (4 email: orientamento → cross-sell editing → richiesta recensione), S3b post-editing (3 email: gestione attesa → recensione → cross-sell formazione), S3c post-webinar (già parziale). Il post-acquisto è la leva più diretta sulla Retention e sulla prova sociale.

**Move 3 — Trasformare il post-acquisto in raccolta recensioni.**
Target: da 7 a 15+ recensioni. S3b e S3a chiedono la recensione nel momento di massima soddisfazione (dopo la consegna dell'editing, a fine laboratorio). Le recensioni alimentano prova sociale, SEO/schema e la sezione testimonianze.

**Move 4 — Attivare S5 (re-engagement).**
Trigger 30–60 giorni di non-apertura fra i non-acquirenti: 3–4 email in 2 settimane (check-in → valore → incentivo → "Rimani / Non scrivetemi più"). Decisione business da confermare: l'incentivo è solo un nuovo ebook/template per i non-acquirenti; uno sconto solo se il margine lo consente.

**Move 5 — Segmentazione `fans` vs `lead`.**
Stesso contenuto, CTA finale diversa: ai `lead` (mai acquistato) spingi il percorso gratuito → laboratorio; ai `fans` (già clienti) spingi editing/upsell e community. Aumenta la rilevanza senza aumentare la produzione.

**Move 6 — Supporto come marketing e community.**
Risposte curate, presenza nei commenti, gruppi/community di sceneggiatori. Nel nostro quadrante, la relazione continua è ciò che riduce l'abbandono del percorso.

### Mosse di retention nei 90 giorni

- **Sett. 3–4:** Segmentazione audience `newsletter`/`ebook_lead`/`clienti` pronta; S2 già live.
- **Sett. 5–8:** S4 a cadenza settimanale stabile; footer unsubscribe + `List-Unsubscribe` + GDPR sui sequence email; warm-up dominio.
- **Sett. 9–12:** S3a/S3b attivate con i nuovi eventi; prima campagna raccolta recensioni.

### Prospettiva retention a 12 mesi

- **Q1:** S2 e S4 stabili; recensioni verso 10–12.
- **Q2:** S3 attive; S5 attiva; recensioni 12–15; open rate 25–40%, click 3–8%.
- **Q3:** Segmentazione matura; prime coorti di studenti che tornano per un secondo percorso.
- **Q4:** Retention non più critica; passaparola studenti misurato come canale.

### Skill + strumenti

- **Skill:** `emails`, `churn-prevention`, `copywriting`, `copy-editing`, `popups`, `ab-testing`.
- **Strumenti:** Automations engine interno, `EmailTemplate`/`EmailSingleSend`/`EmailAudience`, Resend/SendGrid, admin. **Questa è la parte più matura della stack**: S1 è già prova che funziona.

---

## 7. Referral

> *"Gli utenti fidelizzati portano altri utenti — e a che costo?"*

### Stato attuale

Nessun programma formale. Esiste però il segnale più forte possibile: **passaparola spontaneo e studenti soddisfatti** (13 studenti passati, 7 recensioni 5★). Il programma di affiliazione Amazon è passivo (ricavi, non acquisizione). Nessuna meccanica di referral tracciata.

### Il piano

**Move 1 — I 13 studenti passati come referral-zero.**
Fase 1: coinvolgere gli studenti passati come testimonial e come fonte di passaparola controllato. Un invito a "porta un amico al prossimo laboratorio" con un riconoscimento semplice (credito su un editing futuro, menzione) senza sconti che erodono il margine. È la campagna referral più a buon mercato che abbiamo.

**Move 2 — Raccolta sistematica di testimonial e casi.**
Trasformare ogni studente soddisfatto in prova sociale strutturata (video breve, citazione, prima/dopo sul soggetto). Alimenta pagine prodotto, email e social.

**Move 3 — Passaparola dopo il valore (share-after-value).**
Dopo la consegna di un editing o a fine laboratorio, momento naturale per un invito: "Conosci qualcuno che sta scrivendo? Mandagli il feedback gratuito sulla prima pagina." Il feedback gratuito è l'asset condivisibile a costo zero.

**Move 4 — Programma referral newsletter (Q3+).**
Chi porta 2–3 iscritti sblocca un lead magnet premium o una consulenza breve. Meccanica leggera, tracciata via UTM/link dedicato. Da costruire solo dopo che la newsletter cresce e la conversione è misurata.

**Move 5 — Cross-promo e borrowed referral.**
Collaborazioni con Molly Bloom / Bottega Finzioni e testate di settore: scambio di audience, non pagamento. Ogni cross-promo è una "S-curve episodica" ad alto rendimento se il partner è affine.

**Move 6 — Affiliazione (indiretta).**
Amazon resta passivo. Un vero programma affiliati (per chi promuove corsi/editing) è Q4+/Skip nel 12 mesi: il volume non lo giustifica ancora.

### Mosse referral nei 90 giorni

- **Sett. 5–8:** Coinvolgere 3–5 studenti passati per testimonial + invito passaparola al laboratorio di novembre.
- **Sett. 9–12:** Template "porta un amico" per il prossimo ciclo laboratori; CTA condivisione feedback gratuito.

### Prospettiva referral a 12 mesi

- **Q1:** Testimonial raccolti; primo passaparola strutturato per i laboratori.
- **Q2:** 5–10 testimonial nuovi; condivisione feedback gratuito attiva.
- **Q3:** Programma referral newsletter scoping ed eventuale lancio.
- **Q4:** Referral/passaparola misurato come quota di nuovi clienti.

### Skill + strumenti

- **Skill:** `referrals`, `social`, `copywriting`, `emails`, `marketing-website-design`.
- **Strumenti:** UTM/GA4 per attribuzione; sistema email per lifecycle ambassador; eventualmente Dub.co in Q3+.

---

## 8. Revenue

> *"Cosa facciamo pagare, chi paga, e come compone?"*

### Stato attuale

| Offerta | Prezzo | Segnale |
|---|---|---|
| Laboratorio di scrittura di un soggetto (gruppo) | €300 | 5ª edizione, 13 studenti, 5 sessioni, soggetto al 3° draft |
| Laboratorio 1:1 (individuale) | €300 (early-bird €270, founder €250) | Progettato, max 5 posti, non lanciato |
| Editing Double View — sceneggiatura/soggetto | da €50 (soggetto) | 2 consulenti, 7–10 giorni |
| Webinar | — | Prodotto esistente, schema Course/Event |
| Ebook "Introduzione alla sceneggiatura" | Gratuito | Lead magnet |
| Feedback prima pagina | Gratuito | Micro-impegno |
| Affiliazione Amazon | Variabile | Ricavo indiretto passivo |

**Conversione pagata offline, non visibile in analytics** — è la lacuna numero uno. I pagamenti si chiudono fuori dal sito, via email e bonifico: Stripe è presente nel codice ma **non è in uso**, quindi non esiste un evento `purchase`. Sappiamo quanti lead entrano (newsletter, download, submit dei form) ma non quanti *pagano* né da quale contenuto. Non conosciamo ARPC, repeat rate, CAC, né il tasso lead→cliente pagante. Il rapporto corsi:editing 13:1 è una stima da confermare.

### Il piano

**Move 1 — Rendere visibile la conversione pagata (prerequisito).**
Non serve per forza passare a Stripe: se il modello resta email+bonifico, serve un modo per registrare l'incasso in modo attribuibile — marker “pagato” sul contatto in admin + evento server-side (GA4 Measurement Protocol), oppure riconciliazione manuale mensile. Senza questo, Revenue non è misurabile e il CAC resta ignoto. La decisione è in §13.

**Move 2 — Audit di prezzo e margine (prerequisito).**
Riconciliare il listino reale con quello pubblicato; calcolare il margine per laboratorio (tempo consulenti) ed editing. Riallineare il prezzo nel template S1-E5 (€200→€300). Nota: "da €50" per l'editing va confermato e reso più esplicito in pagina (il prezzo sotto mercato è un differenziatore: va mostrato).

**Move 3 — Lanciare il Laboratorio 1:1 come prodotto a coorti.**
Chiudere naming, date, sistema di prenotazione slot o accordo via email. Massimo 5 posti per edizione; scarsità come leva, non sconto. Il 1:1 è l'offerta a margine più alto e alimenta anche l'editing (upsell naturale).

**Move 4 — Percorso di upsell laboratorio → editing.**
Chi completa un soggetto al 3° draft è il candidato perfetto per l'editing della sceneggiatura. S3a costruisce esattamente questo ponte. Formalizzarlo: "dal soggetto alla sceneggiatura" come percorso, non due transazioni separate.

**Move 5 — Ottimizzare le pagine prodotto/vendita.**
"Prezzo sotto la media del mercato" mostrato esplicitamente; "Cosa ricevi esattamente"; risk reversal; FAQ con schema `FAQPage`; recensioni vicino al prezzo. Ogni pagina prodotto deve spiegare l'esito (es. soggetto al 3° draft) e i tempi (7–10 giorni).

**Move 6 — Bundle e pacchetti (Q2+).**
Valutare un pacchetto "Laboratorio + Editing soggetto" a prezzo dedicato, e un "percorso completo soggetto→sceneggiatura". Aumenta il valore medio per cliente senza scontare il singolo servizio.

**Move 7 — Webinar come prodotto di ingresso a basso prezzo.**
Un webinar gratuito o a basso costo ripetuto periodicamente è una porta d'ingresso che nutre laboratori ed editing. Già previsto in content-strategy (Q2).

**Move 8 — Dati originali come asset (long-term).**
Il report "Stato della sceneggiatura italiana" è autorità e PR, non un ricavo diretto nel 12 mesi. Da tenere in agenda come valore a 24 mesi.

### Unit economics (richiesto — oggi in gran parte ignoto)

| Metrica | Valore | Nota |
|---|---|---|
| ARPC (ricavo medio per cliente) | **[TBD — da misurare]** | Serve attribuire i pagamenti offline (bonifico/email) |
| CAC blended | **[TBD — da calcolare]** | Include tempo di Federico, tooling, contenuti, collaboratori |
| Retention / repeat rate annuale | **[TBD]** | Modello one-off: misurare % di clienti che riacquistano |
| LTV (grezzo) | **[TBD]** | ARPC × frequenza riacquisto |
| LTV / CAC | **[TBD]** | Benchmark sano: > 3 |
| Conversione lead→cliente | **[TBD]** | North star operativa (vedi §13) |

**Metodo di budget (dichiarato).** Con CAC e ARPC ignoti, **nessun metodo (Revenue-Based o Goal-Based) è applicabile in modo difendibile**. La scelta onesta per il 12 mesi è: budget = tooling minimo (€0–100/mese) + tempo founder, **e priorità assoluta a rendere attribuibile la conversione pagata**, che sblocca il calcolo del CAC. Finché il CAC non esiste, il goal di ricavo resta una direzione, non una previsione. Questo va in §13 come decisione #1.

### Mosse revenue nei 90 giorni

- **Sett. 1–2:** Audit prezzo/margine; riallineo template €300; metodo di attribuzione dei pagamenti offline.
- **Sett. 3–4:** Pagina prodotto 1:1 + waitlist; quick win pricing page (prezzo vs mercato, risk reversal).
- **Sett. 5–8:** Prima coorte 1:1; percorso upsell lab→editing via S3a; flusso richiesta→pagamento ottimizzato.
- **Sett. 9–12:** Prima lettura conversione lead→cliente e ricavo per canale; scoping bundle Q2.

### Prospettiva revenue a 12 mesi

- **Q1:** Conversione pagata attribuita; 1:1 lanciato; prezzo/margine riconciliati; quota ricavo corsi vs editing nota.
- **Q2:** Bundle scoping; webinar di ingresso; conversione lead→cliente baseline.
- **Q3:** Repeat rate misurato; percorsi combinati; 1:1 seconda/terza coorte.
- **Q4:** Pricing iterato sui dati; ricavi per canale attribuiti; preparazione report dati.

### Skill + strumenti

- **Skill:** `pricing`, `paywalls`, `sales-enablement`, `revops`, `ab-testing`, `copywriting`.
- **Strumenti:** admin/prodotto + marker “pagato”, GA4 MCP (eventi, Measurement Protocol server-side), sistema email. **Stripe MCP** solo se/quando si passerà al pagamento online.

---

## 9. Roadmap 90 giorni

Livello tattico. Ogni voce è taggata AARRR e con owner. (Owner: **F** = Federico; **F+L** = Federico con Lorenzo.)

### Settimane 1–2 — Sblocco

| Mossa | Stage | Owner |
|---|---|---|
| Attribuire la conversione pagata offline (marker “pagato” + evento server-side o riconciliazione) | Activation/Revenue | F |
| Tipo-prodotto in `submit_product_form` + interazioni `course_purchased`/`editing_purchased` | Activation/Retention | F |
| Riallineare template S1-E5 a €300 | Revenue | F |
| Audit prezzo/margine (lab, editing) | Revenue | F+L |
| Lead magnet 1 (Template Soggetto) e 2 (Calendario Concorsi 2027) | Acquisition | F |
| Eseguire finestra laboratori ottobre (newsletter già scritta) | Acquisition/Revenue | F |
| Prima baseline lead→cliente (pagamenti offline riconciliati) | Cross-cutting | F |

### Settimane 3–4 — Fondamenta

| Mossa | Stage | Owner |
|---|---|---|
| Pubblicare hub `/pagina-uno` | Acquisition | F |
| Lettura dati S2 (ora live) + segmentazione audience | Activation/Retention | F |
| Lead magnet 3 (Scaletta 6-12-6) e 4 (Checklist Format) | Acquisition | F |
| Pagina prodotto Laboratorio 1:1 + waitlist (naming/date chiusi) | Revenue/Acquisition | F |
| Audience email `newsletter`/`ebook_lead`/`clienti` | Retention | F |
| Footer unsubscribe + `List-Unsubscribe` + GDPR + warm-up dominio | Retention | F |

### Settimane 5–8 — Velocità

| Mossa | Stage | Owner |
|---|---|---|
| 4 spoke nuovi cluster 1A/1B | Acquisition | F |
| Lead magnet 5 (Logline) + pagine di atterraggio | Acquisition/Activation | F |
| S4 a cadenza settimanale stabile | Retention | F |
| Prima coorte Laboratorio 1:1 (o seconda finestra lab) | Revenue | F+L |
| Coinvolgere 3–5 studenti passati per testimonial + passaparola | Referral | F |
| Quick win CRO residui (rating, sticky mobile, "cosa ricevi") | Activation | F |
| Prima analisi Pagina Uno video + trascrizione | Acquisition | F |

### Settimane 9–12 — Composizione

| Mossa | Stage | Owner |
|---|---|---|
| 4 nuove analisi Pagina Uno | Acquisition | F |
| Sondaggio "sceneggiatura italiana" (social) | Acquisition | F |
| `/pricing.md` live | Acquisition/AI-SEO | F |
| Attivare S3a/S3b (post-acquisto) | Retention/Revenue | F |
| Prima campagna raccolta recensioni (target 10–12) | Retention/Referral | F |
| Verifica gerarchia CTA homepage con dati di ricavo | Activation/Revenue | F |
| Review 90 giorni + ricalibro Q2 | Cross-cutting | F+L |

---

## 10. Prospettiva a 12 mesi

**Metodo di budget e pattern.** Come dichiarato in §8, con CAC/ARPC ignoti **nessun metodo quantitativo è difendibile**: il budget resta tooling minimo + tempo founder, e il true unlock è la misurazione della conversione pagata (pagamenti offline attribuiti). Il pattern atteso non è esponenziale: è **lineare + step-function** — crescita costante per contenuto/newsletter, interrotta da gradini deliberati (lancio 1:1, bundle, report dati). Tier attuale: **Tier 1 (bootstrap)**, paid €0. Sblocco non legato a un round di funding, ma a **milestone di ricavo**: quando le vendite misurate raggiungono una soglia (da definire sui primi dati), si sblocca (a) un piccolo budget tooling supplementare e (b) un collaboratore part-time su contenuti/lifecycle.

**70/20/10 (adattato al Tier 1).** 70% su ciò che funziona (SEO/contenuti + email + laboratori), 20% sulla prossima curva (dati originali, social/YouTube, community), 10% sperimentale (referral, test CRO).

### Q1 — Mesi 1–3 (ott–dic 2026)

**Stato finanziario:** Tier 1 bootstrap, paid €0.
**Focus:** Fondamenta + conversione. Rendere attribuibile la conversione pagata e completare il percorso.

**Risultati entro fine Q1:**
- Conversione pagata attribuita (pagamenti offline riconciliati + interazioni di acquisto)
- 5 lead magnet live + pagine
- S2 monitorata e ottimizzata
- Hub `/pagina-uno` live
- Laboratorio 1:1 lanciato (prima coorte)
- Finestra laboratori ottobre eseguita
- Prezzo/margine riconciliati

**KPI target:** tasso lead→cliente pagante noto; newsletter 800→950; utenti organici 1.000→1.200/mese; open rate S1/S2 25–40%; recensioni 7→10–12.

**Posizione S-curve:** canale contenuto in crescita iniziale; prodotto (1:1) nuovo; nessuna curva in plateau.

### Q2 — Mesi 4–6 (gen–mar 2027)

**Stato finanziario:** Tier 1, eventuale micro-budget tooling se i primi ricavi lo giustificano.
**Focus:** Validazione. Trasformare il percorso in tassi misurati.

**Risultati entro fine Q2:**
- Tasso lead→cliente baseline noto
- S3 (post-acquisto) e S5 (re-engagement) attive
- Webinar di ingresso + scoping bundle lab+editing
- Cadenza contenuti trimestrale stabile
- Report "Stato della sceneggiatura italiana" avviato

**KPI target:** newsletter 1.100–1.200; click email 3–8%; recensioni 12–15; primo dato di repeat rate.

**Posizione S-curve:** contenuto in rampa; prima curva prodotto (1:1) validata o iterata.

### Q3 — Mesi 7–9 (apr–giu 2027)

**Stato finanziario:** Tier 1. Valutazione collaboratore part-time se conversione misurata.
**Focus:** Scaling contenuto + community + referral.

**Risultati entro fine Q3:**
- Cluster SEO in posizione stabile (pagina 1 su keyword di coda)
- Report dati pubblicato (autorità + PR + citazioni AI)
- Programma referral newsletter scoping/lancio
- Percorsi combinati soggetto→sceneggiatura
- Estensione calendario contenuti a Q4

**KPI target:** newsletter 1.300–1.500; quota nuovi clienti da organico > 70%; 15+ recensioni cumulative.

**Posizione S-curve:** contenuto maturo ma ancora in crescita; avvio della S-curva dati/community.

### Q4 — Mesi 10–12 (lug–set 2027)

**Stato finanziario:** Tier 1 → valutazione Tier 2 interno (micro-budget test se unit economics positive).
**Focus:** Composizione. Canali non-paid come maggioranza dei nuovi clienti.

**Risultati entro fine Q4:**
- North star (conversione/ricavo per iscritto) in miglioramento misurabile
- Passaparola studenti misurato come canale
- 1:1 a regime (coorti multiple)
- Report dati stagionale aggiornato
- Decisione su paid pilot (solo se CAC < soglia)

**KPI target:** newsletter 1.500+; LTV/CAC calcolabile e > 3 nei canali organici; conversione lead→cliente in crescita trimestre su trimestre.

**Posizione S-curve:** 20% "next" (dati/community/social video) pronta a diventare il 70%; paid ancora spento (decisione informata).

> **Nota onestà.** Il calendario contenuti di content-strategy copre fino a giugno 2027. Q4 2027 (lug–set) è **estrapolato**: va programmato in dettaglio durante Q3.

---

## 11. Marketing operations stack

### La tesi

Un fondatore solo + una libreria di skill di marketing + gli strumenti già in casa (motore email/automation, admin, GA4, Stripe) possono produrre l'output di un piccolo team. Non perché l'AI "fa marketing", ma perché ogni mossa di questo piano è collegata a una skill che la rende operativa e a uno strumento che la esegue senza un'unità di personale per canale. Federico non deve assumere per aggiungere un canale: deve orchestrare.

### Skill mappate agli stadi AARRR

| Stadio | Skill primarie | Skill di supporto |
|---|---|---|
| **Acquisition** | `content-strategy`, `seo-audit`, `ai-seo`, `schema`, `competitors`, `social` | `copywriting`, `analytics`, `launch`, `marketing-psychology` |
| **Activation** | `cro`, `onboarding`, `signup`, `popups` | `copywriting`, `copy-editing`, `ab-testing`, `marketing-psychology` |
| **Retention** | `emails`, `churn-prevention` | `copywriting`, `copy-editing`, `ab-testing` |
| **Referral** | `referrals`, `social` | `copywriting`, `emails`, `marketing-website-design` |
| **Revenue** | `pricing`, `sales-enablement`, `revops` | `paywalls`, `ab-testing`, `copywriting` |
| **Cross-cutting** | `product-marketing`, `customer-research`, `marketing-psychology` | `marketing-ideas` |

### Strumenti / MCP per stadio

| Stadio | Connessioni esistenti in casa | Layer consigliato da cablare |
|---|---|---|
| **Acquisition** | GA4/GTM/GSC (free), admin interno, Resend/SendGrid | GA4 MCP, Ahrefs o DataForSEO API, Typefully |
| **Activation** | GA4/GTM, admin (Puck/TipTap) | GA4 MCP |
| **Retention** | **Automations engine + Resend (il più maturo)** | GA4 MCP (attribuzione eventi) |
| **Referral** | UTM/GA4 | (Q3+) Dub.co |
| **Revenue** | admin, email, GA4 (pagamenti offline) | marker “pagato” + GA4 Measurement Protocol; Stripe MCP solo se si passa all'online |
| **Cross-cutting** | Admin/prodotto, `.agents/*` documenti | repository di contesto condiviso |

**Stato attuale: GTM/GA4 sono attivi (eventi top-funnel live); nessun MCP è cablato.** La priorità Q1 è rendere attribuibile il pagamento offline e (opzionale) cablare GA4 MCP — perché è ciò che rende il resto verificabile.

### L'esempio concreto (la prova che la stack funziona)

**S1 — la sequenza nurture post-ebook.** Federico, non sviluppatore, ha progettato e **pubblicato** sul motore Automations interno una sequenza di 7 email (trigger `ebook_downloaded`, Day 1/3/5/7/9/11/14), dalla strategia al copy al design, con la skill `emails` e gli strumenti già in casa. Nessuna assunzione, nessuna agenzia. Lo stesso pattern (skill + strumento interno) ha già prodotto anche S2 e regge S3–S5, il calendario newsletter settimanale e le riscritture SERP. Questa è la dimostrazione operativa su cui poggia l'intero piano: la capacità di esecuzione esiste già, indipendentemente dal budget.

### Sblocco capacità per milestone (non per round)

| Milestone | Team | Tooling | Canali |
|---|---|---|---|
| **Oggi (Tier 1)** | Federico (+ Lorenzo) | Automations, GTM/GA4 (eventi live), Resend, admin; skill | Organico (SEO, contenuti, email, social rented, borrowed, passaparola) |
| **Primi ricavi misurati** | Federico; forse Lorenzo più strutturato | + GA4 MCP, Ahrefs/DataForSEO, Typefully | + YouTube/social strutturato, referral |
| **Soglia ricavo (Tier 2 interno)** | + collaboratore part-time contenuti/lifecycle | + micro-budget test, eventuale Dub.co | + primo paid pilot (solo se CAC < soglia) |
| **Scala** | + designer/editor frazionale | + dashboard analytics | + paid scaling, bundle, webinar ricorrenti |

### Modello team e RACI

Principio: **strategia in casa, esecuzione dove ha senso esternalizzare**. Nel nostro caso la strategia è di Federico, l'esecuzione è di Federico + skill + tool. Il primo innesto è un ibrido **contenuti + lifecycle** (titolo Manager/Lead), attivato dopo i primi dati di conversione, non prima.

| Funzione | Responsabile (strategia) | Esecutore |
|---|---|---|
| Strategia marketing e piano | Federico | Federico |
| Voce del brand | Federico (+ Lorenzo) | Federico |
| SEO / contenuti / editorial cal. | Federico | Federico (+ Lorenzo) |
| Lifecycle / email | Federico | Federico + Automations engine |
| Prodotto / sito / pagamento offline | Federico | Federico + admin |
| Misurazione / analytics | Federico | GTM/GA4 + attribuzione pagamenti offline |
| Social / borrowed | Federico | Federico (+ Typefully) |
| Pricing / offerte | Federico | Federico |
| Lancio 1:1 | Federico | Federico |
| Referral / community | Federico | Federico (+ studenti) |

---

## 12. Tactical idea bank — cross-reference delle 139 tattiche

Le sezioni 4–8 dicono *cosa facciamo*. Questa sezione mappa il menu completo di *cosa è possibile*: ogni tattica della libreria `marketing-ideas`, assegnata allo stadio AARRR e con lo stato specifico per Pictures Writers. È l'inventario da cui pescare quando si sblocca capacità.

**Legenda stati:**
- **Ora (Q1)** — già nella roadmap 90 giorni o eseguibile subito senza nuova capacità
- **Q2** — layer del secondo trimestre
- **Q3+** — espansione dopo fondazione
- **Q4+** — lungo periodo / grande investimento
- **Skip** — incompatibile con voce, modello o categoria

### 12.1 Acquisition

**Ora (Q1)**

| # | Idea | Nota PW |
|---|---|---|
| 1 | Easy Keyword Ranking | Cluster 1A/1B mirano direttamente a keyword di coda |
| 2 | SEO Audit | Eseguito; ripetere trimestrale |
| 5 | Content Repurposing | Ogni hub → clip social, email, video, infografica, PDF |
| 6 | Proprietary Data Content | Sondaggio "sceneggiatura italiana" — asset unico |
| 7 | Internal Linking | Regola spoke↔hub in content-strategy |
| 10 | Parasite SEO | Articoli LinkedIn lunghi |
| 12 | Marketing Jiu-Jitsu | "Siamo più di una scuola" rovescia l'assunto |
| 36 | Quora Marketing | Risposte su scrittura/concorsi |
| 37 | Reddit Keyword Research | Linguaggio degli sceneggiatori (alimenta #139) |
| 39 | LinkedIn Audience | Canale di autorità |
| 59 | Article Quotes (HARO) | PR a costo zero |
| 70 | Conference Speaking | Festival/concorsi di sceneggiatura |
| 74 | Press Coverage | Report dati → pitch testate di settore |
| 101 | Industry Interviews | Interviste a sceneggiatori/insider |
| 102 | Social Screenshots | Estratti sceneggiatura, BTS Double View |
| 109 | Public Demos | Analisi Pagina Uno pubbliche |
| 114 | Moneyball Marketing | Nicchia italiana sottovalutata = asimmetria |
| 115 | Curation as Marketing | Liste film/risorse curate |
| 129 | Review Sites | Recensioni 5★ come prova |
| 138 | Podcast Tours | Pitch podcast di settore |
| 139 | Customer Language | VOC nei materiali; alimentare il copy |

**Q2**

| # | Idea | Nota PW |
|---|---|---|
| 3 | Glossary Marketing | Glossario sceneggiatura (soggetto, trattamento, scaletta…) |
| 8 | Content Refreshing | Aggiornare concorsi/hub annualmente |
| 11 | Competitor Comparison Pages | "CSC vs Holden vs Bottega Finzioni" (pianificato) |
| 17 | Quiz Marketing | "Che sceneggiatore sei?" — lead magnet interattivo |
| 35 | Community Marketing | Community di sceneggiatori |
| 38 | Reddit Marketing | Presenza in subreddit di scrittura |
| 40 | Instagram Audience | Pillole visive |
| 44 | Comment Marketing | Commenti competenti su post di settore |
| 49 | Monthly Newsletters | Monthly come cattura-email |
| 54 | Affiliate Discovery via Backlinks | Analisi backlink concorrenti |
| 58 | Newsletter Swaps | Scambio con newsletter affini |
| 64 | Community Sponsorship | Sponsor di community/festival |
| 65 | Live Webinars | Webinar gratuito di ingresso |
| 84 | Giveaways | Solo se coerente (es. copia sceneggiatura firmata) |
| 108 | Changelogs | Aggiornamenti prodotto (nuovi laboratori) |
| 138 | Podcast Tours | Continuativo — vedi Ora |

**Q3+**

| # | Idea | Nota PW |
|---|---|---|
| 4 | Programmatic SEO | Pagine template (concorsi per anno, per regione) |
| 9 | Knowledge Base SEO | Base di conoscenza sceneggiatura |
| 14 | Side Projects | Progetti laterali coerenti |
| 15 | Engineering as Marketing | Strumenti gratuiti (es. formattatore, counter pagine) |
| 18 | Calculator Marketing | Calcolatore durata/pagine sceneggiatura |
| 20 | Microsites | Micrositi per concorsi/programmi |
| 42 | Short Form Video | Reels/TikTok tecnica di scrittura |
| 57 | Expert Networks | Rete di esperti/insider |
| 61 | Shared Slack Channels | Spazi condivisi con scuole/community |
| 63 | Integration Marketing | Integrazioni con altri strumenti di scrittura |
| 66 | Virtual Summits | Summit online sceneggiatura |
| 68 | Local Meetups | Incontri locali sceneggiatori |
| 69 | Meetup Sponsorship | Sponsor meetup |
| 72 | Conference Sponsorship | Sponsor festival |
| 97 | Playlists as Marketing | Playlist film/analisi |
| 98 | Template Marketing | Template sceneggiatura (lead magnet) |
| 100 | Promo Videos | Video promozionali corsi |
| 103 | Online Courses | Corsi in catalogo |
| 107 | Podcasts (own-hosted) | Podcast di sceneggiatura |
| 111 | Challenges as Marketing | Sfide di scrittura |
| 126 | YouTube Reviews | Recensioni sceneggiature celebri |
| 127 | YouTube Channel | Canale Pagina Uno |
| 130 | Live Audio | Spazi audio su scrittura |

**Q4+**

| # | Idea | Nota PW |
|---|---|---|
| 56 | Reseller Programs | Rivendita corsi a scuole |
| 67 | Roadshows | Tour/eventi dal vivo |
| 71 | Conferences (own-hosted) | Evento proprio di sceneggiatura |
| 73 | Media Acquisitions | Acquisire newsletter/blog di settore |
| 76 | Documentaries | Documentario sulla sceneggiatura italiana |
| 104 | Book Marketing | Libro/manuale |
| 105 | Annual Reports | Report annuale (dati originali) |
| 106 | End of Year Wraps | Retrospettiva annuale |
| 110 | Awards as Marketing | Premio di sceneggiatura |
| 116 | Grants as Marketing | Bandi/contributi |
| 131 | International Expansion | Rimandato (esplicito) — vedi Skip |

**Skip (Q1–Q4: motivazione)**

| # | Idea | Perché skip |
|---|---|---|
| 13 | Competitive Ad Research | Nessun paid attivo |
| 16 | Importers as Marketing | SaaS-specific, non applicabile |
| 19 | Chrome Extensions | Non rilevante (nessun prodotto browser) |
| 21 | Scanners | Non applicabile |
| 22 | Public APIs | Non prodotto developer |
| 23–34 | Podcast/Display Ads, Facebook, Instagram, Twitter, LinkedIn, Reddit, Quora, Google, YouTube, Retargeting, Click-to-Messenger | **Paid** — rimandato per scelta (quadrante bassa frequenza) |
| 41 | X Audience | Bassa pertinenza per il target italiano |
| 43 | Engagement Pods | Off-brand |
| 55 | Influencer Whitelisting | Post-paid |
| 60 | Pixel Sharing | Post-paid |
| 77 | Black Friday Promotions | Off-brand (sconti erodono il posizionamento) |
| 78 | Product Hunt Launch | Non pertinente al target italiano |
| 79 | Early-Access Referrals | Vedi Referral (Q2) |
| 80 | New Year Promotions | Off-brand (sconti) |
| 81 | Early Access Pricing | Sconto non coerente con la scarsità-posti |
| 82 | Product Hunt Alternatives | Non pertinente |
| 83 | Twitter Giveaways | Off-brand |
| 85 | Vacation Giveaways | Off-brand |
| 86 | Lifetime Deals | Danneggia il posizionamento premium |
| 87 | Powered By Marketing | Non applicabile |
| 88 | Free Migrations | Non applicabile |
| 89 | Contract Buyouts | B2B SaaS only |
| 99 | Graphic Novel Marketing | Off-brand |
| 112 | Reality TV Marketing | Off-brand |
| 113 | Controversy as Marketing | Off-brand (voce empatica) |
| 116 | Grants as Marketing | Vedi Q4+ |
| 117 | Product Competitions | Developer-specific |
| 118 | Cameo Marketing | Off-brand |
| 119 | OOH Advertising | Fuori Tier |
| 120 | Marketing Stunts | Off-brand |
| 121 | Guerrilla Marketing | Off-brand |
| 122 | Humor Marketing | Rischioso per voce; non prioritario |
| 123 | Open Source as Marketing | Non applicabile |
| 125 | App Marketplaces | Non app mobile |
| 128 | Source Platforms | B2B SaaS only |
| 131 | International Expansion | Rimandato esplicitamente (§13) |
| 133 | Investor Marketing | Nessun round di funding |

### 12.2 Activation

**Ora (Q1):** 90 One-Click Registration (form a 1 campo per i lead magnet); 96 Onboarding Optimization (S2 ora live: ottimizzazione sui dati + percorso).

**Q2:** 47 Founder Welcome Email (firma personale da Federico — con "team" per la voce); 48 Dynamic Email Capture; 51 Onboarding Emails (S2/serie post-iscrizione).

**Q3+:** 91 In-App Upsells (upsell nel percorso, cross-cut Revenue); 95 Concierge Setup (non rilevante); 124 App Store Optimization (non app).

### 12.3 Retention

**Ora (Q1):** 46 Reactivation Emails (riattivazione newsletter, fatta a ott); 50 Inbox Placement (warm-up dominio, `List-Unsubscribe`).

**Q2:** 45 Mistake Email Marketing (opportunistico); 52 Win-back Emails (S5); 53 Trial Reactivation (non subscription — n/a); 94 Offboarding Flows (n/a).

**Q3+:** 135 Support as Marketing; 134 Certifications (attestato di percorso — cross-cut Referral).

### 12.4 Referral

**Ora (Q1):** 62 Affiliate Program (solo se inbound: passaparola studenti).

**Q2:** 79 Early-Access Referrals (porta un amico al laboratorio); 137 Two-Sided Referrals (non prioritario).

**Q3+:** 92 Newsletter Referrals; 93 Viral Loops.

### 12.5 Revenue

**Ora (Q1):** 132 Price Localization → **Skip** (no internazionalizzazione). Revenue si gioca su strategia (§8), non su tattiche.

**Q2:** 91 In-App Upsells (upsell lab→editing formalizzato).

### 12.6 Cross-cutting / brand

**Ora (Q1):** 114 Moneyball Marketing (metodo continuo); 139 Customer Language (VOC → copy).

### Riepilogo idea bank

- **Acquisition:** ~21 "Ora", ~16 "Q2", ~24 "Q3+", ~11 "Q4+"
- **Activation:** 2 "Ora", 3 "Q2", 2 "Q3+"
- **Retention:** 2 "Ora", 2 "Q2", 2 "Q3+"
- **Referral:** 1 "Ora", 2 "Q2", 2 "Q3+"
- **Revenue:** 1 "Q2" (+ pricing strategico in §8)
- **Cross-cutting:** 2 "Ora"
- **Skip:** ~40 tattiche (paid, giveaway/sconti, developer, off-brand, internazionalizzazione) — con motivazione esplicita sopra

**Cosa prova.** Il piano copre circa **il 60–65% della superficie tattica disponibile** — appropriato per un Tier 1 bootstrap a bassa frequenza: quasi tutto ciò che è paid, sconto-driven o internazionale è fuori per scelta, non per dimenticanza. Man mano che i ricavi sbloccano capacità (Q2→Q3→Tier 2), questa cross-reference diventa l'inventario da cui pescare senza perdere coerenza strategica.

---

## 13. Misurazione, RACI, decisioni aperte, appendice

### Misurazione — le metriche che contano

**North star (proposta): obiettivo di conversione del percorso, cioè il ricavo da laboratori + editing per 1.000 iscritti newsletter (mensile).**
Perché questa: cattura in un unico numero le tre cose che devono muoversi insieme — la crescita dell'audience proprietaria, la sua conversione, e il valore medio per cliente. Non è "ARR" (troppo generico per un modello one-off) né "iscritti" da solo (reach senza monetizzazione). La metrica si muove lentamente, ed è correttamente in trade-off: non puoi migliorarla comprando iscritti di bassa qualità. Richiede però che i pagamenti offline siano attribuiti (decisione aperta #1).

**Leading indicator per stadio AARRR:**

| Stadio | Leading indicators |
|---|---|
| **Acquisition** | Utenti organici/mese; impression + CTR su hub; keyword in pagina 1; download lead magnet; click social → sito |
| **Activation** | Iscrizioni newsletter/mese; tasso blog→newsletter; tasso newsletter→lead magnet; richieste feedback gratuito |
| **Retention** | Open rate (25–40%) e click rate (3–8%) per sequenza; unsubscribe (<0,5%); recensioni raccolte; repeat rate |
| **Referral** | Passaparola studenti tracciato; condivisioni feedback gratuito; iscritti da referral (Q3+) |
| **Revenue** | Conversione lead→cliente pagante (da riconciliazione pagamenti offline); ricavo per canale; ARPC; margine per laboratorio/editing; ricavo/1.000 iscritti (north star) |

**Cadenza di review:**
- **Settimanale (30 min, Federico):** scoreboard leading indicator vs settimana prima + navi della settimana + blocchi. Output: azioni.
- **Mensile (60–90 min, Federico + Lorenzo):** metriche complete vs KPI trimestrali + apprendimenti + ripuntatura. Output: aggiustamenti.
- **Trimestrale (2–3 h, Federico + Lorenzo):** review del piano vs risultati, verifica soglie S-curve/plateau, ricalibro del trimestre successivo. Output: piano v2/v3.

**Soglie di plateau (alert).** Aggiunte settimanali che si appiattiscono; posizioni SEO ferme nonostante nuova pubblicazione; open rate email in calo; conversione in calo con sforzo costante. Due o più segnali sulla stessa curva → sposta peso sul 20% "next" (§10), non spingere più forte sulla curva attuale.

**Kill criteria.** Un lead magnet con < X download dopo 6 settimane → rivalutare posizionamento/CTA. Una sequenza con open < 12% dopo 6 settimane → riscrivere oggetto + segmentazione. Un canale social senza click dopo un trimestre di cadenza → ridurre, non insistere.

### RACI

| Dominio | R | A | C | I |
|---|---|---|---|---|
| Piano strategico | Federico | Federico | Lorenzo | team |
| Voce del brand | Federico | Federico | Lorenzo | team |
| Contenuti / SEO | Federico | Federico | Lorenzo | — |
| Lifecycle / email | Federico | Federico | — | team |
| Prodotto / sito / pagamento offline | Federico | Federico | — | Lorenzo |
| Misurazione / analytics | Federico | Federico | — | Lorenzo |
| Social / borrowed | Federico | Federico | Lorenzo | — |
| Pricing / offerte | Federico | Federico | Lorenzo | — |
| Lancio 1:1 | Federico | Federico | Lorenzo | studenti |
| Referral / community | Federico | Federico | studenti | — |
| Primo hire (futuro) | Federico | Federico | — | team |

### Decisioni aperte che bloccano il piano (ordinate per impatto)

1. **Conversione pagata non attribuita (pagamenti offline via email/bonifico).** Impatto altissimo: il top-funnel è già tracciato in GTM/GA4, ma senza un evento di pagamento non esistono CAC, ARPC, LTV né attribuzione del ricavo al contenuto. Sblocca: §8, §10, north star. → Q1 (sett. 1–2): decidere il metodo (marker in admin + evento server-side GA4, o riconciliazione manuale). **Aggiornamento (2026-10-05):** l'evento server-side GA4 (Measurement Protocol) è stato valutato e **parcheggiato** — a ~12 ordini/anno l'attribuzione per canale è rumore statistico. Restano il marker "pagato" (l'Order in admin) e la riconciliazione manuale; l'alternativa a basso costo è un campo self-reported "come ci hai conosciuto?" al completamento dell'ordine. Riaprire quando gli ordini misurati superano ~20/mese o parte il paid. Dettaglio e soglia: `.scratch/offline-purchase-attribution/spec.md`.
2. **Interazioni interne incomplete (`course_purchased`, `editing_purchased`, tipo-prodotto in `submit_product_form`).** Impatto alto: blocca S3/S5 e l'attribuzione dei ricavi. → Sett. 1–2.
3. **Prezzo e margine editing da confermare ("da €50"?); template S1-E5 da riallineare a €300.** Impatto alto: prezzo sbagliato in un'email pubblicata erode fiducia. → Immediato.
4. **Laboratorio 1:1: naming definitivo, date, sistema prenotazione slot vs accordo email.** Impatto alto: prodotto a margine più alto, ancora fermo. → Sett. 3–4.
5. **5 lead magnet da produrre.** Impatto alto: il funnel cattura solo dall'ebook. → Sett. 1–8.
6. **Ruolo del paid: conferma dello stop nel 12 mesi.** Impatto medio: definisce il perimetro. Default raccomandato: spento (quadrante bassa frequenza). → Decisione di Federico.
7. **Calendario contenuti Q4 2027 (lug–set).** Impatto medio: buco a 9 mesi. → Estensione in Q3.
8. **Internazionalizzazione/inglese: conferma del rinvio.** Default raccomandato: rimandato oltre il 12 mesi. → Decisione di Federico (esclusa in intake).
9. **Sondaggio "sceneggiatura italiana": formato, canale, tempi.** Impatto medio: abilita dati originali + report + PR. → Q1/Q2.
10. **Soglia di ricavo che sblocca il Tier 2 interno (micro-budget + collaboratore).** Impatto medio: definisce il prossimo step. → Da fissare sui primi dati.
11. **Incentivo S5 (sconto sì/no).** Impatto basso: decisione di margine. → Q2.
12. **Verifica gerarchia CTA homepage (13:1).** Impatto basso/medio: correzione sulla base di dati reali. → Q1.

### Appendice — link ai documenti (relativi al repo)

**Documenti di contesto in repo (`.agents/`):**
- `.agents/product-marketing.md` — posizionamento, ICP, voce
- `.agents/content-strategy.md` — calendario 60/30/10, cluster, funnel
- `.agents/ai-seo.md` — agent-readiness, roadmap AI
- `.agents/emails.md` — S1–S5, infrastruttura, test
- `.agents/newsletter.md` — playbook S4, numeri di ottobre
- `.agents/cro.md` — audit pagine, quick win, test
- `.agents/launch-individuale.md` — piano lancio 1:1
- `.agents/schema.md` — JSON-LD
- `.agents/serp-come-scrivere-una-sceneggiatura.md`, `.agents/serp-come-diventare-sceneggiatore.md` — riscritture hub
- `.agents/measurement-*.md` — piani di misurazione per hub

**Nota sulla provenienza dei numeri.** Traffico, iscritti, recensioni e download provengono dai materiali sopra e dagli eventi GTM/GA4 già attivi. **Ricavi, CAC e conversione pagata** sono `[TBD]`: il pagamento è offline (email + bonifico), quindi va reso attribuibile prima di qualsiasi proiezione quantitativa (vedi decisione aperta #1).

---

*Pictures Writers — Piano di Marketing v1. Preparato il 2026-10-02. Per revisione e discussione del team.*
