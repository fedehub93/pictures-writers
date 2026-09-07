# 04: Propagate contact CRUD to provider

**What to build:** Contact mutations in the tRPC router automatically propagate changes to the email provider, keeping the mirror consistent. New orchestration functions in `lib/core/index.ts` handle the provider call after each local mutation. Provider errors are logged but do not block the local operation — the tRPC response includes an optional `propagationWarning` field so the UI can inform the user.

**Blocked by:** 03 (fix core sync functions)

**Status:** done

- [x] `propagateContactCreate(id)` function in `lib/core/index.ts`: syncs associated audiences if they lack `externalId`, calls `adapter.upsertContact`, saves returned `externalId`
- [x] `propagateContactUpdate(id)` function in `lib/core/index.ts`: calls `adapter.upsertContact` with updated contact data and current audience associations
- [x] `contacts.create` mutation calls `propagateContactCreate` after `db.emailContact.create`
- [x] `contacts.update` mutation calls `propagateContactUpdate` after `db.emailContact.update`
- [x] `contacts.remove` mutation calls `deleteContactOnProvider(id)` before `db.emailContact.delete`
- [x] All propagation calls wrapped in try/catch: errors logged with `console.error` and context, local operation succeeds
- [x] tRPC mutation responses include `propagationWarning?: string` — set when provider call fails, absent/null on success
- [x] Tests cover: create propagates to provider with correct data, update propagates updated fields, remove calls `deleteContact`, provider error returns warning but local operation succeeds
