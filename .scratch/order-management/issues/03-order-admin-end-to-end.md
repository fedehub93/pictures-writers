# 03: Order admin end-to-end

**What to build:** implementare la gestione ordini lato admin con creazione, lista, dettaglio, completamento e annullamento.

**Blocked by:** 02 — Customer admin end-to-end.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] (TDD) Test di integrazione per il router orders: creazione ordine con calcolo totale, snapshot prezzi, transizioni di stato (`DRAFT` → `PENDING` → `COMPLETED`/`CANCELLED`), protezione delle transizioni, permessi (`orders.manage` richiesto per completare/annullare), generazione `orderNumber`.
- [ ] Admin con `orders.read` vede la lista paginata degli ordini con stato e totale.
- [ ] Admin con `orders.create` crea un ordine per un customer esistente, aggiungendo prodotti dal catalogo.
- [ ] Il totale dell’ordine viene calcolato automaticamente dagli `OrderItem`.
- [ ] La pagina dettaglio mostra il customer, le righe ordine (`OrderItem`) e i pagamenti (`Payment`).
- [ ] Admin con `orders.manage` completa un ordine in stato `PENDING`: aggiorna il relativo `Payment` offline a `COMPLETED`, registra `completedAt` e `completedBy`.
- [ ] Admin con `orders.manage` annulla un ordine portandolo in stato `CANCELLED`.
- [ ] La voce di menu Shop → Orders appare nella sidebar per chi ha il permesso.
