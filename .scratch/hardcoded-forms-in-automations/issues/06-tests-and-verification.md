# 06: Test e verifica

**What to build:** Automated coverage for the new emits plus a manual end-to-end smoke, then the standard lint/typecheck gates.

**Blocked by:** 01, 02, 03, 04, 05

**Status:** ready-for-agent

- [ ] Extend `src/modules/forms/automations/__tests__/form-submitted-trigger.test.ts` (or add a sibling test) so it asserts: contact emit uses the existing contact id; newsletter/ebook emits use the stable built-in ids; payload `data` shape per form; an Automation scoped to a different form does not fire.
- [ ] A test asserts the seeded shadow `Form` rows exist in the test DB after migration.
- [ ] Manual smoke: publish an Automation scoped to `built-in-form-newsletter` (trigger → one node), submit the newsletter, confirm a Run appears in the Executions screen and the node executes.
- [ ] `npm run lint` clean on touched paths.
- [ ] `npx tsc --noEmit` clean.
- [ ] Record the outcome under `## Comments`.

## Comments
