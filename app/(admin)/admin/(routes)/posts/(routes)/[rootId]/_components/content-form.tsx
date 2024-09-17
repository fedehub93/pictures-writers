"use client";

import { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useDebounceCallback } from "usehooks-ts";
import { Descendant } from "slate";
import { ContentStatus } from "@prisma/client";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

import Editor from "@/components/editor";
import { cn } from "@/lib/utils";

interface BodyFormProps {
  initialData: {
    bodyData: Descendant[];
    status: ContentStatus;
  };
  rootId: string;
  postId: string;
}

const formSchema = z.object({
  bodyData: z.custom<Descendant[]>(),
});

export const ContentForm = ({ initialData, rootId, postId }: BodyFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      bodyData: initialData.bodyData || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
    },
  });

  const onHandleIsFocused = (value: boolean) => {
    setIsFocused(value);
  };

  const { isValid } = form.formState;

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

  const debouncedSubmit = useDebounceCallback(() => {
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
      <div className="flex items-center justify-between">Content</div>
      {/* {!isEditing && initialData.bodyData && (
        // <SlateView
        //   nodes={initialData.bodyData}
        //   transforms={{
        //     elements: [
        //       Paragraph,
        //       HeadingOne,
        //       HeadingTwo,
        //       HeadingThree,
        //       HeadingFour,
        //       Link,
        //     ],
        //     leaves: [RichText],
        //   }}
        // />
        <Editor value={initialData.bodyData}>
          <Editor.Input readonly />
        </Editor>
      )} */}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
                    <Editor.Toolbar />
                    <Editor.Input onHandleIsFocused={onHandleIsFocused} />
                    <Editor.Counter value={field.value} />
                  </Editor>
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
