# Trigger `subscription.confirmed` — spec

Status: ready-for-agent

## Problem Statement

Il nurturing newsletter oggi parte dal trigger `form.submitted` scopato alla form ombra `built-in-form-newsletter`, emesso da `src/actions/subscribe.ts` **al momento della richiesta** — prima che l'utente clicchi il link di conferma. Conseguenze:

- Un'automation di nurture può partire verso un indirizzo **non confermato** (rischio deliverability/spam).
- `emailVerified` non è un segnale affidabile: `createContactByEmail` lo valorizza alla creazione, per **tutti** i flussi (contatti, ebook, prodotto, newsletter), quindi non prova che l'indirizzo sia stato confermato.
- Non esiste un trigger che scatti quando la persona **diventa effettivamente iscritta** (click sul link in `src/app/(home)/(routes)/conferma-sottoscrizione/_components/new-subscription-form.tsx` → `src/actions/new-subscription.ts`).

Serve un trigger dedicato "New subscription" che parta alla conferma, senza toccare il trigger `form.submitted` esistente (che resta utile come segnale di richiesta).

## Solution

Il modulo `mails` (proprietario di contatti e newsletter) registra un nuovo trigger event interno `subscription.confirmed`, emesso da `newSubscription` alla conferma. Il motore resta agnostico (ADR-0005): il modulo decide payload, chiave di idempotenza e semantica.

