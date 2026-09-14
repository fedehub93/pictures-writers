# 06: Permission-aware admin surface

**What to build:**
Apply the shared authorization policy across the admin navigation, pages, actions, and dashboard widgets so the backoffice surface reflects the current user’s permissions while retaining server-side enforcement.

**Blocked by:** 01 - Permission-backed authorization foundation; 02 - Role management

**Status:** ready-for-agent

- [ ] Sidebar entries are hidden when the current user lacks the relevant `read` permission.
- [ ] Admin pages reject direct access when the current user lacks the relevant permission.
- [ ] Create, update, publish, manage, and other actions are hidden or disabled when unauthorized.
- [ ] Dashboard widgets inherit the permission of their parent area.
- [ ] UI filtering is backed by server-side checks and cannot be bypassed through direct requests.
- [ ] Existing `ADMIN` access remains complete after the rollout.
