# 08: End-to-end verification on a production-like copy

**What to build:** The complete acceptance path is demonstrated against a restored copy of the existing Installation, before anything is switched in production. The 720 existing Media keep their addresses, a local upload and a local document are served from the site's own domain, replace and mixed deletion work, switching the driver in both directions breaks nothing, and the audit reports a healthy library.

**Blocked by:** 02, 03, 04, 05, 06, 07

**Status:** ready-for-agent

- [ ] On a restored production-like database, every existing Media resolves on its unchanged address.
- [ ] A local image and a local document are uploaded and served from the site's own domain with the correct headers, and the document answers a Range request.
- [ ] Replace works with local active and with a Media previously written by the provider.
- [ ] A mixed selection deletes without leaving bytes on either driver.
- [ ] Switching the active driver from local to UploadThing and back leaves every existing Media resolving.
- [ ] The audit reports zero unresolved Media and reconciles local disk bytes with accounted bytes.
- [ ] A browser probe renders one page with an existing legacy image and one page with a local image.
- [ ] Results and figures are recorded in the ticket comment.
