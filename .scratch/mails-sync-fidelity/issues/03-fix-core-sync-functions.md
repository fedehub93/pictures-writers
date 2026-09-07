# 03: Fix core sync functions — persist `externalId` + upsert semantics

**What to build:** The core orchestration functions in `lib/core/index.ts` are fixed to close the feedback loop between the local DB and the provider. After a batch sync, the `externalId` of each successfully synced contact is persisted in the DB. Single-contact sync uses `upsertContact` instead of `createContact`. Batch sync of an empty audience succeeds gracefully. `createContactOnProvider` passes audience associations so contacts belong to the correct segments on the provider.

**Blocked by:** 01 (expand adapter interface)

**Status:** ready-for-agent

- [x] `syncContactsWithProvider` persists `externalId` for each contact in `result.syncedContacts` via a DB transaction (batch update)
- [x] `syncContactWithProvider` calls `adapter.upsertContact` instead of `adapter.createContact`, removing the commented-out `if (!externalId)` block
- [x] `syncContactWithProvider` passes all audiences with non-null `externalId` to `upsertContact`
- [x] `syncContactWithProvider` saves the returned `externalId` if the contact didn't have one
- [x] `syncContactsWithProvider` returns `{ success: true, totalProcessed: 0, ... }` instead of throwing when no contacts are found
- [x] `createContactOnProvider` loads the contact's audiences (with non-null `externalId`) and passes them to `adapter.createContact`
- [x] Tests cover: batch sync persists externalIds, single sync uses upsert, empty audience returns success, createContactOnProvider includes audiences
- [x] Rate limit updated: CHUNK_SIZE 5→8 (≈7.6 req/s vs 10 req/s limit), 429 retry with exponential backoff + `retry-after` header support
