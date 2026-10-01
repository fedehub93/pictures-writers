# Measurement — "Come scrivere una sceneggiatura" (Pillar Hub)

**Hub page:** `/come-scrivere-una-sceneggiatura/`
**Precedente al nuovo articolo:** vedi snapshot baseline (data pubblicazione).
**Riferimenti:** `.agents/content-strategy.md` §8 (KPI e Metriche) · §1 (situazione attuale: 2.400 visualizzazioni/mese, 1.000 utenti unici/mese, 800+ iscritti newsletter).

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
**Da verificare:** le tabelle Query/Dispositivi/Paesi sommano 33 impressioni contro le 98/123 di Pagine/Grafico → re-esportare con lo stesso filtro `+scrivere-una-sceneggiatura` e lo stesso periodo per coerenza.
**Azione setup (prima del giorno 30):** validare gli eventi CTA (ebook, lab/editing) con un click manuale — con 0 click organici non sono ancora misurabili.

### Giorno 30 — Primi segnali (KPI §8: keyword rankings + traffico)
- [ ] Posizione keyword esatta "come scrivere una sceneggiatura" e varianti ("da zero", "guida")
- [ ] Impressioni in crescita mese su mese?
- [ ] CTR vs snip bundle? (che snippet della SERP vince: competitor che ti "rubano" click)
- [ ] Click verso ebook/lead magnet dal CTA mid e finale
- [ ] Eventuali fix tecnici emersi (core web vitals, mobile)

### Giorno 90 — Trimestral Review (§8) — decisione
- [ ] Posizione stabile della keyword (top 10? top 5? competitor superati?)
- [ ] Organic traffic +X% mese su mese sul cluster 1A (hub + spoke)
- [ ] Conversion funnel §5: blog → ebook → iscrizione newsletter
- [ ] lead → acquisto corso/editing Double View
- [ ] Nuove keyword opportunity emerse dalle queries in GSC (da "come scrivere X")
- [ ] Aggiornare hub con nuovi link spoke / opportunità identificate

### Giorno 180 — Maturità hub
- [ ] Il post è nella top 5-10 stabile (o su pagina 1 con CTR significativo)
- [ ] Contributo al cluster: i 3 spoke linkati (soggetto, trattamento, scaletta) ricevono traffico citato
- [ ] Valutare A/B sul titolo (deliverable §4: variante B/C)

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