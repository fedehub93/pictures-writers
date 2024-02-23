import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface BlockquoteElementProps extends RenderElementProps {}

export const BlockquoteElement = ({
  attributes,
  element,
  children,
}: BlockquoteElementProps) => {
  return (
    <blockquote
      {...attributes}
      className={cn(
        "mb-8 border-l-4 border-l-neutral-800 bg-white p-4 pl-8 shadow-md [&>p]:mb-0",
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </blockquote>
  );
};
