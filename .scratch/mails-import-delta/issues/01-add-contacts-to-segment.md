# 01: Adapter — add contacts to segment

**What to build:** The provider adapter gains a batch capability to add contacts to an audience segment: contacts that already exist on the provider become segment members without being re-created (idempotent membership add), contacts that don't exist yet are created with the segment already attached, and the provider id of each newly created contact is returned so the local database can persist it. The operation respects the provider rate limit with the same chunking and 429 backoff used by the existing batch sync, and reports per-contact errors without aborting the rest of the batch.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] The provider adapter interface gains `addContactsToSegment(contacts, segmentExternalId)` returning the shared batch result shape (`BatchSyncResult`)
- [x] The Resend adapter implements it: contact with an `externalId` → membership add via the dedicated segment endpoint; contact without → creation with the segment attached, with the new `externalId` returned in `syncedContacts`
- [x] No membership pre-check: the add operation is effectively idempotent (verified against provider docs), so no list-before-add
- [x] Rate limiting mirrors the existing batch sync (chunk cadence + exponential backoff on 429)
- [x] The existing fake adapters in mails test files are updated with a stub method so the suite stays green with the extended interface
- [x] Adapter tests (fake provider client) cover: add-vs-create routing per contact, chunk cadence and 429 backoff, per-contact error aggregation, and the `syncedContacts` mapping for created contacts