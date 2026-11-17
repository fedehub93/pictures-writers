import {
  SEARCH_BOX_DEFAULT_PLACEHOLDER,
  SEARCH_BOX_DEFAULT_VARIANT,
} from "@/shared/components/search/types";

import type { SearchBarContent } from "./types";

/**
 * Default content of a new Search bar block.
 *
 * The renderers and the editor controls both read these values, so a new block
 * and a document saved with the new content object agree on the initial
 * placeholder and variant. Documents with the previous flat props are
 * converted by the one-off migration utility; there is no runtime
 * compatibility layer.
 */
export const SEARCH_BAR_DEFAULT_CONTENT = {
  placeholder: SEARCH_BOX_DEFAULT_PLACEHOLDER,
  variant: SEARCH_BOX_DEFAULT_VARIANT,
} satisfies SearchBarContent;
