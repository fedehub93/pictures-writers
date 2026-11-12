# 07: Verifica finale, parità e documentazione

**What to build:** Chiusura della feature: la suite completa, la parità canvas/pagina, la verifica
in browser sui due percorsi e la documentazione. `docs/puck-canvas.md` acquisisce la sezione
sull'editor inline — toolbar nella action bar e non bubble, editor dentro il root, div dell'editor
dentro l'`hN`, popover dentro l'iframe — perché è la prima domanda che si farà chi tocca un blocco
di testo. ADR-0041 e le voci di glossario vengono riletti contro il codice per verificare che
descrivano ciò che è stato costruito, non ciò che si era deciso di costruire.

**Blocked by:** 05, 06

**Status:** done

**Skills:** `code-review` (globale), `.agents/skills/puck` (progetto).

- [x] `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build` puliti (gli errori
      preesistenti restano preesistenti).
- [x] `render-pipeline.test.tsx`, il test di registro `inline: true` e i test dei due blocchi verdi.
- [x] Browser probe sul builder per ogni criterio di accettazione del ticket 06 e della spec; probe
      sulla pagina pubblicata per grassetti, link, liste e tag del titolo.
- [x] `docs/puck-canvas.md` aggiornato con la sezione dell'editor inline e i suoi riferimenti.
- [x] ADR-0041 e le voci di glossario riletti contro l'implementazione; le divergenze vengono
      corrette nel documento, non lasciate nel codice.
- [x] Revisione con lo skill `code-review` sulle modifiche rispetto al commit di partenza, con gli
      standard del repo e la spec come riferimenti.
- [x] `git status` pulito: nessun file di spike, nessun `.reference/` versionato.

## Notes

- Il foglio di stile è la parte che invecchia peggio: i test che leggono `puck-base.css` come testo
  (come già fa `helpers/puck-base-css.ts`) sono l'unico presidio che le regole del container rich
  text esistano ancora.
- La checklist interattiva di `docs/puck-canvas.md` decide se un futuro upgrade di Puck è
  accettabile: va aggiornata con i passi di questa feature.

## Comments

- 2026-11-12 — Chiusura.

  Documentazione:
  - `docs/puck-canvas.md` ha una sezione **Inline text editing**: editor dentro il root, toolbar
    nella action bar del blocco (non bubble sulla selezione), wrapper `<div>` dentro l'`hN` e
    `<div>` root per `Text`, popover di link e colore portati nel body dell'iframe tramite
    `getRichTextMenuPortalContainer`, `data-puck-rte-menu`, placeholder come decorazione dell'editor
    e container vuoto a altezza zero sulla pagina. La sezione **Verify in a browser** spiega il
    flusso multi-step e la nuova **Upgrade checklist** elenca i passi interattivi (click/caret,
    toolbar, sidebar, link, colore, heading/liste nel Text, scorciatoie disattivate, placeholder,
    pubblicazione, blocco vuoto).
  - ADR-0041 riletto contro il codice: corretto il markup citato nella conseguenza sul wrapper
    (`data-puck-overlay-portal` esiste solo nel canvas; il percorso pubblico rende il container
    dell'editor e `.rich-text` senza quell'attributo). Il resto (default di `contentEditable`,
    `visible` onorato solo dalla sidebar, toolbar nella action bar, allow-list del link, nessuna
    sanitizzazione) corrisponde all'implementazione.
  - Voci di glossario rilette: nessuna divergenza. Il commento di `Text/types.ts` e il testo di
    `puck-canvas.md` non usano più "inline editor" come sinonimo della superficie, che il glossario
    elenca tra le forme da evitare.
  - Divergenza dalla spec corretta nel codice: `HEADING_DEFAULT_PROPS.text` era ancora `"Heading"`;
    ora è `<p>Heading</p>`, come chiede "I default dei due blocchi diventano contenuto rich text
    valido". Il test del render diretto aggiornato (quel seam vede la stringa grezza, senza il
    transform di Puck).

  Verifiche:
  - `npm run lint`: 0 errori, 243 warning preesistenti.
  - `npm run typecheck` pulito.
  - `npm run test:run`: 253 file / 2181 test verdi. Verdi anche i test mirati:
    `render-pipeline.test.tsx`, `inline-roots.test.tsx` (registro `inline: true`),
    `heading-block.test.tsx`, `text-block.test.tsx`, `rich-text-field.test.tsx`,
    `rich-text-link.test.tsx`, `rich-text-placeholder.test.tsx`, `rich-text-popovers.test.tsx`.
  - `npm run build` pulito (19 worker, 382 pagine statiche generate).
  - Browser probe, Chrome headless via CDP, finestra 1440×1000, pagina temporanea
    `probe-inline-text-07` (Heading H2 + Text + Text vuoto), zero eccezioni:
    - builder: click nel testo, caret nel `ProseMirror` dentro l'`hN`, toolbar nella action bar
      sopra il blocco con Bold, Italic, Underline, Add link, Text color. Una sola click mette il
      caret dopo che il canvas è assestato; la prima click a 800 ms dal mount può limitarsi a
      selezionare il blocco.
    - sidebar: `Level`, `Layout`, `Dimension`, `Typography`, nessun campo contenuto e nessun
      `textarea`.
    - grassetto, corsivo e sottolineato applicati dalla toolbar; link con pannello nel documento
      dell'iframe, `Apply`, `target="_blank"` + `rel="noopener noreferrer"` con "Open in new tab",
      `Open` in una nuova scheda e `Remove`; colore con pannello nell'iframe, tema `Primary`
      applicato e "Rimuovi colore"; Level portato a H3 con `<h3>` sul root e classi root intatte.
    - Text: toolbar con `HeadingSelect` e `ListSelect`; paragrafi multipli, terzo paragrafo a
      `<h3>`, quarto a `<ol><li>`, link a `<a href="https://example.com/published">`.
    - blocco svuotato: placeholder "Add a heading"/"Start writing"; Save, navigazione e ricarica:
      blocchi ancora vuoti con i due hint; il documento salvato contiene `<p></p>`, nessun hint e
      nessun attributo dell'editor.
    - Publish: pagina pubblicata `<h3>` con `<strong>Published</strong> heading`; passage con
      `<p>`, `<a>`, `<h3>`, `<ol>`; blocco vuoto a altezza 0; nessun `data-placeholder`,
      `contenteditable`, `data-puck-overlay-portal` o `.is-empty`.
    - La pagina temporanea e la sessione admin temporanea sono state eliminate al termine; il
      server di sviluppo è stato fermato.

  Code review (due assi, sub-agenti in parallelo; base `d66bfc47`):
  - Standard: corretto `import "client-only"` in `src/puck/fields/rich-text/index.tsx`; eliminata
    la duplicazione delle opzioni disattivate in `presets.ts` con `DISABLED_TEXT_OPTIONS`. Restano
    come giudizi accettati: helper CSS locali nei test (piccoli e specializzati), harness di mount
    duplicati tra test, `text?: ReactNode` che porta HTML per via del transform di Puck, e le
    migliorie di accessibilità del pannello colore arrivate col ticket 02.
  - Spec: colmato il default rich text di `Heading`; corretto il markup del wrapper in ADR-0041;
    le verifiche di salvataggio/pubblicazione lasciate al ticket 07 dai ticket 03 e 04 sono state
    eseguite qui. Nessun altro scostamento funzionale.
