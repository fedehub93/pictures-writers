import { cn } from "@/lib/utils";
import { RenderElementProps, useSelected } from "slate-react";

interface LinkComponentsProps extends RenderElementProps {}

export const LinkComponent = ({
  attributes,
  children,
  element,
}: LinkComponentsProps) => {
  const selected = useSelected();
  return (
    <a
      {...attributes}
      href={element.url}
      className={cn("text-blue-700 underline", selected && "shadow-md")}
    >
      <InlineChromiumBugfix />
      {children}
      <InlineChromiumBugfix />
    </a>
  );
};

// Put this at the start and end of an inline component to work around this Chromium bug:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1249405
const InlineChromiumBugfix = () => (
  <span contentEditable={false} className="text-[0px]">
    {String.fromCodePoint(160) /* Non-breaking space */}
  </span>
);
