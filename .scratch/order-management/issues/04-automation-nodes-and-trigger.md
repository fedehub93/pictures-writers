# 04: Automation nodes and trigger

**What to build:** aggiungere all’automation engine i nodi azione `CREATE_CUSTOMER` e `CREATE_ORDER`, e il trigger event interno `order.completed` emesso al completamento di un ordine.

**Blocked by:** 03 — Order admin end-to-end.

**Status:** resolved

## Acceptance criteria

- [x] (TDD) Test di integrazione per i nodi `CREATE_CUSTOMER` e `CREATE_ORDER`: verificano che i nodi creino i record corretti partendo da un input di automation.
- [x] (TDD) Test di integrazione per il trigger `order.completed`: verificano che completando un ordine venga emesso l’evento e che un’automation sottoscritta parta.
- [x] Nodo `CREATE_CUSTOMER` visibile nella palette automations e funzionante.
- [x] Nodo `CREATE_ORDER` visibile nella palette automations e funzionante.
- [x] Un flusso `FORM_SUBMITTED → CREATE_CUSTOMER → CREATE_ORDER` crea correttamente customer e ordine a partire dai dati del form.
- [x] Quando un ordine passa a `COMPLETED`, viene emesso il trigger event interno `order.completed`.
- [x] È possibile creare un’automation attivata dal trigger `order.completed`.

## Comments

Delivered:

- **Nodo `CREATE_CUSTOMER`** in `src/modules/customers/automations/` (constants, catalog, `lib/create-customer-config`, `node`, `ui/create-customer-config-panel`). L’handler interpolava la config dal run context e delega a `createOrUpdateCustomerByEmail` (`src/modules/customers/server/create-customer.ts`): upsert per email che aggiorna solo i campi forniti. L’output espone `customerId` per il chaining.
- **Nodo `CREATE_ORDER`** in `src/modules/orders/automations/` (constants, catalog, `lib/create-order-config`, `node`, `ui/create-order-config-panel`). Delega a un nuovo `createOrderRecord` (`src/modules/orders/server/order-service.ts`) estratto dal router: un solo percorso condiviso per numerazione `PW-YYYY-NNNNNN`, snapshot prezzi, `OrderItem` e `Payment` offline `PENDING`. Gli ordini da automation nascono `PENDING` con `source = AUTOMATION`.
- **Trigger `order.completed`** (`ORDER_COMPLETED_TRIGGER`, canonico `order_completed`) con `emitOrderCompleted` (`src/modules/orders/automations/emit.ts`) chiamato dal router `orders.complete` al termine della transazione: emette `orderId` come idempotency key e un payload con order number, customer, totale, valuta, `completedAt` e righe. Un fallimento dell’emit non annulla il completamento.
- **Composizione runtime**: `automation-runtime.ts` fonde i registries customers/orders (`createCustomer`, `createOrder`, `order_completed`) oltre a quelli forms/mails già presenti.
- **Editor**: i tre nodi sono nel catalogo (`editorActionNodes`/`editorTriggerNodes`), in `node-components`, `node-icons` e `node-config-panels` (due panel shadcn).
- **Coverage**: `src/modules/customers/automations/__tests__/create-customer-node.test.ts` (5), `src/modules/orders/automations/__tests__/create-order-node.test.ts` (4), `src/modules/orders/automations/__tests__/form-to-order-flow.test.ts` (1, runtime composto), `src/modules/orders/automations/__tests__/order-completed-trigger.test.ts` (4), `src/modules/automations/editor/config/__tests__/node-catalog.test.ts` (2). Rifattorizzato `orders/server/procedures.ts` sul servizio condiviso: 22 test router + 6 foundation invariati.
- Verified: `npx vitest run` (81 file, 625 test; 1 fallimento transitorio su `publish-post.test.ts` per timeout transazione verso Neon, verde in isolamento), `npx tsc --noEmit` e `eslint` sui file toccati puliti.


