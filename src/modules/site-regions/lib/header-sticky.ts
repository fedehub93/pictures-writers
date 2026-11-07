/**
 * Positioning classes applied to the public `<header>` when the Header region
 * is sticky.
 *
 * Only the positioning is automatic. The surface (background, border, shadow)
 * stays the author's job on the blocks or on a Container, so no paint is added
 * here. `z-40` keeps the header below `z-50` overlays such as the mobile sheet.
 */
export const HEADER_STICKY_CLASS_NAME = "sticky top-0 z-40";

type HeaderPuckData = {
  root?: unknown;
} | null | undefined;

/**
 * Whether the Header region is held at the top of the viewport while the page
 * scrolls.
 *
 * The flag is stored in the region version's `root.props`, so it is versioned
 * and published with the rest of the header. Anything other than a literal
 * `true` — absent props, `false`, a string from a hand-edited import, a legacy
 * document with `root: {}` — means normal flow.
 */
export function isHeaderSticky(data: HeaderPuckData): boolean {
  const root = data?.root;

  if (!root || typeof root !== "object") {
    return false;
  }

  const props = (root as { props?: unknown }).props;

  if (!props || typeof props !== "object") {
    return false;
  }

  return (props as { sticky?: unknown }).sticky === true;
}

/**
 * Compute the public `<header>` class attribute.
 *
 * Returns `undefined` when there is nothing to apply, so a non-sticky header
 * renders no `class` attribute at all rather than an empty one.
 */
export function getHeaderClassName(data: HeaderPuckData): string | undefined {
  return isHeaderSticky(data) ? HEADER_STICKY_CLASS_NAME : undefined;
}
