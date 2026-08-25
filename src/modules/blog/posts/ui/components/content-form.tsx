"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Descendant } from "slate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

import { ContentStatus, EditorType } from "@/generated/prisma";

import { Form, FormControl, FormField, FormItem } from "@/shared/ui/form";
import { GenericTiptapV2 } from "@/shared/components/form-component/generic-tiptap-v2";

import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import Editor from "@/app/(admin)/_components/editor";

import { usePostStore } from "../../store/use-post-store";
import { usePostsFilters } from "../../hooks/use-posts-filters";

interface BodyFormProps {
  initialData: {
    id: string;
    editorType: EditorType;
    bodyData: Descendant[];
    tiptapBodyData: any;
    status: ContentStatus;
  };
  rootId: string;
  postId: string;
}

const formSchema = z.object({
  bodyData: z.custom<Descendant[]>(),
  tiptapBodyData: z.any().optional(),
});

export const ContentForm = ({ initialData, rootId, postId }: BodyFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = usePostsFilters();
  const { setStatus } = usePostStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      bodyData: initialData.bodyData || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      tiptapBodyData: initialData.tiptapBodyData || {
        type: "doc",
        content: [],
      },
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
        setStatus("saved");
        toast.success("Post updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    setStatus("saving");
    updatePost({
      ...dirtyData,
      id: postId,
      rootId: rootId,
      bodyData: dirtyData.bodyData,
      tiptapBodyData: dirtyData.tiptapBodyData,
    });
  });

  const onChangeBody = (value: Descendant[]) => {
    form.setValue("bodyData", value);
  };

  const onValueChangeBody = (value: Descendant[]) => {
    handleAutoSave();
  };

  return (
    <div>
      <Form {...form}>
        <form onChange={handleAutoSave} className="space-y-4">
          {initialData.editorType === EditorType.SLATE && (
            <FormField
              control={form.control}
              name="bodyData"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <Editor
                      {...field}
                      onChange={onChangeBody}
                      onValueChange={onValueChangeBody}
                    >
                      <Editor.Toolbar sticky />
                      <Editor.Input onHandleIsFocused={() => {}} />
                      <Editor.Counter value={field.value} />
                    </Editor>
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          {initialData.editorType === EditorType.TIPTAP && (
            <GenericTiptapV2
              key={initialData.id}
              id={initialData.id}
              control={form.control}
              name="tiptapBodyData"
              onUpdate={handleAutoSave}
            />
          )}
        </form>
      </Form>
    </div>
  );
};
