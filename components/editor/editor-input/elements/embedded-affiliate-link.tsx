import { ReactEditor, RenderElementProps, useSlateStatic } from "slate-react";

import { EmbeddedAffiliateLinkElement } from "@/components/editor";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { Transforms } from "slate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface AffiliateLinkProps extends RenderElementProps {
  element: EmbeddedAffiliateLinkElement;
}

export const AffiliateLink = ({
  attributes,
  children,
  element,
}: AffiliateLinkProps) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);
  const { onOpen } = useModal();
  const {
    data: { uri, label },
  } = element;

  const onSave = (values: { target: string; text: string }) => {
    Transforms.setNodes(
      editor,
      {
        data: {
          uri: values.target,
          label: values.text,
        },
      },
      { at: path }
    );
  };

  const onHandleEdit = () => {
    onOpen("editLink", onSave, {
      target: uri,
      text: label,
    });
  };

  const onHandleRemove = () => {
    Transforms.removeNodes(editor, { at: path });
  };

  return (
    <div className="border rounded-md mt-6 mb-4" contentEditable={false}>
      <div className="flex items-center justify-between w-full px-4 py-2 border-b bg-slate-100 dark:bg-secondary">
        <p className="text-muted-foreground text-sm">Affiliiate Link Button</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-6 w-6 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem className="cursor-pointer" onClick={onHandleEdit}>
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
        <div className="flex-1 text-muted-foreground">{label}</div>
      </div>
    </div>
    // <div {...attributes} contentEditable={false}>
    //   <Button className="flex justify-center" disabled={true}>
    //     <Link href={uri}>{label}</Link>
    //   </Button>
    //   {children}
    // </div>
  );
};
