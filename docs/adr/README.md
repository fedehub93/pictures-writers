# Architecture Decision Records

One file per decision, numbered from `0001`. Each records the context, the
decision, the options considered and the consequences, so a later reader can
tell why the code looks the way it does.

**Read this index, not the folder.** Open the ADRs whose subject matches the
work — usually the ones for its area — and follow `supersedes` / `refines` links
when the decision you are touching has a chain. Read a superseded ADR only when
you need the history of the decision that replaced it; don't read the whole
folder.

**Status legend**

- `accepted` — in force.
- `superseded by NNNN` — historical; the replacement is authoritative.
- `—` — predates the Status convention; no status is recorded (see the note at
  the bottom).

## Content, publishing and media

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](./0001-on-demand-revalidation.md) | On-demand revalidation for public content instead of full rebuilds | accepted (updated 2026-11 for Site regions) |
| [0002](./0002-faq-generic-model.md) | Generic `Faq` model instead of entity-specific FAQ tables or a shared library | accepted |
| [0011](./0011-root-plus-version-for-page.md) | Split the Page model into `PageRoot` + `PageVersion` (pilot) | accepted |
| [0012](./0012-taxonomy-is-not-versioned.md) | Taxonomy is not versioned | accepted |
| [0013](./0013-root-plus-version-for-post.md) | Split the Post model into `PostRoot` + `PostVersion` | accepted |
| [0014](./0014-root-plus-version-for-product.md) | Split Product into `ProductRoot` + `ProductVersion`, and take `ProductCategory` out of versioning | accepted |
| [0026](./0026-media-storage-seam-and-pregenerated-renditions.md) | Media storage seam and pregenerated renditions | accepted (revised 2026-11: delivery is an application route, driver recorded per Media, mixed library accepted) |

## Forms and public bundle

| ADR | Decision | Status |
| --- | --- | --- |
| [0027](./0027-lazy-load-form-properties.md) | Lazy-load form element properties in the public bundle | — |
| [0028](./0028-no-explicit-prefetch-and-third-party-scripts.md) | No explicit prefetch on public links; GTM stays `afterInteractive` | — |
| [0029](./0029-ci-bundle-budget.md) | CI bundle budget from the Turbopack analyzer | — |
| [0030](./0030-zod-mini-for-public-client-forms.md) | Zod Mini for public client forms | — |

## Admin dashboard

| ADR | Decision | Status |
| --- | --- | --- |
| [0015](./0015-dashboard-widgets-code-defined-registry.md) | Dashboard widgets are code-defined via a registry, with a per-user JSON layout | accepted (revised: the registry is a catalog owned by the domain modules, not a default layout) |
| [0016](./0016-dashboard-always-arrangeable-auto-save.md) | The dashboard is always arrangeable, and layout changes are auto-saved | superseded by [0019](./0019-dashboard-explicit-edit-mode.md) |
| [0017](./0017-dashboard-grid-fills-rows-by-stretching.md) | The dashboard grid fills each row by stretching its last widget | superseded by [0018](./0018-dashboard-positioned-grid.md) |
| [0018](./0018-dashboard-positioned-grid.md) | The dashboard layout is a positioned two-dimensional grid | accepted; supersedes [0017](./0017-dashboard-grid-fills-rows-by-stretching.md) |
| [0019](./0019-dashboard-explicit-edit-mode.md) | The dashboard has an explicit edit mode | accepted; supersedes [0016](./0016-dashboard-always-arrangeable-auto-save.md) |
| [0020](./0020-dashboard-widget-body-clips-and-scrolls.md) | A Dashboard widget's body clips and scrolls inside its card | accepted |
| [0021](./0021-dashboard-actions-as-floating-buttons.md) | The dashboard's add and edit actions are floating buttons | accepted; refines [0019](./0019-dashboard-explicit-edit-mode.md) |

## Admin, users and authorization

| ADR | Decision | Status |
| --- | --- | --- |
| [0024](./0024-admin-sidebar-organised-by-job.md) | The admin sidebar is organised by job, not by feature | — |
| [0025](./0025-personal-read-state-shared-triage.md) | Personal read state, shared triage | accepted |

## Email, contacts and consent

