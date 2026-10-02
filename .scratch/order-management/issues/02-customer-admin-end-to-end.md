# 02: Customer admin end-to-end

**What to build:** implementare la gestione clienti lato admin con tRPC router CRUD, pagina lista e pagina dettaglio.

**Blocked by:** 01 — Foundation: schema, migration e permessi.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] (TDD) Test di integrazione per il router customers: creazione, lettura, aggiornamento, eliminazione, unicità email, gestione customer senza ordini.
- [ ] Admin con `customers.read` vede la lista paginata dei customer.
- [ ] Admin con `customers.create` crea un customer.
- [ ] Admin con `customers.update` modifica un customer esistente.
- [ ] Admin con `customers.delete` elimina un customer che non ha ordini associati.
- [ ] La pagina dettaglio di un customer mostra gli ordini a lui associati.
- [ ] La voce di menu Shop → Customers appare nella sidebar per chi ha il permesso.
