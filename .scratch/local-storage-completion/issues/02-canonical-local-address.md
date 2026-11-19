# 02: Canonical local media address

**What to build:** The local driver always composes the canonical relative `/media/<key>` address. The public-prefix environment variable is removed, so an Installation cannot configure a prefix that the delivery route cannot serve. A leftover value in an environment file has no effect.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] No configuration, documentation or environment sample exposes a configurable local public prefix.
- [ ] The local driver composes `/media/<key>` for originals and renditions, and the delivery route serves those addresses.
- [ ] A leftover public-prefix value has no effect on any address.
- [ ] Tests assert the address shape and the absence of the variable.
- [ ] The environment appendix is updated.
