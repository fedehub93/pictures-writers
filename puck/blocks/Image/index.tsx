import { ComponentConfig } from "@puckeditor/core";
import { cn } from "@/lib/utils";

import { Responsive } from "@/puck/utils/responsive";
import { ImageField, ImageProps } from "@/puck/fields/image";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { DecorationField, DecorationProps } from "@/puck/fields/decoration";

import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='system-ui' font-size='16' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo image selected%3C/text%3E%3C/svg%3E";

export type ImageBlockProps = {
  image?: Responsive<ImageProps>;
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

    const imgData = {
      src: image?.desktop?.src || PLACEHOLDER_IMAGE,
      alt: image?.desktop?.alt || "Image",
      href: image?.desktop?.href || "",
      objectFit: image?.desktop?.objectFit || "cover",
      loading: image?.desktop?.loading || "lazy",
    };

    const ImageContent = (
      <img
        src={imgData.src}
        alt={imgData.alt}
        loading={imgData.loading as "lazy" | "eager"}
        className={cn("puck-dim puck-deco max-w-full")}
        style={{
          objectFit: imgData.objectFit as any,
          ...styleVars,
        }}
      />
    );

    return (
      <>
        {imgData.href ? (
          <a href={imgData.href} className="block w-full">
            {ImageContent}
          </a>
        ) : (
          ImageContent
        )}
      </>
    );
  },
};
