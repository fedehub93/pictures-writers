# Marketing & SEO docs

Documenti di strategia, contenuto, SEO, email e lancio di Pictures Writers. Erano in `.agents/`; ora vivono qui.

## Struttura

```
docs/marketing/
  strategy/   → contesto, strategia contenuti, piano marketing
  seo/        → AI search, schema, riscritture SERP, piani di misurazione
  content/    → copy deck e ottimizzazione conversione delle pagine
  email/      → sequence e playbook newsletter
  launch/     → lancio del laboratorio 1:1
```

## Ordine di lettura

1. **`strategy/product-marketing.md`** — chi è il pubblico, cosa vendiamo, con che voce. È il contesto che tutti gli altri citano.
2. **`strategy/content-strategy.md`** — cosa pubblicare (pillar, cluster), calendario 60/30/10, funnel, KPI (§8).
3. **`strategy/marketing-plan.md`** — piano completo AARRR a 12 mesi, con rubric di autovalutazione e decisioni aperte.
4. Poi l'esecuzione, per fase: `content/copywriting` → `content/cro` → `seo/schema` → `email/emails` → `email/newsletter` → `seo/ai-seo` → `launch/*`.
5. Per singola pagina: `seo/serp-<slug>` (audit SERP + riscrittura) e poi `seo/measurement-<slug>` (check a 7/30/90/180 giorni).

## Indice

| File | Cosa contiene | Stato | Ultima modifica |
|---|---|---|---|
| `strategy/product-marketing.md` | Posizionamento, ICP, voce, obiezioni, proof point | ✅ contesto master | 05/10/2026 |
| `strategy/content-strategy.md` | Pillar e cluster, calendario, funnel, KPI §8 | 🔄 v1.1 — target numerici fissati | 22/10/2026 |
| `strategy/marketing-plan.md` | Piano AARRR 13 sezioni (ott 2026–set 2027), rubric, decisioni | ✅ completo · #1 attribuzione offline parcheggiata | 05/10/2026 |
| `content/copywriting.md` | Copy deck: title, meta, intro, CTA per hub e pagine | 🔄 applicazione in CMS in corso | 02/10/2026 |
| `content/cro.md` | Audit pagine, quick win e test di conversione | 🔄 quick win residui | 23/09/2026 |
| `content/lead-magnet-01-template-soggetto.md` | LM1 "Il soggetto in 8 mezze pagine": decisioni, contenuto v2, specifica Figma, template prodotto, landing, email | 🔄 contenuto v2 e specifica Figma pronti; da impaginare | 22/10/2026 |
| `seo/schema.md` | JSON-LD: Organization, Product/Course/Event, FAQ | ✅ fase 6 | 23/09/2026 |
| `seo/ai-seo.md` | Agent-readiness, `llms.txt`, policy AI, roadmap AI search | ✅ fondamenta · ⏳ markdown negotiation, dati originali | 21/10/2026 |
| `seo/serp-come-scrivere-una-sceneggiatura.md` | Audit SERP + riscrittura integrale hub 1A | ✅ pubblicata 22/09 | 01/10/2026 |
| `seo/serp-come-diventare-sceneggiatore.md` | Audit SERP + riscrittura hub 2B | ✅ | 01/10/2026 |
| `seo/measurement-come-scrivere-una-sceneggiatura.md` | Misurazione hub 1A: baseline, giorno 30 chiuso, soglie giorno 90 | 🔄 giorno 90 aperto | 22/10/2026 |
| `seo/measurement-come-diventare-sceneggiatore.md` | Misurazione hub 2B | 🔄 | 01/10/2026 |
| `email/emails.md` | Design sequence S1–S5 + infrastruttura | ✅ S1/S2/S4 live · ⏳ S3/S5 | 02/10/2026 |
| `email/newsletter.md` | Playbook operativo S4, piani mensili | 🔄 | 07/10/2026 |
| `launch/launch-individuale.md` | Piano di lancio Laboratorio 1:1 (pre-annuncio → vendita) | 🔄 finestra 8–27/10 | 07/10/2026 |
| `launch/laboratorio-1-1-product-page.md` | Brief e copy della product page 1:1 | 🔄 | 07/10/2026 |

## Convenzioni

- **Link interni root-relative**: `docs/marketing/...`, non relativi. Valgono da qualunque sottocartella e non si rompono se un doc cambia cartella.
- **Nessun dato grezzo versionato**: i CSV di Search Console non sono conservati. I numeri che contano stanno nei `measurement-*.md`, con data e finestra di rilevazione.
- **Un doc per fase**: non duplicare contenuto tra documenti; la catena è `product-marketing` → `content-strategy` → deliverable di fase.

## Altri posti utili

| Cosa | Dove |
|---|---|
| Issue e spec di lavoro | `.scratch/<feature-slug>/` |
| Decisioni architetturali | `docs/adr/` |
| Contesto di dominio condiviso | `CONTEXT.md` |
| Regole per gli agenti | `AGENTS.md` |
| Skill installate | `.agents/skills/` |
