import { cn } from "@/lib/utils";
import { RenderElementProps } from "slate-react";

export const DefaultElement = (props: RenderElementProps) => {
  return (
    <p
      {...props.attributes}
      className={cn(
        props.element.align === "left" && "text-left",
        props.element.align === "center" && "text-center",
        props.element.align === "right" && "text-right"
      )}
    >
      {props.children}
    </p>
  );
};
