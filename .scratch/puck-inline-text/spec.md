# Text editing inline nei blocchi Puck

**Status:** `ready-for-agent`

## Problem Statement

Nel page builder il testo dei blocchi si scrive nella sidebar delle proprietà. `Text` è un
`textarea` puro reso con `whitespace-pre-line` (`src/puck/blocks/Text/ui/text.tsx`), quindi non ha
formattazione; `Heading` è già un campo rich text ma con `contentEditable: false`
(`src/puck/blocks/Heading/index.tsx`), quindi il suo menu di formattazione vive nel pannello e non
sul testo. In entrambi i casi si scrive lontano dal punto in cui il testo appare, mentre il
riferimento del prodotto (Elementor) prevede di scrivere sul canvas e formattare senza cambiare
superficie.

Puck 0.24 supporta il flusso nativamente: `contentEditable: true` su un campo `richtext` fa
rendere a Puck un editor Tiptap al posto del valore della prop, e `renderInlineMenu` diventa la
toolbar del blocco. Non va costruito un editor: va adottato quello di Puck e configurato.

Vincoli che la soluzione deve rispettare:

- **ADR-0040**: stesso albero di elementi in canvas e pagina; `puck.isEditing` può cambiare
  comportamento, mai markup.
- Il **Block root** resta l'elemento selezionato e trascinato; l'editor inline è un suo discendente.
- L'editor inline di Puck è sempre avvolto in un `<div>`, e il contenuto rich text è sempre a
  blocchi (`<p>`): un paragrafo è inevitabile.
- La toolbar inline di Puck sta nella action bar del blocco, ancorata in alto a destra, e non è un
  menu ancorato alla selezione (vedi ADR-0041).
- Il fallback SSR di Puck inietta raw l'HTML salvato: il contenuto è fidato per costruzione.

## Solution

- `Heading` e `Text` dichiarano `contentEditable: true` **esplicitamente** (il default di 0.24 è
  `true`, la documentazione dice `false`).
- Il campo contenuto è **nascosto dalla sidebar** (`visible: false`) su entrambi i blocchi: si
  scrive e si formatta solo nel canvas. La sidebar resta per tipografia, dimensioni e layout.
- La toolbar è quella nativa nella action bar del blocco. Non costruiamo un bubble sulla selezione.
- `Heading` acquisisce un campo `level` (H1–H6, default **H2**) e il blocco emette un vero `<hN>`.
  La sua toolbar è ridotta a grassetto, corsivo, sottolineato, link e colore per-parola.
- `Text` diventa rich text con toolbar completa: grassetto, corsivo, sottolineato, link, colore
  per-parola, selettore heading H1–H6, elenco puntato ed elenco numerato. Il suo root smette di
  essere un `<p>` e diventa un `<div>`.
- Le estensioni non volute vengono **disattivate** via `options`, non solo nascoste dalla toolbar:
  le scorciatoie da tastiera altrimenti reintroducono strike, code, blockquote, allineamento.
- Il container del rich text di entrambi i blocchi riceve in `puck-base.css` la spaziatura tra
  paragrafi, i marcatori delle liste e la scala dei titoli, in `em` sul font del blocco.
- I popover di link e colore si aprono dentro l'iframe del canvas.

Nessuno script di migrazione: i valori esistenti senza tag continuano a leggersi, e i pochi blocchi
`Text` che dipendono dai newline vengono riscritti a mano in produzione.

## User Stories

1. As an author, I want to click a heading on the canvas and type in it, so that content editing
   does not require reaching the sidebar.
2. As an author, I want to select part of a heading and make it bold, italic or underlined from a
   toolbar, so that emphasis is applied where I am looking.
3. As an author, I want to turn a selection into a link from the same toolbar, so that links do not
   require leaving the block.
4. As an author, I want to colour a word from the same toolbar, so that a highlight inside a
   paragraph stays possible.
5. As an author, I want to choose the level (H1–H6) of a heading block in the sidebar, so that the
   document keeps a correct heading hierarchy.
6. As an author, I want the heading block to publish a real heading element, so that search engines
   and screen readers see a heading instead of a generic box.
7. As an author, I want a text block with paragraphs, lists and headings inside it, so that a single
   block can carry a formatted passage without stacking one block per line.
8. As an author, I want list markers and paragraph spacing to look right without extra CSS, so that
   formatted text is readable in the canvas and on the page alike.
9. As an author, I want the formatting toolbar to be reachable without the sidebar, so that the
   block has one editing surface.
10. As an author, I want an empty text block to show me where to type, so that a freshly cleared
    block does not look broken.
11. As an author, I want an empty block to publish nothing visible, so that clearing a block removes
    it from the page.
