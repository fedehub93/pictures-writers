# Esperienza minimalista per l'editor Tiptap del blog

**Status:** `ready-for-agent`

## Problem Statement

Il **Tiptap editor** usato per modificare il contenuto di un **Post** è funzionante e supporta già diversi nodi e mark, ma l'esperienza corrente è centrata su una toolbar ampia e sempre visibile. Questo rende meno immediata la scrittura, aumenta il rumore visivo e costringe l'editor a cercare tra molte azioni anche quando vuole semplicemente concentrarsi sul testo.

Le azioni esistenti sono distribuite principalmente nella toolbar: formattazione inline, heading, allineamento, liste, citazioni e inserimento di contenuti custom. Mancano un punto di ingresso contestuale per i blocchi e una modalità rapida per trovare un comando digitandone il nome.

La situazione deve essere migliorata senza compromettere gli articoli già esistenti. Il contenuto Tiptap è persistito come JSONB e può contenere nodi custom già utilizzati in produzione. Inoltre il blog mantiene il supporto al **Slate editor** per i Post che lo utilizzano, quindi il lavoro deve rimanere confinato all'esperienza Tiptap.

È presente anche un rischio UX e di performance nel salvataggio: gli aggiornamenti del contenuto passano dal bridge Tiptap/React Hook Form e possono attivare più percorsi di autosave. Ogni salvataggio deve rimanere affidabile, ma non deve produrre richieste, invalidazioni o toast di successo più spesso del necessario.

## Solution

Rendere il Tiptap editor una writing workspace più minimalista e vicina al modello mentale di Notion, mantenendo invariati il formato JSON, i nodi persistiti e il renderer pubblico.

La nuova esperienza comprenderà:

- uno **slash menu** ricercabile che si apre digitando `/` e permette di inserire o trasformare rapidamente un blocco;
- un **bubble menu** contestuale alla selezione di testo per le azioni inline più frequenti;
- una toolbar compatta, sticky e facilmente disattivabile tramite prop, mantenuta come supporto discoverable per gli utenti che preferiscono i controlli visuali;
- un placeholder discreto che suggerisce la scrittura e l'uso di `/` senza occupare spazio aggiuntivo;
- trasformazioni tra i principali blocchi testuali;
- conteggio delle parole e tempo di lettura mostrati in modo discreto sotto l'editor;
- autosave debounced con un solo percorso effettivo per il contenuto Tiptap e feedback silenzioso sullo stato di salvataggio;
- preservazione delle estensioni custom già supportate, senza rendere disponibile `TableContentNode` come nuovo comando di inserimento.

Lo slash menu userà l'infrastruttura di suggestion di Tiptap, con filtro locale sui comandi e navigazione da tastiera. Il bubble menu userà il componente React ufficiale di Tiptap. Le azioni che aprono un modal continueranno a usare il media picker e gli altri modal esistenti.

## User Stories

