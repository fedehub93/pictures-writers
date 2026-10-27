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

## Media

**Media**:
The logical identity of one uploaded file in the library: its name, type, storage key, size, checksum, alt text, and the manifest of the renditions derived from it. One Media per original file; content references the Media, never a rendition.
_Avoid_: Asset, file, attachment when referring to the library entity; using Media for a derived rendition.

**Media type**:
The kind of file a Media holds - image, video, audio, document - which decides what metadata is meaningful and whether the file is processed at all.
_Avoid_: Kind, media category; MIME type, which is a property of the file rather than the library category.

**Media rendition**:
A derived copy of a Media's original at one fixed width and format, produced once, stored as its own object under the Media's storage key, and never authored or referenced by content.
_Avoid_: Variant, size, thumbnail, transformed image.

**Media profile**:
A named entry in the rendition ladder, pairing a use in the interface with the widths and formats generated for it. Selecting a profile for a content role is configuration; the numbers behind it are code.
_Avoid_: Preset, variant.

**Storage key**:
The stable, storage-agnostic path identifying an object inside the media bucket, from which the provider URL is derived. A Media keeps the original's key; a rendition derives its own from it.
_Avoid_: Path, filename, URL when referring to the identifier.

**Storage driver**:
The adapter that writes, deletes and addresses objects for one storage Provider. One per installation, chosen by configuration.
_Avoid_: Provider, which is the external service; storage integration, which would be the Provider plus its stored secrets.

**Media revision**:
A counter on a Media that changes when its original file is replaced, giving every rendition a new storage key so no cache can serve the previous file.
_Avoid_: Version, reserved for the reviewed revisions of Post, Page and Product.

**Archived media**:
A Media hidden from the library while remaining served and referenceable by published content. Permanent deletion is a separate, manual act that removes its whole storage prefix.
_Avoid_: Deleted, trashed, soft-deleted as a model concept.

## Forms

**Form**:
A reusable form definition stored in the CMS, whose fields and content drive the public submission UI and whose submissions are recorded per Form. A Form can be embedded in pages and products, and Automations can subscribe to its submissions.
_Avoid_: Modulo, contact form when referring to the CMS entity.

**Form element**:
A configurable unit inside a Form definition — a field, a layout, or a display block. It has a public rendering part, a designer canvas part, and a properties-editing part.
_Avoid_: Field when referring to layouts or display blocks.

**Form runner**:
The public-facing engine that renders a Form definition and collects submissions. Distinct from the form designer used in the backoffice.
_Avoid_: Form renderer when referring to the runtime engine.

**Form designer**:
The backoffice drag-and-drop interface where a Form definition is composed and configured.
_Avoid_: Form builder when referring to the UI surface specifically.

**Properties component**:
The backoffice UI for editing the configuration of a single Form element, such as labels, validation rules, or rich default content.
_Avoid_: Settings panel, edit panel.

**Designer component**:
The backoffice UI representation of a Form element inside the drag-and-drop canvas.
_Avoid_: Canvas item, preview card.

**Form component**:
The public UI representation of a Form element as shown to visitors.
_Avoid_: Input component when referring to non-field elements.

**Form schema**:
The validation rules derived from a Form definition and used when a submission is validated.
_Avoid_: Validation object, Zod schema when referring to the concept.

**Initial value**:
The default value assigned to a Form element when a new submission begins.
_Avoid_: Default field value.

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

## Email accounts and conversations

**Marketing email**:
A bulk or segmented send to subscribers, implemented through `EmailSingleSend` or automations. Not counted against `maxEmailsPerDay`.
_Avoid_: Newsletter when referring to the CMS entity; broadcast when the distinction from one-to-one matters.

**Transactional email**:
An automatic or one-to-one email tied to a specific interaction (order, conversation, confirmation). Counted against `maxEmailsPerDay`.
_Avoid_: System email when the limit applies.

**Email account**:
An email address managed by the CMS for inbound and outbound conversations. It belongs to the globally configured provider and has a receiving address, display name, and signature. It can be enabled for one or more backoffice users.
_Avoid_: Mailbox, inbox when referring to the CMS entity.

**Email account permission**:
The association between a backoffice user and the `EmailAccount` records they may use.
_Avoid_: Account assignment.

**Conversation**:
A sequence of inbound and outbound emails between an external contact and an `EmailAccount`, grouped by the contact's email address and belonging to one `EmailAccount`.
_Avoid_: Thread, ticket when referring to the CMS entity.

**Inbound email**:
A message received through a provider webhook and associated with an `EmailAccount` based on the `to` address.
_Avoid_: Received message when the direction matters.

**Outbound one-to-one email**:
A message sent manually by an admin to an email address through an `EmailAccount`. Distinct from marketing sends.
_Avoid_: Direct message, reply when the entity is a stored email.

**Email attachment**:
A file attached to an inbound or outbound email, persisted in application storage and owned by its parent `EmailMessage`.
_Avoid_: File, upload when the context is email.

**Unread conversation**:
A conversation that has received a new inbound email not yet seen by a given backoffice user. Read state is personal: two users with access to the same email account may see the same conversation as unread and read respectively.
_Avoid_: New message when referring to the conversation state; unread inbox when the scope is per-user.

