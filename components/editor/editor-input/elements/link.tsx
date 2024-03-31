import { RenderElementProps } from "slate-react";

import { cn } from "@/lib/utils";

interface LinkProps extends RenderElementProps {}

export const Link = ({ attributes, children, element }: LinkProps) => {
  return (
    <a
      {...attributes}
      href={element.url}
      className={cn("text-blue-700 underline text-base")}
    >
      {children}
    </a>
  );
};
