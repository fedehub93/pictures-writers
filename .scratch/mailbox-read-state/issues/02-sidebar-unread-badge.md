# 02: Sidebar unread badge

**What to build:** An unread badge on the Inbox entry of the admin sidebar, summing unread conversations across every email account the current user can access and refreshing every 30 seconds.

**Blocked by:** 01 Personal read state foundation

**Status:** resolved

- [x] `use-mailbox-counts` wraps `conversations.getCounts` with a 30-second `refetchInterval`, following `use-notifications-query.ts`.
- [x] The Inbox sidebar item renders a count badge; no other nav item does.
- [x] The badge is hidden when the count is zero and when the user lacks `mail.read`.
- [x] `NavItem` (or the nav rendering) gains an optional badge slot without making `nav-data.ts` fetch anything.
- [x] Read, star, archive and delete mutations invalidate the counts query so the badge updates after an action.
- [x] Rendering test covers the badge when present, absent and zero.

## Comments

- `useMailboxCounts(enabled)` wraps `conversations.getCounts.queryOptions(undefined, { refetchInterval: 30_000 })`. `AppSidebar` enables it only when the user holds `mail.read`, so users without the permission do not make a forbidden request; the Inbox item is also filtered out of their nav.
- `NavItem` gains `badgeKey?: NavBadgeKey`, with `mail-unread` set only on Inbox. `NavBadgeCounts` values are supplied by `AppSidebar`, keeping `nav-data.ts` free of fetching.
- `NavBadge` renders nothing for `undefined` or `0`, and an accessible count bubble otherwise. Tests cover present, absent and zero (`sidebar/__tests__/nav-badge.test.tsx`), plus a nav-data assertion that only Inbox is badged.
- Archive (`useSetConversationArchived`) and delete (`useRemoveConversation`) now invalidate `conversations.getCounts`. The read and star mutations do not exist yet; tickets 03 and 04 introduce them and already require `getCounts` invalidation, so they will reuse the same call.
- Verification: `npx tsc --noEmit` clean; targeted ESLint clean; full Vitest suite 143 files / 1221 tests green.

