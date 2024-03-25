import { Trash } from "lucide-react";
import { Transforms } from "slate";
import {
  ReactEditor,
  RenderElementProps,
  useFocused,
  useSelected,
  useSlateStatic,
} from "slate-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

export const ImageElement = ({
  attributes,
  children,
  element,
}: RenderElementProps) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);

  const selected = useSelected();
  const focused = useFocused();
  return (
    <div {...attributes}>
      {children}
      <div contentEditable={false} className="relative group shadow-md">
        <img src={element.url} alt="test" className="block w-full" />
        <Button
          onClick={() => Transforms.removeNodes(editor, { at: path })}
          variant="ghost"
          size="sm"
          className={cn("absolute top-4 left-4 hidden group-hover:block z-50")}
        >
          <Trash />
        </Button>
      </div>
    </div>
  );
};
