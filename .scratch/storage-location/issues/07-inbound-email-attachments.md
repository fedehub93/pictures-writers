# 07: Inbound email attachments copied into own storage

**What to build:** An email that arrives with attachments has them copied into the Installation's own storage instead of the provider's, so the copy that survives is the one the Installation owns. The message lists its attachments and each one opens from the Installation's domain.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] An inbound message with an attachment stores it through the active driver.
- [ ] The stored attachment opens from `/files/<key>`.
- [ ] A storage failure is logged and does not prevent the message from arriving.
- [ ] Deleting the message removes the copied objects through the driver recorded on each one.
- [ ] An inbound message with several attachments stores all of them, each with its own record.
