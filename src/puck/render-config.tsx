import {
  type Config,
  type Data,
  type PuckComponent,
  Render,
  type RootConfig,
} from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { richTextDescriptors } from "./fields/rich-text/presets";

import { mergePropsWithDefaults } from "./lib/merge-props";
import {
  BRAND_DEFAULT_PROPS,
  CONTAINER_DEFAULT_PROPS,
  COPYRIGHT_DEFAULT_PROPS,
  FLEX_DEFAULT_PROPS,
  FORM_DEFAULT_PROPS,
  GRID_DEFAULT_PROPS,
  HEADING_DEFAULT_PROPS,
  LINK_DEFAULT_PROPS,
  LINK_LIST_DEFAULT_PROPS,
  NAVBAR_BLOCK_DEFAULT_PROPS,
  SEARCH_BAR_DEFAULT_PROPS,
  SEPARATOR_DEFAULT_PROPS,
  TEXT_DEFAULT_PROPS,
  TOP_BAR_DEFAULT_PROPS,
} from "./blocks/defaults";

import type { RootProps } from "./root/types";
import { renderRoot } from "./root/render";

import { renderContainerBlock } from "./blocks/Container/render";
import { renderFlexBlock } from "./blocks/Flex/render";
import { renderGridBlock } from "./blocks/Grid/render";
import { renderImageBlock } from "./blocks/Image/render";
import { renderFormBlock } from "./blocks/Form/render";
import { renderSeparatorBlock } from "./blocks/Separator/render";
import { renderIconBlock } from "./blocks/Icon/render";
import { renderHeadingBlock } from "./blocks/Heading/render";
import { renderTextBlock } from "./blocks/Text/render";
import { renderLinkBlock } from "./blocks/Link/render";

import { BrandServer } from "./blocks/Brand/server";
import type { BrandBlockProps } from "./blocks/Brand/types";
import { renderLinkListBlock } from "./blocks/LinkList/render";
import { CopyrightServer } from "./blocks/Copyright/server";
import type { CopyrightBlockProps } from "./blocks/Copyright/types";
import { renderTopBarBlock } from "./blocks/TopBar/render";
import { renderSearchBarBlock } from "./blocks/SearchBar/render";
import { NavbarBlockServer } from "./blocks/NavbarBlock/server";
import type { NavbarBlockProps } from "./blocks/NavbarBlock/types";

/**
 * Apply a block's default props to the public render.
 *
 * Puck merges defaultProps in the editor canvas only; the public `<Render>`
 * receives the saved props as-is. This wrapper restores parity so a block
 * dropped from the palette looks the same in both environments. The defaults
 * are passed as the object rather than looked up by name, so a block cannot
 * silently lose them to a typo.
 */
const withPublicDefaults = <P extends object>(
  defaults: object,
  render: PuckComponent<P>,
): PuckComponent<P> =>
  function PublicRenderWithDefaults(props) {
    return render(mergePropsWithDefaults(defaults, props));
  };

/**
 * Public render root. It declares no fields: the render path only needs the
 * render function, while the editor root fields live in `RootEditor`.
 */
export const rootRenderConfig: RootConfig<RootProps> = {
  render: renderRoot,
};

/**
 * Names of the blocks with a public render function.
 *
 * Kept as a tuple so region palettes are checked against it at compile time.
 * Page blocks live in `renderComponentConfigs`; footer-only blocks live in
 * `regionOnlyRenderComponentConfigs` and are merged by
 * `regionComponentConfigs`.
 */
export const RENDER_COMPONENT_NAMES = [
  "Container",
  "Flex",
  "Grid",
  "Image",
  "Form",
  "Separator",
  "Icon",
  "Heading",
  "Text",
  "Link",
  "Brand",
  "LinkList",
  "Copyright",
  "TopBar",
  "SearchBar",
  "NavbarBlock",
] as const;

export type RenderComponentName = (typeof RENDER_COMPONENT_NAMES)[number];

/**
 * Render functions for the blocks shared by pages and Site regions.
 *
 * Every entry consumes the block's single pure render implementation. Only the
 * field descriptors Puck needs at render time (slots and rich text) are
 * declared here, so the public render path never imports editor field modules.
 * A region picks the subset it allows from this map (see
 * `region/render-config.ts`), so adding a block here never makes it available
 * in every palette by accident.
 */
