import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface HeadingFourElementProps extends RenderElementProps {}

export const HeadingFourElement = (props: HeadingFourElementProps) => {
  return (
    <h4
      {...props.attributes}
      className={cn(
        "text-xl mb-4",
        props.element.align === "left" && "text-left",
        props.element.align === "center" && "text-center",
        props.element.align === "right" && "text-right"
      )}
    >
      {props.children}
    </h4>
  );
};
