import type { ButtonProps } from "./Button/types";
import type { ContainerBlockProps } from "./Container/types";
import type { FlexBlockProps } from "./Flex/types";
import type { GridBlockProps } from "./Grid/types";
import type { HeadingProps } from "./Heading/types";
import type { SeparatorBlockProps } from "./Separator/types";
import type { TextBlockProps } from "./Text/types";
import type { FormBlockProps } from "./Form/types";
import type { BrandBlockProps } from "./Brand/types";
import type { CopyrightBlockProps } from "./Copyright/types";
import type { LinkListBlockProps } from "./LinkList/types";
import type { NavbarBlockProps } from "./NavbarBlock/types";
import type { SearchBarBlockProps } from "./SearchBar/types";
import type { TopBarBlockProps } from "./TopBar/types";

import {
  BRAND_DEFAULT_CONTENT,
  BRAND_DEFAULT_TYPOGRAPHY,
} from "./Brand/defaults";
import { BUTTON_DEFAULT_VARIANT } from "./Button/constants";
import {
  COPYRIGHT_DEFAULT_CONTENT,
  COPYRIGHT_DEFAULT_TYPOGRAPHY,
} from "./Copyright/defaults";
import { HEADING_DEFAULT_LEVEL } from "./Heading/level";
import { LINK_LIST_DEFAULT_CONTENT } from "./LinkList/defaults";
import { NAVBAR_BLOCK_DEFAULT_CONTENT } from "./NavbarBlock/defaults";
import { SEARCH_BAR_DEFAULT_CONTENT } from "./SearchBar/defaults";
import {
  TOP_BAR_DEFAULT_DECORATION,
  TOP_BAR_DEFAULT_LAYOUT,
  TOP_BAR_DEFAULT_SIZE,
  TOP_BAR_DEFAULT_SPACING,
} from "./TopBar/defaults";

/**
 * The default props of every Puck block, defined once.
 *
 * Each editor component config assigns its constant from here as
 * `defaultProps`, and the public render config applies the same constant
 * through `withPublicDefaults`. Keeping the definitions in one module is what
 * keeps the two paths from drifting: a block either has no defaults or has
 * exactly one definition of them.
 *
 * The composite objects (Top bar, Brand, and the rest of the region blocks)
 * live here too, so their `index.tsx` does not have to restate what is already
 * a constant in the block's own `defaults` module.
 */

export const CONTAINER_DEFAULT_PROPS: ContainerBlockProps = {
  items: [],
  layout: {
    desktop: {
      display: "block",
    },
  },
};

export const FLEX_DEFAULT_PROPS: FlexBlockProps = {
  items: [],
  layout: {
    desktop: {
      display: "flex",
    },
  },
};

export const GRID_DEFAULT_PROPS: GridBlockProps = {
  items: [],
  layout: {
    desktop: {
      display: "grid",
    },
  },
};

export const HEADING_DEFAULT_PROPS: HeadingProps = {
  text: "<p>Heading</p>",
  level: HEADING_DEFAULT_LEVEL,
};

/**
 * The Button has no Spacing default: the target-sized box is the block's base
 * box, declared by `puck-button-box` in `puck-base.css`. As a default prop it
 * would read as an authored value, so clearing the field would collapse the
 * Button instead of returning the box (ADR-0045).
 */
export const BUTTON_DEFAULT_PROPS: ButtonProps = {
  button: {
    variant: BUTTON_DEFAULT_VARIANT,
    link: {
      type: "external",
      url: "",
      label: "Inserisci il tuo link",
    },
  },
};

export const SEPARATOR_DEFAULT_PROPS: SeparatorBlockProps = {
  size: {
    desktop: {
      width: "100%",
      height: "2px",
    },
  },
};

export const TEXT_DEFAULT_PROPS: TextBlockProps = {
  text: "<p>Add your text here.</p>",
};

export const FORM_DEFAULT_PROPS: FormBlockProps = {
  form: {
    id: "",
    content: null,
    gtmEventName: "",
  },
};

export const TOP_BAR_DEFAULT_PROPS: TopBarBlockProps = {
  content: [],
  settings: { dismissible: false },
  layout: TOP_BAR_DEFAULT_LAYOUT,
  size: TOP_BAR_DEFAULT_SIZE,
  spacing: TOP_BAR_DEFAULT_SPACING,
  decoration: TOP_BAR_DEFAULT_DECORATION,
};

export const SEARCH_BAR_DEFAULT_PROPS: SearchBarBlockProps = {
  content: SEARCH_BAR_DEFAULT_CONTENT,
};

export const LINK_LIST_DEFAULT_PROPS: LinkListBlockProps = {
  content: LINK_LIST_DEFAULT_CONTENT,
};

export const BRAND_DEFAULT_PROPS: BrandBlockProps = {
  content: BRAND_DEFAULT_CONTENT,
  typography: BRAND_DEFAULT_TYPOGRAPHY,
};

export const COPYRIGHT_DEFAULT_PROPS: CopyrightBlockProps = {
  content: COPYRIGHT_DEFAULT_CONTENT,
  typography: COPYRIGHT_DEFAULT_TYPOGRAPHY,
};

export const NAVBAR_BLOCK_DEFAULT_PROPS: NavbarBlockProps = {
  content: NAVBAR_BLOCK_DEFAULT_CONTENT,
};

/**
 * Every block that has defaults, keyed by component name.
 *
 * The map is the registry the parity test walks: a block listed here must
 * expose the same object as its `defaultProps` in the editor config and receive
 * it from the public render. Icon and Image deliberately have no entry because
 * they need no default.
 */
export const BLOCK_DEFAULT_PROPS: Record<string, object> = {
  Container: CONTAINER_DEFAULT_PROPS,
  Flex: FLEX_DEFAULT_PROPS,
  Grid: GRID_DEFAULT_PROPS,
  Heading: HEADING_DEFAULT_PROPS,
  Button: BUTTON_DEFAULT_PROPS,
  Separator: SEPARATOR_DEFAULT_PROPS,
  Text: TEXT_DEFAULT_PROPS,
  Form: FORM_DEFAULT_PROPS,
  TopBar: TOP_BAR_DEFAULT_PROPS,
  SearchBar: SEARCH_BAR_DEFAULT_PROPS,
  LinkList: LINK_LIST_DEFAULT_PROPS,
  Brand: BRAND_DEFAULT_PROPS,
  Copyright: COPYRIGHT_DEFAULT_PROPS,
  NavbarBlock: NAVBAR_BLOCK_DEFAULT_PROPS,
};
