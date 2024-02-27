import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface HeadingOneProps extends RenderElementProps {}

export const HeadingOne = ({
  children,
  attributes,
  element,
}: HeadingOneProps) => {
  return (
    <h1
      {...attributes}
      className={cn(
        "text-3xl mb-4",
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </h1>
  );
};
