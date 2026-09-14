# Pictures Writers

Glossary for the blog post editing context, including editorial content and desktop navigation.

## Post editing

**Post**:
An editorial document managed in the blog CMS, including its content, metadata, SEO settings, and publishing state.
_Avoid_: Article when referring to the CMS entity.

**Scheduled publication**:
A publication instruction that makes the latest saved eligible version of a Post public at a future date and time chosen by the editor.
_Avoid_: Delayed post, queued article.

**Heading**:
A structural title inside post content. For the admin outline, headings are the Tiptap `h2`, `h3`, and `h4` blocks.
_Avoid_: Section title when referring to the content node.

**Outline**:
A temporary desktop navigation view derived from the headings in the active Tiptap post editor. It is not persisted as part of the post.
_Avoid_: Table of contents when referring to the admin editing aid.

**Tiptap editor**:
The single rich-text editor for editorial content (posts, product descriptions). It produces structured JSON content and is the source of the admin outline.
_Avoid_: Public table of contents.

**SEO panel**:
The post editing area for search metadata such as title, description, canonical URL, social metadata, and indexing directives.
_Avoid_: SEO outline when referring to the contextual helper displayed beside the panel.

**TableContentNode**:
A persistent Tiptap content node that can be inserted into a post for public display. It is separate from the temporary admin outline.
_Avoid_: Outline when referring to persisted post content.

## Public rendering

**On-demand revalidation**:
The mechanism (`revalidatePath`) that regenerates and re-caches a public route at publish/edit time so content changes go live without a full application build.
_Avoid_: Rebuild, deploy-on-publish when referring to the retired webhook-build flow.

**Route-level invalidation**:
Invalidating a whole URL path (or segment, via `revalidatePath(path, 'layout')`) rather than individual cached data. This is the chosen granularity because public pages read directly from the database.
_Avoid_: Tag-based invalidation when referring to the chosen approach.

**ISR backstop**:
The coarse time-based `revalidate` value on public routes (24h) that self-heals content if an on-demand revalidation is missed. It is a safety net, not the source of freshness.
_Avoid_: Cache TTL when referring to the strategy.

## Backoffice users and authorization

**Backoffice user**:
An identity managed by the CMS that is allowed, or may be allowed in the future, to access the `/admin` area. This context does not currently include public-site users.
_Avoid_: Customer or visitor when referring to a CMS backoffice identity.

**Role**:
A named, reusable set of permissions assigned to one or more backoffice users. A backoffice user has one role in the initial module. `ADMIN` is the only protected system role. Other roles, including the seeded `EDITOR` role, may be configured by administrators.
_Avoid_: User type when referring to an authorization profile.

**Permission**:
An authorization to perform one action within one backoffice area, such as reading or updating users.

**Backoffice area**:
A functional part of the CMS to which permissions apply, such as users, posts, settings, or dashboard widgets. The initial authorization scope is area and action, not individual records.

**Suspended account**:
A backoffice user account that remains stored but cannot authenticate or access the backoffice. Suspension replaces physical deletion for the initial user-management module.
_Avoid_: Deleted user when the account is retained.

**Invitation**:
A time-limited email flow through which an administrator enables a new backoffice user to establish their account credentials and profile.
An invitation is a separate pending entity and becomes an account only after acceptance. Expired and cancelled invitations remain historical records but cannot be used.

**Administrative activity**:
A record of a sensitive user-management or authorization operation and the backoffice user who performed it.
Activities are retained indefinitely in the initial module and exclude passwords, tokens, invitation links, and other secrets.

**Account status**:
The lifecycle state of a backoffice user: `pending` while an invitation is not accepted, `active` after activation, and `suspended` when access is disabled. Invitation expiry is a state of the invitation, not a permanent account status.

**Authorization policy**:
The server-side rule that evaluates a backoffice user’s role and permissions. It is the single security boundary shared by admin pages, tRPC procedures, and REST endpoints.
