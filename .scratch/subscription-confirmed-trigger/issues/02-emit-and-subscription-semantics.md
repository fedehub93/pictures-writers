# 02: Emit dalla conferma + `emailVerified`/interaction/notifica coerenti

**What to build:** `newSubscription` emette `subscription.confirmed` alla prima conferma; `emailVerified` non è più impostato alla creazione; `user_subscribed` e la notifica admin si spostano dalla richiesta alla conferma. Il trigger `form.submitted` su `subscribe` resta invariato.

**Blocked by:** 01

**Status:** resolved

- [x] `src/data/email-contact.ts`: `createContactByEmail` non imposta più `emailVerified` alla creazione (per tutti i flussi) e `interactionType` diventa opzionale (nessuna interaction se assente).
- [x] `src/modules/mails/automations/emit.ts` (nuovo, `server-only`): `emitSubscriptionConfirmed({ email, contactId, confirmedAt })` chiama `enqueueEventRuns({ triggerType: SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE, payload, idempotencyKey: contactId ?? email })`, senza `matchesNode`. Riesportato da `index.ts`.
- [x] `src/actions/new-subscription.ts`: calcola `wasVerified = existingUser.emailVerified != null` prima dell'update; imposta `emailVerified`; se `!wasVerified` aggiunge l'interaction `user_subscribed`, chiama `handleUserSubscribed()` ed emette `emitSubscriptionConfirmed(...)`. Emit in `try/catch` con log, **mai** bloccante. Delete token e sync provider invariati.
- [x] `src/actions/subscribe.ts`: `createContactByEmail(email)` senza interaction; **rimuove** `handleUserSubscribed()`. Invariati: emit `form.submitted` (`built-in-form-newsletter`), `generateSubscriptionToken`, `sendSubscriptionEmail`.
- [x] Nessun doppio emit: la riconferma di un contatto già verificato non emette e non notifica.
- [x] Un errore nell'emit non impedisce la conferma (l'action ritorna comunque `{ success: "Email verified!" }`).

## Comments

Delivered:

- **`email-contact.ts`.** `createContactByEmail` non imposta più `emailVerified` (per nessun flusso: newsletter, ebook, contatti, prodotto, webinar) e `interactionType` è opzionale: nessuna interaction quando assente. Il ramo "contatto esistente vs nuovo" è unificato (lookup, eventuale create, poi interaction unica).
- **`mails/automations/emit.ts`.** Nuova `emitSubscriptionConfirmed({ email, contactId, confirmedAt: Date })`, `server-only`, che costruisce `SubscriptionConfirmedPayload` (`confirmedAt` ISO) e chiama `enqueueEventRuns` con `idempotencyKey: contactId ?? email`, senza `matchesNode`. `index.ts` riesporta la funzione e il tipo d'ingresso.
- **`new-subscription.ts`.** Calcola `wasVerified` prima dell'update, valorizza `emailVerified`, e solo se `!wasVerified` upserta l'interaction `user_subscribed`, chiama `handleUserSubscribed()` ed emette `subscription.confirmed` in `try/catch` non bloccante. Delete token e `createContactOnProvider` invariati.
- **`subscribe.ts`.** `createContactByEmail(email)` senza interaction; rimossa `handleUserSubscribed()`. Restano l'emit `form.submitted` sulla form ombra, `generateSubscriptionToken` e `sendSubscriptionEmail`.

Test:

- `subscription-confirmed-trigger.test.ts`: aggiunto `describe("newSubscription confirmation semantics")` — prima conferma (payload + `idempotencyKey === contactId`, `emailVerified`, interaction, notifica), end-to-end con Send Email (1 `mailCall`, Run `COMPLETED`), riconferma di contatto già verificato (nessun Run, nessuna notifica, nessuna interaction), `subscription.confirmed` non attiva un'Automation `form.submitted`, e fallimento emit non bloccante (`success` + `emailVerified` valorizzato).
- `newsletter-emit.test.ts`: alla richiesta non ci sono più `emailVerified`, interaction `user_subscribed` né notifica; nuovo test che conferma token + `sendSubscriptionEmail`.
- Verifica: `npx tsc --noEmit` clean; `npx vitest run` 533/533 (69 file); `npx eslint` senza errori sui path toccati (restano warning preesistenti in `email-contact.ts`).

Nota: il lavoro di test/verifica del ticket 03 è stato completato qui per mantenere la suite verde.

Note di contesto:

- La form ombra `BUILT_IN_NEWSLETTER_FORM_ID` resta: serve all'emit `form.submitted` di `subscribe`, che non viene toccato.
- La policy `isSubscriber` è fuori scope (ticket separato): qui non si cambia il default `true` dello schema né la logica di `remove-subscription.ts`.
- Gate "prima conferma": `emailVerified` è l'unico marker affidabile perché, da questo ticket, viene valorizzato solo qui. Il caso "ex-iscritto che torna" non emette (win-back = follow-up).
