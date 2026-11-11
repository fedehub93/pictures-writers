import { cn } from "@/shared/lib/utils";
import type { ImageProps } from "@/puck/fields/image";
import { pickDisplayVars } from "@/puck/fields/layout/get-layout-vars";
import type { BlockDragRef } from "@/puck/types";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='system-ui' font-size='16' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo image selected%3C/text%3E%3C/svg%3E";

/**
 * Image block UI.
 *
 * `Dimension` describes the box of the block and `Decoration` styles the
 * picture inside it. The box used to be hard-coded to `w-full` and only the
 * `<img>` carried the authored width: on the public page that made an inline
 * image claim a whole flex row and squeeze its siblings, while the editor
 * canvas hid the problem behind Puck's per-block wrapper.
 */
export const ImageBlockUi = ({
  image,
  layoutVars,
  dimensionVars,
  decorationVars,
  layoutClassName,
  dragRef,
}: {
  image?: ImageProps;
  layoutVars: Record<string, string>;
  dimensionVars: Record<string, string>;
  decorationVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
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
      className="puck-deco block h-full w-full"
      style={{
        objectFit: imgData.objectFit as any,
        ...decorationVars,
      }}
    />
  );

  const rootClassName = cn("puck-dim", layoutClassName);
  const rootStyle = {
    ...pickDisplayVars(layoutVars),
    ...dimensionVars,
  };

  return (
    <>
      {imgData.href ? (
        // The anchor is the block root, so it is what the editor selects; the
        // ref must not move to the `<img>` inside it.
        <a
          ref={dragRef}
          href={imgData.href}
          className={cn("block", rootClassName)}
          style={rootStyle}
        >
          {ImageContent}
        </a>
      ) : (
        <div ref={dragRef} className={rootClassName} style={rootStyle}>
          {ImageContent}
        </div>
      )}
    </>
  );
};