1. As an editor, I want a quiet writing surface with less persistent UI, so that I can stay focused on drafting the Post.
2. As an author, I want to type `/` at the beginning of a block or after a space, so that I can discover block actions without leaving the writing flow.
3. As an author, I want the slash menu to show useful commands immediately when it opens, so that I can choose a common block without typing a full search term.
4. As an author, I want the slash menu to filter by label, description and keywords as I continue typing, so that I can find a block quickly even when I do not remember its exact name.
5. As an author, I want the slash menu to group commands into text, media and content sections, so that the list remains understandable as more commands are added.
6. As an author, I want to navigate the slash menu with the arrow keys, so that I can keep my hands on the keyboard while writing.
7. As an author, I want to confirm a slash command with Enter, so that inserting a block does not require a mouse interaction.
8. As an author, I want Escape to close the slash menu without changing the document, so that an accidental `/` is harmless.
9. As an author, I want selecting a slash command to remove the slash query from the document, so that command text is never persisted as article content.
10. As an author, I want the slash menu to insert a paragraph, so that I can explicitly reset a block to normal text.
11. As an author, I want the slash menu to insert Heading 1 through Heading 4, so that I can structure the Post while writing.
12. As an author, I want the slash menu to insert bullet and ordered lists, so that I can create structured lists without opening a large toolbar.
13. As an author, I want the slash menu to insert a blockquote and a code block, so that I can represent common editorial content directly from the writing flow.
14. As an author, I want the slash menu to insert a divider, so that I can separate sections of a Post without manually finding a formatting control.
15. As an author, I want the slash menu to open the existing media picker for an image, so that the new UX does not introduce a second media management flow.
16. As an author, I want the slash menu to open the existing URL modal for a YouTube video, so that embedded media continues to use the established validation and persistence behavior.
17. As an author, I want the slash menu to open the existing product selector, so that I can embed a shop product without leaving the Post editor.
18. As an author, I want the slash menu to insert an info box, so that I can highlight supporting information in the Post.
19. As an editor, I want existing custom nodes to remain editable and renderable, so that improving the admin UX does not damage published content.
20. As an editor, I want `TableContentNode` to remain compatible with existing content while being omitted from the new insertion menu, so that its current production usage is safe without adding a command that is not currently needed.
21. As an author, I want a bubble menu to appear when I select text, so that inline formatting is available near the content I am editing.
22. As an author, I want the bubble menu to support bold, italic, underline and link, so that the most frequent inline actions are available without a permanent toolbar.
23. As an author, I want inline actions to preserve or restore editor focus, so that applying formatting does not unexpectedly move the cursor.
24. As an author, I want the bubble menu to stay limited to inline actions, so that structural actions do not make the contextual menu noisy.
25. As an editor, I want a compact toolbar to remain available for discoverability, so that users who do not know slash commands can still format content.
26. As a developer, I want the compact toolbar to be sticky inside the editor rather than fixed to the viewport, so that it remains useful while scrolling without covering unrelated admin UI.
27. As a developer, I want the compact toolbar to be removable through a boolean configuration prop with an enabled default, so that different editor contexts can opt out without forking the editor shell.
28. As an author, I want the toolbar to expose heading and block transformations, so that I can change the current block type using visible controls when preferred.
29. As an author, I want to transform a text block between paragraph, headings, lists, blockquote and code block, so that I can revise structure without recreating content.
30. As an author, I want an unobtrusive placeholder to explain that I can start writing or use `/`, so that the new minimal interface remains discoverable.
31. As an author, I want word count to update as I write, so that I can monitor the length of the Post without opening another panel.
32. As an editor, I want an estimated reading time below the editor, so that I can understand the approximate reading effort of the Post.
33. As an editor, I want word count and reading time to remain derived display data, so that they do not create redundant persisted fields or migration work.
34. As an author, I want autosave to continue after editing the Tiptap content, so that I do not lose work while using the new menus.
35. As an author, I want autosave to remain debounced, so that rapid typing does not create a request for every transaction.
36. As an author, I want autosave success to be represented by a quiet status rather than a success toast on every edit, so that writing is not interrupted by notifications.
37. As an editor, I want save errors to remain visible, so that I know when a Post may not have been persisted.
38. As an editor, I want loading a previously persisted Tiptap Post to preserve its structure and custom nodes, so that the UX improvement is safe for production content.
39. As an editor, I want saving a previously persisted Tiptap Post without meaningful changes to avoid unnecessary content churn, so that versioning and rendering remain stable.
40. As an editor, I want the outline derived from headings to continue updating, so that the new editor surface does not break desktop navigation.
41. As an author, I want the editor to remain usable on tablet and smaller screens, so that the writing flow is not limited to a large desktop viewport.
42. As an author, I want keyboard interactions to work consistently for menus and formatting, so that the minimal UI improves efficiency rather than hiding functionality.
43. As an accessible user, I want slash and bubble menu controls to have labels and selected states, so that icon-only controls remain understandable with assistive technology.
44. As a developer, I want the editor integration to keep the Slate path untouched, so that Posts using the legacy editor continue to work as before.
45. As a developer, I want the public renderer to keep receiving the same node names and attributes, so that admin UX changes do not require a content migration.
46. As a developer, I want the editor feature to be testable through a single high-level Tiptap integration seam, so that behavior is verified without coupling tests to internal React component structure.
47. As a maintainer, I want the feature to have clear boundaries around deferred functionality, so that drag handles, drag-and-drop media, Markdown shortcuts and advanced block management can be added later without being implicitly required now.

## Implementation Decisions

### Editor surface and compatibility

- The current Tiptap JSON document remains the persistence contract.
- No Prisma schema change, JSON migration or renderer format change is introduced.
- The existing distinction between the Tiptap editor, the Slate editor, the temporary admin outline and the persisted `TableContentNode` is preserved.
- The editor extension set remains compatible with all currently persisted custom nodes, including images, YouTube embeds, products, info boxes and `TableContentNode`.
- `TableContentNode` remains registered for loading, editing and rendering existing content, but is intentionally omitted from the new insertion catalog.
- The public renderer continues to be the compatibility boundary: any node created by the new UX must use the existing node names and attributes already understood by the renderer.

### Slash menu

