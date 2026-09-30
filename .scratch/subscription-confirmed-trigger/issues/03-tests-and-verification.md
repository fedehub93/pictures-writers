# 03: Test e verifica end-to-end

**What to build:** Copertura della nuova emissione e aggiornamento dei test esistenti sulla newsletter, più le verifiche di repo.

**Blocked by:** 02

**Status:** resolved

- [x] Nuova suite `src/modules/mails/automations/__tests__/subscription-confirmed-trigger.test.ts`:
  - [x] prima conferma → un Run con `triggerType === "subscription.confirmed"`, payload `{ email, contactId, confirmedAt }`, `idempotencyKey === contactId`;
  - [x] la stessa Automation con Send Email esegue end-to-end (due `runDueAutomations` → un `mailCall`);
  - [x] riconferma di un contatto già verificato → nessun nuovo Run;
  - [x] `subscription.confirmed` non attiva un'Automation con trigger `form.submitted`;
  - [x] un fallimento dell'emit non blocca la conferma (action ritorna `success`).
- [x] Aggiornamento `src/modules/forms/automations/__tests__/newsletter-emit.test.ts`: alla richiesta nessun `emailVerified`, nessuna interaction `user_subscribed`, nessuna notifica; restano l'emit `form.submitted`, il token e l'invio della mail di conferma.
- [x] `npx tsc --noEmit` pulito.
- [x] `npx vitest run` verde.
- [x] `npx eslint` pulito sui path toccati.

## Comments

Delivered insieme al ticket 02 (la suite `subscription-confirmed-trigger.test.ts` del ticket 01 è stata estesa con il `describe("newSubscription confirmation semantics")`; `newsletter-emit.test.ts` aggiornato al nuovo significato della richiesta). Dettagli e comandi di verifica nei commenti del ticket 02.

Note di contesto:

- Convenzione di test repo: Vitest su `DATABASE_URL` di `.env.test`; la suite pulisce le tabelle che usa (`cleanupAutomationTables`).
- `subscribe` ha un mock di `@/modules/mails/lib/mail` (`sendSubscriptionEmail`) e di `@/lib/event-handler`; il nuovo test segue lo stesso pattern per `handleUserSubscribed`.
