# Mails Sync Fidelity

**Status:** `ready-for-agent`

## Problem Statement

Il modulo `mails` usa il DB locale come single source of truth e il provider esterno (Resend) come mirror sincronizzabile. Oggi la sincronizzazione è **unidirezionale e manuale**: l'utente deve premere "Sync" per pushare i dati verso il provider. Questo causa quattro problemi critici:

1. Dopo un sync batch, l'`externalId` dei contatti creati sul provider **non viene salvato** nel DB locale. La prossima sync non può distinguere contatti nuovi da esistenti, creando duplicati sul provider.
2. La sincronizzazione di un singolo contatto usa `createContact` (sempre create, mai upsert) perché il check `if (!externalId)` è stato commentato. Ogni sync manuale crea un duplicato.
3. Le operazioni CRUD su contatti e audience **non propagano le mutazioni** al provider. Un contatto creato, modificato o eliminato localmente rimane nello stato precedente sul provider fino al prossimo sync manuale — se l'utente se ne ricorda.
4. L'eliminazione di un contatto non ha alcun hook verso il provider: il contatto rimosso dal DB locale continua a ricevere broadcast.

Il risultato è un mirror che **diverge sistematicamente** dalla source of truth, con duplicati, contatti fantasma, e dati stale sul provider.

## Solution

Rendere la sincronizzazione **automatica e fedele**: ogni mutazione sul DB locale deve propagarsi al provider, e ogni operazione di sync batch deve persistere il mapping `localId → externalId` per mantenere la tracciabilità. L'adapter diventa un'interfaccia di upsert (non create) e le procedure tRPC diventano thin wrapper che chiamano funzioni core di orchestrazione, le quali si occupano sia del DB sia del provider.

## User Stories

1. As an admin user, I want contacts created in the CMS to be automatically pushed to the email provider, so that I don't have to manually sync after every creation.
2. As an admin user, I want contact updates (name, email, subscription status, audience membership) to be automatically reflected on the email provider, so that the provider mirror stays consistent with my local data.
3. As an admin user, I want contact deletions to remove the contact from the email provider, so that deleted contacts don't receive emails.
4. As an admin user, I want audience creation to automatically create the corresponding segment on the email provider, so that I can immediately assign contacts to it.
5. As an admin user, I want audience name changes to update the segment name on the email provider, so that the provider reflects my local naming.
6. As an admin user, I want audience deletion to remove the segment from the email provider, so that orphan segments don't accumulate.
7. As an admin user, I want a batch sync to persist the `externalId` of each successfully synced contact, so that subsequent syncs don't create duplicates.
8. As an admin user, I want a single-contact sync to use upsert semantics, so that re-syncing an existing contact updates it instead of creating a duplicate.
9. As an admin user, I want batch sync of an empty audience to succeed gracefully (zero contacts processed), so that I don't get spurious errors.
10. As an admin user, I want the `createContactOnProvider` function to include audience associations, so that newly created contacts belong to the correct segments on the provider.
11. As an admin user, I want the `sendBulk` tRPC mutation to delegate to the existing `sendSingleSend` function, so that multi-audience sends work correctly and idempotency keys are honored.
12. As a developer building a new provider adapter, I want the `EmailProviderAdapter` interface to express upsert semantics explicitly, so that I can implement create-or-update in a single method without ambiguity.
13. As a developer building a new provider adapter, I want `syncContactsBatch` to return a per-contact mapping of `localId → externalId`, so that I can persist the provider IDs after a batch operation.
14. As a developer, I want provider propagation errors on CRUD to be logged but not block the local operation, so that a temporary provider outage doesn't prevent me from managing contacts locally.

## Implementation Decisions

### 1. Estensione dell'interfaccia `EmailProviderAdapter`

L'interfaccia `EmailProviderAdapter` in `lib/types.ts` viene estesa con:

- **`upsertContact`**: sostituisce `createContact` per la sincronizzazione di un singolo contatto. Semantica: se il contatto esiste sul provider (per email o per `externalId`), lo aggiorna; altrimenti lo crea. Ritorna `{ errors: string[]; externalId: string }`. Il parametro `audiences` diventa obbligatorio (non opzionale) perché il mirror deve sempre riflettere le associazioni locale.
- **`deleteSegment`**: nuovo metodo per eliminare un segmento/audience dal provider. Ritorna `{ errors: string[] }`.
- **`syncContactsBatch`**: il tipo di ritorno `BatchSyncResult` viene esteso con un campo `syncedContacts: { localId: string; externalId: string }[]` che mappa ogni contatto sincronizzato con successo al suo `externalId` sul provider.

