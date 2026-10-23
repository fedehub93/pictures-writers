# Measurement — "Come scrivere una sceneggiatura" (Pillar Hub)

**Hub page:** `/come-scrivere-una-sceneggiatura/`
**Natura dell'intervento:** riscrittura integrale v2 di una pagina **pre-esistente da anni** (non una pagina nuova). Lo snapshot del 7° giorno è quindi *post*-riscrittura: il termine di paragone vero è i 28 giorni precedenti al 22/9.
**Riferimenti:** `docs/marketing/strategy/content-strategy.md` §8 (KPI e Metriche) · §1 (situazione attuale: 2.400 visualizzazioni/mese, 1.000 utenti unici/mese, 800+ iscritti newsletter).

Le scadenze sotto sono allineate alla *Trimestral Review* della strategy (§8). Lo scopo: distinguere *tecnicità* (da sistemare subito) da *performance* (da valutare a 90 giorni).

---

## Timeline dei check

### Giorno 0 — Pubblicazione ✅ (2026-09-22)
- [x] URL definitivo pubblicato: `/come-scrivere-una-sceneggiatura/` (non `/draft/...`)
- [x] Meta title/description aggiornati (deliverable §5)
- [x] Immagini con alt text; nessun link rotto (verifica il link "tema della storia" corretto)
- [x] Richiedere indicizzazione/aggiornamento in GSC (URL + sitemap)

### Giorno 7 — Snapshot baseline (da confrontare con 30/90)
> Serve come termine di paragone: si rileva una volta, non si giudica.
- [x] Indicizzata? (GSC: Coverage → Valid)
- [x] Queries per cui appare + posizione media
- [x] Impressioni, click, CTR, posizione
- [x] Bounce rate / tempo su pagina (GA4)
- [ ] Funzionamento CTA: ebook (click), link lab/editing → **non testabile** (0 click organici); da validare con click manuale

#### Baseline rilevata — 2026-10-01 (dati GSC 22–28 set 2026, 7 giorni)

| Metrica | Valore |
|---|---|
| Indicizzata | ✅ Sì |
| Impressioni (URL hub) | 98 · 123 con varianti `#sezione` + pagina correlata |
| Click | 0 |
| CTR | 0% |
| Posizione media (hub) | 10,94 (migliore giornaliero 7,7 il 23/9) |
| Aspetto nella ricerca (rich result) | Nessuno |
| GA4 | 4 visualizzazioni · 1 utente · 11s · 10 eventi → inutilizzabile (0 click organici) |

**Query già presenti (top):** `sceneggiatura` (15 impr · pos 12,8) · `come scrivere una sceneggiatura di un film` (6 · 9,17) · `sceneggiatura cinematografica` (2 · 26,5) · `come si scrive una sceneggiatura` (1 · pos 5).

**Device:** desktop 21 impr (pos 21,95) · mobile 12 impr (pos 15,83).
**Paesi:** Italia 27 impr; resto estero (rumore).

**Lettura (non giudizio):** a 7 giorni la pagina è indicizzata e compare già per le query core in pagina 1–2, ma a posizione >10 → 0 click attesi. Google mostra già i salti alle sezioni (`#che_cos_una_sceneggiatura`, `#mostra_non_raccontare_lo_stile_della_sceneggiatura`): la struttura viene letta bene.
**Chiuso il 2026-10-22 — non era un errore di export.** Nel re-export con lo stesso filtro e lo stesso periodo, Query e Paesi sommano **164** impressioni contro **447** di Pagine (28 gg correnti) e **182** contro **471** (28 gg precedenti): rapporto stabile → GSC esclude le query anonimizzate da *tutti* i breakdown tranne Pagine. Regola operativa: **volume da Pagine, wording e posizione da Query**.
**Azione setup:** export GSC ricevuti il 2026-10-22 (vista filtrata + non filtrata, con confronto). I CSV grezzi non sono conservati: i numeri stanno in questo documento. GA4 non ancora fornito.

