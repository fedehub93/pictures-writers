import Image from "next/image";
import { ComponentConfig } from "@puckeditor/core";

// Placeholder SVG base64 - grigio chiaro con icona immagine
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='system-ui' font-size='16' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo image selected%3C/text%3E%3C/svg%3E";

export type ImageBlockProps = {
  src?: string;
  alt?: string;
};

export const ImageBlock: ComponentConfig<ImageBlockProps> = {
  fields: {
    src: {
      type: "text",
      label: "Image URL",
    },
    alt: {
      type: "text",
      label: "Alt Text",
    },
  },
  defaultProps: {
    src: "",
    alt: "Image",
  },
  render: ({ src = "", alt = "Image" }) => {
    const imageSrc = src && src.trim() !== "" ? src : PLACEHOLDER_IMAGE;

    return (
      <img
        src={imageSrc}
        alt={alt}
        /* Dimensioni fisse temporanee necessarie per Next/Image senza la prop 'fill' */
        width={400}
        height={300}
        style={{
          width: "100%",
          height: "auto",
        }}
      />
    );
  },
};
