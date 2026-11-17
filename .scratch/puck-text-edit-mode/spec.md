# Modalità modifica testo nei blocchi Puck

## Problem Statement

Nel page editor un blocco testo non si riesce a trascinare. `Heading` e `Text` montano il loro
Content field in linea, e l'editor Puck occupa l'intera superficie del Block root: qualunque press
cade dentro un `[contenteditable]`, che dnd-kit rifiuta, e dopo il focus l'overlay portal intercetta
il `pointerdown` in fase di capture. L'autore può quindi riordinare immagini, link e container, ma
non i blocchi testuali — che sono spesso quelli di cui vuole cambiare l'ordine.

Lo stesso montaggio sempre attivo produce due effetti collaterali: il caret entra nel testo al primo
click, anche quando l'intenzione era selezionare; e `Invio` con il caret dentro un `Heading` inserisce
un paragrafo *dentro* l'`<hN>`, una modifica silenziosa del contenuto che l'autore non ha chiesto.

## Solution

Il blocco testo acquista due stati espliciti.

**Locked text block** (default): la zona editabile è inerte. Un click seleziona il blocco, un press
prolungato con movimento lo trascina come qualunque altro blocco. Nessun caret, nessuna modifica
accidentale.

**Text editing mode**: caret vivo nel punto cliccato, toolbar di formattazione montata, testo
normalmente editabile. Si entra deliberatamente — doppio click sul blocco, `Invio` sul blocco
selezionato, o il pulsante **Edit text** nell'action bar — e si esce con `Esc`, con un click fuori,
o con **Done**. Un solo blocco per volta è in modalità modifica, e lo stato non sopravvive alla
sessione né al cambio di documento.

Mentre il caret è attivo il trascinamento resta possibile dal grip dell'action bar, così nessuno
resta in trappola dentro un blocco. Su touch si entra solo dal pulsante.

La pagina pubblicata non cambia: nessun attributo, nessuna classe, nessun byte di JavaScript in più.

## User Stories

1. Come autore, voglio trascinare un blocco testo afferrandolo dal testo, così da riordinare la pagina senza cercare un bordo.
2. Come autore, voglio che un click su un blocco testo lo selezioni e basta, così da non ritrovarmi il caret nel testo quando volevo solo selezionare.
3. Come autore, voglio fare doppio click sul testo per entrarci in modifica, così da avere il gesto che conosco dagli editor grafici.
4. Come autore, voglio che il caret cada sulla parola che ho cliccato, così da correggere un refuso senza riposizionarlo.
5. Come autore, voglio vedere la toolbar di formattazione solo mentre sto modificando il testo, così da non confonderla con le azioni del blocco.
6. Come autore, voglio uscire dalla modalità modifica con `Esc`, così da non dover mirare il pulsante.
7. Come autore, voglio che il primo `Esc` mi lasci il blocco selezionato e il secondo lo deselezioni, così da non perdere il blocco quando esco da una modifica.
8. Come autore, voglio uscire dalla modalità cliccando un altro blocco o sul fondo della pagina, così da seguire il flusso naturale.
9. Come autore, voglio che passare a un altro blocco testo chiuda la modalità del precedente, così da avere un solo blocco attivo.
10. Come autore, voglio che cliccare sulla toolbar, sul pannello link o sul pannello colore non chiuda la modalità, così da formattare senza perdere la selezione del testo.
11. Come autore, voglio entrare in modalità modifica con `Invio` sul blocco selezionato, così da scrivere subito dopo averlo scelto.
12. Come autore, voglio un pulsante **Edit text** nell'action bar, così da scoprire il gesto e da poter entrare in modalità anche dal touch.
13. Come autore su tablet, voglio che un tap selezioni il blocco e che la modifica si apra solo dal pulsante, così da non combattere con lo zoom del browser.
14. Come autore, voglio il grippino di trascinamento anche mentre sto modificando un testo, così da poter spostare il blocco senza uscire dalla modalità.
15. Come autore, voglio che un blocco appena inserito resti bloccato finché non lo apro, così da non rischiare di modificarlo mentre lo posiziono.
16. Come autore, voglio che `Esc` e `Invio` non facciano nulla quando nessun blocco è selezionato, così da non avere effetti a sorpresa.
17. Come autore, voglio che la modalità si chiuda quando passo all'anteprima interattiva, così da ritrovare il builder in uno stato pulito al ritorno.
18. Come autore, voglio che un blocco cancellato o annullato non lasci uno stato armato fantasma, così da non avere un editor montato su un blocco che non esiste più.
19. Come autore, voglio che la modalità non esista per i blocchi che non posso modificare, così da non vedere un pulsante che promette quello che i permessi negano.
20. Come autore, voglio che uscire dalla modalità lasci il blocco selezionato e le dimensioni della pagina invariate, così da continuare a lavorare sullo stesso elemento.
21. Come redattore, voglio che la pagina pubblicata sia identica byte per byte a prima, così da non dover riverificare layout, SEO e Core Web Vitals.
22. Come manutentore, voglio un test che fallisca se le regole CSS del gate spariscono, così da non poter rompere di nuovo il drag senza accorgermene.
23. Come manutentore, voglio che un futuro blocco testuale erediti il comportamento senza modifiche, così da non ricreare il difetto.
24. Come manutentore, voglio un probe in browser capace di trascinare e di fare doppio click, così da poter verificare interazioni che i test in happy-dom non possono riprodurre.
25. Come manutentore, voglio la checklist di upgrade del canvas aggiornata, così da scoprire a ogni bump di Puck se questa interazione è ancora vera.

