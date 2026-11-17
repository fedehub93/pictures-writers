---
Status: done
Type: task
Blocked by: none
---

# 02: Dimagrire AGENTS.md

**What to build:** `AGENTS.md` tiene ciò che solo lui può portare — i puntatori di navigazione e i
gotcha che nessun config confessa — e lascia andare ciò che `package.json`, `.env` e
`docs/self-hosting/` dicono già. Da 319 righe / 19,5 KB a circa 200 righe, senza cambiare
comportamento.

**Blocked by:** None.

**Status:** done — 135 righe / 9,7 KB.

## Perché

`AGENTS.md` è nel contesto di ogni turno. Oggi spende circa 5k token per ripetere comandi che
l'agente può leggere in `package.json` e variabili che il file stesso rimanda a
`docs/self-hosting/appendice-a-variabili-ambiente.md`. Il costo non è solo il token: è
l'attenzione spesa su una lista di comandi invece che sui gotcha, che sono l'unica parte che non
si trova altrove.

## Acceptance criteria

- [x] Nessun comando che `package.json` già definisce, tranne dove la spiegazione è il punto
      (perché le migrazioni stanno nel build command, perché `dev:db:*` pinna il progetto
      Compose).
- [x] Le variabili d'ambiente diventano un puntatore all'appendice, non una lista.
- [x] **Key Technologies** sparisce: è `package.json`.
- [x] L'istruzione sul lint compare una volta sola (oggi è in Testing Instructions e in Pull
      Request Guidelines).
- [x] Restano, perché nessun config li esprime: l'avviso di non puntare il dev locale alla
      produzione (il pump ogni 15 secondi), la tabella Coolify, la regola "migrazioni nel build
      command, non nel pre-deployment", la nota ISR single-instance / `revalidatePath`, i due
      file di auth da tenere allineati, la regola sugli identificatori SQL da allow-list, tutti i
      Common Gotchas (incluso il #8 su `docs/puck-canvas.md`).
- [x] **File organization patterns** resta ma si accorcia: spiega una convenzione (`server/`,
      `ui/`, `hooks/`, `lib/`, `store/` dentro un modulo), non solo un albero di cartelle.
- [x] Ogni riga che resta nomina un file da leggere o enuncia una regola che nessun config può
      esprimere.

## Cosa è cache, con l'evidenza

| Sezione | Righe circa | Cosa ripete |
| --- | --- | --- |
| Setup Commands | 47 | `npm install`, i comandi Prisma, `npm run dev`, `npm run build` (tutti in `package.json`), più 14 variabili già elencate nell'appendice |
| Testing Instructions | 40 | gli script `test:*` e il contenuto di `.env.test` |
| Build and Deployment | 47 | `build`, `build:production`, `start`, che sono in `package.json` e nel runbook |
| Key Technologies | ~20 | `package.json` |
| Project Overview > Architecture | ~20 | descrive `src/app` e `src/modules`, che `ls src/` mostra |

## Note

- Leggere `writing-for-agents` prima di toccare il file: context load vs cognitive load,
  disclosure dietro puntatori, e il test dei no-op frase per frase.
- Non riaprire le decisioni della Fase 1, già in `48189df1`: indice ADR, TOC del glossario,
  scoping di `docs/agents/domain.md`. Questo ticket tocca solo `AGENTS.md`.
- Spostare le voci-spec del glossario dietro gli ADR è il punto 6, separato: non farlo qui.
- Coordinare con il ticket 01: la riga *"Before committing, always run `npm run lint`"* oggi è
  falsa. Se il ticket 01 è già chiuso, la riga è vera e resta; altrimenti va tolta o resa
  esplicita sul comando che funziona.
- Verifica: `npm run lint` non copre il markdown, quindi la verifica è una rilettura riga per
  riga contro i criteri qui sopra.

## Comments

- 2026-11-12 — Ticket scritto dal retro, su richiesta del maintainer (Fase 2 già pianificata).
  Evidenza: 319 righe, 19,5 KB, caricate a ogni turno; il retro ha trovato la duplicazione del
  comando lint e una riga che non può essere seguita.
- 2026-11-12 — Implementato. `AGENTS.md` passa da 465 righe / 19,1 KB a 135 righe / 9,7 KB
  (la versione al momento del ticket era già cresciuta rispetto alle 319 righe citate).
  - Rimossi: Setup Commands, Key Technologies, Key models, Build output, Important build config,
    Setup Prisma, l'elenco delle API route, le PR Guidelines (lint/build/migrazioni conservati
    dove servono).
  - Conservati e spostati: i comandi ora vivono solo in `package.json`; le variabili in un
    puntatore all'appendice; i due database locali, il pump, il vincolo `127.0.0.1`/IPv6, il
    pinning Compose, il log del dev server e i tre `test-db`/`global-setup` restano nel
    Development Workflow. La sezione `Database > Raw SQL` conserva il titolo perché i messaggi
    di `eslint.config.mjs` la citano per nome.
  - Tabella Coolify e regole di deploy restano, con il divieto esplicito di usare la
    "Pre-deployment command". Tutti gli 8 Common Gotchas restano, #3 chiarito sul conflitto
    `trailingSlash` vs `NEXT_PUBLIC_APP_URL` senza slash finale.
  - Code review (standards + spec, in parallelo): corretto il riferimento rotto `Database > Raw
    SQL`, reso esplicito il divieto sul pre-deployment, tolti i duplicati (appendice,
    troubleshooting, "Vercel/Neon"), aggiunta la nota che la CI non esegue `next build`.
  - Verifica: `npm run lint` esce 0 (243 warning, 0 errori); il markdown non è coperto da lint,
    quindi il resto è rilettura riga per riga contro gli acceptance criteria.