`createContact` viene mantenuto per retrocompatibilità (usato da `createContactOnProvider` per il flusso di creazione iniziale dove il contatto non esiste ancora sul provider), ma `syncContactWithProvider` migra a `upsertContact`.

### 2. Persistenza del mapping `localId → externalId` post-sync batch

`syncContactsWithProvider` in `lib/core/index.ts`, dopo aver chiamato `adapter.syncContactsBatch`, iterà su `result.syncedContacts` e aggiorna il campo `externalId` di ogni contatto nel DB locale in una singola transazione (`updateMany` o transaction con batch update). Questo chiude il loop di tracciabilità: la prossima sync vede i contatti con `externalId` popolato e può usare upsert invece di create.

### 3. `syncContactWithProvider` migra a `upsertContact`

Il blocco `if (!externalId)` commentato viene rimosso. La funzione chiama sempre `adapter.upsertContact`, passando tutte le audience con `externalId` non nullo. Se il provider ritorna un `externalId` e il contatto locale non ne ha ancora uno, lo salva. Se il contatto locale ha già un `externalId`, lo usa per identificare il contatto sul provider (upsert per ID invece che per email).

### 4. Propagazione CRUD — hook nelle procedure tRPC

Le procedure tRPC vengono modificate per chiamare le funzioni core di orchestrazione dopo ogni mutazione locale:

**Contatti:**
- `contacts.create` → dopo il `db.emailContact.create`, chiama una nuova funzione `propagateContactCreate(id)` che: (a) sincronizza le audience associate se non hanno `externalId`, (b) chiama `adapter.upsertContact` con i dati del contatto e le audience, (c) salva l'`externalId` ritornato.
- `contacts.update` → dopo l'update DB, chiama `propagateContactUpdate(id)` che fa upsert del contatto sul provider con i dati aggiornati.
- `contacts.remove` → prima del `db.emailContact.delete`, chiama `deleteContactOnProvider(id)` (funzione già esistente ma mai agganciata) per rimuovere il contatto dal provider.

**Audience:**
- `audiences.create` → dopo il `db.emailAudience.create`, chiama `propagateAudienceCreate(id)` che fa `adapter.syncSegment` e salva l'`externalId`.
- `audiences.update` → dopo l'update DB, chiama `propagateAudienceUpdate(id)` che fa `adapter.syncSegment` con il nome aggiornato.
- `audiences.remove` → prima del `db.emailAudience.delete`, chiama `adapter.deleteSegment(externalId)` se l'audience ha un `externalId`.

**Gestione errori di propagazione:** le chiamate al provider nelle funzioni `propagate*` wrappano il call in try/catch. Un errore del provider viene **loggato** (console.error con contesto) ma **non blocca** l'operazione locale. La procedura tRPC ritorna un campo `propagationWarning` nella risposta per informare l'UI che il provider non è stato aggiornato. Questo garantisce che un outage temporaneo del provider non impedisca la gestione locale dei contatti.

### 5. `syncContactsWithProvider` non throwa più su zero contatti

Se la query non ritorna contatti, la funzione ritorna `{ success: true, totalProcessed: 0, successfulCount: 0, failedCount: 0, errors: [], syncedContacts: [] }` invece di throware.

### 6. `createContactOnProvider` passa le audience

La funzione `createContactOnProvider` in `lib/core/index.ts` viene modificata per caricare le audience del contatto (con `externalId` non nullo) e passarle a `adapter.createContact`, esattamente come fa già `syncContactWithProvider`.

### 7. Mutation `sendBulk` delega a `sendSingleSend`

La mutation `sendBulk` in `single-sends/server/procedures.ts` viene riscritta per delegare a `sendSingleSend()` da `single-sends/lib/send-single-send.ts`, eliminando la duplicazione di logica. La mutation diventa un thin wrapper che:
1. Recupera settings e valida i permessi
2. Chiama `sendSingleSend({ singleSendId })`
3. Aggiorna `externalId` sul `EmailSingleSend` con il risultato
4. Ritorna la risposta

