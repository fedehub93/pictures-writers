# 02: Emit dalla conferma + `emailVerified`/interaction/notifica coerenti

**What to build:** `newSubscription` emette `subscription.confirmed` alla prima conferma; `emailVerified` non è più impostato alla creazione; `user_subscribed` e la notifica admin si spostano dalla richiesta alla conferma. Il trigger `form.submitted` su `subscribe` resta invariato.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `src/data/email-contact.ts`: `createContactByEmail` non imposta più `emailVerified` alla creazione (per tutti i flussi) e `interactionType` diventa opzionale (nessuna interaction se assente).
- [ ] `src/modules/mails/automations/emit.ts` (nuovo, `server-only`): `emitSubscriptionConfirmed({ email, contactId, confirmedAt })` chiama `enqueueEventRuns({ triggerType: SUBSCRIPTION_CONFIRMED_TRIGGER_TYPE, payload, idempotencyKey: contactId ?? email })`, senza `matchesNode`. Riesportato da `index.ts`.
- [ ] `src/actions/new-subscription.ts`: calcola `wasVerified = existingUser.emailVerified != null` prima dell'update; imposta `emailVerified`; se `!wasVerified` aggiunge l'interaction `user_subscribed`, chiama `handleUserSubscribed()` ed emette `emitSubscriptionConfirmed(...)`. Emit in `try/catch` con log, **mai** bloccante. Delete token e sync provider invariati.
- [ ] `src/actions/subscribe.ts`: `createContactByEmail(email)` senza interaction; **rimuove** `handleUserSubscribed()`. Invariati: emit `form.submitted` (`built-in-form-newsletter`), `generateSubscriptionToken`, `sendSubscriptionEmail`.
- [ ] Nessun doppio emit: la riconferma di un contatto già verificato non emette e non notifica.
- [ ] Un errore nell'emit non impedisce la conferma (l'action ritorna comunque `{ success: "Email verified!" }`).

## Comments

Note di contesto:

- La form ombra `BUILT_IN_NEWSLETTER_FORM_ID` resta: serve all'emit `form.submitted` di `subscribe`, che non viene toccato.
- La policy `isSubscriber` è fuori scope (ticket separato): qui non si cambia il default `true` dello schema né la logica di `remove-subscription.ts`.
- Gate "prima conferma": `emailVerified` è l'unico marker affidabile perché, da questo ticket, viene valorizzato solo qui. Il caso "ex-iscritto che torna" non emette (win-back = follow-up).
