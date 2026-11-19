# 09: No user path touches a storage provider

**What to build:** The browser stops shipping a storage provider's client. The provider's file router and the three endpoints that no longer have a caller disappear, and the legacy upload branch a provider used to feed goes with them. After this, an Installation with no token has no provider code in any path a visitor, an admin or a form submitter can reach.

**Blocked by:** 05, 06, 07

**Status:** ready-for-agent

- [ ] The provider's client library is no longer imported by any client component.
- [ ] The provider's file router and its public route are gone.
- [ ] The three endpoints without a caller and the legacy JSON upload branch are gone.
- [ ] Every upload the product offers still works on an Installation with no token.
- [ ] The client bundle carries no provider code, and the provider token is read only on the server.
- [ ] A remaining reference to a provider host in stored content is reported by the sweep rather than silently tolerated.
