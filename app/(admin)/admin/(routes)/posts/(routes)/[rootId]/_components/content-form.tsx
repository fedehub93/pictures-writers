"use client";

import { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Descendant } from "slate";
import { useDebouncedCallback } from "use-debounce";

import { ContentStatus, EditorType } from "@prisma/client";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import Editor from "@/app/(admin)/_components/editor";
import { GenericTiptap } from "@/components/form-component/generic-tiptap";

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
  editorType: z.enum([EditorType.SLATE, EditorType.TIPTAP]),
  bodyData: z.custom<Descendant[]>(),
  tiptapBodyData: z.any().optional(),
});

export const ContentForm = ({ initialData, rootId, postId }: BodyFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      editorType: initialData.editorType || EditorType.SLATE,
      bodyData: initialData.bodyData || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      tiptapBodyData: initialData.tiptapBodyData || {
        type: "doc",
        content: [],
      },
    },
  });

  const { watch, setValue, handleSubmit, control, formState } = form;
  const { isValid } = formState;
  const editorType = watch("editorType");

  const onHandleIsFocused = (value: boolean) => {
    setIsFocused(value);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`/api/posts/${rootId}/versions`, values);
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`/api/posts/${rootId}/versions/${postId}`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onChangeBody = (value: Descendant[]) => {
    form.setValue("bodyData", value);
  };

  const onValueChangeBody = (value: Descendant[]) => {
    debouncedSubmit();
  };

  const debouncedSubmit = useDebouncedCallback(() => {
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <div
      className={cn(
        "border-l-4  dark:bg-slate-900 p-4 transition",
        isFocused && "border-l-blue-500",
        !isValid && "border-l-red-500"
      )}
    >
      <div className="flex items-center justify-between">
        <span>Content</span>
        <FormField
          control={control}
          name="editorType"
          render={({ field }) => (
            <FormItem>
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  form.handleSubmit(onSubmit)();
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Editor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EditorType.SLATE}>Slate</SelectItem>
                  <SelectItem value={EditorType.TIPTAP}>Tiptap</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {editorType === EditorType.SLATE && (
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
                      <Editor.Input onHandleIsFocused={onHandleIsFocused} />
                      <Editor.Counter value={field.value} />
                    </Editor>
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          {editorType === EditorType.TIPTAP && (
            <GenericTiptap
              key={initialData.id}
              id={initialData.id}
              control={form.control}
              name="tiptapBodyData"
              onUpdate={debouncedSubmit}
            />
          )}
        </form>
      </Form>
    </div>
  );
};
