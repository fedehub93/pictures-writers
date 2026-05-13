import { useId } from "react";
import { ComponentConfig } from "@puckeditor/core";
import { cn } from "@/lib/utils";

import { Responsive } from "@/puck/utils/responsive";
import { ImageField, ImageProps } from "@/puck/fields/image";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { DecorationField, DecorationProps } from "@/puck/fields/decoration";

import { getDimensionProps } from "@/puck/utils/dimension";
import { getDecorationProps } from "@/puck/utils/decoration";

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
  defaultProps: {
    // I default sono già gestiti all'interno dei rispettivi field!
  },
  render: ({ image, dimension, decoration }) => {
    const rawId = useId().replace(/:/g, "");
    const blockClass = `puck-image-${rawId}`;

    // Generiamo il CSS
    const dimensionData = getDimensionProps(dimension, blockClass);
    const decorationData = getDecorationProps(decoration, blockClass);

    const combinedCss = `
      ${dimensionData.cssString || ""}
      ${decorationData.cssString || ""}
    `;

    // Per il rendering HTML usiamo SEMPRE i dati "desktop" o "mobile" in base all'approccio che preferisci.
    // Di solito per src, alt, href usiamo il fallback Desktop se non ci sono implementazioni
    // complesse con il tag <picture> (che ti consiglio di esplorare in futuro per una vera art direction).

    // Per ora estraiamo semplicemente i dati finali per il render:
    // (In un rendering server-side reale dovresti stampare il tag <picture> se image.mobile.src esiste)
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
        className={cn("max-w-full", blockClass)}
        style={{
          objectFit: imgData.objectFit as any,
        }}
      />
    );

    return (
      <>
        {combinedCss.trim() !== "" && (
          <style dangerouslySetInnerHTML={{ __html: combinedCss }} />
        )}
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
