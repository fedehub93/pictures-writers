# 07: Inbound email attachments copied into own storage

**What to build:** An email that arrives with attachments has them copied into the Installation's own storage instead of the provider's, so the copy that survives is the one the Installation owns. The message lists its attachments and each one opens from the Installation's domain.

**Blocked by:** 05

**Status:** done

- [x] An inbound message with an attachment stores it through the active driver.
- [x] The stored attachment opens from `/files/<key>`.
- [x] A storage failure is logged and does not prevent the message from arriving.
- [x] Deleting the message removes the copied objects through the driver recorded on each one.
- [x] An inbound message with several attachments stores all of them, each with its own record.

## Comments

**2026-11-20**

Landed in `f103641f` (`feat(mails): copy inbound email attachments into owned storage`).

- The inbound handler now copies every attachment through `copyInboundAttachments`, which
  downloads the provider's expiring URL once and writes the bytes through `AttachmentStorage`.
  A failed write is logged per attachment with its id, filename and reason, and only that file is
  skipped: the message is still recorded, and a failure does not undo the files already stored.
  A download failure after the retries still aborts the webhook, because the provider's retry is
  the recovery path; the ADR records that a storage skip is final, since the recorded message id
  makes a later retry a no-op.
- `attachment-storage.ts` already wrote through the same `storeOwnedFile` as every owned file, so
  the active driver, `kind = ATTACHMENT`, `origin = INTERNAL`, checksum and canonical
  `/files/<key>` address all follow the stored-file record. The handler composes no address.
- Deleting the conversation permanently removes its message, and with it each attachment's object
  through the driver recorded on that file; the record is removed in the same transaction, and a
  driver this build cannot configure leaves the record for the audit.
- `docs/media.md` and ADR-0026 describe the inbound path, the per-attachment failure isolation and
  the finality of a skipped copy.

Tests: `handle-inbound-email.test.ts` now exercises several attachments (one record each), a
storage failure that skips one file while the message arrives with the other, and a total storage
failure that still records the message. A new end-to-end test in `owned-files.test.ts` posts an
inbound webhook through the real local driver, opens both attachments from `/files/<key>` with the
expected content types and bytes, then deletes the conversation and asserts both records and both
disk objects are gone.

Verification: `npm run test:run` — 286 files, 2600 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (250 pre-existing warnings); `npm run check:doc-citations` 97 docs /
0 broken. No browser probe was run for this ticket.
