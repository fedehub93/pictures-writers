# 04: Automation nodes and trigger

**What to build:** aggiungere all’automation engine i nodi azione `CREATE_CUSTOMER` e `CREATE_ORDER`, e il trigger event interno `order.completed` emesso al completamento di un ordine.

**Blocked by:** 03 — Order admin end-to-end.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] (TDD) Test di integrazione per i nodi `CREATE_CUSTOMER` e `CREATE_ORDER`: verificano che i nodi creino i record corretti partendo da un input di automation.
- [ ] (TDD) Test di integrazione per il trigger `order.completed`: verificano che completando un ordine venga emesso l’evento e che un’automation sottoscritta parta.
- [ ] Nodo `CREATE_CUSTOMER` visibile nella palette automations e funzionante.
- [ ] Nodo `CREATE_ORDER` visibile nella palette automations e funzionante.
- [ ] Un flusso `FORM_SUBMITTED → CREATE_CUSTOMER → CREATE_ORDER` crea correttamente customer e ordine a partire dai dati del form.
- [ ] Quando un ordine passa a `COMPLETED`, viene emesso il trigger event interno `order.completed`.
- [ ] È possibile creare un’automation attivata dal trigger `order.completed`.

