# 07: Legacy API hardening and authorization convergence

**What to build:**
Bring the existing user REST endpoints under the shared authorization boundary while new user-management operations use the tRPC path. Remove sensitive response leakage and mass-assignment risks, and reduce divergent authentication/authorization implementations without breaking supported callers.

**Blocked by:** 01 - Permission-backed authorization foundation; 03 - Backoffice user directory and account controls; 04 - Invitation onboarding and password recovery

**Status:** ready-for-agent

- [ ] User REST reads require the correct authentication and permission.
- [ ] User responses use explicit safe field selections and never expose passwords or tokens.
- [ ] User updates accept only explicitly allowed fields.
- [ ] REST and tRPC user operations apply the same authorization decisions.
- [ ] New user-management operations are available through the tRPC contract.
- [ ] Existing supported callers continue to receive compatible success and error behaviour.
- [ ] No user-management endpoint permits an authorization bypass.
