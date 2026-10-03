# 02: Customer admin end-to-end

**What to build:** implementare la gestione clienti lato admin con tRPC router CRUD, pagina lista e pagina dettaglio.

**Blocked by:** 01 — Foundation: schema, migration e permessi.

**Status:** resolved

## Acceptance criteria

- [x] (TDD) Test di integrazione per il router customers: creazione, lettura, aggiornamento, eliminazione, unicità email, gestione customer senza ordini.
- [x] Admin con `customers.read` vede la lista paginata dei customer.
- [x] Admin con `customers.create` crea un customer.
- [x] Admin con `customers.update` modifica un customer esistente.
- [x] Admin con `customers.delete` elimina un customer che non ha ordini associati.
- [x] La pagina dettaglio di un customer mostra gli ordini a lui associati.
- [x] La voce di menu Shop → Customers appare nella sidebar per chi ha il permesso.

## Comments

Delivered:

- `src/modules/customers/server/procedures.ts` espone il router tRPC `customers` (`create`, `update`, `remove`, `getOne`, `getMany`) con email normalizzata e unicità garantita dal vincolo Prisma (`P2002` → `CONFLICT`), `getMany` paginato con ricerca su email/nome, `getOne` con gli ordini associati e `remove` che rifiuta i customer con ordini. Registrato in `src/trpc/routers/_app.ts`.
- UI admin sotto `src/app/(admin)/admin/(routes)/shop/customers/` (lista + dettaglio) con modulo `src/modules/customers/`: dialog create/edit permesso-gated, azioni di riga, ricerca server-side, paginazione e tabella ordini nel dettaglio.
- Voce di menu Shop → Customers in `src/app/(admin)/_components/sidebar/app-sidebar.tsx` dietro `customers.read`.
- Coverage: `src/modules/customers/__tests__/customers-router.test.ts` (11 test: create, normalizzazione/duplicato email, getOne con ordini e NOT_FOUND, getMany/search, update + conflitto email, remove con e senza ordini).
- Verified: `npx vitest run` sui test intaccati (17 verdi), `npx tsc --noEmit` ed eslint puliti.
