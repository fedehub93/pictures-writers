import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface DefaultProps extends RenderElementProps {
  isHighlight?: boolean;
}

export const Default = ({ children, attributes, element }: DefaultProps) => {
  return (
    <div
      {...attributes}
      className={cn(
        "leading-6 mb-6 text-base",
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
        // isHighlight && "bg-zinc-200"
      )}
    >
      {children}
    </div>
  );
};
