# 02: Delegate `sendBulk` tRPC mutation to `sendSingleSend`

**What to build:** The `sendBulk` tRPC mutation in `single-sends/server/procedures.ts` currently duplicates the logic of `sendSingleSend` from `single-sends/lib/send-single-send.ts`, but only handles the first audience (`audiences[0]`). The mutation is rewritten to delegate to `sendSingleSend()`, which already handles multiple audiences, classifies transient vs permanent errors, and supports idempotency keys. The mutation becomes a thin wrapper that validates settings, calls `sendSingleSend`, updates the `externalId` on the `EmailSingleSend` record, and returns the result.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `sendBulk` mutation in `single-sends/server/procedures.ts` delegates to `sendSingleSend()` instead of duplicating logic
- [x] Multi-audience sends work correctly through the mutation (one broadcast per audience, provider IDs joined)
- [x] `idempotencyKey` is forwarded to `sendSingleSend` and reaches the adapter
- [x] `externalId` on `EmailSingleSend` is updated with the result from `sendSingleSend`
- [x] Error handling uses `EmailSendError.transient` to classify tRPC error codes (transient → INTERNAL_SERVER_ERROR for retry, permanent → BAD_REQUEST)
- [x] `npm run lint` passes
