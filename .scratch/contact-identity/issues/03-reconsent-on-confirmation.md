# 03: La conferma ripristina il consenso

**What to build:** Chi si è cancellato e si iscrive di nuovo non deve restare soppresso per sempre. La conferma via link riporta `isSubscriber` a `true`, e `subscription.confirmed` parte sulla transizione non-iscritto → iscritto invece che solo alla prima verifica dell'indirizzo. È un cambio di politica sul consenso (ADR-0035), non un bug fix, ed è indipendente dal lavoro sull'identità: può precedere o seguire.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] `new-subscription` scrive `isSubscriber: true` insieme a `emailVerified` e alla forma canonica dell'indirizzo
- [x] Il gate del trigger non è più `emailVerified == null` ma la transizione di consenso: emette `subscription.confirmed` quando il contatto passa da non-iscritto a iscritto (prima verifica **o** riattivazione)
- [x] Un contatto già iscritto che riconferma non riemette il trigger
- [x] Un contatto cancellato che non riconferma resta invariato e non riceve nulla
- [x] La creazione/upsert del contatto sul provider dopo la conferma continua a funzionare anche quando il contatto era stato eliminato lato provider alla cancellazione
- [x] Test: cancellato → conferma → `isSubscriber` true e trigger emesso; iscritto → riconferma → nessun trigger; cancellato → nessuna conferma → invariato
- [x] ADR-0007 risulta annotato come parzialmente superato (fatto in `docs/adr/0007-*.md`)

## Comments

Delivered:

- `src/actions/new-subscription.ts`: confirmation writes `isSubscriber: true`, `emailVerified` and the canonical address together; the trigger gate is the transition into "subscribed and verified", so first confirmation and reactivation emit while an already-subscribed contact's re-confirmation stays silent. `confirmedAt` is shared by the stored value and the emitted payload, and the provider sync still runs after the update (recreating a contact the provider deleted on unsubscribe).
- `docs/adr/0007-separate-consent-from-verification.md`: marked partially superseded by ADR-0035, with the stale "first confirmation only" consequence rewritten.
- `docs/adr/0035-reconfirmation-restores-consent.md`: spells out the compound gate (unverified capture vs. cancelled contact) and corrects the provider-recreation note.
- `src/modules/mails/automations/emit.ts`: emitter contract now describes the consent transition instead of "first time".
- Tests: cancelled → confirm restores `isSubscriber` and emits, notifies and syncs the provider; already-subscribed → re-confirm emits nothing and stays subscribed; cancelled with an expired link stays untouched with no Run; `createContactOnProvider` replaces a stale externalId after the provider-side deletion. Full suite: 194 files / 1612 tests green.
