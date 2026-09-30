# 02: Id del Contact nel payload `form.submitted`

**What to build:** Il payload del Run di `form.submitted` espone `contactId` quando l'emitter lo conosce (come già fa `subscription.confirmed`), e il `defaultData` del catalogo del trigger lo include per l'autocomplete delle espressioni. Questo abilita il footer Handlebars di disiscrizione (`.../rimuovi-sottoscrizione/?id={{payload.contactId}}`) nelle sequenze scatenate da form.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Il Run di `form.submitted` porta `contactId` valorizzato quando l'emitter lo riceve.
- [ ] Il campo è opzionale: un emit senza `contactId` non produce un payload rotto.
- [ ] Il catalogo del trigger pubblicizza `contactId`, così l'autocomplete lo suggerisce.
- [ ] Test al seam dell'emit (DB di test): presenza del campo quando fornito, assenza quando non fornito.
