import { ComponentConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";

import { DimensionField, DimensionProps } from "@/puck/fields/dimension";

import { getDimensionVars } from "@/puck/utils/get-style-vars";
import { Separator } from "@/components/ui/separator";

export type SeparatorBlockProps = {
  dimension?: Responsive<DimensionProps>;
};

export const SeparatorBlock: ComponentConfig<SeparatorBlockProps> = {
  fields: {
    dimension: DimensionField,
  },
  defaultProps: {
    dimension: {
      desktop: {
        width: "100%",
        height: "2px",
      },
    },
  },
  render: ({ dimension }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
    };

    return <Separator style={styleVars} className="puck-dim" />;
  },
};
