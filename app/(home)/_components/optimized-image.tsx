"use client";

import Image, { ImageLoaderProps } from "next/image";

import { Media } from "@prisma/client";
import { PostWithImageCoverWithCategoryWithTags } from "@/lib/post";

const imageLoader = ({
  image,
  src,
  width,
  quality,
}: ImageLoaderProps & { image: Media }) => {
  if (width <= 300) {
    return image?.metadata?.webp.resized[0].url || image?.url || "";
  }

  if (width <= 828) {
    return image?.metadata?.webp.resized[1].url || image?.url || "";
  }

  return image?.metadata?.webp.resized[2].url || image?.url || "";
};

export const OptimizedImage = ({ image }: { image: Media }) => {
  return (
    <Image
      src={image.url}
      alt={image.altText || ""}
      width={image.metadata?.original?.width || 750}
      height={image.metadata?.original?.height || 422}
      placeholder={image.metadata?.placeholder?.url ? "blur" : "empty"}
      blurDataURL={image.metadata?.placeholder?.url}
      loader={({ src, width, quality }) =>
        imageLoader({ image, src, width, quality })
      }
      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
      style={{ width: "100%", height: "100%" }}
      className="blog-post__image"
    />
  );
};
