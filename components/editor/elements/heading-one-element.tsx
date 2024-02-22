import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface HeadingOneElementProps extends RenderElementProps {}

export const HeadingOneElement = (props: HeadingOneElementProps) => {
  return (
    <h1
      {...props.attributes}
      className={cn(
        "text-3xl",
        props.element.align === "left" && "text-left",
        props.element.align === "center" && "text-center",
        props.element.align === "right" && "text-right"
      )}
    >
      {props.children}
    </h1>
  );
};
