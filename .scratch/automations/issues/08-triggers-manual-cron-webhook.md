# 08: Triggers — manual (run now), cron, webhook

**What to build:** The three general trigger types. "Run now" from the editor (or list) enqueues a Run manually with an empty or editor-provided payload. A cron trigger fires when the interval defined on the trigger node has elapsed since the most recent Run of that Automation (read from the ledger). A webhook trigger exposes an authenticated route: a constant-time comparison of a caller secret against the Automation's stored hash starts a Run with the request body as payload.

**Blocked by:** 02, 05

**Status:** ready-for-agent

- [ ] "Run now" starts a Run from the admin with an explanatory payload; it works even while the Automation is published.
- [ ] A cron-triggered Automation fires on interval based on the ledger's most recent Run (clock injected for deterministic tests); unpublished Automations never fire.
- [ ] The webhook route authenticates the caller secret in constant time against the stored hash and creates a Run whose payload is the request body; bad/missing secrets are rejected.
- [ ] Each trigger type is covered by ingestion tests through the pump/runner.