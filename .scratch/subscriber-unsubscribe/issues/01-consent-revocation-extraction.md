# 01: Revoca del consenso dietro un'unica funzione

**What to build:** Una funzione server unica che revoca il consenso di un Contact (`isSubscriber = false`), **mantiene la riga Contact** (il consenso si revoca, non si cancella), e sincronizza il provider in best-effort (errori loggati, mai propagati). Ritorna `false` se il Contact non esiste ed è idempotente. La server action pubblica di disiscrizione (`/rimuovi-sottoscrizione`) diventa un thin wrapper su questa funzione, con lo stesso contratto di ritorno (`{ error }` / `{ success }`). È il prefactor che prepara i ticket successivi.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Esiste una funzione server unica di revoca che imposta `isSubscriber = false` senza cancellare la riga Contact.
- [x] Gli errori di sincronizzazione col provider non sono propagati: la revoca riesce comunque.
- [x] Una seconda chiamata per lo stesso id è idempotente (nessun errore).
- [x] Id inesistente → ritorna `false`.
- [x] La pagina pubblica `/rimuovi-sottoscrizione` continua a comportarsi identicamente (il Contact resta, il consenso è revocato).
- [x] Test al seam della funzione (DB di test + adapter provider mockato): revoca, tolleranza agli errori del provider, idempotenza, id inesistente.

## Comments

Delivered:

- `src/modules/mails/lib/core/contacts/unsubscribe.ts` espone `unsubscribeContactById(id, adapter?)`: imposta `isSubscriber = false` senza cancellare la riga, tenta `deleteContactOnProvider` in best-effort (errori loggati con `console.error`, mai propagati), è idempotente e ritorna `false` per id inesistente. Riesportata da `src/modules/mails/lib/core/index.ts`.
- `src/actions/remove-subscription.ts` è ora un thin wrapper che delega a `unsubscribeContactById`, mantenendo il contratto `{ error }` / `{ success }`.
- Coverage: `src/modules/mails/lib/core/contacts/__tests__/unsubscribe.test.ts` (revoca mantenendo la riga, errori provider come lista e come throw, idempotenza, id inesistente → `false`).
- Verified: suite completa verde, `npx tsc --noEmit` e eslint puliti.
