# Table node noto-oriented per il Tiptap editor

**Status:** `ready-for-agent`

## Problem Statement

Il **Tiptap editor** condiviso (usato per il corpo dei **Post** e per le descrizioni prodotto) oggi non offre alcun modo di rappresentare dati tabellari. L'editor è already noto-oriented come esperienza (slash menu, bubble menu, blocco per flusso di scrittura), ma manca l'equivalente di una tabella dati di Notion: una griglia semplice in cui inserire ed eliminare righe e colonne direttamente nel flusso di scrittura.

Un articolo editoriale o una scheda prodotto possono richiedere confronti, specifiche o dati strutturati: senza un nodo **Table** l'autore è costretto a integrare screenshot, liste artificiose o contenuto non semanticamente rappresentabile. Inoltre il glossario del dominio già distingue **TableContentNode** (l'indice dei titoli persistito) da una vera griglia dati, ma il contenuto tabellare persistito non esiste ancora.

Non esistono attualmente estensioni table installate, e la linea di versioni dei pacchetti Tiptap è frammentata (due linee 3.22.5 e 3.27.1 nel manifest); ogni nuova estensione deve evitare di aggravare quella frammentazione, in particolare considerando che il Puck editor dipende anch'esso da Tiptap.

## Solution

Aggiungere un nodo **Table** persistente al Tiptap editor noto-oriented, costruito sull'estensione ufficiale Tiptap (famiglia `extension-table`, `-row`, `-cell`, `-header`, motore prosemirror-tables) e ispirato nell'aspetto e nel comportamento alla tabella inline di Notion:

- inserimento via slash menu e toolbar, con dimensione iniziale 3×3 e prima riga header attiva;
- celle a contenuto solo inline rich text, con navigazione completa da tastiera (frecce, `Tab`, `Enter`, `Shift+Enter`, `Esc`);
- operazioni strutturali facili: aggiungere/eliminare righe e colonne, toggle header row, eliminare la tabella, tramite un FloatingMenu noto-style al passaggio del mouse e affordance "+" che aggiungono righe/colonne ai bordi;
- colonne ridimensionabili col drag, con larghezze persistite nel documento;
- griglia sempre rettangolare: nessuna cella unita, e gli `colspan`/`rowspan` provenienti da un incolla HTML vengono rimossi al parsing;
- minimo garantito 1×1, con le eliminazioni disabilitate al limite;
- la tabella è trascinabile come blocco unico, come gli altri blocchi custom;
- stile editor noto-like (bordi su hover/focus, cella attiva evidenziata) e stile pubblico diverso (bordi sempre visibili, header in evidenza, coerente col tema del sito);
- renderer pubblico esteso con un gemello schema-only dei quattro nodi, così post e prodotti esistenti continuano a caricarsi senza migrazioni.

Componente funziona ovunque viva l'editor condiviso: corpo dei Post e descrizioni prodotto.

## User Stories

