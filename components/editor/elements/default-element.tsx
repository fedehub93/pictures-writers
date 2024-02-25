import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface DefaultElementProps extends RenderElementProps {
  isHighlight?: boolean;
}

export const DefaultElement = (props: DefaultElementProps) => {
  return (
    <div
      {...props.attributes}
      className={cn(
        props.element.align === "left" && "text-left",
        props.element.align === "center" && "text-center",
        props.element.align === "right" && "text-right",
        props.isHighlight && "bg-zinc-200"
      )}
    >
      {props.children}
    </div>
  );
};
