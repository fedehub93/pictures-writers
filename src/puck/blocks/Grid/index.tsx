import { type Slot, type ComponentConfig } from "@puckeditor/core";

// Importiamo il tipo Responsive
import { Responsive } from "@/puck/utils/responsive";

import { GridField, GridProps } from "@/puck/fields/grid";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";
import { DecorationField, DecorationProps } from "@/puck/fields/decoration";

import {
  getDecorationVars,
  getDimensionVars,
  getGridVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { GridBlockUi } from "./ui/grid";

// 1. Aggiorniamo le prop per utilizzare il wrapper Responsive
export type GridBlockProps = {
  grid?: Responsive<GridProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
  items: Slot;
};

export const GridBlock: ComponentConfig<GridBlockProps> = {
  fields: {
    grid: GridField,
    dimension: DimensionField,
    typography: TypographyField,
    decoration: DecorationField,
    items: {
      type: "slot",
    },
  },
  defaultProps: {
    items: [],
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
};
