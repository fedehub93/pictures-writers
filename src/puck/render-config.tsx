import { Color, TextStyle } from "@tiptap/extension-text-style";
import {
  type Config,
  type Data,
  Render,
  type RootConfig,
} from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "./utils/get-style-vars";
import { getLayoutVars } from "./fields/layout/get-layout-vars";

import { type RootProps } from "./root";

import { RootBlockUi } from "./root/ui/root";

import { HeadingBlockUi } from "./blocks/Heading/ui/heading";
import { TextBlockUi } from "./blocks/Text/ui/text";

import { ContainerBlockUi } from "./blocks/Container/ui/container-block-ui";
import { FlexBlockUi } from "./blocks/Flex/ui/flex-block-ui";
import { GridBlockUi } from "./blocks/Grid/ui/grid";
import { ImageBlockUi } from "./blocks/Image/ui/image";
import { FormBlockUi } from "./blocks/Form/ui/form";
import { SeparatorBlockUi } from "./blocks/Separator/ui/separator";
import { IconBlockUi } from "./blocks/Icon/ui/icon";
import { LinkBlockUi } from "./blocks/Link/ui/link";
import { LinkList } from "./blocks/LinkList";
import { Copyright } from "./blocks/Copyright";
import { CopyrightServer } from "./blocks/Copyright/server";
import { Brand } from "./blocks/Brand";
import { BrandServer } from "./blocks/Brand/server";

export const rootRenderConfig: RootConfig<RootProps> = {
  fields: {
    title: { type: "text" },
  },
  render: ({ children, dimension }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
    };

    return <RootBlockUi styleVars={styleVars}>{children}</RootBlockUi>;
  },
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
] as const;

export type RenderComponentName = (typeof RENDER_COMPONENT_NAMES)[number];

/**
 * Render functions for the blocks shared by pages and Site regions.
 *
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
    render: ({ layout, dimension, typography, decoration, items: Items }) => {
      const styleVars = {
        ...getLayoutVars(layout),
        ...getDimensionVars(dimension),
        ...getTypographyVars(typography),
        ...getDecorationVars(decoration),
      };
      return <ContainerBlockUi Items={Items} styleVars={styleVars} />;
    },
  },
  Flex: {
    fields: {
      items: {
        type: "slot",
      },
    },
    render: ({ layout, dimension, typography, decoration, items: Items }) => {
      const styleVars = {
        ...getLayoutVars(layout),
        ...getDimensionVars(dimension),
        ...getTypographyVars(typography),
        ...getDecorationVars(decoration),
      };
      return <FlexBlockUi Items={Items} styleVars={styleVars} />;
    },
  },
  Grid: {
    fields: {
      items: {
        type: "slot",
      },
    },
    render: ({ layout, dimension, typography, decoration, items: Items }) => {
      const styleVars = {
        ...getLayoutVars(layout),
        ...getDimensionVars(dimension),
        ...getTypographyVars(typography),
        ...getDecorationVars(decoration),
      };
      return <GridBlockUi Items={Items} styleVars={styleVars} />;
    },
  },
  Image: {
    render: ({ image, dimension, decoration }) => {
      const styleVars = {
        ...getDimensionVars(dimension),
        ...getDecorationVars(decoration),
      };

      return <ImageBlockUi image={image} styleVars={styleVars} />;
    },
  },
  Form: {
    render: ({ form, dimension }) => {
      const styleVars = {
        ...getDimensionVars(dimension),
      };
      return <FormBlockUi form={form} styleVars={styleVars} />;
    },
  },
  Separator: {
    render: ({ dimension }) => {
      const styleVars = {
        ...getDimensionVars(dimension),
      };

      return <SeparatorBlockUi styleVars={styleVars} />;
    },
  },
  Icon: {
    render: ({ icon, dimension, typography }) => {
      const styleVars = {
        ...getDimensionVars(dimension),
        ...getTypographyVars(typography),
      };

      return <IconBlockUi icon={icon} styleVars={styleVars} />;
    },
  },
  Heading: {
    fields: {
      text: {
        type: "richtext",
        tiptap: {
          extensions: [TextStyle, Color],
        },
      },
    },

    render: ({ text, dimension, typography }) => {
      const styleVars = {
        ...getDimensionVars(dimension),
        ...getTypographyVars(typography),
      };

      return <HeadingBlockUi text={text} styleVars={styleVars} />;
    },
  },
  Text: {
    fields: {
      text: {
        type: "textarea",
      },
    },

    render: ({ text, align, color }) => {
      return <TextBlockUi text={text} align={align} color={color} />;
    },
  },
  Link: {
    render: ({ link, dimension, typography, decoration }) => {
      const styleVars = {
        ...getDimensionVars(dimension),
        ...getTypographyVars(typography),
        ...getDecorationVars(decoration),
      };

      return <LinkBlockUi link={link} styleVars={styleVars} />;
    },
  },
};

/**
 * Render functions for blocks that only exist in a Site region palette.
 *
 * `Copyright` swaps the database-free editor render for a server renderer so
 * the public footer can read the site name from Settings.
 */
const regionOnlyRenderComponentConfigs: Config<any, RootProps>["components"] =
  {
    Brand: {
      ...Brand,
      render: ({ showLogo, showSiteName, customText, customLogoUrl }) => (
        <BrandServer
          showLogo={showLogo}
          showSiteName={showSiteName}
          customText={customText}
          customLogoUrl={customLogoUrl}
        />
      ),
    },
    LinkList,
    Copyright: {
      ...Copyright,
      render: ({ showYear, extraText, links }) => (
        <CopyrightServer
          showYear={showYear}
          extraText={extraText}
          links={links}
        />
      ),
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
