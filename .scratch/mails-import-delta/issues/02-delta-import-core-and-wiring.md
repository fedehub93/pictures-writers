# 02: Delta import into audiences (core + wiring)

**What to build:** Importing contacts into an audience propagates **only the missing contacts** to the provider, instead of re-syncing the whole audience. The admin picks interaction types (with the usual page window), the flow connects the missing contacts locally and adds each to the audience segment on the provider — one provider call per contact, or zero if nothing is missing — and the admin sees processed/succeeded/failed counts with per-contact error reasons synchronously. The full re-sync of an audience remains available as a separate heal action, and the filtered-count preview keeps working.

**Blocked by:** 01

**Status:** done

- [x] New core import orchestration replacing the current import path: resolve the adapter, ensure the audience segment exists on the provider (persisting a new provider id if one is returned), select only contacts missing from the audience with matching interaction types (same page window), fast-path with zero provider calls when the delta is empty, connect the missing contacts locally before calling the provider, call the adapter's add-to-segment batch once, persist the provider id of every created contact, and return counts/errors
- [x] A provider error on a single contact is reported in the per-contact errors without aborting the rest of the import
- [x] The import mutation is rewired to the new orchestration; its response stays compatible with the current UI (synchronous, message + counts)
- [x] The now-dead full-import helper is removed (no remaining callers); the full audience re-sync mutation and the filtered-contact-count query are unchanged
- [x] Core tests (fake adapter, existing test seam) cover: the delta query selects only missing contacts, empty delta → zero provider calls (segment sync and add-to-segment alike), persistence of created contacts' provider ids, persistence of a newly returned segment id, per-contact errors do not block the rest, and local connection happens before the provider call