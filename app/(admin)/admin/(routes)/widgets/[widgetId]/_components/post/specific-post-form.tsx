"use client";

import * as z from "zod";
import Image from "next/image";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Control, useController } from "react-hook-form";
import { widgetFormSchema } from "../widget-form";
import { Grip, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PostWithImageCoverWithCategoryWithTags } from "@/lib/post";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface SpecificPostFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
  isDisabled: boolean;
}

export const SpecificPostForm = ({
  control,
  isSubmitting,
  isDisabled = true,
}: SpecificPostFormProps) => {
  const { onOpen } = useModal();
  const { field: fieldPosts } = useController({
    control,
    name: "metadata.posts",
  });

  const fetchPosts = async (ids: string[]) => {
    console.log(ids);
    const { data } = await axios.post<PostWithImageCoverWithCategoryWithTags[]>(
      "/api/admin/posts/fetch",
      { ids }
    );
    return data;
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["postsFetch"],
    queryFn: () => fetchPosts(fieldPosts.value.map((v) => v.id)),
    enabled: fieldPosts.value.length > 0,
  });

  if (isLoading) return <div>Loading...</div>;

  if (isError) return <div>Error...</div>;

  const onAddPost = () => {
    onOpen("selectPost", onSelectPost);
    refetch();
  };

  const onDeletePost = (id: string) => {
    const newPosts = fieldPosts.value.filter((v) => v.id !== id);
    fieldPosts.onChange(newPosts);
    refetch();
  };

  const onSelectPost = (post: PostWithImageCoverWithCategoryWithTags) => {
    console.log(fieldPosts.value, post.id);
    fieldPosts.onChange([
      ...fieldPosts.value,
      { id: post.id, sort: fieldPosts.value.length },
    ]);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = [...fieldPosts.value];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedOrder = reordered.map((item, index) => ({
      item,
      sort: index + 1,
    }));

    fieldPosts.onChange(updatedOrder);
  };

  return (
    <div className={cn("flex flex-col", fieldPosts.value.length && "gap-y-4")}>
      <FormField
        control={control}
        name="metadata.posts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Posts</FormLabel>
            <FormControl>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="posts" direction="vertical">
                  {(provided) => (
                    <div
                      className={cn(
                        "w-full border rounded-md p-4",
                        fieldPosts.value.length === 0 && "hidden"
                      )}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {data &&
                        data.map((p, index) => (
                          <Draggable
                            key={p.title}
                            draggableId={p.title}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                key={p.title}
                                className="flex items-center gap-y-2 w-full border hover:shadow-xl duration-500 transition-all rounded-md shadow-md mb-4"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <div
                                  className="h-16 w-8 border-r bg-muted flex justify-center items-center cursor-pointer"
                                  {...provided.dragHandleProps}
                                >
                                  <Grip className="h-5 w-5" />
                                </div>
                                <div className="text-sm px-2 line-clamp-2">
                                  {p.title}
                                </div>
                                <div className="flex ml-auto group">
                                  <div className="relative w-16 h-16 aspect-square overflow-hidden">
                                    <Image
                                      src={p.imageCover?.url || ""}
                                      alt={"image"}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div
                                    className="h-16 w-0 border-r bg-destructive flex justify-center items-center cursor-pointer group-hover:w-8 transition-all duration-500"
                                    onClick={() => onDeletePost(p.id)}
                                  >
                                    <Trash2 className="h-5 w-5 text-white" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onAddPost}
        disabled={isSubmitting || isDisabled}
      >
        Add a post
      </Button>
    </div>
  );
};
