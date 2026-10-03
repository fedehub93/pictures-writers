# 06: Order actual date (`orderDate`)

**What to build:** aggiungere all’`Order` un campo `orderDate` che registra la data effettiva della vendita, distinta dai timestamp di audit. L’admin la imposta quando crea un ordine (default a oggi); per gli ordini storici importati la data resta quella reale e non quella di inserimento. Il numero ordine usa l’anno di `orderDate`.

**Blocked by:** 03 — Order admin end-to-end.

**Status:** resolved

## Acceptance criteria

- [x] (TDD) Test di integrazione: creando un ordine con `orderDate` esplicita il campo viene persistito; senza `orderDate` il default è “adesso”.
- [x] (TDD) Test di integrazione: `orderDate` viene restituita da `getOne` e `getMany`.
- [x] (TDD) Test: il segmento anno di `orderNumber` deriva da `orderDate`, quindi un ordine datato in un anno passato riceve `PW-<quell’anno>-NNNNNN`.
- [x] Migration applicabile con `npx prisma migrate dev`; gli ordini già esistenti ottengono la loro data di creazione come `orderDate`.
- [x] Il form di creazione ordine admin espone un date picker per `orderDate`, con default a oggi.
- [x] Lista e dettaglio ordine mostrano `orderDate`.
- [x] `npm run lint` e `npx tsc --noEmit` passano senza errori nuovi.

## Comments

Delivered:

- `Order.orderDate DateTime @default(now())` in `prisma/schema.prisma`, con migration `20261003095339_add_order_date` che aggiunge la colonna e fa backfill `UPDATE "Order" SET "orderDate" = "createdAt"` per gli ordini esistenti.
- `createOrderRecord` (`src/modules/orders/server/order-service.ts`) accetta `orderDate`, usa `input.orderDate ?? new Date()` e ne deriva l’anno di `orderNumber` (`getFullYear`), così un ordine storico riceve `PW-<anno storico>-NNNNNN`.
- `orderInsertSchema` espone `orderDate: z.date().optional()`; il router `orders.create` lo inoltra al service.
- Form admin: campo `GenericCalendar` (`onlyFutureDates={false}`) con default `new Date()`, per accettare anche date passate.
- Lista: nuova colonna “Order date” (`columns.tsx`); dettaglio: riga “Order date” (`order-id-view.tsx`).
- Test TDD aggiunti in `orders-router.test.ts`: persistenza `orderDate` esplicita, default “adesso”, `orderDate` in `getMany`/`getOne`, anno di `orderNumber` derivato da `orderDate`.
- Verified: `npx vitest run` (82 file, 629 test verdi), `npx tsc --noEmit` pulito, eslint pulito sui file toccati.
