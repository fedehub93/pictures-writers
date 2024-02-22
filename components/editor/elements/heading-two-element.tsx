import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface HeadingTwoElementProps extends RenderElementProps {}

export const HeadingTwoElement = (props: HeadingTwoElementProps) => {
  return (
    <h2
      {...props.attributes}
      className={cn(
        "text-2xl mb-4",
        props.element.align === "left" && "text-left",
        props.element.align === "center" && "text-center",
        props.element.align === "right" && "text-right"
      )}
    >
      {props.children}
    </h2>
  );
};
