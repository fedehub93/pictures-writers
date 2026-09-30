# 03: Guardia di consenso come policy di consegna (dominio contatti)

**What to build:** Le email di sequenza non devono partire verso un Contact che ha revocato il consenso. La guardia **non** entra nel nodo Send Email né in `sendAutomationEmail`: è una *policy di consegna* del dominio contatti che decora l'effetto `mail` nell'unico punto di composizione (`createAutomationRuntimeEffects`, `automation-runtime.ts:41`). La policy legge dalla request dell'effetto il destinatario già interpolato, risolve l'`EmailContact` per email; se esiste e `isSubscriber = false` ritorna un esito saltato **senza chiamare l'effetto interno** (nessuna email, nessun log, Step non marcato come fallito). Negli altri casi passa la request all'effetto interno inalterata. Nodo e primitivo di invio restano ignari dei Contact (ADR-0008).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Esiste una policy di consegna (dominio contatti) che decora l'effetto mail; è composta in `createAutomationRuntimeEffects` e riceve l'effetto interno come parametro (iniettabile nei test).
- [x] Destinatario che risolve a un `EmailContact` con `isSubscriber = false` → effetto interno non chiamato, output `{ sent: false, skipped: true }`, nessuna riga `EmailSendLog`.
- [x] Destinatario che risolve a un `EmailContact` con consenso presente → effetto interno chiamato, invio normale.
- [x] Destinatario che non è un Contact (o non è un'email) → effetto interno chiamato, invio normale.
- [x] Il nodo Send Email e `sendAutomationEmail` non cambiano: nessun campo `purpose`, nessun lookup di Contact nel primitivo. `GenericEmail`/`SendEmailConfig` restano non toccati.
- [x] Test al seam della policy (effetto interno iniettato + DB di test): salto per consenso revocato (nessuna chiamata all'effetto interno), invio per consenso presente, invio per destinatario non-Contact.

## Comments

Delivered:

- `src/modules/mails/automations/lib/sequence-delivery-policy.ts` espone `createSequenceDeliveryPolicy(inner: AutomationEffect)`: legge il destinatario già interpolato dalla request, risolve l'`EmailContact` per email e, con `isSubscriber = false`, ritorna `{ sent: false, skipped: true }` senza mai invocare `inner` (nessuna email, nessun log, Step non fallito). Negli altri casi delega la request inalterata.
- Composta in `createAutomationRuntimeEffects` (`src/modules/automations/server/automation-runtime.ts`): `mail: createSequenceDeliveryPolicy(createAutomationMailEffect())`. Nodo Send Email e `sendAutomationEmail` restano domain-agnostic (ADR-0008).
- Coverage: `src/modules/mails/automations/lib/__tests__/sequence-delivery-policy.test.ts` (salto per consenso revocato senza chiamare l'effetto interno; invio per consenso presente; invio per destinatario non-Contact o privo di destinatario; passthrough immutato).
- Verified: suite completa verde, `npx tsc --noEmit` e eslint puliti.
