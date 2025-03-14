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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetPostMetadataPosts, WidgetPostType } from "@/types";
import { Input } from "@/components/ui/input";
import { ChangeEvent } from "react";

interface PostTypeFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
  isDisabled: boolean;
}

type WidgetPostFormType = {
  type: WidgetPostType;
  label: string;
};

const types: WidgetPostFormType[] = [
  {
    type: WidgetPostType.ALL,
    label: "All",
  },
  {
    type: WidgetPostType.LATEST,
    label: "Latest",
  },
  {
    type: WidgetPostType.POPULAR,
    label: "Popular",
  },
  {
    type: WidgetPostType.SPECIFIC,
    label: "Specific",
  },
  {
    type: WidgetPostType.CORRELATED,
    label: "Correlated",
  },
];

export const PostTypeForm = ({
  control,
  isSubmitting,
  isDisabled = true,
}: PostTypeFormProps) => {
  const { onOpen } = useModal();
  const { field: fieldPostType } = useController({
    control,
    name: "metadata.postType",
  });
  const { field: fieldPosts } = useController({
    control,
    name: "metadata.posts",
  });
  const { field: fieldLimit } = useController({
    control,
    name: "metadata.limit",
  });

  const onLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldLimit.onChange(Number.parseInt(e.target.value));
  };

  const fetchPosts = async (ids: string[]) => {
    const { data } = await axios.post<PostWithImageCoverWithCategoryWithTags[]>(
      "/api/admin/posts/fetch",
      { ids }
    );
    return data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["postsFetch", fieldPosts.value.length],
    queryFn: () =>
      fetchPosts(
        fieldPosts.value.map((v: WidgetPostMetadataPosts) => v.rootId)
      ),
    enabled: fieldPosts.value.length > 0,
  });

  if (isLoading) return <div>Loading...</div>;

  if (isError) return <div>Error...</div>;

  const onAddPost = () => {
    onOpen("selectPost", onSelectPost);
  };

  const onSelectPost = (post: PostWithImageCoverWithCategoryWithTags) => {
    fieldPosts.onChange([
      ...fieldPosts.value,
      { rootId: post.rootId, sort: fieldPosts.value.length },
    ]);
  };

  const onDeletePost = (rootId: string) => {
    const newPosts = fieldPosts.value.filter(
      (v: WidgetPostMetadataPosts) => v.rootId !== rootId
    );
    fieldPosts.onChange(newPosts);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = [...fieldPosts.value];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedOrder = reordered.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));

    fieldPosts.onChange(updatedOrder);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-x-4 items-center">
        <FormField
          control={control}
          name="metadata.postType"
          render={({ field }) => (
            <FormItem
              className={cn(
                "w-full",
                field.value !== WidgetPostType.SPECIFIC &&
                  "flex-1 flex flex-col w-4/5"
              )}
            >
              <FormLabel className="block">Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a post type..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {types?.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex gap-x-4 items-center">
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="metadata.limit"
          render={({ field }) => (
            <FormItem
              className={cn(
                "hidden",
                fieldPostType.value !== WidgetPostType.SPECIFIC &&
                  "flex flex-col w-1/5"
              )}
            >
              <FormLabel className="block">Limit</FormLabel>
              <Input
                {...field}
                onChange={onLimitChange}
                type="number"
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div
        className={cn("flex flex-col", fieldPosts.value.length && "gap-y-4")}
      >
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
                          fieldPosts.value.map(
                            (v: WidgetPostMetadataPosts, index: number) => {
                              const p = data.find((d) => d.rootId === v.rootId);
                              if (!p) return null;
                              return (
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
                                            unoptimized
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
                              );
                            }
                          )}
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
    </div>
  );
};
