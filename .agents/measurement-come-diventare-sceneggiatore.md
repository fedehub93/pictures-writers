# Measurement — "Come diventare sceneggiatore" (Pillar Hub 1B)

**Hub page:** `/come-diventare-sceneggiatore-la-guida-definitiva/`
**Precedente al nuovo articolo:** vedi snapshot baseline al giorno 0 (il post era già indicizzato, va misurato il delta, non è una pagina nuova).
**Riferimenti:** `.agents/content-strategy.md` §8 (KPI e Metriche) · `.agents/serp-come-diventare-sceneggiatore.md` (deliverable riscrittura) · `.agents/product-marketing.md`.

Le scadenze sono allineate alla *Trimestral Review* della strategy (§8). Obiettivo: distinguere *tecnicità* (da sistemare subito) da *performance* (da valutare a 30/90 giorni).

**Nota di contesto SERP:** la query "come diventare sceneggiatore" è dominata da accademie con domini forti (NABA, Università Link, DAM Academy). Le posizioni vanno giudicate a 90-180 giorni; i primi 30 misurano indicizzazione, CTR e corretta generazione dello schema.

---

## Timeline dei check

### Giorno 0 — Pubblicazione ✅ (2026-10-01)
- [x] URL pubblicato: `/come-diventare-sceneggiatore-la-guida-definitiva/` (non `/draft/...`)
- [x] Meta title/description aggiornati (deliverable §5)
- [x] Roadmap presente come **lista HTML**, non solo immagine
- [x] CTA callout presenti (laboratorio, editing soggetto, editing categoria) e link corretti
- [x] Blocco FAQ compilato (5 risposte)
- [x] **`FAQPage` JSON-LD presente** (Rich Results Test) — unico controllo bloccante che il draft non permetteva
- [x] "Double View" uniformato (intro + CTA)
- [x] Immagini con alt text; nessun link rotto
- [x] Richiedere indicizzazione/aggiornamento in GSC (URL + sitemap)

### Giorno 7 — Snapshot baseline
> Un rilevamento, non un giudizio: serve come termine di paragone.
- [ ] Indicizzata? (GSC: Coverage → Valid)
- [ ] Queries per cui appare + posizione media (pre/post riscrittura)
- [ ] Impressioni, click, CTR, posizione
- [ ] Bounce rate / tempo su pagina (GA4)
- [ ] Click sui 3 CTA (laboratorio, editing soggetto, editing categoria)
- [ ] `FAQPage` valido e nessun rich-result error in GSC

### Giorno 30 — Primi segnali
- [ ] Posizione keyword esatta "come diventare sceneggiatore" + varianti ("in Italia", "cinematografico", "cosa studiare")
- [ ] Impressioni in crescita mese su mese?
- [ ] CTR: presenza nei rich result grazie all'FAQPage?
- [ ] Queries residue emerse in GSC da aggiungere alle FAQ
- [ ] Fix tecnici eventuali (Core Web Vitals, mobile)

### Giorno 90 — Trimestral Review (§8) — decisione
- [ ] Posizione stabile (top 20? top 10? accademie superate?)
- [ ] Organic traffic sul cluster 1B (hub + spoke: scuole, concorsi)
- [ ] Funnel: blog → feedback gratuito / newsletter → laboratorio / editing
- [ ] Confronto CTA: laboratorio vs editing (quale converte)
- [ ] Nuove keyword opportunity da "come diventare X"
- [ ] Aggiornare hub con nuovi link spoke / opportunità

### Giorno 180 — Maturità hub
- [ ] Posizione pagina 1 o top 5-10 con CTR significativo
- [ ] Contributo al cluster: traffico verso spoke (scuole, concorsi, soggetto/trattamento/scaletta)
- [ ] Valutare A/B sul titolo (deliverable §4: varianti B/C)

---

## KPI da monitorare (da §8)

| Metrica | Tipo | Dove |
|---------|------|------|
| Pagine visualizzate / utenti unici | Vanity (monitorare, non ottimizzare) | GA4 |
| Posizione keyword + impressioni | Business | GSC |
| CTR (vs snippet competitor) | Business | GSC |
| Presenza rich result FAQ | Business | GSC |
| Blog → lead magnet / feedback gratuito | Business | GA4 + form |
| Click CTA → laboratorio / editing | Business | GA4 + Stripe |

**Nota:** essendo il post già esistente, il giorno 0 è un **baseline di confronto**, non un punto di partenza da zero. Il valore atteso della riscrittura si legge nel delta posizione/CTR/click ai 30-90 giorni.

---

## Setup suggerito (prima del giorno 7, se non già attivo)
- GSC: sitemap inviata, URL richiesto manualmente dopo il publish
- GA4: eventi di conversione sui click CTA (laboratorio, editing, feedback gratuito)
- Rich Results Test: verifica manuale del `FAQPage` post-publish
- UTM sulle email/social che puntano alla pagina
