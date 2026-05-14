import { ComponentConfig } from "@puckeditor/core";

import { Responsive } from "@/puck/utils/responsive";
import { ImageField, ImageProps } from "@/puck/fields/image";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { DecorationField, DecorationProps } from "@/puck/fields/decoration";

import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";

import { ImageBlockUi } from "./ui/image";

export type ImageBlockProps = {
  image?: ImageProps;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};

export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  fields: {
    image: ImageField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: {},
  render: ({ image, dimension, decoration }) => {
    const styleVars = {
      ...getDimensionVars(dimension),
      ...getDecorationVars(decoration),
    };

    return <ImageBlockUi image={image} styleVars={styleVars} />;
  },
};