export const renderComponentConfigs: Config<any, RootProps>["components"] = {
  Container: {
    fields: {
      items: {
        type: "slot",
      },
    },
    render: withPublicDefaults(CONTAINER_DEFAULT_PROPS, renderContainerBlock),
  },
  Flex: {
    fields: {
      items: {
        type: "slot",
      },
    },
    render: withPublicDefaults(FLEX_DEFAULT_PROPS, renderFlexBlock),
  },
  Grid: {
    fields: {
      items: {
        type: "slot",
      },
    },
    render: withPublicDefaults(GRID_DEFAULT_PROPS, renderGridBlock),
  },
  Image: {
    // No default props: the Image block has none (ADR-0039, revision).
    render: renderImageBlock,
  },
  Form: {
    render: withPublicDefaults(FORM_DEFAULT_PROPS, renderFormBlock),
  },
  Separator: {
    render: withPublicDefaults(SEPARATOR_DEFAULT_PROPS, renderSeparatorBlock),
  },
  Icon: {
    // No default props: the Icon block has none.
    render: renderIconBlock,
  },
  Heading: {
    // Rich text is resolved at render time from the field descriptor, so the
    // public config shares the editor field's schema without pulling in the
    // editor menu module.
    fields: {
      text: richTextDescriptors.heading,
    },
    render: withPublicDefaults(HEADING_DEFAULT_PROPS, renderHeadingBlock),
  },
  Text: {
    render: withPublicDefaults(TEXT_DEFAULT_PROPS, renderTextBlock),
  },
  Link: {
    render: withPublicDefaults(LINK_DEFAULT_PROPS, renderLinkBlock),
  },
};

/**
 * Render functions for blocks that only exist in a Site region palette.
 *
 * Brand, Copyright and NavbarBlock read Installation settings or resolve CMS
 * links on the server, so their public entries go through a thin adapter
 * around the server renderer. The editor canvas keeps using the shared pure
 * render from each block, which stays database-free.
 */
const BrandRender: PuckComponent<BrandBlockProps> = (props) => (
  <BrandServer {...props} />
);

const CopyrightRender: PuckComponent<CopyrightBlockProps> = (props) => (
  <CopyrightServer {...props} />
);

const NavbarBlockRender: PuckComponent<NavbarBlockProps> = (props) => (
  <NavbarBlockServer {...props} />
);

const regionOnlyRenderComponentConfigs: Config<any, RootProps>["components"] =
  {
    Brand: {
      render: withPublicDefaults(BRAND_DEFAULT_PROPS, BrandRender),
    },
    LinkList: {
      render: withPublicDefaults(LINK_LIST_DEFAULT_PROPS, renderLinkListBlock),
    },
    Copyright: {
      render: withPublicDefaults(COPYRIGHT_DEFAULT_PROPS, CopyrightRender),
    },
    TopBar: {
      // The slot field is declared so the public render resolves the nested
      // content exactly like the editor canvas.
      fields: {
        content: {
          type: "slot",
        },
      },
      render: withPublicDefaults(TOP_BAR_DEFAULT_PROPS, renderTopBarBlock),
    },
    SearchBar: {
      render: withPublicDefaults(SEARCH_BAR_DEFAULT_PROPS, renderSearchBarBlock),
    },
    NavbarBlock: {
      render: withPublicDefaults(NAVBAR_BLOCK_DEFAULT_PROPS, NavbarBlockRender),
    },
  };

/**
 * Full render map used by Site regions: the shared blocks plus the
 * region-only ones.
 */
export const regionComponentConfigs: Config<any, RootProps>["components"] = {
  ...renderComponentConfigs,
  ...regionOnlyRenderComponentConfigs,
};

export const pageRenderConfig: Config<any, RootProps> = {
  components: renderComponentConfigs,
  root: rootRenderConfig,
};

export type PuckEditorProps = {
  initialData: Data;
  /**
   * Render palette to use. Defaults to the page palette so existing callers
   * keep rendering pages unchanged.
   */
  config?: Config<any, RootProps>;
};

// Render Puck editor
export function PuckRender({
  initialData,
  config = pageRenderConfig,
}: PuckEditorProps) {
  return <Render config={config} data={initialData} />;
}
