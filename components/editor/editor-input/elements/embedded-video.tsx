import { ReactEditor, RenderElementProps, useSlateStatic } from "slate-react";
import { Transforms } from "slate";

import { EmbeddedVideoElement } from "@/components/editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface VideoElementProps extends RenderElementProps {
  element: EmbeddedVideoElement;
}

export const EmbeddedVideo = ({
  attributes,
  children,
  element,
}: VideoElementProps) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const { data } = element;

  const onHandleRemove = () => {
    Transforms.removeNodes(editor, { at: path });
  };

  return (
    <div className="border rounded-md mt-6 mb-4" contentEditable={false}>
      <div className="flex items-center justify-between w-full px-4 py-2 border-b bg-slate-100 dark:bg-secondary">
        <p className="text-muted-foreground text-sm">Embedded Video</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-6 w-6 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem className="cursor-pointer">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={onHandleRemove}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full flex items-center justify-between h-40 p-4">
        <div className="flex-1 text-muted-foreground">{data.uri}</div>
        <div className="relative aspect-video w-36 h-36">
          <div>
            <div
              style={{
                padding: "100% 0 0 0",
                position: "relative",
              }}
            >
              <iframe
                src={`${data.uri}?title=0&byline=0&portrait=0`}
                frameBorder="0"
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    // <div {...attributes}>
    //   <div contentEditable={false}>
    //     <div
    //       style={{
    //         padding: "75% 0 0 0",
    //         position: "relative",
    //       }}
    //     >
    //       <iframe
    //         src={`${data.uri}?title=0&byline=0&portrait=0`}
    //         frameBorder="0"
    //         style={{
    //           position: "absolute",
    //           top: "0",
    //           left: "0",
    //           width: "100%",
    //           height: "100%",
    //         }}
    //       />
    //     </div>
    //   </div>
    //   {children}
    // </div>
  );
};