- **Nuovo nodo trigger** `SUBSCRIPTION_CONFIRMED_TRIGGER` (label "New subscription"), palette + registry + runtime, **senza configurazione** (non c'è nulla da scopare).
- **Emissione** da `newSubscription`, solo alla **prima** conferma del contatto, con payload `{ email, contactId, confirmedAt }` e idempotency key `contactId ?? email`, in `try/catch` non bloccante.
- **`emailVerified` allineato**: non più impostato da `createContactByEmail`; valorizzato solo alla conferma. Diventa il marker "ha già confermato in passato".
- **Interaction e notifica coerenti**: `user_subscribed` e `handleUserSubscribed()` passano dalla richiesta alla conferma.
- **`form.submitted` invariato** su `subscribe`: i due trigger restano distinti e indipendenti; l'ebook resta su `form.submitted`.
- **`isSubscriber` non toccato** in questo lavoro: la policy di consenso (asse separato dalla verifica) è un ticket a sé.

## User Stories

1. Come admin, voglio un trigger "New subscription" che parta quando l'utente conferma via email, così il nurture raggiunge solo indirizzi confermati.
2. Come admin, voglio continuare a usare `form.submitted` per reagire alla richiesta di iscrizione, così i due momenti restano separati.
3. Come admin, voglio che il trigger esponga `{{ payload.email }}` e `{{ payload.confirmedAt }}`, così posso parametrizzare le email.
4. Come admin, voglio che il trigger **non** riparta se un contatto già confermato riconferma, così non riavvio un flusso che ha già ricevuto.
5. Come sviluppatore, voglio che `emailVerified` significhi davvero "indirizzo verificato", così il dato è affidabile in admin e nelle query.
6. Come sviluppatore, voglio che `user_subscribed` e la notifica admin avvengano alla conferma, così "iscrizione" significa iscrizione confermata.
7. Come sviluppatore, voglio che l'emissione non blocchi mai la conferma, così un errore di automazione non rompe il flusso pubblico.

## Implementation Decisions

### Nuovo trigger (modulo `mails`)

- Costanti in `src/modules/mails/automations/constants.ts`:
  - `SUBSCRIPTION_CONFIRMED_NODE_TYPE = "SUBSCRIPTION_CONFIRMED_TRIGGER"` (canonicalizza a `subscription_confirmed`).
  - `SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE = "subscription.confirmed"` (valore persistito in `AutomationRun.triggerType`).
- Payload in `src/modules/mails/automations/types.ts`: `SubscriptionConfirmedPayload = { email: string; contactId: string; confirmedAt: string }`.
- Catalogo (`catalog.ts`): entry `{ type, label: "New subscription", category: "trigger", defaultData }`. `defaultData` rispecchia il payload (stringhe vuote) per l'assistenza alle espressioni; nessuna configurazione richiesta.
- Registry (`node.ts`): `subscription_confirmed: passthroughHandler`, analogo a `form_submitted`.
- Nessun config panel e nessun validator: il nodo non ha configurazione da validare a publish time.
- Wiring editor: aggiunta a `editorNodeCatalog` (`editor/config/node-catalog.ts`) e a `nodeComponents` (`editor/config/node-components.ts`, `SUBSCRIPTION_CONFIRMED_TRIGGER: TriggerNode`).
- Wiring runtime: `subscriptionConfirmedNodeRegistry` unito in `moduleNodeRegistry` (`server/automation-runtime.ts`).

### Emissione

- Nuova `emitSubscriptionConfirmed({ email, contactId, confirmedAt })` in `src/modules/mails/automations/emit.ts` (`server-only`): chiama `enqueueEventRuns({ triggerType: SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE, payload, idempotencyKey: contactId ?? email })`. Nessun `matchesNode` (nessuno scoping).
- Chiamata da `newSubscription` (`src/actions/new-subscription.ts`), in `try/catch` con log, **mai** bloccante.

### Prima conferma (gate)

- In `newSubscription`, calcolare `wasVerified = existingUser.emailVerified != null` **prima** dell'update.
- Emettere (e notificare) **solo se `!wasVerified`**: una riconferma di un contatto già verificato non riparte.
- L'`interaction` `user_subscribed` (upsert idempotente) e la notifica `handleUserSubscribed()` avvengono alla conferma, sotto lo stesso gate della notifica.
- Limite noto: i contatti **legacy** hanno `emailVerified` valorizzato alla creazione in vecchi dati; una loro riconferma non emette. Accettato.

### `emailVerified` e `user_subscribed` alla richiesta

- `createContactByEmail` (`src/data/email-contact.ts`): smette di impostare `emailVerified` alla creazione (per tutti i flussi); `interactionType` diventa opzionale (nessuna interaction quando assente).
- `subscribe.ts`: `createContactByEmail(email)` senza interaction; **rimuove** `handleUserSubscribed()` (spostata alla conferma). Restano invariati l'emit `form.submitted`, il token e `sendSubscriptionEmail`.
- `newSubscription.ts`: su conferma valida imposta `emailVerified`, aggiunge l'interaction `user_subscribed`, chiama `handleUserSubscribed()` e `emitSubscriptionConfirmed` (solo prima conferma), prosegue con delete del token e sync provider.

## Testing Decisions

- Nuova suite `src/modules/mails/automations/__tests__/subscription-confirmed-trigger.test.ts` (Vitest, test DB): prima conferma → un Run con `triggerType = "subscription.confirmed"`, payload `{ email, contactId, confirmedAt }` e `idempotencyKey === contactId`; la stessa Automation con Send Email esegue end-to-end; riconferma di un contatto già verificato → nessun nuovo Run; una `subscription.confirmed` non attiva una Automation con `form.submitted`.
- Aggiornare `src/modules/forms/automations/__tests__/newsletter-emit.test.ts`: alla richiesta non ci sono più `emailVerified`, interaction `user_subscribed` né notifica; restano l'emit `form.submitted`, il token e l'invio della mail di conferma. L'emit `form.submitted` continua a partire.
- Test che un fallimento di `emitSubscriptionConfirmed` non blocchi la conferma.
- Verifica: `npx tsc --noEmit`, `npx vitest run`, `npx eslint` sui path toccati.

## Out of Scope

- **Policy di consenso** (`isSubscriber`): oggi `@default(true)` e mai toccato alla creazione; la matrice GDPR (quali flussi rendono "subscriber") è un ticket a sé. La colonna `emailVerified` in admin resta, ma diventa significativa.
- Win-back per ex-iscritti che ri-confermano (transizione `isSubscriber false → true`): non coperto da `subscription.confirmed`.
- Nuovi trigger per le altre lead-capture (`contact.created`, `ebook.downloaded`): l'ebook resta su `form.submitted`.
- Rimozione della form ombra `built-in-form-newsletter` o dell'emit `form.submitted` da `subscribe`: restano.
- Provider/bounce handling, migrazione dei dati storici.

## Further Notes

- ADR: `docs/adr/0007-separate-consent-from-verification.md`.
- Glossario in `CONTEXT.md` (Contact, Subscriber, Verified address, Confirmation).
- Riferimenti: `.scratch/hardcoded-forms-in-automations/spec.md` (fuori scope già previsto), `.scratch/automations/issues/09-form-submitted-trigger.md`, `.agents/emails.md` §2/G4.
