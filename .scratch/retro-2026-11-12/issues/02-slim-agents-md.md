---
Status: ready-for-human
Type: task
Blocked by: none
---

# 02: Dimagrire AGENTS.md

**What to build:** `AGENTS.md` tiene ciò che solo lui può portare — i puntatori di navigazione e i
gotcha che nessun config confessa — e lascia andare ciò che `package.json`, `.env` e
`docs/self-hosting/` dicono già. Da 319 righe / 19,5 KB a circa 200 righe, senza cambiare
comportamento.

**Blocked by:** None.

**Status:** ready-for-human — è la Fase 2 della riorganizzazione dei documenti, e le decisioni su
cosa tenere sono del maintainer.

## Perché

`AGENTS.md` è nel contesto di ogni turno. Oggi spende circa 5k token per ripetere comandi che
l'agente può leggere in `package.json` e variabili che il file stesso rimanda a
`docs/self-hosting/appendice-a-variabili-ambiente.md`. Il costo non è solo il token: è
l'attenzione spesa su una lista di comandi invece che sui gotcha, che sono l'unica parte che non
si trova altrove.

## Acceptance criteria

- [ ] Nessun comando che `package.json` già definisce, tranne dove la spiegazione è il punto
      (perché le migrazioni stanno nel build command, perché `dev:db:*` pinna il progetto
      Compose).
- [ ] Le variabili d'ambiente diventano un puntatore all'appendice, non una lista.
- [ ] **Key Technologies** sparisce: è `package.json`.
- [ ] L'istruzione sul lint compare una volta sola (oggi è in Testing Instructions e in Pull
      Request Guidelines).
- [ ] Restano, perché nessun config li esprime: l'avviso di non puntare il dev locale alla
      produzione (il pump ogni 15 secondi), la tabella Coolify, la regola "migrazioni nel build
      command, non nel pre-deployment", la nota ISR single-instance / `revalidatePath`, i due
      file di auth da tenere allineati, la regola sugli identificatori SQL da allow-list, tutti i
      Common Gotchas (incluso il #8 su `docs/puck-canvas.md`).
- [ ] **File organization patterns** resta ma si accorcia: spiega una convenzione (`server/`,
      `ui/`, `hooks/`, `lib/`, `store/` dentro un modulo), non solo un albero di cartelle.
- [ ] Ogni riga che resta nomina un file da leggere o enuncia una regola che nessun config può
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
