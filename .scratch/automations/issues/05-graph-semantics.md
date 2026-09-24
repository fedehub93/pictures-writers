# 05: Graph semantics — connections, fan-out, per-token, conditional node

**What to build:** The real graph executor on top of the linear runner. Connections drive traversal: fan-out is allowed (one node's output fans to many successors), and a node with multiple incoming connections produces one Step per arriving token (per-token semantics, no joins). The Conditional node evaluates against incoming/payload data and routes via its `true`/`false` outputs. A runtime guard cancels a Run that exceeds 500 node executions; cycles are rejected at validation.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] A linear chain of nodes executes in order through connections and terminalizes correctly.
- [ ] Fan-out from one node to two successors runs both branches; both Step records appear in the ledger.
- [ ] The Conditional node routes between `true` and `false` outputs based on interpolation of payload/previous outputs; only the matched branch executes.
- [ ] A node with two incoming tokens produces one Step per token, each with its own input snapshot.
- [ ] A run exceeding the 500-execution guard is canceled with a clear error in its status.
- [ ] Integration tests cover chain, fan-out, conditional split, per-token multi-input, and the guard.