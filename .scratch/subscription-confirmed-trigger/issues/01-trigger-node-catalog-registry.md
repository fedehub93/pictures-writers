# 01: Nodo trigger `subscription.confirmed` (costanti, catalogo, registry)

**What to build:** Il modulo `mails` registra il nuovo trigger event interno `subscription.confirmed` come nodo (`SUBSCRIPTION_CONFIRMED_TRIGGER`), senza configurazione, e lo collega a palette editor e runtime. Nessuna emissione in questo ticket.

**Blocked by:** —

**Status:** resolved

- [x] `src/modules/mails/automations/constants.ts` espone `SUBSCRIPTION_CONFIRMED_NODE_TYPE = "SUBSCRIPTION_CONFIRMED_TRIGGER"` e `SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE = "subscription.confirmed"`.
- [x] `src/modules/mails/automations/types.ts` espone `SubscriptionConfirmedPayload = { email: string; contactId: string; confirmedAt: string }`.
- [x] `src/modules/mails/automations/catalog.ts` contribuisce una entry `{ type, label: "New subscription", description, category: "trigger", defaultData }`; `defaultData` rispecchia il payload (stringhe vuote).
- [x] `src/modules/mails/automations/node.ts` espone `subscriptionConfirmedNodeRegistry` con `subscription_confirmed: passthroughHandler`, e `index.ts` riesporta costanti/tipi/registry/catalogo.
- [x] Editor: la entry è in `editor/config/node-catalog.ts` (`editorNodeCatalog`) e `SUBSCRIPTION_CONFIRMED_TRIGGER` mappa su `TriggerNode` in `editor/config/node-components.ts`.
- [x] Runtime: `subscriptionConfirmedNodeRegistry` è unito in `moduleNodeRegistry` (`server/automation-runtime.ts`).
- [x] `SUBSCRIPTION_CONFIRMED_TRIGGER` non ha config panel né validator (nessuna configurazione richiesta).
- [x] Test: una Automation pubblicata col nodo trigger riceve un Run quando `enqueueEventRuns({ triggerType: "subscription.confirmed", ... })` viene chiamato; il passthrough propaga il payload ai successori.
- [x] `npx tsc --noEmit`, `npx vitest run`, `npx eslint` puliti sui path toccati.

## Comments

Delivered:

- **Modulo `mails`.** `constants.ts` aggiunge `SUBSCRIPTION_CONFIRMED_NODE_TYPE` (`SUBSCRIPTION_CONFIRMED_TRIGGER`) e `SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE` (`subscription.confirmed`); nuovo `types.ts` con `SubscriptionConfirmedPayload`; `catalog.ts` contribuisce la entry `New subscription` (categoria `trigger`, `defaultData` a stringhe vuote) sotto lo stesso pattern di `forms/automations`; `node.ts` aggiunge `subscriptionConfirmedNodeRegistry = { subscription_confirmed: passthroughHandler }`; `index.ts` riesporta costanti/tipi/registry/catalogo.
- **Editor.** `editorNodeCatalog` include `subscriptionConfirmedTriggerCatalogEntry`; `nodeComponents` mappa `SUBSCRIPTION_CONFIRMED_TRIGGER: TriggerNode` (nessun config panel: `getNodeConfigPanel` torna `undefined`, l'host rende `null`). In `node-icons.ts` il nodo usa `UserCheckIcon`, così la palette non cade sul fallback.
- **Runtime.** `moduleNodeRegistry` in `server/automation-runtime.ts` unisce anche `subscriptionConfirmedNodeRegistry`.
- **Test.** `subscription-confirmed-trigger.test.ts` (Vitest su DB di test, `cleanupAutomationTables`) copre: forma della entry di palette, chiave `subscription_confirmed` nel registry, un Run creato da `enqueueEventRuns({ triggerType: "subscription.confirmed" })` con payload e `idempotencyKey` conservati, la propagazione del payload ai successori (il Send Email legge `{{ input.email }}`/`{{ input.confirmedAt }}`, quindi il test fallirebbe se il passthrough non inoltrasse l'output), e l'assenza di Run per un trigger diverso (`form.submitted`).
- Verified: `npx tsc --noEmit` clean; `npx vitest run` 527/527 (69 file); `npx eslint` clean sui path toccati.

Non-blocking follow-up (ticket 02):

- `SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE` non ha ancora un consumer di produzione: l'emissione da `newSubscription` arriva nel ticket 02.
