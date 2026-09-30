# 02: Id del Contact nel payload `form.submitted`

**What to build:** Il payload del Run di `form.submitted` espone `contactId` quando l'emitter lo conosce (come già fa `subscription.confirmed`), e il `defaultData` del catalogo del trigger lo include per l'autocomplete delle espressioni. Questo abilita il footer Handlebars di disiscrizione (`.../rimuovi-sottoscrizione/?id={{payload.contactId}}`) nelle sequenze scatenate da form.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Il Run di `form.submitted` porta `contactId` valorizzato quando l'emitter lo riceve.
- [x] Il campo è opzionale: un emit senza `contactId` non produce un payload rotto.
- [x] Il catalogo del trigger pubblicizza `contactId`, così l'autocomplete lo suggerisce.
- [x] Test al seam dell'emit (DB di test): presenza del campo quando fornito, assenza quando non fornito.

## Comments

Delivered:

- `FormSubmittedPayload` (`src/modules/forms/automations/types.ts`) acquisisce `contactId?: string` (opzionale: l'evento form non presuppone un Contact).
- `emitFormSubmitted` (`src/modules/forms/automations/emit.ts`) include `contactId` solo quando fornito, così un emit senza Contact omette la chiave invece di portare un `null` permanente nel payload.
- `formSubmittedTriggerDefaultData` (`src/modules/forms/automations/catalog.ts`) include `contactId`, così l'autocomplete suggerisce `{{ payload.contactId }}`.
- Coverage: `src/modules/forms/automations/__tests__/form-submitted-trigger.test.ts` (payload con `contactId` fornito; assenza della chiave quando non fornito; `defaultData` che pubblicizza il campo).
- Verified: suite completa verde, `npx tsc --noEmit` e eslint puliti.
