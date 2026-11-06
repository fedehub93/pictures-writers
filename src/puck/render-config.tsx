import { Color, TextStyle } from "@tiptap/extension-text-style";
import {
  type Config,
  type Data,
  type PuckComponent,
  Render,
  type RootConfig,
} from "@puckeditor/core";
import "@puckeditor/core/puck.css";

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
import { renderAnnouncementBarBlock } from "./blocks/AnnouncementBar/render";
import { renderSearchBarBlock } from "./blocks/SearchBar/render";
import { NavbarBlockServer } from "./blocks/NavbarBlock/server";
import type { NavbarBlockProps } from "./blocks/NavbarBlock/types";

export const rootRenderConfig: RootConfig<RootProps> = {
  fields: {
    title: { type: "text" },
  },
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
  "AnnouncementBar",
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
 * `region-render-config.ts`), so adding a block here never makes it available
 * in every palette by accident.
 */
export const renderComponentConfigs: Config<any, RootProps>["components"] = {
  Container: {
    fields: {
      items: {
        type: "slot",
      },
    },
    render: renderContainerBlock,
  },
  Flex: {
    fields: {
      items: {
        type: "slot",
      },
    },
    render: renderFlexBlock,
  },
  Grid: {
    fields: {
      items: {
        type: "slot",
      },
    },
    render: renderGridBlock,
  },
  Image: {
    render: renderImageBlock,
  },
  Form: {
    render: renderFormBlock,
  },
  Separator: {
    render: renderSeparatorBlock,
  },
  Icon: {
    render: renderIconBlock,
  },
  Heading: {
    // Rich text is resolved at render time from the field descriptor, so the
    // public config keeps the same extensions without the editor menu module.
    fields: {
      text: {
        type: "richtext",
        tiptap: {
          extensions: [TextStyle, Color],
        },
      },
    },
    render: renderHeadingBlock,
  },
  Text: {
    render: renderTextBlock,
  },
  Link: {
    render: renderLinkBlock,
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
      render: BrandRender,
    },
    LinkList: {
      render: renderLinkListBlock,
    },
    Copyright: {
      render: CopyrightRender,
    },
    AnnouncementBar: {
      render: renderAnnouncementBarBlock,
    },
    SearchBar: {
      render: renderSearchBarBlock,
    },
    NavbarBlock: {
      render: NavbarBlockRender,
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
