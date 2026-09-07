# 01: Expand `EmailProviderAdapter` interface and implement in `ResendAdapter`

**What to build:** The adapter interface gains three new capabilities so that the core sync layer can track provider-side identifiers, update existing contacts without creating duplicates, and delete segments. The `ResendAdapter` implements these using the Resend SDK: `upsertContact` performs a get-then-create-or-update (Resend's `contacts.create` is not an upsert — it fails if the email already exists), `deleteSegment` calls `segments.remove`, and `syncContactsBatch` returns a per-contact mapping of local ID to provider external ID. Dead code (the ~80 lines of commented-out `syncContactsBatch` in `ResendAdapter`) is removed. The `BatchSyncResult` type gains a `syncedContacts` field. The fake adapter used in existing tests (`send-single-send.test.ts`) is updated to satisfy the new interface shape.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] `EmailProviderAdapter` interface gains `upsertContact(email, id, firstName, lastName, isSubscriber, audiences)` returning `{ errors: string[]; externalId: string }`
- [x] `EmailProviderAdapter` interface gains `deleteSegment(externalId)` returning `{ errors: string[] }`
- [x] `BatchSyncResult` type gains `syncedContacts: { localId: string; externalId: string }[]`
- [x] `ResendAdapter.upsertContact` implements get-then-create-or-update using Resend SDK (`contacts.get` by email, then `contacts.create` or `contacts.update` accordingly)
- [x] `ResendAdapter.deleteSegment` calls `resendClient.segments.remove(id)`
- [x] `ResendAdapter.syncContactsBatch` populates `syncedContacts` with the local-to-external ID mapping for each successfully synced contact
- [x] `ResendAdapter.sendBulk` keeps `idempotencyKey` discarded — Resend `broadcasts.create` does not support it yet (only `emails.send` and `batch` do via `IdempotentRequest`)
- [x] ~80 lines of commented-out `syncContactsBatch` code removed from `ResendAdapter`
- [x] Fake adapter in `send-single-send.test.ts` updated to satisfy new interface
- [x] `npm run lint` passes
