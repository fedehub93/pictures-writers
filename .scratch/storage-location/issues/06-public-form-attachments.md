# 06: Public form attachments

**What to build:** A visitor can attach a file to a public form on an Installation with no provider account, and the file arrives served from the Installation's own domain. Because the uploader is anonymous, the transport is rate-limited per client and per form, capped in size, and labels the file as public-origin so the budget can protect the owner.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] A visitor submits a form with a PDF and receives a served attachment that opens from the Installation's domain.
- [ ] The transport refuses a file over the per-file cap and refuses a burst beyond the rate limit, each with a machine-readable answer.
- [ ] Every file created this way is labelled public-origin.
- [ ] A refused upload leaves no bytes and no record.
- [ ] The submission's data points at the attachment and never at a provider address.
- [ ] The designer preview of the upload field still renders without performing an upload.
