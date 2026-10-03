# 05: GA4 purchase event

**What to build:** spingere l’evento `purchase` a Google Tag Manager quando un admin completa manualmente un ordine.

**Blocked by:** 03 — Order admin end-to-end.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] (TDD) Test unitario per la funzione che costruisce il payload GA4 `purchase` a partire da un `Order` e i suoi `OrderItem`: verifica `transaction_id`, `value`, `currency`, `items`.
- [ ] Completando un ordine dall’interfaccia admin, il client chiama `sendGTMEvent('purchase', { ecommerce: { ... } })`.
- [ ] Il payload include `transaction_id` (orderNumber), `value`, `currency` e `items` con i dati degli `OrderItem`.
- [ ] Il payload segue lo schema GA4 ecommerce (`item_id`, `item_name`, `price`, `quantity`).
- [ ] L’evento non viene spinto due volte se l’ordine era già in stato `COMPLETED`.
