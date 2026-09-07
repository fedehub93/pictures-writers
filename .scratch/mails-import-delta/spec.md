# Mails Import Delta

**Status:** `ready-for-agent`

## Problem Statement

L'import dei contatti in un'audience è oggi un'operazione **O(n) sull'intera audience**, non sul delta. Quando l'admin seleziona un set di interaction type e importa, il flusso corrente:

1. trova i contatti mancanti nell'audience e li collega in locale, poi
2. chiama il re-sync completo dell'audience (`syncContactsWithProvider`), che riesegue la creazione/upsert **di tutti** i contatti dell'audience sul provider, ogni volta.

Il risultato: per aggiungere pochi contatti a un segmento si ripaga l'intero upload. Con audience grandi l'import impiega minuti e consuma inutilmente la quota API del provider. I contatti già sincronizzati vengono ritoccati senza motivo, e il costo cresce con la dimensione dell'audience (non con la dimensione del delta).

## Solution

Rendere l'import **delta-only**: l'import trova solo i contatti mancanti, li collega in locale, e propaga al provider **solo quelli**, con una chiamata per contatto:

- contatto già esistente sul provider (`externalId` presente) → aggiunta della membership al segmento via l'endpoint dedicato (semantica idempotente, verificata sulla documentazione Resend: nessun body, risposta `segmentId`, nessun errore documentato per membri esistenti);
- contatto non ancora sul provider (`externalId` assente) → creazione sul provider con il segmento già associato, persistendo poi l'`externalId` ritornato.

La logica di rete (chunking, delay tra chunk, retry su 429) vive nel adapter, come già fa `syncContactsBatch`: il core orchestra solo DB → chiamata unica → persistenza. Il re-sync completo resta disponibile come azione separata di "guarigione" manuale per i casi di drift sospetto.

Costo: importare N contatti mancanti costa **N chiamate** (a chunk rate-limited), indipendentemente dalla dimensione dell'audience. Nessuna chiamata al provider se il delta è vuoto.

## User Stories

1. As an admin user, I want to import into an audience only the contacts that are missing from it, so that the operation completes in seconds even for large audiences.
2. As an admin user, I want a contact that already exists on the provider to be added to the segment without being re-created, so that no redundant provider call happens.
3. As an admin user, I want a contact that does not exist on the provider yet to be created with the segment attached during import, so that it lands in the right segment immediately.
4. As an admin user, I want the provider id of each newly created contact to be persisted on the local contact, so that later syncs don't duplicate it.
5. As an admin user, I want importing an audience with no missing contacts to make zero provider calls and return a graceful zero-result, so that re-running imports is harmless and fast.
6. As an admin user, I want the import result to report processed/succeeded/failed counts with per-contact error reasons, so that I can see which contacts need attention.
7. As an admin user, I want a provider error on one contact to be reported without aborting the rest of the import, so that a partial failure doesn't block the whole page.
8. As an admin user, I want import of many contacts to respect the provider rate limit with the same chunking/backoff as the existing batch sync, so that Resend doesn't reject the batch.
9. As an admin user, I want repeated imports of the same audience not to re-process contacts that were already imported, so that the operation is safe to run twice.
10. As an admin user, I want the full "sync audience" action to remain a complete re-sync, so that I can heal provider drift when I suspect the mirror is out of sync.
11. As an admin user, I want the filtered contact count preview to keep working, so that the import UI can still tell me how many contacts will be imported.
12. As an admin user, I want the import to stay pagination-based (interaction types + page window), so that I can decide which interactions qualify and import in chunks.
13. As an admin user, I want the import to remain a synchronous blocking operation, so that I get the final result at the end.
14. As a developer implementing a provider adapter, I want the membership-add logic to live in the adapter like the existing batch sync, so that network and rate-limit concerns stay out of the core orchestration.
15. As a developer implementing a provider adapter, I want the new adapter method to return the same `BatchSyncResult` shape used elsewhere, so that core persistence handles created and existing contacts uniformly.

## Implementation Decisions

### 1. Estensione dell'interfaccia `EmailProviderAdapter`

Nuovo metodo sull'interfaccia dell'adapter:

**`addContactsToSegment(contacts, segmentExternalId)`** → `BatchSyncResult`

- `contacts` è l'array dei contatti da aggiungere al segmento, ciascuno con: email, id locale, nome/cognome, flag iscritto, `externalId` (nullable).
- Semantica per contatto:
  - `externalId` presente → chiamata di aggiunta al segmento (endpoint dedicato `segments.add`), nessuna creazione;
  - `externalId` assente → creazione sul provider con il segmento già associato.
