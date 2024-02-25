import { cn } from "@/lib/utils";
import { RenderElementProps, useSelected } from "slate-react";

interface LinkComponentsProps extends RenderElementProps {}

export const LinkComponent = ({
  attributes,
  children,
  element,
}: LinkComponentsProps) => {
  return (
    <a
      {...attributes}
      href={element.url}
      className={cn("text-blue-700 underline")}
    >
      {children}
    </a>
  );
};