| ADR | Decision | Status |
| --- | --- | --- |
| [0007](./0007-separate-consent-from-verification.md) | Separate marketing consent from address verification | accepted |
| [0008](./0008-consent-policy-at-mail-effect-boundary.md) | Keep consent out of the generic mail primitives; enforce it as a delivery policy | accepted |
| [0009](./0009-provider-native-unsubscribe-on-broadcasts.md) | Keep the provider-native unsubscribe on single-send broadcasts; the app owns consent for sequences | accepted |
| [0022](./0022-global-provider-multiple-email-accounts.md) | Global email provider with multiple conversation accounts | — |
| [0031](./0031-consent-provider-in-integrations.md) | Consent provider lives in Integrations; public configuration fails open | — |
| [0033](./0033-sandboxed-iframe-for-email-bodies.md) | Render email bodies in a sandboxed iframe | accepted |
| [0034](./0034-email-address-is-contact-identity.md) | Email address is the Contact identity, compared case-insensitively | accepted |
| [0035](./0035-reconfirmation-restores-consent.md) | Re-confirmation restores consent | accepted |

## Automations

| ADR | Decision | Status |
| --- | --- | --- |
| [0003](./0003-inhouse-run-engine.md) | In-house DB-backed run engine instead of a workflow vendor | accepted |
| [0004](./0004-automation-tables-and-snapshot.md) | Normalized node/connection tables with a published snapshot instead of a versioned JSON blob | accepted |
| [0005](./0005-domain-agnostic-engine.md) | Domain-agnostic engine: dedup via opaque idempotency key | accepted |
| [0006](./0006-site-time-zone-and-wait-anchoring.md) | Site time zone for scheduled features, with Wait anchored to wall-clock time | accepted |
| [0010](./0010-run-cancellation.md) | Run cancellation is terminal, passive, and frees the idempotency key | accepted |

## Site layout and Puck

| ADR | Decision | Status |
| --- | --- | --- |
| [0037](./0037-site-regions-as-versioned-entities.md) | Site regions as first-class versioned entities | accepted |
| [0038](./0038-responsive-visibility-on-the-block.md) | Responsive visibility lives on the block | accepted |
| [0039](./0039-one-breakpoint-ladder.md) | One breakpoint ladder for authoring, CSS and the navbar | accepted (revised: the Image default is a natural size) |
| [0040](./0040-one-element-tree-in-canvas-and-page.md) | One element tree in the canvas and on the page | accepted |
| [0041](./0041-inline-text-editing-in-puck-blocks.md) | Inline text editing in the Puck text blocks, with a block toolbar instead of a selection bubble | accepted (revised: drag and the caret corrected by [0042](./0042-text-editing-mode-and-the-canvas-lock.md)) |
| [0042](./0042-text-editing-mode-and-the-canvas-lock.md) | A text block is locked until an explicit text editing mode; the lock covers the overlay portal | accepted; corrects [0041](./0041-inline-text-editing-in-puck-blocks.md) on drag and the caret |
| [0043](./0043-button-variant-is-data-not-a-class.md) | One Button block, whose variant is a set of props rather than a class | accepted (partially superseded: the variant stays a prop, its look moves to a class of Style variables — [0045](./0045-block-starting-look-is-a-class-of-style-variables.md)) |
| [0044](./0044-size-and-spacing-style-fields.md) | One block box, split into Size and Spacing fields over one class and one set of variables | accepted |
| [0045](./0045-block-starting-look-is-a-class-of-style-variables.md) | A block's starting look is a class of Style variables, not an inline copy per instance | accepted; partially supersedes [0043](./0043-button-variant-is-data-not-a-class.md) |
| [0046](./0046-one-layout-block.md) | One layout block: a container's display mode is a property, not a block type | accepted |
| [0047](./0047-panel-controls-carry-their-own-fill.md) | The properties panel's controls carry their own fill instead of inheriting the surface | accepted |

## Platform, integrations and tenancy

| ADR | Decision | Status |
| --- | --- | --- |
| [0023](./0023-integration-is-the-only-credential-source.md) | The Integration row is the only credential source | — |
| [0032](./0032-self-hosted-hetzner-coolify.md) | Self-host the application on a Hetzner VPS with Coolify | accepted |
| [0036](./0036-one-image-runtime-configuration.md) | Build one image and configure each Installation at runtime | accepted |

## Adding an ADR

- Take the next number; never renumber or delete an old ADR.
- Give it a `**Status**:` line (`accepted`, `superseded by [NNNN](./...)`).
- Link the decision it replaces or refines, in both files.
- Add its row to the table for its area, above.

> **Note:** ADRs 0022, 0023, 0024, 0027, 0028, 0029, 0030 and 0031 were written
> before the Status convention and carry no status line. They are still live
> decisions; the absence of a status means "never superseded", not "unknown".