12. As an author, I want the heading inside a text block to scale with the block's font size, so
    that the responsive typography ladder keeps working.
13. As a reader, I want published rich text to keep the authored emphasis, links and lists, so that
    the page reads as it was designed.
14. As a maintainer, I want the canvas and the public page to render the same tree for these blocks,
    so that ADR-0040 keeps holding.
15. As a maintainer, I want the inline editor's markup to be Puck's, not ours, so that an upstream
    upgrade does not require reimplementing the editor.
16. As a maintainer, I want a regression on the canvas path to be recoverable by re-showing the
    sidebar field, so that one flag is the way back.
17. As a maintainer, I want the trusted-HTML assumption recorded, so that the day a non-editor write
    path appears we know a sanitizer becomes mandatory.

## Implementation Decisions

### Campo condiviso

- `src/puck/fields/rich-text/index.tsx` diventa una factory di descrittori, perché i due blocchi
  hanno menu e `options` diverse ma devono condividere estensioni, link mark e comportamento del
  canvas. Il modulo resta l'unica fonte del campo per editor e render pubblico.
- Il descrittore dichiara `contentEditable: true` e `visible: false`. `visible` è onorato solo dal
  disegno della sidebar: il transform del canvas legge il descrittore grezzo, quindi il valore resta
  editabile sul blocco.
- `renderInlineMenu` è l'unico menu: il `renderMenu` della sidebar sparisce con il campo. Entrambi i
  menu portano link e colore oltre ai controlli di default (grassetto, corsivo, sottolineato).
- `src/puck/render-config.tsx` dichiara per `Text` lo stesso descrittore `richtext` che già dichiara
  per `Heading`, così il render pubblico risolve il valore con le stesse estensioni.

### Heading

- Nuovo campo `level`: `select` con `h1`–`h6`, default `h2`, non responsive.
- Il root del blocco è l'elemento `hN` e resta lui a portare `dragRef`, `puck-dim`, `puck-typo` e le
  variabili di stile. L'editor inline è un suo discendente, quindi il contratto del Block root non
  cambia.
- `options` restringe lo schema: `heading: false`, `bulletList: false`, `orderedList: false`,
  `blockquote: false`, `code: false`, `codeBlock: false`, `strike: false`, `horizontalRule: false`,
  `textAlign: false`. Il paragrafo resta: non è disattivabile.
- La toolbar inline non offre il selettore heading: il tag è una proprietà del blocco.

### Text

- Root `<div>` con `puck-dim`, `puck-typo`, `puck-block-root` e le variabili di stile; il contenuto
  rich text sta dentro. Il `whitespace-pre-line` sparisce: la formattazione ora è esplicita.
- `options` abilita heading e liste, disattiva le estensioni che non sono nell'allegato del
  riferimento: `blockquote: false`, `code: false`, `codeBlock: false`, `strike: false`,
  `horizontalRule: false`, `textAlign: false`.
- La toolbar inline offre anche `HeadingSelect` e `ListSelect`.

### Tipografia e spaziatura

- Il container del rich text prende una classe dedicata (una sola, condivisa dai due blocchi) e in
  `puck-base.css` riceve: `p + p` con margine in `em`, margini azzerati sul primo e sull'ultimo
  figlio, `ul`/`ol` con `list-style` e `padding-inline` ripristinati (il preflight di Tailwind li
  azzera), `h1`–`h6` con scala in `em` per ereditare il font del blocco.
- La scala dei titoli è una costante del foglio di stile, non un campo: un autore che vuole un
  titolo di dimensione diversa usa il blocco `Heading` o il campo tipografia, non l'HTML.

### Vuoto

- Il blocco rende il container anche quando il testo è vuoto, in entrambi i percorsi: un blocco che
  non rende nulla non ha root da selezionare, e ADR-0040 vieta markup diverso tra canvas e pagina.
- Nel canvas un blocco vuoto mostra un placeholder via CSS (pseudo-elemento sul paragrafo vuoto del
  ProseMirror); sulla pagina l'elemento vuoto ha altezza zero.

### Dati esistenti

- Nessuna migrazione: un valore senza tag viene avvolto in un paragrafo al render, e i newline
  restano visibili grazie a `white-space: pre-wrap`. I blocchi `Text` che ne dipendono vengono
  riscritti dall'autore in produzione, fuori da questa spec.
- I default dei due blocchi diventano contenuto rich text valido.

### Sicurezza

- L'HTML salvato è contenuto fidato: l'unico percorso di scrittura è l'editor, che normalizza il
  markup incollato contro lo schema, e i link sono già allow-listati due volte. L'assunzione è
  registrata in ADR-0041; un sanitizer diventa obbligatorio quando compare un percorso di scrittura
  non-editor.

