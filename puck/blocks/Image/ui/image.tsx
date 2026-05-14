import { cn } from "@/lib/utils";
import { ImageProps } from "@/puck/fields/image";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='system-ui' font-size='16' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo image selected%3C/text%3E%3C/svg%3E";

export const ImageBlockUi = ({
  image,
  styleVars,
}: {
  image?: ImageProps;
  styleVars: Record<string, string>;
}) => {
  const imgData = {
    src: image?.src || PLACEHOLDER_IMAGE,
    alt: image?.alt || "Image",
    href: image?.href || "",
    objectFit: image?.objectFit || "cover",
    loading: image?.loading || "lazy",
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
};
