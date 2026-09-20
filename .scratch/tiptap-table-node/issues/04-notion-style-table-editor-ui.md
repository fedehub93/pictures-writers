# 04: Interfaccia editor noto-style

**What to build:** Nell'editor admin, la tabella viene presentata nello stile di Notion. Al passaggio del mouse sulla griglia appare un FloatingMenu noto-style che offre le operazioni strutturali (riga sopra/sotto, colonna sinistra/destra, elimina riga, elimina colonna, toggle header row, elimina tabella) con gli stati disabilitati al limite 1×1. Sul bordo destro e sull'estremità inferiore della griglia compaiono affordance "+" che aggiungono al volo una colonna a destra o una riga sotto. La tabella è trascinabile come blocco unico, come gli altri blocchi custom dell'editor. Lo stile è noto-like mentre si edita: bordi della griglia visibili solo su hover/focus e cella attiva evidenziata, così la superficie di scrittura resta minimale quando la tabella non è in focus. I controlli espongono etichette e stati accessibili.

**Blocked by:** 03 (Table grid structural commands)

**Status:** done

- [x] Il FloatingMenu appare al passaggio del mouse su una cella con tutte le operazioni, e gli stati disabilitati al limite 1×1 sono corretti.
- [x] Le affordance "+" sui bordi aggiungono colonna a destra e riga sotto con un click.
- [x] La tabella si trascina come blocco unico nel documento.
- [x] Lo stile editor mostra i bordi solo su hover/focus e la cella attiva è evidenziata.
- [x] I controlli del menu hanno etichette e stati leggibili da assistive technology.
- [x] Validazione manuale completata secondo la checklist nella spec (menu al hover, posizionamento ai bordi, "+", tastiera, resize con persistenza, incolla, viewport).

## Verification

- Validazione manuale eseguita dall'utente sulla checklist della spec:
  - menu galleggiante al passaggio del mouse su una cella, tutte le operazioni visibili e corrette agli stati disabilitati al limite 1×1;
  - posizionamento del menu corretto anche vicino ai bordi della griglia;
  - affordance "+" sul bordo destro e sull'estremità inferiore aggiungono colonna a destra / riga sotto con un click;
  - navigazione completa da tastiera (frecce, Tab/Shift+Tab, Enter, Shift+Enter, Esc);
  - resize colonne col drag con persistenza della larghezza dopo salvataggio e ricaricamento;
  - incolla da un altro editor produce una griglia rettangolare senza celle unite;
  - tabella sollevabile e trascinabile come blocco unico nel documento;
  - stile editor noto-like: bordi visibili solo su hover/focus e cella attiva evidenziata;
  - controlli del menu con etichette e stati accessibili;
  - rendering pubblico coerente su Post e prodotto.
- Drag-reorder della tabella e stile pubblico sono verificati su issue 04/05 come da checklist.
- `npm run lint`: nessun nuovo finding (restano solo errori/warning pre-esistenti).

## Note

- Il drag come blocco unico è implementato via `TableBlockView` (`src/shared/components/tiptap-editor/extensions/table/table-view.ts`): un handle non-React fuori dal DOM contenuto, con `contenteditable=false` e `draggable`, che ignora il caret durante il drag (`preventDefault` su mousedown) e mostra l'intera tabella come drag image.
- Lo stile noto-like vive in `src/app/(admin)/admin.css`: bordi della griglia trasparenti di default, resi visibili su `hover`/`focus-within` del wrapper, cella attiva evidenziata via `.table-cell-active`, selezione colonna/riga via `.selectedCell`.