Questo garantisce che multi-audience, idempotency key e classificazione errori transienti funzionino anche dalla mutation tRPC.

### 8. `ResendAdapter` — implementazione dei nuovi metodi

- **`upsertContact`**: usa `resendClient.contacts.create()` (che su Resend è già un upsert per email). Se il contatto ha un `externalId` (ID Resend), lo passa come parametro per evitare lookup per email. Ritorna sempre l'`externalId` del contatto sul provider.
- **`deleteSegment`**: usa `resendClient.segments.delete(segmentId)`.
- **`syncContactsBatch`**: dopo ogni chunk completato con successo, raccoglie i `localId → externalId` dai risultati e li include nel `BatchSyncResult.syncedContacts`.
- **`sendBulk`**: passa l'`idempotencyKey` alla chiamata `resendClient.broadcasts.create` se presente, invece di scartarla.

### 9. Codice morto rimosso

I ~80 righe di `syncContactsBatch` commentato in `resend-adapter.ts` vengono eliminati.

## Testing Decisions

### Cosa rende un buon test

I test verificano **comportamento esterno**, non dettagli implementativi. In particolare:
- Che le funzioni core chiamino i metodi corretti dell'adapter con i parametri corretti
- Che il DB locale venga aggiornato correttamente dopo ogni operazione
- Che gli errori del provider vengano gestiti senza bloccare l'operazione locale

### Moduli testati

1. **`lib/core/index.ts`** — Le funzioni `syncContactsWithProvider`, `syncContactWithProvider`, `createContactOnProvider`, `deleteContactOnProvider`, `propagateContactCreate`, `propagateContactUpdate`, `propagateContactDelete`, `propagateAudienceCreate`, `propagateAudienceUpdate`, `propagateAudienceDelete`. Tutte testabili iniettando un fake adapter (stesso pattern di `send-single-send.test.ts`).

2. **`lib/adapters/resend-adapter.ts`** — I nuovi metodi `upsertContact`, `deleteSegment`, e il campo `syncedContacts` in `syncContactsBatch`. Testabili mockando il client Resend.

3. **Procedure tRPC** — Test di integrazione per verificare che le mutation chiamino le funzioni core. Priorità bassa rispetto ai test sulle funzioni core.

### Prior art

Il file `src/modules/mails/single-sends/lib/__tests__/send-single-send.test.ts` è il modello: inietta un `fakeAdapter` conforme a `EmailProviderAdapter`, opera sul DB di test, e verifica il comportamento esterno. I nuovi test seguono lo stesso pattern.

## Out of Scope

- **Webhook dal provider verso il modulo**: esplicitamente fuori scope. Il DB locale è la single source of truth; non ci interessa ricevere eventi dal provider.
- **Retry automatico su errori transienti**: fuori scope per questa iterazione. La propagazione CRUD logga gli errori e ritorna un warning; il retry può essere aggiunto in futuro.
- **Rate limiting adattivo**: il rate limiting hardcoded nell'adapter rimane invariato.
- **Adapter SendGrid**: il factory `getProviderAdapter` continua a throware per SendGrid. L'implementazione di un adapter SendGrid è fuori scope.
- **Istanza Resend singleton**: il factory crea ancora una nuova istanza ad ogni chiamata. Ottimizzazione futura.
- **Gestione bounce/unsubscribe via provider**: fuori scope. Lo stato `isSubscriber` è gestito solo localmente.

## Further Notes

- L'estensione di `BatchSyncResult` con `syncedContacts` è un cambiamento di interfaccia breaking per `EmailProviderAdapter`. L'adapter `ResendAdapter` va aggiornato in concomitanza. I test esistenti di `sendSingleSend` usano un `fakeAdapter` che va aggiornato per includere il nuovo campo.
- La propagazione CRUD introduce una dipendenza dal provider nelle procedure tRPC. Per mantenere le procedure testabili, le funzioni `propagate*` vivono in `lib/core/index.ts` e ricevono l'adapter come parametro (o lo risolvono internamente via factory). Le procedure tRPC possono essere testate mockando il modulo `lib/core`.
- Il campo `propagationWarning` nella risposta delle mutation è opzionale e retrocompatibile: se la propagazione riesce, il campo è assente o `null`.
