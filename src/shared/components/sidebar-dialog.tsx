"use client";

import { useIsMobile } from "@/shared/hooks/use-mobile";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { ScrollArea } from "../ui/scroll-area";

interface SidebarDialogProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * Responsive dialog shell for modals with a sidebar layout.
 * The visible title/layout lives in `children`; `title`/`description`
 * are only used for accessibility (a hidden Dialog/Description title).
 */
export const SidebarDialog = ({
  title,
  description,
  open,
  onOpenChange,
  children,
}: SidebarDialogProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} handleOnly>
        <DrawerContent className="max-h-[90vh]">
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          {description ? (
            <DrawerDescription className="sr-only">
              {description}
            </DrawerDescription>
          ) : null}
          <ScrollArea className="max-h-[90vh] overflow-auto p-4">
            {children}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 max-w-[calc(100vw-3rem)] sm:max-w-4xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {description ? (
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
        ) : null}
        {children}
      </DialogContent>
    </Dialog>
  );
};