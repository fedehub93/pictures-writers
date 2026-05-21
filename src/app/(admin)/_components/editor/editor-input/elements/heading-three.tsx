import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface HeadingThreeProps extends RenderElementProps {}

export const HeadingThree = ({
  children,
  attributes,
  element,
}: HeadingThreeProps) => {
  return (
    <h3
      {...attributes}
      className={cn(
        "text-xl font-medium mb-4",
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </h3>
  );
};
