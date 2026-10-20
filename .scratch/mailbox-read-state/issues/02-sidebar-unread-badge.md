# 02: Sidebar unread badge

**What to build:** An unread badge on the Inbox entry of the admin sidebar, summing unread conversations across every email account the current user can access and refreshing every 30 seconds.

**Blocked by:** 01 Personal read state foundation

**Status:** ready-for-agent

- [ ] `use-mailbox-counts` wraps `conversations.getCounts` with a 30-second `refetchInterval`, following `use-notifications-query.ts`.
- [ ] The Inbox sidebar item renders a count badge; no other nav item does.
- [ ] The badge is hidden when the count is zero and when the user lacks `mail.read`.
- [ ] `NavItem` (or the nav rendering) gains an optional badge slot without making `nav-data.ts` fetch anything.
- [ ] Read, star, archive and delete mutations invalidate the counts query so the badge updates after an action.
- [ ] Rendering test covers the badge when present, absent and zero.

## Comments
