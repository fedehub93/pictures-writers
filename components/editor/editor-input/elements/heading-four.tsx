import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface HeadingFourProps extends RenderElementProps {}

export const HeadingFour = ({
  children,
  attributes,
  element,
}: HeadingFourProps) => {
  return (
    <h4
      {...attributes}
      className={cn(
        "text-lg mb-4",
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </h4>
  );
};
