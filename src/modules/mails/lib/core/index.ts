/**
 * Core mails business logic.
 *
 * Barrel module: re-exports the split implementations so existing consumers
 * (`@/modules/mails/lib/core`) keep working unchanged.
 *
 * Layout:
 *  - provider helpers ......... lib/provider.ts (getProviderAdapter, resolveAdapter)
 *  - broadcast ................ ./broadcast.ts            (sendBulk)
 *  - contacts ................. ./contacts/sync.ts        (blocking, throws)
 *                               ./contacts/propagate.ts   (non-blocking, returns warning)
 *  - audiences ................ ./audiences/sync.ts       (blocking, throws)
 *                               ./audiences/propagate.ts  (non-blocking, returns warning)
 */

// Provider factory helpers (shared infra)
export { getProviderAdapter, resolveAdapter } from "../provider";

// Broadcasts (single sends)
export { sendBulk } from "./broadcast";

// Contacts — blocking manual sync
export {
  syncContactWithProvider,
  createContactOnProvider,
  deleteContactOnProvider,
} from "./contacts/sync";

// Contacts — non-blocking propagation after local mutations
export { propagateContactCreate, propagateContactUpdate } from "./contacts/propagate";

// Audiences — blocking batch sync / import
export {
  syncContactsWithProvider,
  updateContactsAudience,
} from "./audiences/sync";

// Audiences — non-blocking propagation after local mutations
export {
  propagateAudienceCreate,
  propagateAudienceUpdate,
  propagateAudienceDelete,
} from "./audiences/propagate";
