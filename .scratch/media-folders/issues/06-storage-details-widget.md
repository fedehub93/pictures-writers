# 06: Storage details widget

**What to build:** An editor sees how much storage is used overall and how it is split across Images, Videos, Audio and Documents.

**Blocked by:** 01 — Folder tree sidebar, 03 — Folder-scoped grid and Recent view

**Status:** ready-for-agent

- [ ] The aggregation endpoint returns total used bytes, total quota bytes, and per-`MediaType` usage.
- [ ] The widget renders a progress bar for total used vs quota.
- [ ] The widget lists Images, Videos, Audio and Documents with their file counts and sizes.
- [ ] The widget shows a warning state when usage is above the configured warning ratio.
- [ ] Router/API tests verify the aggregation.
- [ ] Component test verifies the widget renders the breakdown.
