# 05: GA4 purchase event

**What to build:** spingere l’evento `purchase` a Google Tag Manager quando un admin completa manualmente un ordine.

**Blocked by:** 03 — Order admin end-to-end.

**Status:** reversed — see comment below.

## Acceptance criteria

- [x] (TDD) Test unitario per la funzione che costruisce il payload GA4 `purchase` a partire da un `Order` e i suoi `OrderItem`: verifica `transaction_id`, `value`, `currency`, `items`.
- [x] Completando un ordine dall’interfaccia admin, il client chiama `sendGTMEvent('purchase', { ecommerce: { ... } })`.
- [x] Il payload include `transaction_id` (orderNumber), `value`, `currency` e `items` con i dati degli `OrderItem`.
- [x] Il payload segue lo schema GA4 ecommerce (`item_id`, `item_name`, `price`, `quantity`).
- [x] L’evento non viene spinto due volte se l’ordine era già in stato `COMPLETED`.

## Comments

Delivered:

- `src/modules/orders/lib/ga4-purchase.ts` espone `buildGa4PurchaseEvent(order)`, una funzione pura che proietta un ordine completato nel payload GA4 `purchase` (`transaction_id`, `value`, `currency`, `items` con `item_id`/`item_name`/`price`/`quantity`). Ritorna `null` per gli stati non `COMPLETED`, così il builder non può produrre un evento per un ordine non completato.
- `useOrderActions` (`src/modules/orders/hooks/use-order-actions.ts`) riceve l’ordine completato dal mutation `orders.complete` e chiama `sendGTMEvent(buildGa4PurchaseEvent(order))` nella `onSuccess`. La deduplica non sta nel builder: `orders.complete` accetta solo la transizione `PENDING -> COMPLETED`, quindi un ordine già `COMPLETED` fallisce prima della `onSuccess` e l’evento scatta esattamente una volta.
- `GoogleTagManager` aggiunto al layout admin (production-gated, come nel layout pubblico) così il dataLayer del backoffice è effettivamente collegato al container GTM.
- Coverage: `src/modules/orders/__tests__/ga4-purchase.test.ts` (4 test: payload completo, mapping multi-riga, fallback `item_id` al `OrderItem.id` quando il `productId` è null, `null` per stati non `COMPLETED`).
- Verified: `npx tsc --noEmit`, eslint sui file toccati e `npx vitest run` (83 file, 633 test verdi).

Reversed (2026-10-05):

Il purchase client-side è stato rimosso: l'evento partiva dal browser dell'admin, quindi GA4 attribuiva la conversione alla sessione admin invece che a quella del cliente. Sono stati rimossi `sendGTMEvent` da `useOrderActions`, `src/modules/orders/lib/ga4-purchase.ts`, i suoi test e il `GoogleTagManager` dal layout admin (introdotto solo per questo scopo). L'Order in admin resta il marker "pagato". L'attribuzione server-side (GA4 Measurement Protocol) è stata specificata ma **parcheggiata** per volume insufficiente: vedi `.scratch/offline-purchase-attribution/spec.md`.
