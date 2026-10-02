# AI SEO — Pictures Writers

**Document version:** v1
**Last updated:** 2026-10-02
**Status:** Fase 8 della roadmap SEO (ai-seo)
**Contesto:** `.agents/product-marketing.md`, `.agents/content-strategy.md`, `.agents/schema.md`

---

## 1. Obiettivo di questa fase

Pictures Writers oggi **rankia** su Google (guida "come scrivere una sceneggiatura" in top-5 organico) ma non è ancora **citabile dalle risposte AI** (AI Overviews, ChatGPT, Perplexity, Gemini, Copilot, Claude). Obiettivo della fase: passare da "retrieved" a "cited" — e, sul lungo periodo, a "recommended" — con interventi su tre assi:

1. **Structure** — contenuto estraibile a blocchi (answer block, tabelle, FAQ).
2. **Authority** — dati, fonti citate, E-E-A-T, freschezza.
3. **Presence** — essere dove gli LLM guardano (machine-readable files, terze parti).

Il target primario è **Google AI Overviews** (dove PW ha già le fondamenta SEO), poi **ChatGPT** e **Perplexity**. Copilot/Claude sono lower priority.

---

## 2. Audit agent-readiness (2026-10-02)

Scansione `is-agentic.com` su `pictureswriters.com`: **68/100** — *"Important blockers remain"*. 3 fail, 6 partial su 14 check.

### 2.1 Fail

| # | Check | Livello | Evidenza | Azione |
|---|-------|---------|----------|--------|
| 1 | Markdown content negotiation | Essential | `Accept: text/markdown` su `/` restituisce HTML, manca `Vary: Accept` | **Rimandato** — richiede `proxy.ts` + conversione TipTap/Puck. Vedi §7.2 |
| 2 | Brand name discoverability | Recommended | Ricerca di "Pictures Writers" non restituisce il dominio | Presenza off-site (LinkedIn, Wikipedia, mention) — §5.3 |
| 3 | Agent instruction / when-to-use | Recommended | Nessun `llms.txt` | **Fatto** — §7.1 |

### 2.2 Partial

| # | Check | Evidenza | Azione |
|---|-------|----------|--------|
| 4 | Agent-friendly 404 | 404 corretto ma senza body Markdown | Rimandato col Markdown negotiation |
| 5 | Content without JS | 5.674 char, H1 presente ma salta H2→H4 | **Corretto** (heading homepage) |
| 6 | Metadata completeness | manca `og:image` | **Fatto** — §7.1 |
| 7 | Organization schema | manca `contactPoint`, `address` | **Fatto** — §7.1 |
| 8 | Trust anchor pages | `/about` e privacy ok, "Contact" non riconosciuto (pagina `/contatti/` in italiano) | Documentato — non è un gap reale di contenuto |
| 9 | JSON-LD structured data | Organization senza `description` | **Fatto** — §7.1 |

### 2.3 Nota positiva

Il contenuto pubblico è **server-rendered**: homepage, blog e pagine shop restituiscono testo nel primo HTML (senza JS). Questo è il prerequisito #1 di entrambi i checker ed è già soddisfatto.

---

## 3. Come funziona l'AI search (sintesi operativa)

| Piattaforma | Index | Cosa pesa | Priorità PW |
|---|---|---|---|
| **Google AI Overviews** | Google | Core ranking + E-E-A-T + schema | **Alta** |
| **ChatGPT** | Bing | Authority (40%), content-answer fit (55%), freschezza (3,2× se <30gg) | **Alta** |
| **Perplexity** | proprio + Google | FAQ schema, PDF pubblici, paragrafi self-contained, velocity | **Media** |
| **Gemini** | Google + KG | Source owned dominanti (~60% citazioni) | Media |
| **Copilot** | Bing | LinkedIn/GitHub, page speed <2s | Bassa |
| **Claude** | Brave | Factual density, precisione | Bassa |

**Stance Google (da rispettare):** nessun markup speciale richiesto per AI Overviews; non scrivere contenuti "per l'AI"; non spezzare il testo in frammenti; buon SEO + contenuto people-first è la base. Gli altri motori invece premiano struttura estraibile, `llms.txt` e file machine-readable. La strategia qui sotto fa entrambe le cose senza conflitto.