- A dedicated slash-command catalog defines the command id, visible label, description, keywords, grouping and icon for each command.
- The initial catalog contains paragraph, Heading 1–4, bullet list, ordered list, blockquote, code block, divider, image, YouTube video, product and info box.
- The catalog does not contain `TableContentNode`.
- `/` activates the suggestion only in a valid text context, at the beginning of a block or after an allowed whitespace prefix.
- The query excludes the trigger character, does not allow spaces in the initial release, and filters locally against labels, descriptions and keywords.
- The menu uses Tiptap's suggestion utility and managed positioning, with a bounded popup that flips when necessary and does not require manual scroll or resize listeners.
- Arrow keys move through the flattened visible command list, Enter executes the selected command, and Escape closes the suggestion without changing document content.
- Selecting a command removes the complete slash query before applying the command.
- Text commands use existing Tiptap commands and preserve the current block content where Tiptap supports the transformation.
- Image, YouTube and product commands open the existing modal flows. The selected slash range is removed before the modal opens, and the resulting media node is inserted at the current editor position using the existing node attributes.
- The info box command inserts the existing custom node with its current default attributes.
- The slash popup is a React-rendered component and owns only menu presentation and keyboard selection; document mutations remain editor commands.

### Bubble menu

- The bubble menu uses the React-specific Tiptap menu integration rather than a second custom positioning plugin.
- It appears for a non-empty text selection in a normal editable context.
- It contains bold, italic, underline and link actions, with active states derived from the current editor state.
- Link editing continues to use the existing custom link modal and link mark behavior.
- The bubble menu does not contain media insertion, alignment, lists or block transformations.
- Mouse interactions prevent accidental loss of the text selection before a command runs, and commands refocus the editor after execution.
- The bubble menu uses delayed position updates and the existing Floating UI behavior to avoid recalculating position on every selection event.

### Compact toolbar

- The toolbar is refactored as a compact presentation of the existing controls rather than removed from the codebase.
- The editor shell exposes a boolean toolbar visibility configuration, enabled by default. Consumers can disable the toolbar without changing the editor extension set or duplicating the shell.
- The toolbar is sticky within the editor container and uses compact spacing suitable for a writing surface.
- Existing formatting and embed actions remain available through the toolbar, except for the deliberate removal of the Table of Contents insertion action.
- The visible block selector supports paragraph, Heading 1–4, bullet list, ordered list, blockquote and code block transformations where the current selection permits them.
- Toolbar icon controls expose accessible labels and tooltips; icon-only presentation is not the only source of meaning.
- The toolbar does not become a second command system: the slash catalog is the canonical list of insertable blocks, while the toolbar is a discoverable shortcut surface.

### Placeholder and derived writing metrics

- The editor uses the official Tiptap placeholder extension with a short, localized prompt mentioning the slash menu.
- Placeholder styling is limited to the empty editor context and does not change persisted JSON.
- Word count is derived from the current Tiptap document text, using the existing word-count semantics.
- Reading time is derived from word count using a fixed editorial reading-speed assumption and is rounded up for non-empty content.
- Metrics are rendered below the editor in a subtle, non-editable status row and are never persisted.
- Metric subscriptions select only the derived value needed by the status row, avoiding broad editor-shell re-renders.

### Autosave and performance

- The Tiptap-to-React Hook Form bridge continues to emit the current JSON document, but the content autosave path is consolidated so a single editor transaction does not schedule duplicate saves.
- The existing debounce behavior remains the default protection against request-per-keystroke behavior.
- Content autosave success no longer emits a success toast for every edit.
- The editor uses the existing post status store for quiet saving/saved/error feedback; errors remain actionable and visible.
- Content autosave avoids invalidating unrelated post-list queries on every successful body update unless a consumer demonstrably depends on that invalidation.
- The editor does not call `getJSON()` more than necessary for a single update cycle; derived metrics use the ProseMirror document state where possible.
- The slash popup, bubble menu and metrics subscribe only to the state slices they need.
- No drag handle, drag-and-drop upload, image paste upload or Markdown shortcut is introduced in this iteration.

### Organizzazione del codice

- Il Tiptap editor è infrastruttura condivisa, non un modulo di dominio autonomo: shell visuale, primitive di toolbar/bubble menu e integrazioni Tiptap riutilizzabili restano nell'area shared.
- La composizione specifica del blog Post, il catalogo dei comandi legati ai contenuti editoriali e l'orchestrazione dei modal admin restano nell'area del modulo blog, così la shared infrastructure non dipende dal dominio Post.
- Non viene eseguito uno spostamento massivo degli artefatti esistenti in questa iterazione: si separano le nuove responsabilità solo dove serve e si mantengono gli import compatibili.

### Public and admin boundaries

- The implementation is limited to the Tiptap editing path used by blog Posts.
- The Slate editor path remains unchanged.
- The admin outline remains derived from headings and is not replaced by a persisted table of contents.
- Existing modal contracts for assets, URLs, products and links remain the integration points for those actions.
- No new API endpoint or tRPC procedure is required.
- No new persisted field is required for toolbar visibility, word count, reading time or menu state.

## Testing Decisions

### Cosa rende un buon test

I test devono verificare comportamento esterno e compatibilità del documento, non dettagli di implementazione React, nomi di classi CSS o il numero di componenti interni.