## Implementation Decisions

**Stato.** Un solo id di blocco armato per sessione, accanto a zoom, auto-zoom e site layout nello
store dell'editor già esistente: è stato di sessione, non persistito, non parte del documento. Si
azzera al mount dell'editor, quando l'id non esiste più nel documento, e al cambio di preview mode.
Nessuna migrazione, nessun campo nuovo nel Puck data.

**Seam del gate.** Il comportamento è un wrapper applicato **solo nelle config dell'editor** ai due
blocchi testuali. Il render condiviso e la config pubblica restano intatti, quindi né lo store né i
listener entrano nel bundle del sito e la parità tra canvas e pagina non è a rischio. Il wrapper
compone `puck.dragRef` per afferrare il Block root e attaccarvi listener **nativi**: il canale React
e quello nativo si sono dimostrati indipendenti (il `preventDefault` di React non compare
sull'evento nativo), e il target di un `dblclick` è un discendente dell'editor, non il root.

**Blocco e armamento sono un solo meccanismo.** Le due regole vivono nella cascata, insieme:

```css
[data-puck-component] [data-puck-overlay-portal],
[data-puck-component] [data-puck-overlay-portal] * { pointer-events: none !important; }

[data-puck-component][data-text-editing] [data-puck-overlay-portal],
[data-puck-component][data-text-editing] [data-puck-overlay-portal] * { pointer-events: auto !important; }
```

(Dalla spike: Puck forza `pointer-events: auto !important` sul portal e sui discendenti, quindi
bloccare il solo `[contenteditable]` non bloccava nulla; e un lock che copre i discendenti rende il
testo una maniglia di trascinamento, che è il comportamento voluto.)

**Attributo transitorio.** `data-text-editing` compare sul Block root solo mentre il blocco è armato.
A riposo il markup del canvas coincide con quello pubblico, quindi la parità non richiede eccezioni;
l'attributo non può esistere sulla pagina.

**Caret.** `caretRangeFromPoint` sul punto del `dblclick`, poi `focus()` sull'editor: misurato esatto,
zero caratteri di scarto, e conservato dal focus. Se il punto non risolve, il caret va a fine testo.

**Ingressi.** Doppio click (listener nativo sul root), `Invio` sul blocco selezionato e non armato
(Puck non configura nessun `KeyboardSensor`, quindi il tasto è libero), pulsante nell'action bar.
Su touch solo il pulsante: il doppio tap è dello zoom.

**Uscita.** Click su un altro blocco o deselezione, `Esc`, **Done**. `Esc` è interamente nostro —
Puck non ha nessun handler `Escape`: il primo esce dalla modalità tenendo la selezione, il secondo
deseleziona. Il blur da solo **non** esce, perché il focus va nel pannello link o colore e chiudere
lì smonterebbe la toolbar a metà formattazione. All'uscita il focus si sposta sul Block root: Puck
azzera `currentRichText` solo con un `relatedTarget`, altrimenti la toolbar resta appesa a un blocco
bloccato. La selezione DOM viene collassata.

**Drag mentre si edita.** `dnd.enableDragHandle` attivo: il grip dell'action bar è la via di
trascinamento quando il caret è vivo, perché in quello stato dnd-kit rifiuta correttamente i press
dentro il testo. Il grip comparirà su tutti i blocchi, non solo su quelli testuali: è la chrome
standard di Puck e non la differenziamo.

**Pulsante.** Primo `overrides` del progetto: un override dell'action bar che rende il pulsante
quando il componente selezionato dichiara un Content field (si legge il descrittore dei `fields`,
non una lista di tipi), e lo nasconde quando il campo non è editabile per permessi o read-only. È
un toggle: **Edit text** / **Done**, con `aria-pressed`.

**Conseguenze accettate.** Un click lento su un blocco bloccato può iniziare un drag (200 ms con 5 px
di deriva): è la regola di dnd-kit già in vigore su ogni altro blocco. Un doppio click lento può
diventare un drag invece di armare: per questo il pulsante fa parte del modello e non è un ripiego.

## Testing Decisions

Un buon test descrive il comportamento esterno del gate — quali gesti cambiano lo stato e cosa vede
chi pubblica — non la composizione interna del wrapper né i dettagli di Puck. Si verificano quattro
seam, tutti già presenti nel repo.

1. **Wrapper del gate** (seam più alto): render del blocco con un finto `dragRef`; doppio click,
   `Invio` ed `Esc` cambiano lo stato; a riposo il markup è identico a quello non gated; nessun
   attributo sopravvive all'uscita. Prior art: `inline-roots.test.tsx` per il contratto del root,
   `heading-block.test.tsx` per la resa del blocco.
2. **Parità di markup**: lo stesso albero nella config dell'editor e in `pageRenderConfig`, con
   l'attributo presente solo da armato. Prior art: `render-pipeline.test.tsx`,
   `canvas-link-inert.test.tsx`.
3. **CSS**: le due regole asserite sul testo del foglio di stile con l'helper già usato per
   `puck-base.css`, perché specificità e `!important` sono il contratto che tiene in piedi il gate.
4. **Browser**: `scripts/browser-probe.mjs` esteso con una sequenza press → move → release e con il
   doppio click, più i passi nuovi nella checklist di `docs/puck-canvas.md`. happy-dom non riproduce
   l'hit-testing né il listener di Puck, quindi il browser resta ciò che chiude la questione.

## Out of Scope

- `Invio` con il caret dentro un `Heading`, che inserisce un paragrafo nell'`<hN>`: comportamento
  Tiptap preesistente, non introdotto qui.
- Auto-armamento del blocco appena trascinato dalla palette.
- Selezione della parola al doppio click.
- Doppio tap su touch.
- Una PR upstream che renda nativo il comportamento in Puck.
- Bubble menu ancorato alla selezione (già escluso da ADR-0041).

## Further Notes

La strada è stata scelta dopo una spike in browser i cui risultati sono in
`.scratch/puck-text-edit-mode/spike/FINDINGS.md`, con i riferimenti puntuali al sorgente di Puck e a
dnd-kit. Due fatti di quella spike hanno cambiato il progetto: il blocco iniziale non bloccava nulla
(Puck riabilita i discendenti del portal con `!important`) e `Esc` non esiste in Puck, quindi la
deselezione va scritta.

ADR-0041:93 afferma che l'editor inline non tocca drag e selezione: l'ADR di questa feature registra
il fatto misurato e lo corregge. Il glossario è già aggiornato con **Text editing mode** e **Locked
text block**.

Costo stimato: 2–3 giorni, con il rischio concentrato nei due blocchi testuali.
