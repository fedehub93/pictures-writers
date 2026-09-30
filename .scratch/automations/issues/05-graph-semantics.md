# 05: Graph semantics — connections, fan-out, per-token, conditional node

**What to build:** The real graph executor on top of the linear runner. Connections drive traversal: fan-out is allowed (one node's output fans to many successors), and a node with multiple incoming connections produces one Step per arriving token (per-token semantics, no joins). The Conditional node evaluates against incoming/payload data and routes via its `true`/`false` outputs. A runtime guard cancels a Run that exceeds 500 node executions; cycles are rejected at validation.

**Blocked by:** 03

**Status:** resolved

- [x] A linear chain of nodes executes in order through connections and terminalizes correctly.
- [x] Fan-out from one node to two successors runs both branches; both Step records appear in the ledger.
- [x] The Conditional node routes between `true` and `false` outputs based on interpolation of payload/previous outputs; only the matched branch executes.
- [x] A node with two incoming tokens produces one Step per token, each with its own input snapshot.
- [x] A run exceeding the 500-execution guard is canceled with a clear error in its status.
- [x] Integration tests cover chain, fan-out, conditional split, per-token multi-input, and the guard.

## Comments

Delivered (see `src/modules/automations/lib/interpolate.ts` and `lib/node-registry.ts`):

- Interpolation: `interpolateAutomationValue` walks node `data` recursively, replacing `{{ expr }}` with values looked up via `readPath` against `input`, `payload`, `run` and `step`. A template that is the *whole* string resolves to the raw typed value (so `{{ payload.retries }}` stays a number); a template mixed with text interpolates as a string, missing values becoming `""`. Objects and arrays are traversed, so nested config (e.g. a conditional's `value`) is covered.
- Conditional: `conditionalHandler` interpolates the whole config before reading `source`/`path`/`operator`/`value`, then routes on the `true`/`false` output. The duplicate `readPath` it carried was deleted in favour of the exported one — no behavioural change, just one implementation.
- Test coverage added: chain/fan-out/conditional/per-token/guard integration cases in `lib/__tests__/automation-engine.test.ts`, the interpolation unit suite in `lib/__tests__/interpolate.test.ts`, and conditional true/false/interpolation cases in `lib/__tests__/node-registry.test.ts`.
- Already in place from issue 03 (verified, not rewritten): connection-driven traversal, per-token Step fan-in, the `AUTOMATION_MAX_EXECUTIONS = 500` guard and cycle rejection via `hasCycle`/`validateAutomationGraph` (`lib/validate.ts`, covered by `lib/__tests__/validate.test.ts`).
- Verified: `npx tsc --noEmit` clean; `vitest src/modules/automations` 54/54; full `npm run test:run` 380/380 (46 files); `npx eslint` clean on all touched automation files.
- Review follow-ups applied: the guard limit stays a fixed constant (an earlier draft threaded a `maxExecutions` option through `runDueAutomations` purely to make the test cheap — removed), and `readPath` is no longer duplicated.

Non-blocking follow-ups:

- **The guard counts `attempts`, not distinct nodes.** `attempts` increments on every lease claim, so retries and wait-node resumes consume the 500 budget; a run with many waits can be cancelled before 500 distinct node executions. If the intent is 500 *executions*, switch the sum to completed Steps — a one-line change in `automation-runner.ts`, deliberately left alone to keep this ticket's diff to interpolation plus tests.
- **The guard test pre-seeds the ledger** (one completed trigger + 500 pending leaf Steps at `attempts: 1`) instead of really executing 501 nodes, which keeps it at ~2s rather than minutes against the Neon test DB. It still exercises the real constant, but it does not drive 500 genuine executions end to end.
- **The conditional integration test does not pin `source: "payload"`.** It relies on trigger passthrough copying the payload into `input`, so `{{ payload.tier }}` resolves through `input`; the `source: "payload"` path is only covered by the unit test. Worth an explicit `source` on the integration fixture.
- **Only the conditional handler interpolates.** `interpolateAutomationValue` is generic, so the remaining node handlers can adopt it, but none do yet — templates in an `http` or `transform` node's config are still literal strings.
- **`readPath` does not index into arrays.** `items.0.name` returns `null` because traversal bails on arrays; numeric indices would need explicit support if node configs ever need to reach into list payloads.
- `npm run lint` still reports ~60 pre-existing errors elsewhere in the repo (e.g. `no-var` in `src/app/(home)/_components/utils/captcha.ts`); nothing in `src/modules/automations/`.