- Ritorna `BatchSyncResult` con `syncedContacts: { localId, externalId }[]` (solo i contatti creati, per la persistenza dell'`externalId` in locale) e `errors` per-contatto.
- **Nessun pre-check di membership**: la documentazione Resend per l'aggiunta contatto→segmento non dichiara errori per membri esistenti (POST senza body, risposta `segmentId`); l'add è effettivamente idempotente.
- Il rate limiting replica esattamente `syncContactsBatch` (chunk con pausa tra chunk, retry con backoff su 429). Nessun rate limiting adattivo.

### 2. Nuova funzione core di import delta

La funzione `updateContactsAudience` (usata dalla mutation `importContacts`) viene sostituita da `importContactsIntoAudience`, con la stessa firma `(audienceId, interactions, skip, take)` e la stessa semantica di paginazione. Flusso:

1. risoluzione dell'adapter dal settings,
2. sync del segmento dell'audience (`syncSegment`, persistendo `newExternalId` se ritornato) per garantire l'esistenza del segmentId sul provider,
3. query dei contatti **non** nell'audience con interaction type corrispondenti (la query esistente, con `skip`/`take`),
4. se il delta è vuoto → ritorno immediato di zero-result, **nessuna chiamata al provider**,
5. connessione locale dei contatti all'audience (loop di update, come oggi),
6. chiamata unica a `adapter.addContactsToSegment` con i contatti collegati e il segmentId,
7. persistenza dell'`externalId` per ogni contatto creato da `result.syncedContacts`,
8. ritorno dei conteggi/errori (stessa forma di `BatchSyncResult`).

La chiamata finale al re-sync completo (`syncContactsWithProvider`) viene rimossa dall'import. `syncContactsWithProvider` e la mutation `syncContacts` restano invariate come strumento di heal manuale.

### 3. Wiring delle procedure tRPC

- `audiences.importContacts` → chiama `importContactsIntoAudience` al posto di `updateContactsAudience`. Risposta: messaggio + conteggi/errori, sincrona e bloccante come oggi (UX invariata; l'admin vede il risultato finale).
- `audiences.syncContacts` → invariata (re-sync completo).
- `audiences.getFilteredContactCount` → invariata (preview per la UI di import).
- Nessuna modifica UI: la mutation espone gli stessi input e una risposta compatibile.

### 4. Persistenza e idempotenza

- I contatti creati sul provider durante l'import ottengono l'`externalId` persistito in locale (paso 7), mantenendo la tracciabilità `localId → externalId` stabilita nello spec di sync fidelity.
- L'import è idempotente per costruzione: la query seleziona solo i contatti non ancora nell'audience; rieseguire l'import non riprocessa gli stessi contatti.

## Testing Decisions

### Cosa rende un buon test

I test verificano comportamento esterno, non dettagli implementativi: quali metodi dell'adapter vengono chiamati e con quali parametri, lo stato del DB dopo l'operazione, la gestione degli errori del provider senza bloccare l'operazione locale, e il fast-path "delta vuoto → zero chiamate".

### Moduli testati (due seam esistenti, nessun seam nuovo)

1. **Core** — `importContactsIntoAudience`, testata con fake `EmailProviderAdapter` iniettato e DB di test.
   *Prior art:* `core/audiences/__tests__/sync.test.ts` (stesso pattern: fake adapter + DB di test nel `.env.test`).
   Casi: query del delta corretta; delta vuoto → nessuna chiamata al provider e zero-result; persistenza degli `externalId` da `syncedContacts`; errore per-contatto aggregato senza interrompere il resto; ordine "connessione locale → chiamata provider".

2. **Adapter** — `addContactsToSegment` su `ResendAdapter`, testata con client Resend finto nel campo privato.
   *Prior art:* `lib/adapters/__tests__/resend-adapter.test.ts` (creato in questa sessione).
   Casi: contatti con `externalId` → solo aggiunta al segmento (nessuna creazione); contatti senza `externalId` → creazione con segmento e mapping in `syncedContacts`; chunking/pausa tra chunk e retry su 429 coerenti con `syncContactsBatch`; aggregazione errori per contatto.

3. **Procedure tRPC** — priorità bassa: la mutation resta un thin wrapper; non si testa direttamente (pattern esistente del modulo).

### Prior art

- `core/audiences/__tests__/sync.test.ts` e `core/audiences/__tests__/propagate-audience.test.ts` per il seam core.
- `lib/adapters/__tests__/resend-adapter.test.ts` per il seam adapter.

## Out of Scope

- **Assegnazione automatica dell'audience al momento della form**: fuori scope. Il mapping interaction type → audience resta deciso dall'admin al momento dell'import nella UI (nessun hardcode nel codice delle form).
- **Percorso inverso (rimozione dai segmenti)**: l'import è solo additivo. La rimozione di membership non è gestita da questo flusso; restano a disposizione la reconcile dei segmenti nel path single-contact e il re-sync completo come heal.
- **Mapping interaction → audience data-driven**: quando i form diventeranno dinamici, la gestione cambierà; questa iterazione non introduce configurazione.
- **Rate limiting adattivo / webhook dal provider**: ereditati fuori scope dallo spec di sync fidelity.
- **Modifiche UI oltre alla compatibilità della risposta**: nessuna.
- **Contatti già nell'audience locale con membership mancante sul provider**: non toccati dall'import delta; il re-sync completo è il percorso di guarigione.

## Further Notes

- L'estensione dell'interfaccia `EmailProviderAdapter` è un cambiamento di interfaccia: i fake adapter nei test esistenti (tipizzati sull'interfaccia) vanno aggiornati con il nuovo metodo in concomitanza.
- Comportamento "add to segment" idempotente verificato su documentazione ufficiale Resend (endpoint dedicato: POST senza body, risposta `segmentId`, nessun errore documentato per duplicati; OpenAPI catalog protetto da auth non consultabile, nessun contro-riscontro trovato). Safety net previsto: un ipotetico errore non documentato verrebbe catturato come errore per-contatto e aggregato, senza esplodere l'operazione.
- L'import mantiene la semantica di paginazione `skip`/`take`: i conteggi riflettono la pagina corrente. Il costo totale cresce con il numero di pagine, non con la dimensione dell'audience.
- Il flusso di import si inserisce nel lavoro già fatto su sync fidelity (propagazione CRUD, persistenza `externalId`): nessuna nuova dependency di terze parti.