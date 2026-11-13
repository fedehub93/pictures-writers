# 01: Probe in browser con drag e doppio click

**What to build:** Il probe in browser sa fare le due azioni che oggi gli mancano e che servono a
verificare qualunque interazione del canvas: una sequenza press → move → release con i tasti premuti,
e un doppio click. Da qui in poi si può dimostrare che un blocco si trascina e che un doppio click
arriva al blocco, invece di dedurlo dai test in happy-dom — che non riproducono né l'hit-testing né i
listener nativi di Puck.

**Blocked by:** None (can start immediately)

**Status:** done

**Skills:** `docs/agents/browser-probe.md`, `docs/puck-canvas.md`.

- [x] Il probe accetta un'azione di trascinamento che parte da un elemento (o da coordinate nel
      frame) e arriva a un offset, emettendo press, una serie di movimenti con il tasto premuto e il
      rilascio, con le distanze espresse in pixel del canvas e non dello schermo.
- [x] Il probe accetta un'azione di doppio click che produce due coppie press/release con
      `clickCount` 1 e 2, così che il browser generi davvero l'evento `dblclick`.
- [x] `builder-probe.mjs` espone le due azioni nella lista di passi, con la stessa forma delle
      esistenti, così che una verifica multi-passo possa trascinare e poi leggere l'ordine.
- [x] `docs/agents/browser-probe.md` documenta le due azioni e il perché servono.
- [x] Prova reale sul builder: un trascinamento del `Heading` sotto il `Text` cambia l'ordine letto
      dal documento; un doppio click su un blocco produce `detail: 2` e il caret nel testo.
- [x] Nessuna modifica sotto `src/`: il ticket è solo strumentazione.

## Notes

- Il probe non deve diventare un test automatico in CI: resta uno strumento che un umano o un agente
  lancia e legge, come già oggi per link e pannelli colore.
- Il trascinamento deve avere una pausa iniziale di circa 250 ms: Puck attiva il drag con
  `Delay(200) + Distance(5)`, e senza pausa il movimento non viene interpretato come drag.

## Comments

**2026-11-13 — commit `993f315b`** (`feat(builder-probe): add drag and double click actions`).

Cosa è cambiato:

- `scripts/browser-probe.mjs`: `doubleClickAt` (due coppie press/release sullo stesso punto,
  `clickCount` 1 poi 2) e `dragBy` (press, 250 ms di pausa, sei `mouseMoved` con `buttons`, release).
  Entrambe sono esposte sulla sessione di `withSession`; `canvasPoint` traduce un punto del canvas in
  coordinate schermo con lo `scale` dell'iframe, e `dragBy` converte `dx`/`dy` allo stesso modo. Lo
  sgancio di `waitForTarget` e di `modifierMask` (ora validante e condiviso) evita tre copie della
  stessa regola.
- `scripts/builder-probe.mjs`: passi `drag` e `doubleClick`. `drag` risolve la partenza (centro
  dell'elemento o `x`/`y` nel frame), riporta il punto nei due sistemi, lo `scale`, la distanza in
  pixel del canvas e cosa c'è sotto il press (`hit`: tag, editor, overlay portal). `doubleClick`
  riporta l'evento (`detail`, `target`, `connected`, `prevented`, `inContenteditable`) e il caret
  (`activeTag`, `contenteditable`, `anchorOffset`, `selectionInsideActive`).
- `docs/agents/browser-probe.md`: sezione "Dragging and double-clicking" con il perché (happy-dom
  non riproduce hit-testing né i listener di Puck), la pausa di 250 ms, i pixel del canvas e il
  fatto che `detail: 2` richiede davvero `clickCount` 2.

Prova reale sul builder (`.env.agent`, `npm run agent:seed`, `--server`), pagina probe con `Heading`
"Probe heading" e `Text` "Probe paragraph":

```text
[ { "action": "evaluate", ... inietta il lock CSS del gate ... },
  { "action": "evaluate", "value": ["Probe heading", "Probe paragraph"] },
  { "action": "drag", "target": "h2[data-puck-component]", "dx": 0, "dy": 400 },
  { "action": "evaluate", "value": ["Probe paragraph", "Probe heading"] } ]
```

Il passo `drag` ha riportato `from.hit = { tag: "h2", insideEditor: false, ... }`,
`scale = 0.104786`, `distance = { dx: 0, dy: 400 }`: l'ordine dei `[data-puck-component]` nel
documento è cambiato, `Heading` sotto `Text`.

```text
{ "action": "wait", "ms": 2500 },
{ "action": "doubleClick", "target": "h2[data-puck-component]", "text": "Probe heading" }
→ event: { type: "dblclick", detail: 2, target: "p", connected: true, inContenteditable: true },
  caret:  { activeTag: "div", contenteditable: "true", collapsed: false, anchorOffset: 6,
            selectionInsideActive: true }
```

Due note dalla prova:

- Il drag è stato eseguito con il lock CSS del gate iniettato via `evaluate`. Senza, il press al
  centro del blocco cade dentro il `.ProseMirror` e dnd-kit rifiuta il target
  `[contenteditable]`: è il difetto che la feature esiste per correggere, non un limite del probe.
  Anche la partenza da coordinate nel frame è stata provata (stesso cambio d'ordine).
- A server freddo l'editor inline può montare *sotto* il gesto: l'evento `dblclick` arriva lo
  stesso, ma `connected` è `false` e il caret resta su `body` (la DOM colpita è stata sostituita).
  Il report lo dice; un passo `wait` prima del doppio click lo evita. È la stessa ragione per cui
  `focus` ritenta.

Verifiche: `npm run lint` 0 errori (244 warning preesistenti); `npm run typecheck` pulito;
`npm run test:run` 253 file / 2181 test passati. Nessun file sotto `src/`.

Il passo della checklist in `docs/puck-canvas.md` e il glossario restano aperti: il ticket 05 li
possiede.
