import { MarkViewContent, MarkViewRendererProps } from "@tiptap/react";
import { ArrowUpRight, Copy, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { removeLinkMark, updateLinkMark } from "../helpers";

export const LinkButton = ({ editor, mark }: MarkViewRendererProps) => {
  const { onOpen } = useModal();

  const isExternalLink =
    mark.attrs.href.includes("http://") || mark.attrs.href.includes("https://");

  const isFollow = isExternalLink
    ? mark.attrs.nofollow !== undefined
      ? !!!mark.attrs.nofollow
      : false
    : true;

  const onCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(mark.attrs.href)
        .then(() => {
          toast.success("Link copied successfully");
        })
        .catch((err) => {
          toast.error("Failed to copy link");
        });
    } else {
      toast.error("Clipboard API not supported");
    }
  };

  const onSave = ({ target, follow }: { target: string; follow: boolean }) => {
    updateLinkMark(editor, { href: target, nofollow: !follow });
  };

  const onEditLink = () => {
    onOpen("editLink", onSave, {
      text: "empty",
      target: mark.attrs.href,
      follow: !mark.attrs.nofollow,
    });
  };

  const onRemoveLink = () => {
    removeLinkMark(editor);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <a
          href="#"
          className={cn(
            "relative text-blue-700 underline underline-offset-2 cursor-pointer",
            isFollow && "mr-4"
          )}
        >
          {isFollow && (
            <ArrowUpRight className="absolute top-0 -right-4 h-4 w-4" />
          )}
          <MarkViewContent />
        </a>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="border border-gray-300 shadow-lg px-4 py-0.5 bg-white rounded-md w-full"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium leading-none text-blue-700 underline underline-offset-2 cursor-default">
            {mark.attrs.href}
          </p>
          <div className="ml-8 flex">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="ghost" size="icon" onClick={onCopyLink}>
                      <Copy className="h-4 w-4 pointer-events-none" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="bg-muted-foreground text-muted"
                >
                  <p>Copy Link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="ghost" size="icon" onClick={onEditLink}>
                      <Pencil className="h-4 w-4 pointer-events-none" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="bg-muted-foreground text-muted"
                >
                  <p>Edit Link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="ghost" size="icon" onClick={onRemoveLink}>
                      <Trash2 className="h-4 w-4 pointer-events-none" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="bg-muted-foreground text-muted"
                >
                  <p>Remove Link</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
