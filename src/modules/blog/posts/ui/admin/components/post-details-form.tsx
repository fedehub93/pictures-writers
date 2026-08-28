"use client";

import { Controller, useForm } from "react-hook-form";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ContentStatus, EditorType, type User } from "@/generated/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Form } from "@/shared/ui/form";

import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import { usePostsFilters } from "../../../hooks/use-posts-filters";
import { postUpdateSchema, type PostUpdateValues } from "../../../schemas";
import { ContentForm } from "./content-form";

interface PostDetailsFormProps {
  id: string;
  rootId: string;
  initialData: {
    id: string;
    status: ContentStatus;
    title: string;
    description: string | null;
    slug: string;
    postAuthors: {
      user: User;
      sort: number;
    }[];
    postCategories: {
      category: {
        id: string;
        title: string;
      };
      sort: number;
    }[];
    editorType: EditorType;
    bodyData: any;
    tiptapBodyData: any;
  } | null;
  onEditorReady?: (editor: TiptapEditor | null) => void;
}

export const PostDetailsForm = ({
  id,
  rootId,
  initialData,
  onEditorReady,
}: PostDetailsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = usePostsFilters();

  const form = useForm<PostUpdateValues>({
    resolver: zodResolver(postUpdateSchema),
    values: {
      ...initialData,
      id,
      rootId,
      editorType: initialData?.editorType ?? undefined,
    },
    mode: "onChange",
  });

  const { mutate: updatePost, isPending } = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Post updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updatePost({
      ...dirtyData,
      id,
      rootId,
      editorType: dirtyData?.editorType ?? undefined,
    });
  });

  if (!initialData) return <div>Error...</div>;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="px-4 py-4 md:px-6 flex justify-between items-center flex-row">
        <CardTitle className="w-full text-xl font-normal text-foreground mb-0">
          {initialData.title}
        </CardTitle>
        <Form {...form}>
          <form onChange={handleAutoSave}>
            <Controller
              control={form.control}
              name="editorType"
              render={({ field }) => (
                <Field className="flex-1">
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                    }}
                  >
                    <SelectTrigger className="w-30">
                      <SelectValue placeholder="Editor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EditorType.SLATE}>Slate</SelectItem>
                      <SelectItem value={EditorType.TIPTAP}>Tiptap</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </form>
        </Form>
      </CardHeader>
      <CardContent className="p-0 mt-0">
        <ContentForm
          postId={id}
          rootId={rootId}
          initialData={initialData}
          onEditorReady={onEditorReady}
        />
      </CardContent>
    </Card>
  );
};
