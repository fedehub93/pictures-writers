# 06: Generic widget configuration and Trend metric picker

**What to build:** Widget configuration is a generic part of the widget contract, not a special case of the Trend. Any configurable widget exposes a schema; in edit mode its card shows a gear that opens a populated popover, and the chosen config is saved with the user's layout. The Trend is the first user: the gear lets the user pick which permitted metric the instance renders.

**Blocked by:** 03, 05

**Status:** ready-for-agent

- [ ] The widget definition contract supports an optional config schema and default config.
- [ ] In edit mode, a configurable card shows a gear that opens a popover generated from the widget's config schema.
- [ ] The chosen config persists per instance in the user's layout override.
- [ ] The Trend widget lets the user choose which permitted metric the instance renders.
- [ ] Changing a Trend's metric affects only that instance and survives a reload.
