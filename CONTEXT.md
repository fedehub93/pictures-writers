# Pictures Writers

Glossary for the blog post editing context, including editorial content and desktop navigation.

## Post editing

**Post**:
The logical identity of an editorial document in the blog CMS — equivalent to its root. It owns the stable slug, the first publication date, and the inbound references to it (ads, scheduling, widgets). Its content, metadata, authors, taxonomy links, FAQs, and SEO settings live on its versions.
_Avoid_: Article when referring to the CMS entity; using Post for a single revision.

**Post version**:
One revision of a Post's editable content (title, description, body, cover, authors, taxonomy links, SEO), with a status and a sequential number scoped to the Post. Editing the live version forks a new one; the live site changes only on publish.
_Avoid_: Draft when the version may be published; Post when referring to the revision.

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

**Table**:
A persistent Tiptap content node expressing tabular data as a rectangular grid of rows and columns, editable and rendered for public display in posts and product descriptions. Unlike Notion's database views, it is a plain data grid with no merged cells. Distinct from TableContentNode, which is an index of headings.
_Avoid_: TableContentNode when referring to a data grid; Grid or Data grid when referring to the editor node.

## Publishing state

**Published at**:
The moment a content version last became public. It is empty for content that has never been published, and it changes every time an already-published version is published again.
_Avoid_: Creation date, updated date when referring to this moment.

**First published at**:
The moment a content item first became public, shared by every later version of that item. It is empty until the first publication and never changes afterwards.
_Avoid_: Published at when referring to the latest publication.

**Current version**:
The most recent version of a content item, whether or not it is public. It is the version an editor works on and the one that represents the item in backoffice lists. Distinct from the live version, which is the published one.
_Avoid_: Latest version when referring to the live version.

**Live version**:
The version of a content item currently visible on the public site. A page's live version is the one referenced by its root's `liveVersionId`; unpublishing clears it. Distinct from the current version, which may be an unpublished draft.
_Avoid_: Latest version; published version when it could be confused with the current version.

**Root**:
The stable, logical identity of a content item, separate from its revisions. A root owns the stable slug, the first publication date, and the inbound references that must survive across revisions (ads, scheduling, widgets); it points at exactly one current version and, once published, one live version. Editorial relationships — SEO, authors, taxonomy links, FAQs — belong to the version, not the root. Implemented as `PageRoot`, `PostRoot`, and `ProductRoot`.
_Avoid_: Entity, parent, item when the identity/revision distinction matters.

**Version**:
One revision of a root: a snapshot of the mutable content (title, Puck data / body, status, publication dates, SEO, cover, authors, taxonomy links, FAQs) with a sequential number scoped to the root. Implemented as `PageVersion`, `PostVersion`, and `ProductVersion`. Editing a non-live version updates it in place; editing a live version forks a new version so the live site is unaffected until the new version is published.
_Avoid_: Revision when referring to the Prisma row; draft when the version may be published.

## Content versioning

**Versioning**:
The Root + Version model that separates a content item's stable identity from its revisions, so revisions can be drafted, published, and kept as history. It is reserved for long, frequently edited content, where protecting the live site from in-progress edits and preserving revision history has real value. Implemented for `Page`, `Post`, and `Product`. `ProductCategory`, like `Category` and `Tag`, is not versioned.
_Avoid_: applying versioning to short, rarely edited system records.

**Taxonomy**:
The blog's controlled vocabulary of Categories and Tags. Taxonomy is not versioned: a Category or Tag has no draft, publish, or history — there is one row per item, edited live, identified by a stable unique slug. Versioning is for long, frequently edited content; taxonomy is a set of stable system entities and opts out entirely.
_Avoid_: Category/Tag versions, draft category, publishing a tag.

**Category**:
A named grouping of Posts in the blog taxonomy. It is a single, directly-editable record (title, slug, description, SEO) with no revision model.
_Avoid_: Product category when referring to the shop grouping.

