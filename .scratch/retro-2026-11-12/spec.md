# Retro 2026-11-12: guardrail meccanici e `AGENTS.md`

## Problem Statement

Il lavoro sui link inerti nel canvas (ticket 02 di `puck-link-block-contract`) ha richiesto due
sessioni. La prima ha implementato il ticket, superato i test e i due subagent di review, ed è
stata committata: `fe11f23a`. I link navigavano ancora. La causa — Puck attacca un listener
nativo sulla radice del blocco e chiama `stopPropagation()`, quindi un handler React in bolla non
gira mai — è emersa solo in una seconda sessione, con Chrome vero davanti (`0440bb99`,
`a2c8a0b5`).

Da lì il retro ha isolato due cose che restano da fare. Non sono difetti del codice: sono difetti
dell'ambiente in cui l'agente lavora.

1. **Nessun guardrail funzionante.** `AGENTS.md` prescrive `npm run lint` prima di ogni commit, e
   il comando esce con 40 errori. La CI esegue solo `npm run test:run`: né lint né typecheck. Un
   errore di tipo o un hook chiamato dopo un early return arriva su `main` e lo intercetta solo
   la build Coolify, dopo il merge.
2. **`AGENTS.md` è una cache da 19 KB.** 316 righe caricate a ogni turno, circa 200 delle quali
   riscrivono `package.json`, `.env` e `docs/self-hosting/appendice-a-variabili-ambiente.md`.

## Solution

Il primo diventa un guardrail: `npm run lint` e `npm run typecheck` verdi, eseguiti dalla CI su
ogni pull request. Il secondo è editoriale: togliere da `AGENTS.md` ciò che l'ambiente già dice,
tenere i puntatori e i gotcha che nessun config confessa.

Le altre voci del retro sono già state applicate in questa sessione (vedi sotto): non vanno
rifatte.

## Tickets

- `issues/01-lint-and-typecheck-guardrail.md` — portare lint e typecheck in CI. `done`.
- `issues/02-slim-agents-md.md` — dimagrire `AGENTS.md`. `ready-for-human`: è la Fase 2 della
  riorganizzazione dei documenti, e le decisioni su cosa tenere sono del maintainer.

## Already applied

- `scripts/browser-probe.mjs` e `docs/agents/browser-probe.md`: Chrome headless via CDP, un
  click o una pressione di tasto, report JSON (`cancelled`, `navigated.top/frame/newTabs`).
  Verificato su 8 casi con un fixture locale; due bug trovati e corretti durante la verifica
  (porta fissa condivisa fra probe, hang quando il browser muore a metà run).
- `docs/puck-canvas.md`: il contratto del canvas che né i docs Puck né la skill installata
  portano — radice del blocco, click in fase di capture, parità di markup, verifica in browser.
  Puntato da `AGENTS.md` > Common Gotchas #8.
- `.scratch` invisibile a `glob` senza `hidden: true`: documentato in
  `docs/agents/issue-tracker.md`.
- `npm run dev:db:psql`: SQL via pipe invece che dentro un `-c` con le quote annidate.
  Documentato in `AGENTS.md` > Local development database.
- Percorso del log del dev server (`.next/dev/logs/next-development.log`) documentato in
  `AGENTS.md` > Start the development server.

## Out of scope

- **Clone di `.reference/puck`.** La skill `puck` installata (`puckeditor/skills`) copre l'API e
  la diagnosi, e i docs sono raggiungibili: `puckeditor.com/llms.txt` come indice, poi `.md`.
  Restano fuori solo le domande di internals, per cui `docs/puck-canvas.md` dà il comando di
  clone. Non serve un clone permanente adesso.
- **Skill `handoff`.** Scrive in `%TEMP%` e per contratto cita gli artefatti invece di
  duplicarli: i ticket sono l'artefatto durevole, l'handoff sarebbe un livello sopra.
- **Rigenerare `skills-lock.json`.** L'installazione della skill `puck` è del maintainer.
