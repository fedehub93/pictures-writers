# 08: Affordance di gestione tabella (pattern + dwell delay)

**What to build:** Il pattern di gestione della tabella nell'editor viene confermato: il FloatingMenu a hover (ticket 04) resta la superficie di gestione, perché l'editing è mouse-first e desktop (99% dei casi). Non si riprogetta verso row/column handle. Si aggiunge un solo micro-fix mirato al comportamento fastidioso osservato: il menu si ri-ancora a ogni cella attraversata dal puntatore e "insegue" l'utente sopra il contenuto. Con un **dwell delay** il menu appare solo dopo una sosta stabile su una cella, quindi le celle di transito non lo ri-ancorano più.

**Blocked by:** 04 (Notion-style table editor UI)

**Status:** done

## Decisioni

- **Pattern confermato**: FloatingMenu a hover + knob "+" ai bordi, com'è ora. Nessuna introduzione di row/column handle. La scelta è mouse-first, touch editing fuori scope.
- **Dwell delay ~300ms**: il menu non appare finché il puntatore non sosta ~300ms su una cella; un passaggio rapido tra celle non lo mostra e non lo ri-ancora. Il valore 300ms è il compromesso tra "non inseguire" (il sintomo) e "rispondere quando ti fermi" (500ms verrebbe percepito come lento da chi usa il menu come azione primaria, spostando il traffico sui "+").
- **Transizione in show**: fade ~120ms + scale 0.98→1. Solo in entrata: un'animazione in uscita complicherebbe lo scheduler di hide (`HideScheduler`) senza valore pratico.
- **Implementazione**: `hover-controller.ts` — un `SHOW_DELAY_MS = 300` accanto all'attuale `HIDE_DELAY_MS`, con la logica di comparsa schedulata (le celle di transito annullano il timer di show). Estendere `hover-controller.test.ts` con i casi: sosta oltre soglia → mostra; passaggio rapido → non mostra; uscita dalla tabella → hide invariato.
- **Trigger di rivalutazione (soft, documentato qui)**: il pattern si riapre solo se emerge un segnale reale in uso — es. un autore abituale di tabelle segnala che il menu non lo trova, oppure le azioni cadono sempre sui knob "+" a scapito del menu. Nessuna metrica inventata: è un admin CMS, non serve instrumentare.

## Checklist

- [x] Il menu a hover non appare più durante un passaggio rapido tra celle; appare dopo ~300ms di sosta.
- [x] Il menu resta ancorato/posizionato come prima quando visibile; i knob "+" invariati.
- [x] Fade-in ~120ms + scale 0.98→1 in entrata; nessuna animazione in uscita.
- [x] Il hide a uscita tabella/menu resta corretto (`HideScheduler`).
- [x] `hover-controller.test.ts` esteso e verde (sosta, passaggio rapido, uscita).
- [x] `npm run lint` senza nuovi finding; `npx tsc --noEmit` pulito.

## Verification

- Suite: 37 file / 321 test verdi (inclusi i 19 di `hover-controller.test.ts`); `npx tsc --noEmit` pulito; `npm run lint` senza nuovi finding.
- Test del seam `hover-controller`:
  - sosta stabile oltre `SHOW_DELAY_MS` (300ms) → `ShowScheduler` mostra una volta sola;
  - passaggio rapido tra celle → ogni segnale `cell` ri-armano il timer, la finestra non scatta mai e l'ancoraggio visibile resta fermo (niente "inseguimento");
  - stesso cella (refresh da `transaction`) → adotta subito la rect aggiornata e annulla ogni show pendente;
  - uscita tabella/editor e dal menu → hide invariato (`HideScheduler`, 200ms), test esistenti intatti.
- La resa visuale (fade+scale in entrata) e la percezione del delay (300ms) richiedono una smoke test manuale nel browser admin, come da pattern della spec.

## Note

- `hover-controller.ts`: il decision model da `{ anchor, timer }` (solo hide) è diventato `{ anchor, show, hide }`: `show` guida un nuovo `ShowScheduler` con `SHOW_DELAY_MS = 300`. La meccanica a slot singolo è estratta in `DelayScheduler` (base condivisa); `ShowScheduler` e `HideScheduler` sono sotto-classi che fissano rispettivamente 300ms e 200ms.
- `table-menu.tsx`: un `pendingRef` tiene il candidato in sosta, adottato come `anchor` dal callback del `ShowScheduler`; ogni segnale `cell` aggiorna il candidato e ri-arma il timer, così le celle di transito azzerano la finestra. `onScroll` e il cleanup cancellano entrambi gli scheduler; il `cell` a parità di `cellPos` (refresh da `transaction`) adotta subito la rect.
- Transizione d'entrata sulla toolbar: `animate-in fade-in-0 zoom-in-[0.98] duration-[120ms]` (utilities `tw-animate-css`, già importate in `admin.css`). Nessuna classe d'uscita: il menu sparisce per unmount con l'`HideScheduler`, come prima.
- I knob "+" restano invariati (render e posizionamento); compaiono insieme al menu perché vivono nello stesso overlay ancorato.
