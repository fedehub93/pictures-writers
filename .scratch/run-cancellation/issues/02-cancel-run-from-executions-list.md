# 02: Cancel a RUNNING Run from the Executions list

**What to build:** The Executions list lets an authorized user cancel a `RUNNING` Run without opening it. The per-row action becomes an "Actions" dropdown that always offers View (Debug when the Run is `FAILED`) and additionally offers "Cancel run" only while the Run is `RUNNING`, reusing the confirmation dialog and mutation delivered for the Run detail.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The per-row action in the Executions list is an "Actions" dropdown: View (or Debug when `FAILED`) is always present.
- [ ] "Cancel run" appears in the dropdown only while the Run is `RUNNING`.
- [ ] "Cancel run" opens the same confirmation dialog and calls the same `cancelRun` mutation as the Run detail.
- [ ] After a successful cancel the Executions list query is invalidated and a success toast is shown.
- [ ] A user without `automations.write` sees no "Cancel run" action.
- [ ] `npm run lint` and `npm run build` pass.
