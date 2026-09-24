# 02: Admin shell — automations list, canvas skeleton, draft and publish

**What to build:** The admin surface for automations: a sidebar entry (tools group) and permission keys (`automations.read`/`automations.write`), a list of Automations, and a visual canvas editor (React Flow, new dependency) where nodes can be placed, named, and connected. An Automation is saved as a draft and published with validation (at least one trigger node, no cycles), and publishing freezes the graph into the published snapshot. Pages follow the existing admin pattern (server page → auth + permission check → prefetch → hydrate → view).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Sidebar entry appears under tools and obeys the new permission keys; unauthorized access is rejected.
- [ ] List view shows automations with name and status; creating/renaming/deleting works.
- [ ] Canvas editor renders placed nodes and connections and persists them; editing a draft does not touch the published snapshot.
- [ ] Publish action validates at least one trigger node and rejects cycles, then stores the published snapshot; unpublished Automations are flagged as such in the list.
- [ ] The editor UI lives in the automations module's admin view/components folders and uses the domain vocabulary (node, connection, trigger, action).