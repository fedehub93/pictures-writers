# 01: Foundation: schema, migration e permessi

**What to build:** aggiungere al database i modelli `Customer`, `Order`, `OrderItem`, `Payment`, gli enum di stato/sorgente/metodo, e i permission keys necessari per l’area ordini.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Schema Prisma aggiornato con i modelli `Customer`, `Order`, `OrderItem`, `Payment` e gli enum `OrderStatus`, `OrderSource`, `PaymentMethod`, `PaymentStatus`.
- [ ] Migration creata e applicabile con `npx prisma migrate dev`.
- [ ] Permission keys `customers.read`, `customers.create`, `customers.update`, `customers.delete`, `orders.read`, `orders.create`, `orders.update`, `orders.delete`, `orders.manage` registrati nel sistema permessi e assegnabili ai ruoli.
- [ ] `npm run lint` e `npx tsc --noEmit` passano senza errori nuovi.
- [ ] (TDD) Test di integrazione che verificano che i nuovi permission keys siano riconosciuti dal sistema autorizzativo e che le tabelle vengano create correttamente sul database di test.
