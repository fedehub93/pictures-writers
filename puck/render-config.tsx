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
  getGridVars,
  getTypographyVars,
} from "./utils/get-style-vars";

import { type RootProps } from "./root";

import { RootBlockUi } from "./root/ui/root";

import { HeadingBlockUi } from "./blocks/Heading/ui/heading";
import { GridBlockUi } from "./blocks/Grid/ui/grid";
import { ImageBlockUi } from "./blocks/Image/ui/image";
import { FormBlockUi } from "./blocks/Form/ui/form";
import { SeparatorBlockUi } from "./blocks/Separator/ui/separator";
import { IconBlockUi } from "./blocks/Icon/ui/icon";

const RootRender: RootConfig<RootProps> = {
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

const config: Config<any, RootProps> = {
  components: {
    Grid: {
      fields: {
        items: {
          type: "slot",
        },
      },
      render: ({ grid, dimension, typography, decoration, items: Items }) => {
        const styleVars = {
          ...getGridVars(grid),
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
  },
  root: RootRender,
};

export type PuckEditorProps = {
  initialData: Data;
};

// Render Puck editor
export function PuckRender({ initialData }: PuckEditorProps) {
  return <Render config={config} data={initialData} />;
}