**Tag**:
A free-form label attached to Posts in the blog taxonomy. It is a single, directly-editable record with no revision model.
_Avoid_: Product category, Category when the distinction matters.

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

## Forms

**Form**:
A reusable form definition stored in the CMS, whose fields and content drive the public submission UI and whose submissions are recorded per Form. A Form can be embedded in pages and products, and Automations can subscribe to its submissions.
_Avoid_: Modulo, contact form when referring to the CMS entity.

## Contacts and subscriptions

**Contact**:
An email address captured by any public entry point (contact form, newsletter, lead magnet, product form), with no implication about consent or ownership.
_Avoid_: Lead, user, member when referring to the captured address.

**Subscriber**:
A Contact who consented to receive marketing email. Consent is revoked — not deleted — when they unsubscribe.
_Avoid_: Member, mailing-list entry, user.

**Verified address**:
A Contact whose address ownership was proven by following a link sent to that address. Capturing an address never verifies it; only confirmation does.
_Avoid_: Confirmed contact, validated email, double opt-in flag.

**Confirmation**:
The act by which a Contact follows the subscription link and becomes a Subscriber with a Verified address; it is the moment the `subscription.confirmed` trigger event fires.
_Avoid_: Opt-in, signup, soft opt-in.

## Email templates

**Email template**:
A reusable email design stored in the CMS, holding the visual layout and the rendered HTML that outgoing mail can start from. It is a standalone asset, not owned by any single send.
_Avoid_: Newsletter when referring to the CMS entity.

**Template duplication**:
The act of creating a new, independent Email template by copying an existing one's design. The copy carries over the content only — never the settings that link a template to a subscription flow — and is edited on its own from the moment it is created.
_Avoid_: Clone, version when referring to this action.

## Outgoing email

**Preheader**:
The short summary text an inbox shows alongside the subject line before the message is opened. It accompanies the subject on an outgoing email and is not part of an Email template's design.
_Avoid_: Preview text when referring to the concept (that is the UI label), summary line.

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

## Catalog

**Product**:
A sellable offering in the shop — an ebook, service, webinar, or affiliate link — managed in the CMS with its description, pricing, media, FAQs, SEO, and publishing state.
_Avoid_: Item, offering, listing when referring to the catalog entity.

**Product version**:
One revision of a Product's editable content (title, description, pricing, metadata, media, category link, form, FAQs, SEO), with a status and a sequential number scoped to the Product. Editing the live version forks a new one; the live site changes only on publish.
_Avoid_: Draft when the version may be published; Product when referring to the revision.

**Product category**:
A named grouping that organizes Products in the shop and drives the public shop listing. It is a single, directly-editable record with no revision model, like the blog's Category.
_Avoid_: Shop category, Category when referring to the blog taxonomy.

**Review**:
A customer testimonial attached to a Product, carrying a rating and an optional comment, shown publicly once published.
_Avoid_: Testimonial, rating, feedback when referring to the entity.

## Commerce

**Customer**:
A person or organization that buys or may buy products and services through the platform. Distinct from a Contact (just an email address) and from a Backoffice user (CMS identity). A Customer may have a name, email, phone, billing details, and optional notes. A Customer may exist without having placed an Order.
_Avoid_: User, subscriber, or contact when referring to the commercial buyer.

**Order**:
A commercial request by a Customer to buy one or more products or services. It has a lifecycle status, a total amount, one or more Order items, and zero or more Payments. An Order is created manually by a backoffice user or by an Automation.
_Avoid_: Purchase when referring to the new canonical order entity.

**Order item**:
A single line inside an Order: a product reference, a quantity, and the price/name snapshot taken at the time the Order was created.
_Avoid_: Cart item, product line.

**Payment**:
A record of money received or expected for an Order, with a method (offline, Stripe, etc.), a status, an amount, and a reference. One Order may have multiple Payments (deposits, refunds).
_Avoid_: Transaction, purchase.

