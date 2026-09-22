# Measurement — "Come scrivere una sceneggiatura" (Pillar Hub)

**Hub page:** `/come-scrivere-una-sceneggiatura/`
**Precedente al nuovo articolo:** vedi snapshot baseline (data pubblicazione).
**Riferimenti:** `.agents/content-strategy.md` §8 (KPI e Metriche) · §1 (situazione attuale: 2.400 visualizzazioni/mese, 1.000 utenti unici/mese, 700+ iscritti newsletter).

Le scadenze sotto sono allineate alla *Trimestral Review* della strategy (§8). Lo scopo: distinguere *tecnicità* (da sistemare subito) da *performance* (da valutare a 90 giorni).

---

## Timeline dei check

### Giorno 0 — Pubblicazione
- [ ] URL definitivo pubblicato: `/come-scrivere-una-sceneggiatura/` (non `/draft/...`)
- [ ] Meta title/description aggiornati (deliverable §5)
- [ ] Immagini con alt text; nessun link rotto (verifica il link "tema della storia" corretto)
- [ ] Richiedere indicizzazione/aggiornamento in GSC (URL + sitemap)

### Giorno 7 — Snapshot baseline (da confrontare con 30/90)
> Serve come termine di paragone: si rileva una volta, non si giudica.
- [ ] Indicizzata? (GSC: Coverage → Valid)
- [ ] Queries per cui appare + posizione media
- [ ] Impressioni, click, CTR, posizione
- [ ] Bounce rate / tempo su pagina (GA4)
- [ ] Funzionamento CTA: ebook (click), link lab/editing

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