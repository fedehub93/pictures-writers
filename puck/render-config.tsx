import { Config, Data, Render } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import {
  getDecorationVars,
  getDimensionVars,
  getGridVars,
  getTypographyVars,
} from "./utils/get-style-vars";
import { HeadingBlockUi } from "./blocks/Heading/ui/heading";
import { GridBlockUi } from "./blocks/Grid/ui/grid";
import { ImageBlockUi } from "./blocks/Image/ui/image";
import { FormBlockUi } from "./blocks/Form/ui/form";
import { Separator } from "@/components/ui/separator";

// Create Puck component config
const config: Config = {
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

        return <Separator style={styleVars} className="puck-dim" />;
      },
    },
    Heading: {
      fields: {
        text: { type: "richtext" },
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
};

export type PuckEditorProps = {
  initialData: Data;
};

// Render Puck editor
export function PuckRender({ initialData }: PuckEditorProps) {
  return <Render config={config} data={initialData} />;
}