**Order completion**:
The manual transition, performed by an authorized backoffice user, that moves an Order from a pending state to a completed state and records the corresponding Payment as received. It is the canonical business moment that triggers downstream events such as post-purchase automations and analytics.
_Avoid_: Closing the order, paid flag.

## FAQ

**Faq**:
A generic Prisma model storing a question-and-answer pair, linked to exactly one content entity (Product or Post) via optional foreign keys. Content is per-entity, never shared across entities.
_Avoid_: ProductFAQ, PostFAQ, FaqItem when referring to the Prisma model.

**FaqSection**:
The public accordion component that renders a list of Faqs on a page. Shared across products and posts.
_Avoid_: FAQ accordion when referring to the component.

**FaqPageJsonLd**:
The component that generates FAQPage JSON-LD structured data from a list of Faqs. Still parsed by AI answer engines and non-Google crawlers; Google no longer produces rich results from it (removed May 2026).
_Avoid_: FAQ rich result when referring to the component.

## Automation engine

**Automation**:
An authored, versioned workflow blueprint in the CMS: a set of Nodes joined by Connections, with the trigger that starts it. Built in the visual canvas editor and published as a snapshot.
_Avoid_: Workflow when referring to the CMS entity (the naming kept from the earlier tutorial model), flow.

**Node**:
An authored element of an Automation; either a Trigger (manual, cron, webhook, internal event) or an Action (conditional, wait, send email, http, llm, web search). Configured via position and data; may reference a Credential.
_Avoid_: Step when referring to the authored element.

**Connection**:
A directed link between two Nodes over which the source Node's output is delivered to the target Node's input. Multiple outgoing connections (fan-out) are allowed; cycles are rejected by the editor.
_Avoid_: Edge, Link.

**Trigger event**:
A typed, internal event emitted by a CMS module (e.g. `form.submitted`) that an Automation can subscribe to start a Run. The in-process counterpart of the external webhook trigger.
_Avoid_: Event hook, pub/sub event.

**Run**:
A single execution of an Automation, created when its trigger fires; owns a snapshot of the trigger payload and a ledger of Steps. There is no concept of a "paused execution": a waiting step is a Step with a resume time.
_Avoid_: Execution (ambiguous with deployment/CI), session.

**Step**:
The run-time record of one Node execution inside a Run: input/output snapshots, status, attempt count, resume time, and error. Distinct from Node, which is author-time.
_Avoid_: Task, Node when referring to a run-time record.

**Run cancellation**:
The terminal transition, performed by an authorized backoffice user, that moves a Run from `RUNNING` to `CANCELED` and skips its pending Steps. It never recalls a Step already in flight, and it frees the Run's idempotency key so the same trigger may start a new Run.
_Avoid_: Terminate, stop, or abort when referring to the action; "paused" Run.

**Published snapshot**:
The frozen copy of an Automation's graph that Runs execute; captured at publish time so editing the draft never affects running or historical executions.
_Avoid_: Version, revision.

**Credential**:
A stored, encrypted secret (API key, webhook secret) that Nodes reference by id. Secrets never live in Node configuration.
_Avoid_: API key when referring to the stored record.

**Idempotency key**:
The opaque string a caller passes to the trigger ingestion (`enqueueRun`) so the engine silently skips a Run when another Run with the same Automation and key already exists. Callers choose the key; the engine never interprets it.
_Avoid_: Dedup key, contact key.

**Site time zone**:
The single IANA time zone, configured once in site settings, in which scheduled features read wall-clock times — the Cron trigger's time of day and the Wait node's anchoring. Sites start in `Europe/Rome`; an unset or invalid value falls back to UTC.
_Avoid_: User time zone, server time zone, per-node time zone.

**Wait anchor**:
The rule that turns the Wait node's delay plus a time of day into a resume moment: N calendar days after the current wall date, at that time in the Site time zone, rolled forward one day when the moment has already passed.
_Avoid_: Absolute delay, countdown, offset.
