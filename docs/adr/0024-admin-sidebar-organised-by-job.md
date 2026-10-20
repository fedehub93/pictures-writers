# The admin sidebar is organised by job, not by feature

The admin sidebar groups entries into sections named after the work the backoffice user is doing — Content, Marketing, Shop, Automations, Settings, Access — instead of the feature-shaped buckets it grew into (Blog, Shop, Tools, Others). Dashboard and Inbox sit above the sections as one-click destinations, and every section is a flat list: there is no third level of navigation, and a section label never becomes part of a URL.

We chose this because the old structure forced the user to decode the codebase: "Tools" held mails, ads, forms, automations, integrations and settings; "Blog" held pages, media and widgets; and the Conversations inbox was buried two clicks deep under Mails > Conversations because marketing email and one-to-one mail happened to share a module. The section a feature sits in is a navigation concern, not a domain one, which is why `/admin/ads`, `/admin/forms` and `/admin/integrations` keep their URLs while their sidebar entry lives under Marketing or Settings. Keeping URLs stable where they already name a single resource also keeps every existing link and permission key valid: permission keys describe functional areas (`templates.read`, `mail.read`) and do not change when the menu is reorganised.

**Considered Options**
- Mirroring the sidebar hierarchy in the URL space (`/admin/content/posts`, `/admin/marketing/ads`) — rejected: it moves stable, working routes for a purely presentational gain and makes the URL say the same thing twice.
- One "System" bucket for configuration, integrations, email plumbing and access — rejected: it recreates the "Others" dumping ground under a better name.
- Keeping the collapsible Mails node with Marketing and Conversations subgroups — rejected: it is the only three-level branch, and "Conversations" is a module detail, not something an admin looks for; the inbox is a daily destination and deserves one click.
- Permanent redirects for the mail routes that did move — rejected: the admin area is not public, so no bookmarks or indexed URLs need preserving. The redirects added by the previous Mails split were removed along with them rather than repointed.

**Consequences**
- A new section is a label in `nav-data.ts`; it never requires moving a route.
- Navigation depth is capped at two levels by the data type, and `NavGroup` no longer exists.
- Moving a page between sections is a nav-data edit plus, where the page prints its own section, the matching header string; moving its URL remains a separate, deliberate decision.
- The current entry is highlighted by the most specific matching URL, so parent and child entries never light up together.
- The unread-conversation badge on Inbox is a follow-up: the entry exists now without a counter.