### Interazione

- Un click nel testo seleziona il blocco e mette il caret: è il comportamento di Puck, garantito
  dall'overlay portal che il transform registra da solo. Non aggiungiamo un doppio click.
- La toolbar compare quando il campo ha il focus, sparisce quando lo perde (Puck tiene conto del
  passaggio del focus dentro il menu).

## Testing Decisions

### Cosa rende un buon test

I test verificano il markup e il comportamento esterno dei blocchi, non la composizione interna dei
componenti né le classi CSS di Puck. Un buon test dimostra che:

- `renderHeadingBlock` emette l'elemento `hN` corrispondente a `level`, con le variabili di stile e
  `dragRef` sul root;
- un `level` mancante decade su `h2` e uno non valido non produce markup arbitrario;
- `renderTextBlock` emette un `div` di root e non un `p`;
- entrambi i blocchi rendono il contenuto anche quando è vuoto;
- le regole del container rich text (paragrafi, liste, titoli) esistono nel foglio di stile, con un
  test sul testo del CSS come già fanno i test di `puck-base.css`;
- il render pipeline (editor config e render config sulla stessa albero) resta in parità, come
  `src/puck/__tests__/render-pipeline.test.tsx`;
- un valore plain senza tag viene reso come paragrafo, e un valore con tag conserva grassetto e
  link.

### Seam

- Test di blocco: `src/puck/__tests__/heading-block.test.tsx` (nuovo) e `text-block.test.tsx`
  (aggiornato), sul render puro, senza Puck montato.
- Parità canvas/pagina: `render-pipeline.test.tsx`, che confronta i due config sullo stesso albero.
- CSS: i test esistenti che leggono `puck-base.css` come testo (`helpers/puck-base-css.ts`).
- Browser: il comportamento dell'editor inline (click, caret, toolbar nella action bar, popover di
  link e colore dentro l'iframe) non è riproducibile in happy-dom. Si verifica con
  `scripts/browser-probe.mjs --frame preview-frame` sul builder, come prescrive
  `docs/puck-canvas.md`.

### Validazione manuale

- Click nel testo di un `Heading` e di un `Text`: caret dentro, toolbar visibile in alto a destra.
- Selezione di una parola: grassetto, corsivo, sottolineato applicati e persistiti dopo il salvataggio.
- Link: apertura del popover dentro il canvas, applicazione, rimozione, "apri in nuova scheda".
- Colore: colore di tema, palette, colore custom, rimozione.
- Testo: heading interno, elenco puntato e numerato, più paragrafi con spaziatura.
- Heading: cambio `level` in sidebar e verifica del tag sulla pagina pubblicata.
- Blocco svuotato: placeholder nel canvas, nulla di visibile sulla pagina.
- Pubblicazione: pagina pubblicata che conserva grassetti, link e liste.

## Out of Scope

- Bubble menu ancorato alla selezione: resta l'evoluzione possibile, non è un requisito di questa
  spec (ADR-0041).
- Gli altri blocchi che contengono testo: label del `Link`, voci di `NavbarBlock`, `Brand`,
  `Copyright`, placeholder della `SearchBar`. Diventeranno una issue separata sul pattern del campo.
- Una vista "Codice" dell'HTML, come il Visual/Code di Elementor.
- Sanitizzazione dell'HTML al salvataggio.
- Script di migrazione dei `Text` esistenti: il passaggio è manuale e fuori dal repo.
- Controllo in sidebar per la spaziatura tra paragrafi.
- `level` responsive (un heading di livello diverso per breakpoint).
- Contenuto inline-only per il blocco `Heading` (niente paragrafi): il paragrafo è inevitabile
  nello schema di Puck.

## Further Notes

- La fonte di verità del comportamento di Puck è il sorgente dell'installato, non i bundled chunk:
  il clone shallow di `v0.24.0` in `.reference/puck` (gitignored) è la referenza usata per questa
  spec.
- Il rischio più grosso è la scoperta dell'upgrade: `inline: true` è documentato per i nodi inline
  del rich text, mentre qui se ne usa il comportamento più stretto (salta il wrapper e consegna
  `dragRef`). I test di parità esistono per far fallire rumorosamente un cambio upstream; la
  checklist interattiva decide se l'upgrade è accettabile in pratica.
- `docs/puck-canvas.md` va aggiornato con la sezione sull'editor inline (toolbar nella action bar,
  editor dentro il root, popover nell'iframe), perché è la prima domanda che si farà chi tocca un
  blocco di testo.
- Il passaggio manuale sui `Text` in produzione è un ticket a parte, `ready-for-human`.