**Conversation read state**:
Per-backoffice-user information about a conversation: whether its inbound mail has been read and whether that user starred it. It is personal and never changes what other users see.
_Avoid_: Seen flag, unread flag when referring to the stored state (the flag is derived).

**Mailbox view**:
One of the named ways of looking at the mail of an Email account — Inbox, Sent, Starred, Archive, Trash. A view is a query, not a container: messages are never moved into one, and a conversation appears in every view whose rule it satisfies.
_Avoid_: Folder, label, mailbox when referring to the view.

**Inbox**:
The Mailbox view of conversations that are neither archived nor deleted.
_Avoid_: Mailbox, folder when referring to the view.

**Sent**:
The Mailbox view listing outbound one-to-one messages, newest first, across conversations. Distinct from a Conversation, which groups inbound and outbound mail by contact.
_Avoid_: Outbox; sent conversations.

**Archive**:
The Mailbox view of conversations whose triage is finished. Archiving removes a conversation from the Inbox without deleting it.
_Avoid_: Done, closed.

**Trash**:
The Mailbox view of deleted conversations, where a conversation can be restored or permanently deleted.
_Avoid_: Bin, recycle bin.

**Starred conversation**:
A conversation a backoffice user marked as important to them. The star is personal state and never changes what other users see.
_Avoid_: Flagged, important when referring to the stored state.

**Shared triage**:
The rule that archiving, restoring, and permanently deleting a conversation act on the conversation itself, so they affect every backoffice user who can access its Email account. Read state and star are personal and exempt.
_Avoid_: Team state; shared read.

**Filtered**:
The mailbox navigation group that gathers views narrowing the mail rather than listing a mailbox: Starred and Archive. It is a presentation grouping, not a Mailbox view.
_Avoid_: Folder group; custom mailbox.

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

## External integrations

**Provider**:
An external service a CMS feature talks to, identified by the service itself rather than by the credentials used to reach it (email, file storage, analytics, payments, consent management).
_Avoid_: Vendor, integration when referring to the service.

**Integration**:
The site's configuration for one Provider: the Provider it targets, whether it is active, its non-secret configuration, and, when the Provider needs them, its stored secrets. Secrets are optional: a Provider such as a consent manager may be configured entirely through public identifiers and declare no secret fields at all.
_Avoid_: Connection (reserved for Automations), account, settings.

## Admin dashboard

**Dashboard widget**:
A self-contained unit displayed on the admin dashboard, whose visibility is governed by the permission it declares and which the backoffice user may reorder, remove, re-add, configure, and rename. It shows the default title and description of its Widget definition, and the active Widget filters, unless the user gives it a title override. Distinct from the Site widget rendered on the public site.
_Avoid_: Widget when the dashboard is in scope; card, panel, module.

**Widget definition**:
The catalog entry describing one kind of Dashboard widget — its identity, the group it belongs to, the permission it requires, its default title and description, its default size preset, and, when it is configurable, the config schema it exposes. The Dashboard widget is an instance of a definition: the definition is author-time, the widget is what the user arranges. Definitions are code, not database rows, and each belongs to the module whose data its widget presents.
_Avoid_: Widget type, widget kind.

**Widget size preset**:
One of the discrete sizes — small, medium, full — a Widget definition seeds a newly added Dashboard widget with, and the step by which a widget is resized without a pointer. A Dashboard widget's actual size is its place on the grid; the preset is only the size it started from and a keyboard-resize step.
_Avoid_: Widget size when referring to a widget's concrete grid placement.

**Widget title override**:
The display title a backoffice user gives a Dashboard widget, replacing the default title its Widget definition provides on the card. A title override starts empty and clearing it reverts the widget to its default title. Distinct from the definition's default title, which every instance of that kind shares and which can itself depend on the instance's subject.
_Avoid_: Label, custom name, alias.

**Widget group**:
The presentation category the widget library sorts Widget definitions into (Content, Shop, Automations, Analytics), used to browse the library. It is a library taxonomy, distinct from the fascia a widget belongs to (operational or analytics) and from the permission that gates it.
_Avoid_: Category, module when the library grouping is in scope.

**Metric**:
A named, permission-scoped time series of CMS data (e.g. contact growth, form submissions, ebook downloads, revenue) exposed by the dashboard's metric registry. The Trend widget renders exactly one Metric at a time.
_Avoid_: Statistic, chart, report, KPI.

**Widget filter**:
A narrowing of a Dashboard widget's data chosen per instance — a subset of forms, content statuses, scheduled action types, order statuses, or review publication states. A filter is optional; when it is left wide open the widget is unfiltered and shows none. Distinct from the Metric a Trend instance renders, which is the widget's subject (named in its title) rather than a restriction on the data.
_Avoid_: Config, query, parameters, options.

**Dashboard layout**:
The positioned arrangement of Dashboard widgets a backoffice user has placed on their dashboard — each widget occupying its own place and size on a shared grid — filtered to the Widget definitions permitted to that user. A user who has placed none has an empty dashboard; there is no seeded default.
_Avoid_: Dashboard config, dashboard settings, default layout; ordered list when referring to the layout model.

**Site widget**:
A configurable block rendered on the public site (hero, popup, post sidebar or bottom), managed under the public Widgets area. Distinct from the Dashboard widget.
_Avoid_: Widget when the dashboard is in scope.
