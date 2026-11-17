# 06: Blocco vuoto e placeholder

**What to build:** Un blocco di testo svuotato deve dire dove scrivere, senza inventare markup. Nel
canvas il paragrafo vuoto dell'editor mostra un placeholder; sulla pagina il blocco rende comunque
il proprio container, che è vuoto e ha altezza zero. Il container resta in entrambi i percorsi per
due ragioni: ADR-0040 vieta markup diverso tra canvas e pagina, e un blocco che non rende nulla non
ha root da selezionare (si ritroverebbe solo dall'Outline). Il placeholder è testo dell'editor, non
contenuto del documento: non viene salvato e non finisce nella pagina pubblicata.

**Blocked by:** 03, 04

**Status:** done

**Skills:** `.agents/skills/puck` (progetto), `tiptap` (globale).

- [x] Un `Heading` e un `Text` svuotati nel canvas mostrano un placeholder nel punto del caret, con
      testo distinto per i due blocchi.
- [x] Il placeholder non compare sulla pagina pubblicata.
- [x] Il blocco vuoto rende il container in canvas e sulla pagina: l'elemento resta selezionabile
      nel canvas e non produce nulla di visibile sulla pagina.
- [x] Salvare un blocco vuoto e ricaricarlo non introduce testo nel documento.
- [x] Test: il render di un blocco senza testo produce il container atteso, senza contenuto.
- [x] Browser probe: svuotare il blocco, vedere il placeholder, salvare, ricaricare, pubblicare.

## Notes

- La strada preferita è l'estensione `@tiptap/extension-placeholder` (già in dipendenze) aggiunta
  alle `tiptap.extensions` del preset, con un testo per blocco: è configurabile e non richiede
  selettori fragili. In alternativa una regola CSS sul paragrafo vuoto del ProseMirror, che però
  deve tenere conto del `<br class="ProseMirror-trailingBreak">` che ProseMirror lascia dentro un
  paragrafo vuoto.
- Un `<h2>` vuoto sulla pagina ha altezza zero: non serve renderizzare `null`, e non si può, perché
  serve il root nel canvas.

## Comments

- 2026-11-12 — Implementato.

  Cambi:
  - `src/puck/fields/rich-text/extensions.ts`: nuova `createRichTextExtensions(placeholder)` che
    aggiunge `Placeholder` di `@tiptap/extension-placeholder` alla lista condivisa. La lista resta
    una sola per descrittore, quindi editor e render config costruiscono lo stesso schema.
    L'estensione è inclusa nel descrittore e non solo nel campo editor: `Placeholder` non aggiunge
    nodi o mark, disegna la decorazione solo nell'editor e non entra nell'HTML serializzato.
  - `src/puck/fields/rich-text/presets.ts`: `RICH_TEXT_PLACEHOLDERS` (`heading: "Add a heading"`,
    `text: "Start writing"`) e un `tiptap.extensions` per blocco. Il testo distinto è il motivo della
    factory: un'unica lista condivisa non potrebbe portare due hint.
  - `src/puck/styles/puck-base.css`: regola `::before` su `.is-empty[data-placeholder]` con
    `content: attr(data-placeholder)`, `float: left`, `height: 0`, `pointer-events: none` e
    `opacity: 0.5`; una seconda regola toglie il `p:empty::before` con spazio unificatore che Puck
    mette su ogni paragrafo vuoto. Senza la seconda, un blocco svuotato occupava una riga (24px)
    sulla pagina: il ticket chiede altezza zero. La regola è ristretta a `p:empty:only-child`, cioè
    al blocco svuotato, così una riga vuota voluta tra due paragrafi resta alta come prima.
  - Test: `rich-text-field.test.tsx` copre hint distinti e regole CSS; nuovo
    `rich-text-placeholder.test.tsx` monta un editor Tiptap reale e verifica decorazione
    (`is-empty`, `data-placeholder`) e assenza nell'HTML serializzato; `heading-block.test.tsx`
    verifica il container vuoto; `text-block.test.tsx` verifica che il render pubblico di un valore
    vuoto e di `<p></p>` non contenga hint né attributi dell'editor; `render-pipeline.test.tsx`
    aggiunge il ramo vuoto di `Heading` e `Text` alla parità canvas/pagina.

  Verifiche:
  - `npm run typecheck` pulito.
  - `npm run lint`: 0 errori, 243 warning preesistenti.
  - `npm run test:run`: 253 file / 2181 test verdi.
  - Browser probe su una pagina di prova creata e poi eliminata (`probe-ticket-06`), CDP headless,
    finestra 1440×1000, zero eccezioni:
    - svuotati con Ctrl+A/Backspace, il `Heading` mostra
      `<p data-placeholder="Add a heading" class="is-empty is-editor-empty">` con
      `::before content: "Add a heading"`, il `Text` `"Start writing"`; entrambi i root restano
      `.puck-block-root.puck-rich-text` (H2 e DIV).
    - `Save`, ricaricamento: i due blocchi sono ancora vuoti e i placeholder ricompaiono; il
      documento salvato contiene `text: "<p></p>"`, nessun hint, nessun `data-placeholder` o
      `is-empty`.
    - `Publish` e pagina pubblicata: nessun `[data-placeholder]`, nessun `.is-empty`, nessun testo
      `Add a heading`/`Start writing`; il container vuoto ha altezza 0 (H2 e DIV).
    - La sessione admin temporanea e la pagina di prova sono state eliminate al termine; il server
      di sviluppo è stato fermato.

  Nota: la regola `p:empty:only-child:not([data-placeholder])::before { content: none }` è ciò che
  rende vero "altezza zero" sulla pagina. Puck usa lo spazio unificatore per dare una riga al caret
  nell'editor; sul sito non c'è caret, e il paragrafo vuoto al caret porta `data-placeholder` per
  cui l'hint resta. Il ramo `:only-child` limita l'effetto al blocco svuotato: una riga vuota
  voluta tra due paragrafi non cambia altezza. Nessun markup diverso tra canvas e pagina: cambia
  solo lo stile.

