/**
 * Search box variants shared by the client component and the Puck block.
 *
 * Kept outside the `"use client"` module so the server-side block config can
 * import the type without pulling in a client reference.
 */
export type SearchBoxVariant = "inline" | "compact";

export const SEARCH_BOX_DEFAULT_PLACEHOLDER = "Search...";
export const SEARCH_BOX_DEFAULT_VARIANT: SearchBoxVariant = "inline";

export type SearchBoxProps = {
  /** Placeholder shown inside the search input. */
  placeholder?: string;
  /**
   * `inline` keeps the input visible with the results below it.
   * `compact` renders an icon button that opens the search in a popover.
   */
  variant?: SearchBoxVariant;
  className?: string;
  /** Optional input id, so callers can associate a visible `<label>`. */
  id?: string;
};
