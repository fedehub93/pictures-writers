# 04: Replace a file through the active driver and the application transport

**What to build:** "Replace file" behaves like the upload the admin chose: it takes its bytes through the application transport, writes the new revision through the active driver — not the environment's — and leaves the previous revision intact when it fails. The previous object is cleaned through the driver recorded on the existing Media, and a provider that is not configured never blocks the replace.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] With the Installation setting on local and the environment still naming UploadThing, replace writes the new revision to disk and the Media records local.
- [ ] With the setting on UploadThing, replace writes to the provider.
- [ ] The replace flow no longer uses the UploadThing dropzone; it posts through the application's upload transport.
- [ ] Cleanup of the previous revision resolves the driver recorded on the existing Media.
- [ ] When the previous provider is not configured, replace still succeeds and reports the cleanup as skipped.
- [ ] A failed replace leaves the previous revision, address and manifest intact.
- [ ] Tests cover both drivers and a Media written by the other driver.