### Giorno 30 — Primi segnali (KPI §8: keyword rankings + traffico) — ✅ rilevato 2026-10-22
- [x] Posizione keyword esatta e varianti → `come scrivere una sceneggiatura` **9,78** (da 10,33) · `come si scrive una sceneggiatura` **7,5** (da 12,89) · `sceneggiatura` 13,27 (da 16,48) · `sceneggiatura cinematografica` 24,9 (da 37,5) · `come scrivere una sceneggiatura di un film` 9,33 (da 7,78, **unico arretramento**). Varianti `da zero` / `guida` / `passo passo`: **0 impressioni** → ipotesi del deliverable §4 non validata (nessuna domanda o nessun ranking: GSC non distingue).
- [x] Impressioni mese su mese → **−5% sull'hub** (395→377) contro **+31% del sito**: sotto-performance relativa. Il calo è interamente coda lunga: 13 query sparite (−36 impr) contro 11 nuove entrate a posizione 42–87 (+14), e i 19 sopravvissuti recuperano +4 → −18 netto. Nessuna query core persa.
- [x] CTR → **1,01% → 1,59%** (+57%); sulle sole query attribuite **0,55% → 1,22%** (2,2×). Tab "Aspetto nella ricerca" **vuoto**, ma il `FAQPage` **è presente** nell'HTML della pagina (verificato il 22/10): Google dal 2023 mostra i rich result FAQ solo a siti governativi e sanitari. Non è un difetto e non è una leva.
- [ ] Click verso ebook/lead magnet → **ancora non misurabile**: serve GA4 (eventi su `page_location`), export non fornito.
- [ ] Fix tecnici → nessun dato CWV in questi export. Gap reale trovato il 22/10: **nessun `BreadcrumbList` sulle pagine blog** (c'è solo su shop), benché `schema.md` lo desse per presente. Da aggiungere in `blog-posting.tsx`.

#### Snapshot rilevata — 2026-10-22 (GSC, `Ultimi 28 giorni` ≈ 24/9–21/10 vs 28 gg precedenti)

> Il range è relativo ("Ultimi 28 giorni" esportato il 22/10), non custom 22/9–19/10. Confronto valido perché la pagina pre-esisteva; le date vanno citate così.

| Metrica | 28 gg prec. | Ultimi 28 gg | Δ |
|---|---|---|---|
| Click | 4 | 6 | +50% |
| Impressioni (hub) | 395 | 377 | −4,6% |
| Impressioni (hub + `#frammenti`) | 471 | 447 | −5,1% |
| CTR | 1,01% | 1,59% | +57% |
| Posizione media (vista Pagine) | 18,30 | 13,13 | +5,2 posti |
| Posizione ponderata (vista Query) | 26,98 | 20,51 | +6,5 posti |
| CTR su query attribuite | 0,55% | 1,22% | 2,2× |

**Controllo sito (stesso periodo):** click 1.559→2.059 (+32%), impressioni 99.242→130.019 (+31%), CTR 1,57%→1,58%. Il +31% è trainato da pagine non collegate (`cos-e-la-prosa` +6.485, `cos-e-il-capoverso` +2.533, inquadrature +1.497, analessi +1.348): surge stagionale di rientro-scuola o evento di ranking, **non attribuibile alla riscrittura**.

**Struttura letta da Google:** i vecchi frammenti `#step_1`…`#step_7` (16/15/10/10/9/8/8 impr) sono a zero; i sitelink ora puntano alle nuove sezioni — `#mostra_non_raccontare` 17, `#che_cos_una_sceneggiatura` 15, `#il_percorso_i_documenti` 11, `#da_dove_partire` 9, `#dai_forma_alla_storia` 9, `#le_regole_doro_della_formattazione` 9 — tutte a posizione 8,2–9,8.

**Coda lunga persa (riallocazione, non perdita):** `scrivere sceneggiature` 14→0, `sceneggiatura significato` 4→0, `come scrivere un copione` 3→0, `come si scrive fiction` 3→0, `come diventare uno sceneggiatore` 3→0. A livello sito `sceneggiatura significato` fa 52→**110** impressioni: la domanda è passata ad altre pagine. Comportamento corretto per una pagina che si focalizza.

**Anomalia collaterale (fuori scope, da aprire a parte):** `cos-e-il-tema-della-storia` 8.003→1.605 impr e click **111→13**; in parallelo `cos-e-la-trama-di-una-storia` 8.557→17.320 impr e click 24→59 (CTR 0,34% a posizione 4,21). Riattribuzione di query tra le due pagine con **−63 click netti** sulla coppia, nello stesso arco temporale della riscrittura.

#### Sta rispettando le aspettative?

| Criterio | Target dichiarato | Esito |
|---|---|---|
| Indicizzazione (giorno 30) | nuova struttura letta da Google | ✅ sitelink migrati alle 7 sezioni nuove |
| CTR (giorno 30 — *l'unico KPI che il piano dichiara per i 30 gg*) | in crescita | ✅ +57% (2,2× sulle query attribuite) |
| Posizione keyword | giudizio esplicito a **90–180 gg** | ⏳ exact a 9,78: fondo pagina 1, non ancora top 5 |
| Impressioni mese su mese | crescita | ❌ −5% (sito +31%) |
| Catturare la query (§2 Pillar 1) | — | ⏳ 6 click in 28 gg: non ancora |

**Lettura:** sui due criteri fissati per il giorno 30 (indicizzazione + CTR) è **in linea o sopra**. Sul traffico è sotto, ma va confrontato col fatto che a posizione 13 il tetto di CTR è ~1–2%: con 377 impressioni i 6 click sono *esattamente* il massimo atteso (baseline doc: "a posizione >10 → 0 click attesi"). La variabile che conta resta la posizione, da giudicare al giorno 90.

**Buchi nel piano — chiusi il 2026-10-22.** §8 diceva "Organic traffic growth: +X% mese su mese" senza definire X, e non esisteva un target numerico per click o posizione: senza numeri il giorno 90 non sarebbe stato giudicabile. Le soglie sono ora fissate nella sezione Giorno 90, e §8 di `content-strategy.md` è stato allineato (v1.1).

**Aperti:** (a) 4 export settimanali W1–W4 per capire se il dip è iniziale o recente (la posizione media a 28 gg, 13,13, è peggiore del 10,94 della settimana 1: serve la curva); (b) GA4 per i click CTA; (c) SERP manuale per "come scrivere una sceneggiatura" — GSC non dice quale snippet vince; (d) `BreadcrumbList` mancante sui post blog (non le FAQ: il `FAQPage` c'è già).

### Giorno 90 — Trimestral Review (§8) — decisione
- [ ] Posizione stabile della keyword (top 10? top 5? competitor superati?)
- [ ] Organic traffic sul cluster 1A (hub + spoke) — target e quota definiti sotto
- [ ] Conversion funnel §5: blog → ebook → iscrizione newsletter
- [ ] lead → acquisto corso/editing Double View
- [ ] Nuove keyword opportunity emerse dalle queries in GSC (da "come scrivere X")
- [ ] Aggiornare hub con nuovi link spoke / opportunità identificate

#### Soglie di decisione (fissate il 2026-10-22)

Baseline al 22/10 — hub: pos exact **9,78** · CTR **1,59%** · **6 click/28 gg** · quota click cluster sul sito **29,0%**.

| Metrica | PASS — continuare a investire | PARZIALE — iterare | FAIL — cambiare approccio |
|---|---|---|---|
| Posizione exact `come scrivere una sceneggiatura` | ≤ 5 | 6–8 | > 8 |
| CTR hub | ≥ 3,0% | 2,0–3,0% | < 2,0% |
| Click hub / 28 gg | ≥ 40 | 20–39 | < 20 |
| Quota click cluster 1A sul totale sito | ≥ 33% | 29–33% (piatto) | < 29% |

**Sono soglie di decisione, non previsioni.** Il giorno 90 non serve a sapere "se è andata bene": serve a decidere se continuare, iterare o cambiare approccio. In caso di PARZIALE, l'ordine di intervento è snippet/title → internal link dagli spoke → schema FAQ. In caso di FAIL, il sospetto numero uno non è il testo ma **l'intento**: la SERP potrebbe volere un formato diverso (lista, video, template) da quello che stiamo servendo.

**Attenzione all'aritmetica del gate:** 40 click a CTR 3% richiedono ~1.300 impressioni (ora 377). Se al giorno 90 la posizione è ≤ 5 ma le impressioni restano ~400, il gate è **PARZIALE** e il collo di bottiglia è il *volume di domanda*, non il ranking: in quel caso l'azione non è "scrivere meglio", è allargare le query servite (nuovi spoke) o spostare il KPI sul cluster.

**Perché la quota di cluster e non il +X% assoluto:** il sito è cresciuto del +31% in 28 giorni per cause che non controlliamo (rientro scuola / ranking event). Una quota neutralizza il denominatore: se il cluster cresce più del sito, la riscrittura ha funzionato; se cresce uguale, no.

**Baseline cluster 1A al 22/10** (8 URL esistenti: hub, soggetto, logline, trattamento, scaletta, formattare, programmi, 21 idee cortometraggio): click 360 → **597** (+66%), impressioni 15.839 → 22.836 (+44%), quota sul sito 23,1% → **29,0%**.

### Giorno 180 — Maturità hub
- [ ] Posizione stabile: exact in **top 5**, CTR hub **≥ 3,5%**, **≥ 70 click/28 gg**
- [ ] Quota click cluster 1A sul sito **≥ 38%**
- [ ] Contributo al cluster: i 3 spoke linkati (soggetto, trattamento, scaletta) ricevono traffico citato e crescono a loro volta
- [ ] Valutare A/B sul titolo (deliverable §4: variante B/C) — solo con CTR < 3% a posizione ≤ 5, altrimenti il collo di bottiglia non è il titolo

---

## KPI da monitorare (da §8)

| Metrica | Tipo | Dove |
|---------|------|------|
| Pagine visualizzate / utenti unici | Vanity (monitorare, non ottimizzare) | GA4 |
| Posizione keyword + impressioni | Business | GSC |
| CTR (vs snippet competitor) | Business | GSC |
| Blog → lead magnet → newsletter | Business | GA4 + form |
| Lead → acquisto (corso/editing) | Business | Stripe + email |

**Nota:** la query "come scrivere una sceneggiatura" non è posseduta da nessun competitor serio (strategy §1, gap #1): le posizioni vanno giudicate a 90-180 giorni, i primi 30 misurano indicizzazione e CTR.

---

## Setup suggerito (prima del giorno 7, se non già attivo)
- GSC: sitemap inviata, URL manuale richiesto
- GA4: eventi di conversione su click CTA (ebook = contenuto scaricato)
- UTM sulle email/social che puntano alla pagina