1. As an editor, I want to insert a data table into the content of a Post or a product description, so that I can present tabular data inside editorial content.
2. As an author, I want to insert a table from the slash menu as a Content command, so that insertion stays inside the writing flow.
3. As an author, I want to insert a table from the toolbar Embed menu, so that the action is discoverable without opening the slash menu.
4. As an author, I want a new table to start as a 3×3 grid with the first row as header, so that I can begin filling data immediately.
5. As an author, I want the header row styled distinctly and removable via a toggle, so that a table can be presented with or without a labeled header.
6. As an author, I want to move the cursor between cells with the arrow keys, so that I can navigate the grid without leaving the keyboard.
7. As an author, I want Tab to move to the next cell and Shift+Tab to the previous one, so that cell traversal follows the standard grid convention.
8. As an author, I want Tab in the last cell of the last row to create a new row, so that the table can grow without explicit counts.
9. As an author, I want Enter to move the cursor to the cell below, so that data entry flows top to bottom.
10. As an author, I want Enter in the last row to create a new row below, so that filling data never stalls at the edge of the grid.
11. As an author, I want Shift+Enter to insert a line break inside the current cell, so that a cell can contain multiple lines without leaving the cell.
12. As an author, I want Escape to leave the table grid, so that I can return to normal block editing after data entry.
13. As an author, I want a "plus" affordance to appear on the edge of a row/column on hover, so that I can add a row below or a column right with one click.
14. As an author, I want a noto-style floating menu to appear over the table, so that I can insert a row above/below and a column left/right where the pointer is.
15. As an author, I want to delete the current row or column from the same menu, so that corrections require a single action.
16. As an author, I want delete-row and delete-column actions disabled at the 1×1 limit, so that a valid rectangular grid is always preserved.
17. As an author, I want to delete the whole table from the menu, so that a mistaken table can be removed cleanly.
18. As an author, I want to drag a column divider to resize it, with the width remembered after saving, so that column proportions fit the content.
19. As an author, I want a cell to accept bold, italic, underline, links and inline code, so that cell text has the same inline formatting as normal paragraphs.
20. As an author, I want pasting an HTML table to produce a Table node, so that content copied from other editors or spreadsheets lands as editable structure.
21. As an author, I want pasted tables with merged cells to degrade to a plain rectangular grid, so that the grid stays simple like a Notion table.
22. As an author, I want to drag the table as a whole block to reposition it, so that it behaves like the other custom blocks in the editor.
23. As an accessible user, I want the table menu controls to expose accessible labels and states, so that icon-only actions remain understandable with assistive technology.
24. As an editor, I want the table grid to look noto-like while editing (borders on hover/focus and an active cell highlight), so that the writing surface stays minimal when the table is not in focus.
25. As a reader, I want the published table to show always-visible borders and a highlighted header, so that tabular data is readable on the public site.
26. As a developer, I want the table content to round-trip between the production editor and the public renderer without migration, so that posts and products keep working unchanged.
27. As a developer, I want all Tiptap packages aligned to a single version line, so that the new table packages cannot introduce peer-version conflicts.
28. As a developer, I want the Puck editor to keep working after the version alignment, so that the page builder is not broken by the table work.
29. As a developer, I want the table feature testable through the single existing production editor seam, so that behavior is verified without coupling to React component internals.
30. As a maintainer, I want the Table domain term to be recorded in the glossary distinct from TableContentNode, so that the language of the codebase matches the feature.

## Implementation Decisions

### Architettura del nodo

