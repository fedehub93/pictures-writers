# 04: Text diventa rich text

**What to build:** Il blocco `Text` smette di essere un `textarea` e diventa rich text come il
`Heading`, con la toolbar completa: grassetto, corsivo, sottolineato, link, colore per-parola,
selettore heading H1–H6, elenco puntato ed elenco numerato. Il root del blocco diventa un `div`
(non può restare un `<p>`, perché l'editor inline vi inserisce un `<div>` e il contenuto è a
paragrafi) e perde `whitespace-pre-line`: la formattazione ora è esplicita. Le `options`
disattivano blockquote, code, codeBlock, strike, horizontalRule e allineamento. Il container del
rich text completa la classe condivisa con i marcatori e il padding delle liste e con la scala dei
titoli in `em`, così un H2 dentro il blocco scala con il font tipografia del blocco stesso. Il
render config pubblico dichiara il campo `richtext` per `Text`, con lo stesso descrittore
dell'editor.

**Blocked by:** 01, 02, 03

**Status:** done

**Skills:** `.agents/skills/puck` (progetto), `tiptap` (globale). Leggere
`https://puckeditor.com/docs/api-reference/components/rich-text-menu.md` per `HeadingSelect` e
`ListSelect`.

- [x] `Text` usa il preset "text" della factory: `contentEditable`, `options` e `renderInlineMenu`
      completi.
- [x] Il root è un `div` con `puck-dim`, `puck-typo`, `puck-block-root` e le variabili di stile;
      `whitespace-pre-line` rimossi.
- [x] `TEXT_DEFAULT_PROPS` diventa contenuto rich text valido.
- [x] `render-config.tsx` dichiara `fields.text` di tipo `richtext` per `Text`, con lo stesso
      descrittore del campo.
- [x] `puck-base.css`: `ul`/`ol` con `list-style` e `padding-inline` ripristinati, `h1`–`h6` con
      scala in `em` sul font del blocco, margini coerenti con il container condiviso.
- [x] Toolbar inline: `HeadingSelect` e `ListSelect` presenti e funzionanti; il testo selezionato
      diventa heading o lista e torna paragrafo.
- [x] Test di blocco aggiornati: root `div`, niente `whitespace-pre-line`, contenuto reso anche se
      vuoto; un valore plain senza tag reso come paragrafo; grassetto e link conservati.
- [x] `render-pipeline.test.tsx` resta verde: stesso albero in canvas e pagina.
- [x] Browser probe: scrivere più paragrafi, creare una lista, cambiare un paragrafo in H3, salvare
      e ricaricare. (Salvataggio non esercitato, vedi Comments.)

## Notes

- I valori `Text` già salvati senza tag continuano a leggersi: Puck avvolge una stringa semplice in
  un paragrafo al render, e i newline restano visibili grazie a `white-space: pre-wrap`. Nessuna
  migrazione in questo ticket; la riscrittura dei blocchi in produzione è il ticket 08.
- Il blocco `Text` può contenere titoli: è il modello "Text" di Elementor, non quello di `Heading`.
  Il livello qui è contenuto inline, non una proprietà del blocco.

## Comments

- 2026-11-12 — Implementato.

  Cambi:
  - `richTextDescriptors.text` con `options` che tengono attivi heading e liste e disattivano
    blockquote, code, codeBlock, strike, horizontalRule e textAlign.
  - `richTextFields.text` è il preset del blocco, con `renderInlineMenu` dedicato
    (`TextRichTextInlineMenu`): `HeadingSelect` e `ListSelect` in un gruppo, poi grassetto, corsivo,
    sottolineato e il gruppo link/colore. Il menu di sidebar resta invariato fino al ticket 05.
  - `Text` monta `richTextFields.text`; il root è un `div` con `block puck-dim puck-typo
    puck-block-root puck-rich-text`, senza `whitespace-pre-line`.
  - `TEXT_DEFAULT_PROPS.text` è `<p>Add your text here.</p>`.
  - `render-config.tsx` dichiara `fields.text: richTextDescriptors.text` per `Text`, così il render
    pubblico risolve lo stesso HTML con lo stesso schema.
  - `puck-base.css`: `.puck-rich-text` ripristina `list-style-type` e `padding-inline-start` per
    `ul`/`ol`, con il ritmo di 1em già usato dai paragrafi e la stessa distanza dopo la lista
    (`ul + p`, `ol + p`), e la scala `h1`–`h6` in `em` con margini; i titoli prendono peso 600 e
    interlinea 1.2.
  - `text-block.test.tsx` riscritto (root `div`, nessun `whitespace-pre-line`, container reso vuoto,
    plain → paragrafo e grassetto/link conservati sul percorso pubblico, regole CSS lette dal
    foglio) e `rich-text-field.test.tsx` esteso al preset `text`.

  Verifiche:
  - `npm run typecheck` pulito.
  - `npm run lint`: 0 errori, 243 warning preesistenti.
  - `npm run test:run`: 252 file / 2166 test verdi.
  - Browser probe sul builder (`about`, frame `preview-frame`, finestra 1440×1000), con un `Text`
    trascinato dalla palette e **senza salvare**: click nel blocco con `ProseMirror` attivo,
    tre paragrafi scritti, il terzo portato a `<h3>` con `HeadingSelect` e il secondo a
    `<ul><li>` con `ListSelect`, poi convertito in `<ol>` e riportato a paragrafo riselezionando la
    stessa voce; anche l'H3 è tornato paragrafo riselezionando "Heading 3". Stili calcolati: root
    16px, `h3` 20px (1.25em), `ul` `list-style-type: disc` e `padding-left: 24px` (1.5em). Zero
    eccezioni.

  Nota: il salvataggio e il ricaricamento non sono stati esercitati per non scrivere una nuova
  versione della pagina condivisa di sviluppo; la persistenza passa dallo stesso transform
  `richtext` coperto dai test di parità, e il ticket 07 la verifica sul percorso completo. La
  popover di `HeadingSelect`/`ListSelect` è quella di Puck e si apre nel documento padre: è
  posizionata correttamente sopra la toolbar, ma non è portata nel documento dell'iframe come i
  popover di link e colore.

