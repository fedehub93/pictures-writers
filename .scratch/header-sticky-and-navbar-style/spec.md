# Sticky header and NavbarBlock style controls

## Goal

Let an editor pin the Header region while the page scrolls, and make the navigation's labels and spacing configurable — while matching the plain look of the retired hardcoded navbar (no item surface, text-only hover/active).

## Background

The public header is the `HEADER` Site region rendered in `src/app/(home)/layout.tsx` inside a bare `<header>`; there is no header block. `RootEditor` is shared by the page editor, the Header region editor and the Footer region editor, and its fields are shown in the properties panel when nothing is selected.

`NavbarBlock` renders a shadcn `NavigationMenu` on desktop and a portaled `Sheet` on mobile. Its labels are hard-coded (`text-sm` inline, `text-base` in the sheet), its item spacing is a mix of `space-x-1` from the primitive and `gap-1` passed by the block, and every item inherits a surface from `navigationMenuTriggerStyle()` / `hover:bg-accent`. None of that is authorable.

See `CONTEXT.md` (Site layout → Sticky header) and `.scratch/site-regions/`, `.scratch/site-region-authoring/`, `.scratch/puck-editor-polish/` for the surrounding model.

## Decisions

- **Sticky, not `position: fixed`.** The switch applies `position: sticky; top: 0` to the `<header>` element, so the header stays in normal flow and `main` needs no reserved space. `position: fixed` was rejected because it removes the header from flow and requires a spacer whose height must track the header.
- **The switch is a property of the Header region root**, not of a block and not of the `SiteRegion` row. It is stored in the region version's `root.props`, so it is versioned, published, revalidated and rolled back with the rest of the header.
- **Only the Header editor exposes the field.** A header-specific root config is used by `editorConfigForRegion("HEADER")`; pages and the footer keep `RootEditor` unchanged.
- **Only `sticky top-0 z-40` is applied automatically.** No background, border or shadow: the author paints the surface on the blocks or on a Container. `z-40` keeps the header below the mobile sheet and other `z-50` overlays.
- **Single switch for all breakpoints.** A responsive (per-Breakpoint) sticky setting is a future extension, not part of this effort.
- **No auto-hide now.** The boolean shape leaves room for an additive `hideOnScroll` later; a three-value mode was rejected because it would have to be designed now.
- **Navigation style is one dedicated accordion** ("Navigation style") with two responsive values: `fontSize` and `itemSpacing`, both `ValueUnitInput` (font size with the existing presets). The shared Typography accordion was rejected because most of its controls are inert on inline nav labels.
- **`fontSize` applies to every link label**: top-level links, column triggers, dropdown/column links, mobile rows and accordion triggers. Card titles/descriptions and the CTA keep their own sizes. Default when nothing is authored: 14px inline, 16px in the mobile sheet.
- **`itemSpacing` sets the gap**: the desktop top-level row (normalised to one value, replacing `space-x-1` + `gap-1`) and the mobile sheet rows. Per-item `px-4` padding is unchanged; dropdown lists keep their own rhythm. Default when nothing is authored: 8px inline, 4px in the sheet.
- **The plain item look is permanent, not a setting.** Top-level links and dropdown/column links are transparent, `rounded-md`, hover only recolours the text to primary, active is primary. CTA button and mega cards are unchanged.
- **The mobile sheet needs explicit values** because it is portaled to `<body>`: the style variables (or a resolved inline style) must be passed to `SheetContent`, otherwise the controls would not affect the mobile menu.

## Data model

Header root (`Data["root"].props`), HEADER only:

```ts
type HeaderRootProps = RootProps & {
  sticky?: boolean;
};
```

NavbarBlock:

```ts
type NavbarAppearanceProps = {
  fontSize?: string;
  itemSpacing?: string;
};

type NavbarBlockProps = {
  content?: NavbarBlockContent;
  appearance?: Responsive<NavbarAppearanceProps>;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};
```

Both are additive: documents without the new props keep their current rendering.

## Out of scope / follow-ups

- **Auto-hide on scroll** (hide on scroll down, reveal on scroll up): needs a client scroll listener and its edge cases (mobile sheet open, keyboard focus, `prefers-reduced-motion`, hydration). Additive as `hideOnScroll?: boolean`.
- **Anchor offset**: `home.css` still carries `h2 { scroll-margin-top: 100px }` from the retired fixed navbar. The follow-up is a client component that measures the sticky header with a `ResizeObserver` and writes `--sticky-header-height` on `documentElement`, with `html { scroll-padding-top: var(--sticky-header-height, 0px) }`, plus removal of the `h2` rule. Only active when sticky is on.
- **Responsive sticky switch**: a per-Breakpoint control, if a mobile-specific behaviour is ever needed.
- **Decoration on the Header root**: not added now; the author can paint blocks or wrap them in a Container. If a single surface over the whole region is needed later, the header root config is the place.
- Removing the orphaned hardcoded navbar under `src/app/(home)/_components/navbar/`.

## Tickets

| # | Ticket | Depends on |
| - | ------ | ---------- |
| 01 | Sticky header switch | — |
| 02 | Navigation style: font size and item spacing | — |
| 03 | Plain navigation items | 02 |

## Verification

Manual acceptance against a published Header region:

- With sticky on, scrolling a long page keeps the whole header (TopBar included) at the top, the header keeps its published surface (no background injected), and the mega menu still opens above the content.
- With sticky off, the header scrolls away and the page is unchanged.
- Toggling the switch in the editor requires Save (and Publish to be live); the canvas does not attempt to pin the header.
- Changing font size affects top-level labels, dropdown/column links, mobile rows and accordion triggers, but not card titles/descriptions or the CTA; on a fresh document the look is identical to today.
- Changing item spacing affects the desktop row and the mobile rows, not the per-item padding.
- Hover/active on nav items recolour the text only; no background appears.
- `npm run lint`, `npx tsc --noEmit`, `npm run test:run` and `npm run build` pass.