- La tabella è costruita con la famiglia ufficiale Tiptap v3 (`Table`, `TableRow`, `TableCell`, `TableHeader`) sul motore prosemirror-tables. Non viene creato un clone custom "block-per-row".
- Il contenuto di una cella è solo rich text inline in un blocco paragrafo. Non sono ammessi blocchi annidati dentro le celle.
- Le celle unite non esistono in questo nodo: i comandi di merge/split non vengono esposti e gli attributi `colspan`/`rowspan` vengono rimossi al parsing (l'incolla di tabelle HTML con celle unite degrada a griglia rettangolare).
- Il comportamento tastiera noto-like viene implementato come keymap dedicata sopra i comportamenti nativi prosemirror-tables: frecce e `Tab`/`Shift+Tab` tra celle, `Tab`/`Enter` sull'ultima riga che creano una nuova riga, `Enter` verso la cella sotto, `Shift+Enter` hard break nella cella, `Esc` che esce dalla griglia.
- La griglia ha un minimo garantito 1×1: l'eliminazione di righe/colonne è disabilitata quando resterebbe sotto tale soglia.
- Il resize delle colonne è abilitato (`colwidth` persistito nel documento JSON).
- La tabella è trascinabile come blocco unico, in coerenza con gli altri blocchi custom dell'editor, mantenendo l'architettura a griglia.

### Interazione editor

- Inserimento predefinito 3×3 con header row attivo.
- Punti d'ingresso: voce "Table" nello slash menu (gruppo `Content`, icona dedicata, keywords per la ricerca) e voce "Table" nel menu Embed della toolbar.
- Un FloatingMenu noto-style appare al passaggio del mouse su una cella e offre: inserisci riga sopra/sotto, inserisci colonna sinistra/destra, elimina riga, elimina colonna, toggle header row, elimina tabella, con gli stati disabilitati al limite 1×1.
- Affordance "+" visibili sull'hover sui bordi destro e inferiore della griglia per aggiungere rapidamente una colonna a destra o una riga sotto.
- L'editor usa le estensioni Tiptap ufficiali per la selezione di celle/righe/colonne (captured da prosemirror-tables). Non vengono introdotti NodeView React per la griglia: i comandi vengono testati sul documento.
- Stile editor noto-like: bordi della griglia visibili solo su hover/focus della tabella e cella attiva evidenziata, via CSS sull'area editor.

### Persistenza e renderer

- Il contratto di persistenza resta il JSON Tiptap esistente; nessuna migrazione del database o cambio di formato.
- L'extension set di produzione riceve i quattro nodi della tabella; il renderer pubblico riceve il gemello schema-only dei quattro nodi e la mappatura di rendering verso un elemento `<table>` con bordi sempre visibili e header in evidenza.
- Il rendering pubblico usa lo stesso set di estensioni del renderer sia per l'output React element sia per l'output HTML string.

### Allineamento versioni

- Tutti i pacchetti `@tiptap/*` del progetto vengono allineati a un'unica linea di versione v3 (la più recente stabile disponibile della famiglia table), eliminando la frammentazione attuale tra 3.22.5 e 3.27.1.
- La compatibilità col Puck editor è verificata: il suo manifest richiede `@tiptap/*` in range v3 (`^3.11.1`), soddisfatti dalla linea scelta; l'instanza npm deduplica in un'unica copia hoisted alla versione allineata.
- Verifica dopo l'allineamento: build completa, suite di test esistente, e smoke test del Puck editor.

### Glossario

- Il termine **Table** è già registrato in `CONTEXT.md` (griglia dati rettangolare, senza celle unite, distinta da **TableContentNode** che è l'indice dei titoli). La spec lo assume come vocabolario del dominio.

## Testing Decisions

### Cosa rende un buon test

I test verificano il comportamento esterno del documento e dei comandi, non dettagli di implementazione React, classi CSS o composizione di componenti. Un buon test dimostra che:

- il comando di inserimento produce una griglia 3×3 con header attivo;
- aggiungere/eliminare righe e colonne produce la struttura attesa nel JSON;
- le eliminazioni si fermano al limite 1×1;
- il toggle header agisce sulla prima riga;
- la navigazione tastiera (Enter, Shift+Enter, Tab) produce gli effetti documentali attesi;
- un incolla HTML con celle unite degrada a una griglia rettangolare senza `colspan`/`rowspan`;
- un documento con tabella round-trippa tra le estensioni di produzione e il renderer pubblico senza perdita semantica;
- i nodi custom esistenti continuano a caricarsi e salvare senza alterazioni.

### Seam principale

Un unico seam di integrazione sul "contratto documento Tiptap", coerente con il pattern già presente per l'editor di produzione, con due lati:

1. **Lato editing**: un'istanza reale di Tiptap configurata con lo stesso set di estensioni di produzione sulla quale vengono eseguiti i comandi tabelle e verificato il documento JSON risultante.
2. **Lato rendering**: lo stesso documento passa per il set di estensioni del renderer pubblico (output React element e output HTML string) per verificare l'output tabellare.

### Validazione manuale

La resa visuale (FloatingMenu noto-style, affordance "+", highlight della cella attiva, stile editor e stile pubblico) viene validata manualmente, come da pattern della spec precedente: nessun test snapshot dei componenti visuali né test legati a classi CSS.

La checklist manuale comprende l'apertura del menu al passaggio del mouse, il posizionamento vicino ai bordi della griglia, le affordance "+" su riga/colonna, la navigazione da tastiera completa, il resize col drag con persistenza dopo salvataggio, l'incolla da un altro editor, e il rendering pubblico su post e prodotto.

### Prior art

Il seam segue il pattern della suite esistente `create-editor-extensions.test.ts` (istanza Tiptap reale con estensioni di produzione, ambiente happy-dom) e della spec `notion-style-tiptap-editor`. Le voci dello slash menu e il loro filtro usano lo stesso contratto del catalogo esistente.

## Out of Scope

- Riordinamento visuale delle righe (drag-reorder dentro la tabella).
- Celle unite (merge/split) e contenuto multi-blocco nelle celle.
- Modifica del formato JSON Tiptap o migrazione del database.
- Modifica dell'esperienza Slate.
- Modalità "database" stile Notion (filtri, viste, formule, relazioni).
- Formattazione avanzata delle celle (colore di sfondo, colori di testo, valuta).
- Import da spreadsheet oltre l'incolla HTML di base.
- Suite end-to-end browser completa.
- Smoke test automatizzati del Puck editor (resta una verifica manuale).

## Further Notes

- Il renderer pubblico è il vincolo di compatibilità: ogni comportamento del nodo deve round-trippare tra editor e renderer senza migrazioni.
- **Table**, **TableContentNode** e admin outline sono tre cose distinte: la griglia dati persistita, l'indice dei titoli persistito, e la navigazione temporanea derivata dagli heading.
- L'allineamento della linea di versioni Tiptap è prerequisito dell'intera feature e va verificato (build, test, Puck) prima che i ticket di feature partano.
- Lo slash menu è la superficie primaria di inserimento; la toolbar è la superficie di discoverability, come da spec precedente.
- Le affordance "+" e il FloatingMenu sono superficie dell'editor admin: non esiste alcunché di simile nel renderer pubblico.