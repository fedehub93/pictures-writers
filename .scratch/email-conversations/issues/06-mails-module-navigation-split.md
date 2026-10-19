# 06: Mails module navigation split

**What to build:** The Mails module is reorganized into two macro sections — **Marketing** (Templates, Audiences, Contacts, Single Sends) and **Conversations** (Inbox, Accounts) — with working navigation and clear separation.

**Blocked by:** 02 EmailAccount admin CRUD and permissions, 03 Inbox read UI

**Status:** resolved

- [x] Admin navigation under Mails shows two groups: Marketing and Conversations.
- [x] Existing mail features (Templates, Audiences, Contacts, Single Sends) are grouped under Marketing.
- [x] Inbox and Accounts are grouped under Conversations.
- [x] Routes and page titles reflect the new grouping.
- [x] Navigation tests verify the menu structure and that each item lands on the correct page.

## Comments

Delivered:

- `src/app/(admin)/_components/sidebar/nav-data.ts` — the sidebar nav tree extracted from `AppSidebar` as pure data (`navData`) with `NavItem` / `NavGroup` / `NavObject` types and a testable `filterNavData(data, permissionKeys)` that filters leaf items and group items by permission and drops parents whose children are all hidden. Mails now renders two groups — **Marketing** (Templates, Audiences, Contacts, Single Sends) and **Conversations** (Inbox, Accounts) — with Settings kept outside the groups.
- `src/app/(admin)/_components/sidebar/nav-main.tsx` — renders the new `groups` as labelled sub-sections inside a collapsible parent (existing `items` still render as before).
- `src/modules/mails/lib/sections.ts` — `MAIL_SECTIONS` (`Marketing` / `Conversations`) as the single source of truth, shared by the nav and the page headers.
- Routes moved under route groups with `git mv`: `marketing/{templates,audiences,single-sends}`, `conversations/{inbox,accounts}`, plus a new `marketing/contacts`. Every page sets a grouping-aware `metadata.title` (e.g. `Email Templates · Marketing`, `Inbox · Conversations`) and its `ContentHeader` gained a `section` eyebrow; `ContentHeader` only changes layout when a `section` is present, so the other list headers are untouched.
- `marketing/contacts` reuses `ContactsView` with the existing `ALL` sentinel (`ALL_AUDIENCES_ID`) so a Contacts entry can live directly under Marketing; the audience-scoped Import action is hidden on that view.
- All internal links updated (templates/audiences/single-sends actions + dialogs, scheduler's `describeScheduledAction`, calendar-query test) and `next.config.mjs` gained permanent redirects from the old paths.
- Coverage: `nav-data.test.ts` (10) — group labels/order, Marketing + Conversations membership and URLs, Settings placement, distinct URLs, that every Mails URL resolves to an on-disk `page.tsx`, and permission filtering (partial, empty group, dropped parent, full access). Scheduler calendar test updated for the new single-send URL.
- Verified: full suite (1126 tests) green, `npx tsc --noEmit` clean, repo lint unchanged at its pre-existing 47 errors (0 errors introduced).

Notes:

- Old URLs redirect permanently to the new ones; existing bookmarks to `/admin/mails/audiences` (previously labelled "Contacts") now land on the Audiences list, which is where that route always pointed.
- "Contacts" needed a top-level page to be a Marketing nav item; it reuses the existing contacts view with the `ALL` sentinel rather than adding a new query.