**Citation ≠ recommendation.** Essere citati è governato dal contenuto; essere **raccomandati** dipende dal consenso esterno (recensioni, forum, stampa, video). Per un brand emergente come PW, la parte off-site (§5.3) è il collo di bottiglia per finire nelle shortlist.

**Volatilità del formato:** ad agosto 2026 ChatGPT 5.6 ha ridotto le citazioni da listicle (−50%) e pagine di confronto (−32%), spingendo verso `site:`/fonti "official" e pagine owned. Conseguenza per PW: le guide how-to, i servizi (`/shop/servizi-di-editing/`) e i file machine-readable sono il terreno premiato — **non** produrre listicle/comparison in scala "per l'AI".

---

## 4. Audit di visibilità AI (da compilare manualmente)

Non esiste reporting AI-specific in Search Console. L'audit va fatto a mano. Le risposte AI sono **non-deterministiche**: eseguire ogni query **3–5 volte** per piattaforma, sessione pulita, e registrare il **mention rate** con `n`.

### Query di test (top 13)

| # | Query | Pagina PW | Google AIO | ChatGPT | Perplexity | PW citata? | Chi è citato |
|---|-------|-----------|:---:|:---:|:---:|:---:|---|
| 1 | come scrivere una sceneggiatura | `/come-scrivere-una-sceneggiatura/` | — | — | — | — | — |
| 2 | come diventare sceneggiatore | `/come-diventare-sceneggiatore-la-guida-definitiva/` | — | — | — | — | — |
| 3 | differenza soggetto trattamento scaletta | (spoke) | — | — | — | — | — |
| 4 | come scrivere un soggetto cinematografico | (spoke) | — | — | — | — | — |
| 5 | come formattare una sceneggiatura | (spoke) | — | — | — | — | — |
| 6 | editing sceneggiatura / consulenza copione | `/shop/servizi-di-editing/` | — | — | — | — | — |
| 7 | scuole di sceneggiatura in Italia | (spoke) | — | — | — | — | — |
| 8 | CSC vs Holden vs Bottega Finzioni | (spoke) | — | — | — | — | — |
| 9 | struttura in tre atti sceneggiatura | (hub) | — | — | — | — | — |
| 10 | come scrivere un dialogo | (spoke) | — | — | — | — | — |
| 11 | AI e sceneggiatura | (spoke) | — | — | — | — | — |
| 12 | concorsi di sceneggiatura 2026 | (hub) | — | — | — | — | — |
| 13 | come scrivere una logline | (spoke) | — | — | — | — | — |

**Metodo diagnostico avanzato (ChatGPT fan-out):** aprire la query in ChatGPT, DevTools → Network, refresh della conversazione (`/c/<id>`), cercare `queries` nel payload per vedere le ricerche reali che ChatGPT fa in background. Serve a costruire la lista query dai comportamenti reali — **non** a generare un articolo per ogni fan-out (è il pattern che 5.6 ha penalizzato).

**Scomporre le cause** prima di concludere "non siamo citati":
- **Technical** — non crawlabile/parsabile (vedi §2 e §6).
- **Comprehension** — l'AI ci descrive in modo vago/errato (manca una definizione chiara).
- **Trust** — capisce ma non ci sceglie (gap di consenso esterno, §5.3).

---

## 5. Strategia — i tre pilastri su Pictures Writers

### 5.1 Structure — rendere il contenuto estraibile

Le AI estraggono **passaggi**, non pagine. Ogni claim chiave deve reggere da solo.

| Pagina | Pattern da applicare | Esempio concreto |
|--------|----------------------|------------------|
| `/come-scrivere-una-sceneggiatura/` | **Definition + Step-by-step** in testa | "Una sceneggiatura è un testo scritto per immagini, strutturato in titoli di scena, descrizioni e dialoghi, che precede la realizzazione del film. Si scrive in 10 passi: …" |
| `/shop/servizi-di-editing/` | **Self-contained answer + Comparison** | "**Pictures Writers Editing Double View**: due consulenti analizzano la tua sceneggiatura in modo indipendente e restituiscono un'unica analisi incrociata. Risposta in 7–10 giorni lavorativi. Prezzo sotto la media del mercato." |
| Spoke "soggetto/trattamento/scaletta" | **Comparison table** | tabella a 3 colonne (a cosa serve, lunghezza, quando si usa) |
| Hub categoria | **FAQ block** | domande in linguaggio naturale ("Quanto costa un editing di sceneggiatura?", "Quanto tempo serve per scrivere una sceneggiatura?") |
| Pagine servizio/corso | **Pros/cons + FAQ** | "È per me?" → risposta diretta in prima frase |

