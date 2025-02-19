import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface HeadingTwoProps extends RenderElementProps {}

export const HeadingTwo = ({
  children,
  attributes,
  element,
}: HeadingTwoProps) => {
  return (
    <h2
      {...attributes}
      className={cn(
        "text-2xl font-medium leading-5 mb-4",
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </h2>
  );
};