Un buon test deve dimostrare che:

- un comando slash produce il blocco previsto;
- il testo `/query` non rimane nel documento dopo l'inserimento;
- una trasformazione mantiene il contenuto testuale e cambia solo la struttura richiesta;
- i nodi custom esistenti continuano a essere accettati senza alterare nome e attributi;
- un contenuto Tiptap esistente può essere caricato e risalvato senza perdita semantica;
- il conteggio parole e il tempo di lettura riflettono il documento corrente;
- un autosave debounced produce una sola azione di salvataggio per una sequenza ravvicinata di aggiornamenti;
- il ramo Slate non viene coinvolto dai cambiamenti Tiptap.

### Seam principale

È previsto un unico seam di integrazione sull'editor Tiptap del blog, usando un'istanza reale di Tiptap configurata con lo stesso set di estensioni dell'ambiente di produzione.

Il seam verifica il comportamento pubblico dei comandi e del documento risultante:

- catalogo e filtro dello slash menu;
- inserimento di paragraph, heading, liste, blockquote, codice e divider;
- rimozione del range slash prima del comando;
- trasformazioni dei blocchi testuali;
- presenza e compatibilità di immagini, video, prodotti, info box e `TableContentNode` già persistiti;
- calcolo di word count e reading time;
- compatibilità con documenti vuoti e documenti legacy già salvati.

Per i modal di asset, URL e prodotto viene usato un fake del contratto esistente, così il test verifica la selezione e l'inserimento senza dipendere da UI o database dei modal.

### Validazione manuale

La resa visuale viene validata manualmente perché la configurazione Vitest corrente usa ambiente Node e il progetto non dispone di una suite browser/UI consolidata.

La checklist manuale comprende:

- apertura del menu `/` all'inizio del blocco e dopo uno spazio;
- filtraggio e navigazione da tastiera;
- chiusura con Escape;
- posizionamento del popup vicino al cursore e comportamento vicino ai bordi della viewport;
- bubble menu con selezioni brevi, lunghe e vicine ai bordi;
- mantenimento della selezione dopo l'apertura del link modal;
- toolbar sticky e disabilitazione tramite prop;
- placeholder e metriche su editor vuoto e non vuoto;
- layout desktop, tablet e viewport stretta;
- autosave, stato salvato/in corso/errore e assenza di toast ripetitivi;
- modifica e rendering di un Post già esistente con nodi custom.

### Prior art

Il seam segue il pattern dei test di dominio già presenti nel progetto, che usano dipendenze fake e verificano effetti osservabili sul risultato. Non vengono introdotti test snapshot dei componenti visuali né test legati a classi Tailwind.

## Out of Scope

- Drag handle e riordinamento visuale dei blocchi.
- Drag & drop delle immagini.
- Upload diretto di immagini tramite paste o clipboard.
- Shortcut Markdown automatici.
- Collaborazione realtime.
- Commenti, revisioni collaborative e tracked changes.
- Cronologia visuale delle versioni del Post.
- AI writing assistant.
- Ricerca full-text nel contenuto del Post.
- Gestione avanzata degli elementi custom.
- Inserimento di `TableContentNode` tramite slash menu o nuova toolbar.
- Nuova gestione editoriale degli elementi embedded.
- Modifica del formato JSON Tiptap o migrazione del database.
- Modifica del renderer pubblico o del comportamento di pubblicazione, salvo la necessità di mantenere compatibilità con i nodi creati.
- Modifica dell'esperienza Slate.
- Nuovo media picker o nuovi endpoint di upload.
- Salvataggio persistito di word count, reading time o preferenze UI.
- Riscrittura completa del layout di `PostDetailsForm`.
- Suite end-to-end browser completa.

## Further Notes

- La dipendenza Tiptap per suggestion deve rimanere allineata alla linea di versione Tiptap già usata dal progetto; non devono essere mescolate major o versioni peer incompatibili.
- L'estensione placeholder segue la stessa regola di allineamento delle versioni Tiptap.
- Il renderer pubblico è il vincolo di compatibilità più importante: ogni nuova azione di inserimento deve usare nodi già supportati oppure richiedere esplicitamente un'estensione renderer, cosa esclusa per questa iterazione.
- Il temporary admin outline e il persisted `TableContentNode` non devono essere confusi: il primo è una navigazione derivata dagli heading, il secondo è contenuto persistito del Post.
- La toolbar è una superficie di fallback e discoverability; lo slash menu è la superficie primaria per l'inserimento dei blocchi.
- La metrica reading time è una stima editoriale, non una promessa sul tempo reale di lettura del pubblico.
- Il lavoro preparatorio sulle dipendenze Tiptap è già presente nel working tree; prima dell'implementazione va verificato che lockfile e versioni installate restino coerenti.