**Regole strutturali:**
- Risposta diretta **subito dopo** l'heading, non sepolta.
- Blocchi answer da **40–60 parole** (ottimale per l'estrazione).
- H2/H3 che rispecchiano il modo in cui le persone formulano la query.
- Tabelle per i confronti, liste numerate per i processi.
- Un concetto per paragrafo.

**Freschezza:** mostrare "Aggiornato il …" in modo visibile (già presente in `formatDate` sui post). Priorità di refresh: hub `come-scrivere` e `come-diventare` (già riscritti in v8), poi le spoke del cluster 1A.

### 5.2 Authority — rendere il contenuto citabile

Il Princeton GEO study (KDD 2024) misura i guadagni di visibilità: **citare fonti +40%**, **statistiche +37%**, **citazioni di esperti +30%**, tono autorevole +25%. La combinazione migliore è *fluidità + statistiche*.

Per PW:
- **Dati originali** — PW ha già l'asset perfetto da sfruttare: il **sondaggio "State of Italian Screenwriting"** previsto nel calendario. Statistiche originali + dataset = la classe di contenuto più citata su tutte le piattaforme.
- **Statistiche con fonte** — es. "Secondo il report X, il 70% …". Mai numeri senza fonte.
- **Attribuzione autoriale** — `Federico Verrengia` e `Lorenzo Carapezzi` come autori con bio e credenziali (già esposti in JSON-LD BlogPosting). Aggiungere bio autore con esperienza di prima mano.
- **E-E-A-T** — mostrare esperienza reale (le 7 recensioni 5★, i laboratori tenuti, i copioni analizzati in "Pagina Uno").
- **Densità fattuale** — numeri specifici, date, esempi tratti da film reali (il format "Pagina Uno" è già perfetto per questo).

### 5.3 Presence — essere dove gli LLM guardano (off-site)

Le citazioni di terze parti governano le **raccomandazioni**. Portfolio, non una sola superficie (i mix cambiano con gli update dei modelli):

| Superficie | Azione PW | Skill correlata |
|---|---|---|
| **LinkedIn** | Articoli lunghi (non solo post); la superficie più citata per temi professionali. Front-loadare la frase target nei primi caratteri (diventa lo slug) | social |
| **YouTube** | Analisi "Pagina Uno" in video + trascrizione/capitoli/descrizione (i modelli leggono il testo attorno al video) | video |
| **Podcast** | Guest in podcast di cinema/scrittura; le trascrizioni vengono crawlate | public-relations |
| **Community** | Reddit/forum di sceneggiatori — partecipazione autentica, mai spam | community-marketing |
| **Recensioni** | Presidio delle 7 recensioni esistenti e generazione continua | customer-research |
| **Wikipedia** | Difficile per un brand di nicchia; monitorare, non forzare | — |

**Test prima di investire in un'ennesima guida self-ranked:** *se un modello ignorasse tutto il nostro dominio, il resto del web ci metterebbe comunque in shortlist?* Se no, quel gap è la priorità.

---

## 6. File machine-readable per gli agenti

Google non li richiede per AI Overviews; ChatGPT/Claude/Perplexity e gli agenti d'acquisto sì. Implementati in questa fase (§7.1):

- **`/robots.txt`** — policy esplicita per i crawler AI (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai, Google-Extended, Bingbot) + `Content-Usage` come segnale di intento. Il `Disallow` esistente resta invariato.
- **`/llms.txt`** — contesto sintetico per gli LLM: cos'è PW, per chi, quando usarla, pagine chiave, servizi.
- **`/llms-full.txt`** — catalogo completo (post + prodotti + FAQ) in un unico file, una sola richiesta.

**Rimandati (roadmap §7.2):**
- **Content negotiation Markdown** (`Accept: text/markdown` → Markdown allo stesso URL canonico, con `Vary: Accept`) e **404 in Markdown**.
- **`/pricing.md`** — PW non ha piani SaaS, ma il servizio di editing ha un prezzo esplicito: un file markdown con i listini del servizio (e il feedback gratuito) rende i prezzi parsabili dagli agenti d'acquisto.

---

## 7. Piano di intervento

### 7.1 Implementato in questa fase (fondamenta tecniche)

| # | File | Modifica |
|---|------|----------|
| 1 | `src/app/robots.ts` | Regole esplicite `Allow` per i crawler AI + `Content-Usage` |
| 2 | `src/app/llms.txt/route.ts` | Nuovo — `llms.txt` dinamico |
| 3 | `src/app/llms-full.txt/route.ts` | Nuovo — catalogo completo |
| 4 | `src/app/(home)/_components/seo/json-ld/organization.tsx` | `description`, `contactPoint`, `address` (country) |
| 5 | `src/app/(home)/_components/seo/head-metadata.ts` | `og:image`, `og:site_name`, `og:locale`, `twitter` |
| 6 | `src/app/(home)/_components/hero-section.tsx` (+ affini) | Gerarchia heading H2→H3 senza salti |

### 7.2 Roadmap (prossime sessioni)

1. **Proxy + Markdown negotiation** — `src/proxy.ts` che, su `Accept: text/markdown`, riscrive a una route Markdown; `Vary: Accept` sulle risposte HTML; 404 in Markdown. `proxy.ts` è il successore di `middleware.ts` in Next.js 16.
2. **Conversione TipTap/Puck → Markdown** — per abilitare il Markdown per-post (oggi il body è JSON TipTap / Puck).
3. **Answer block nel copy** — riscrivere l'incipit delle 6 pagine chiave con definition/self-contained answer da 40–60 parole (coordinare con `copywriting.md`).
4. **FAQ + `FAQPage`** — estendere le FAQ alle hub page (oggi solo prodotti shop).
5. **`HowTo` schema** — sulle guide "come fare X".
6. **Structured pricing** — `/pricing.md` con i listini del servizio editing.
7. **Dati originali** — sondaggio "State of Italian Screenwriting" + statistiche citabili.
8. **Presence** — primi 3 articoli LinkedIn, 3 analisi YouTube, 5 pitch podcast.

### 7.3 Cosa NON fare (stance Google)

- Non scrivere contenuti separati "per l'AI" → rischio spam per scaled content abuse.
- Non spezzare le pagine in frammenti AI-bait.
- Non bloccare i crawler AI se si vuole essere citati (bloccare solo CCBot, training-only, è sicuro).
- Non produrre listicle/comparison in scala per caccia alla citazione.
- Non nascondere il contenuto dietro JS non renderizzato (PW è già server-rendered).

---

## 8. Monitoraggio

| Cosa | Come | Cadenza |
|---|---|---|
| Agent-readiness score | `npx is-agentic pictureswriters.com` — before/after | Mensile |
| AI Overview presence | Check manuale (o Semrush/Ahrefs) | Mensile |
| Citation rate per piattaforma | DIY: 13 query × 3–5 run × (ChatGPT/Perplexity/Google) | Mensile |
| Framing delle mention | recommended / neutral / hedged / recommended-against | Mensile |
| Share of AI voice | Peec AI / Otterly / ZipTie (se/budget disponibile) | Trimestrale |
| Referral da AI | GA4 → referral; **nota: solo ~9% dei click post-raccomandazione arriva come referral visibile** | Mensile |

**Metriche business da agganciare:** branded search volume (proxy di influenza AI senza campagna), self-reported attribution ("come ci hai conosciuto?"), registrazioni chiamate/email.

**Search Console:** nessun report AI-specifico — usare Performance/Coverage/Core Web Vitals standard.

---

## 9. Handoff

Prossima fase della roadmap: **9. marketing-plan** (fCMO/AARRR, 13 sezioni). Il presente documento fornisce l'input AI/visibilità per la sezione Acquisition del piano.

---

## Changelog

- v1 (2026-10-02) — Fase ai-seo. Audit `is-agentic` (68/100), strategia 3 pilastri, piano, implementazione fondamenta tecniche (robots, llms.txt, llms-full.txt, Organization JSON-LD, metadata OG, heading) e roadmap (Markdown negotiation, answer block, FAQ/HowTo, dati originali, presence).
