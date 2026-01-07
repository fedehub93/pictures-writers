"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { WidgetSection } from "@/prisma/generated/client";
import axios from "axios";
import { Grip } from "lucide-react";

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useWidgetsQuery } from "@/app/(admin)/_hooks/use-widgets-query";
import { Skeleton } from "@/components/ui/skeleton";

interface WidgetSortProps {
  label: string;
  section: WidgetSection;
}

export const WidgetSort = ({ label, section }: WidgetSortProps) => {
  const { data, isFetching, isError, refetch } = useWidgetsQuery({ section });

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !data) return;

    const reordered = [...data];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedOrder = reordered.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));

    try {
      axios.put(`/api/admin/widgets/reorder`, { widgets: updatedOrder });
      await refetch();
    } catch (error) {
      console.log(error);
    }
  };

  if (isFetching)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full h-[40px]" />
          <Skeleton className="w-full h-[40px]" />
          <Skeleton className="w-full h-[40px]" />
        </CardContent>
      </Card>
    );
  if (!data || isError) return <div>Error...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {data.map((w, index) => (
                  <Draggable key={w.name} draggableId={w.name} index={index}>
                    {(provided) => (
                      <div
                        className={cn(
                          "flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm"
                        )}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <div
                          className={cn(
                            "px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition"
                          )}
                          {...provided.dragHandleProps}
                        >
                          <Grip className="h-5 w-5" />
                        </div>
                        {w.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
};
