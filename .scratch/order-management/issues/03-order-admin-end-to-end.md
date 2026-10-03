# 03: Order admin end-to-end

**What to build:** implementare la gestione ordini lato admin con creazione, lista, dettaglio, completamento e annullamento.

**Blocked by:** 02 — Customer admin end-to-end.

**Status:** resolved

## Acceptance criteria

- [x] (TDD) Test di integrazione per il router orders: creazione ordine con calcolo totale, snapshot prezzi, transizioni di stato (`DRAFT` → `PENDING` → `COMPLETED`/`CANCELLED`), protezione delle transizioni, permessi (`orders.manage` richiesto per completare/annullare), generazione `orderNumber`.
- [x] Admin con `orders.read` vede la lista paginata degli ordini con stato e totale.
- [x] Admin con `orders.create` crea un ordine per un customer esistente, aggiungendo prodotti dal catalogo.
- [x] Il totale dell’ordine viene calcolato automaticamente dagli `OrderItem`.
- [x] La pagina dettaglio mostra il customer, le righe ordine (`OrderItem`) e i pagamenti (`Payment`).
- [x] Admin con `orders.manage` completa un ordine in stato `PENDING`: aggiorna il relativo `Payment` offline a `COMPLETED`, registra `completedAt` e `completedBy`.
- [x] Admin con `orders.manage` annulla un ordine portandolo in stato `CANCELLED`.
- [x] La voce di menu Shop → Orders appare nella sidebar per chi ha il permesso.

## Comments

Delivered:

- `src/modules/orders/server/procedures.ts` espone il router tRPC `orders` (`create`, `getMany`, `getOne`, `getFormOptions`, `confirm`, `complete`, `cancel`) registrato in `src/trpc/routers/_app.ts`. Il router usa `permissionProcedure` (`orders.read`, `orders.create`, `orders.update`, `orders.manage`).
- Ciclo di vita in un unico punto (`ALLOWED_TRANSITIONS`): `DRAFT → PENDING → COMPLETED/CANCELLED`, con `DRAFT → CANCELLED`. Le transizioni sono applicate con `updateMany` condizionato allo stato osservato, così due transizioni concorrenti non possono vincere entrambe.
- `create` calcola il totale e crea snapshot (`nameSnapshot`, `unitPrice`, `quantity`, `totalPrice`), il `Payment` `OFFLINE`/`PENDING` e genera `orderNumber` nel formato `PW-YYYY-NNNNNN` (retry sul vincolo unico).
- UI admin sotto `src/app/(admin)/admin/(routes)/shop/orders/` (lista + dettaglio) con modulo `src/modules/orders/`: dialog di creazione (`customer` + righe prodotto/quantità con totale live), ricerca, filtro per stato, paginazione, azioni di riga/dettaglio `Confirm`/`Complete`/`Cancel` permesso-gated e tabelle `OrderItem`/`Payment` nel dettaglio.
- Voce di menu Shop → Orders in `src/app/(admin)/_components/sidebar/app-sidebar.tsx` dietro `orders.read`.
- Coverage: `src/modules/orders/__tests__/orders-router.test.ts` (22 test: create/totali/snapshot/orderNumber, getMany con ricerca e filtro stato, getOne, confirm, complete con settlement del payment, cancel, protezione transizioni, mapping permessi) più `foundation.test.ts`.
- Verified: `npx vitest run` (77 file, 610 test verdi), `npx tsc --noEmit` ed eslint sul modulo puliti.
