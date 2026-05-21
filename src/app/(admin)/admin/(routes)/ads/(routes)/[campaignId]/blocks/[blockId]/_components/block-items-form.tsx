"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

import { Grip, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Control, useWatch } from "react-hook-form";

import { AdItem, AdLayoutType } from "@/generated/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AdBlockFormValues } from "@/schemas/ads";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { cn } from "@/lib/utils";

interface BlockItemsProps {
  control: Control<AdBlockFormValues>;
  campaignId: string;
  blockId: string;
  items: AdItem[];
  isSubmitting: boolean;
}

export const BlockItems = ({
  control,
  campaignId,
  blockId,
  items,
  isSubmitting,
}: BlockItemsProps) => {
  const { onOpen } = useModal();
  const router = useRouter();
  const layoutType = useWatch({ control, name: "layoutType" });

  const hideAddNewItemButton =
    layoutType === AdLayoutType.SINGLE && items.length >= 1;

  const onExitModal = () => {};

  const onAddNewItem = () => {
    onOpen("createAdItem", onExitModal, { campaignId, blockId });
  };

  const onDeleteItem = async (itemId: string) => {
    try {
      await axios.delete(
        `/api/admin/ads/${campaignId}/blocks/${blockId}/items/${itemId}`
      );
      toast.success("Block deleted!");
    } catch (error: any) {
      toast.error("Something went wrong!");
    } finally {
      router.refresh();
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const reordered = [...items];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedOrder = reordered.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));

    try {
      await axios.put(
        `/api/admin/ads/${campaignId}/blocks/${blockId}/items/reorder`,
        { blockId, items: updatedOrder }
      );
    } catch (error) {
      console.log(error);
    } finally {
      router.refresh();
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Blocks Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
                // style={getListStyle(snapshot.isDraggingOver)}
              >
                {items.map((i, index) => {
                  return (
                    <Draggable key={i.id} draggableId={i.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          key={i.id}
                          className="border rounded-md flex gap-x-4 items-center"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="p-4 bg-secondary">
                            <Grip className="h-5 w-5" />
                          </div>

                          <div>{i.title}</div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto mr-4"
                                disabled={isSubmitting}
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link
                                href={`/admin/ads/${campaignId}/blocks/${blockId}/items/${i.id}`}
                              >
                                <DropdownMenuItem role="button">
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <ConfirmModal
                                onConfirm={() => onDeleteItem(i.id)}
                              >
                                <Button
                                  variant="ghost"
                                  className="text-destructive px-2! w-full justify-start"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                              </ConfirmModal>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div
          className={cn(
            `p-4 border-dashed border rounded-md flex justify-center`,
            hideAddNewItemButton && "hidden"
          )}
        >
          <Button
            variant="outline"
            type="button"
            onClick={onAddNewItem}
            disabled={isSubmitting}
          >
            Add new item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
