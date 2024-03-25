"use client";

import { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

import Editor, { CustomElement } from "@/components/editor";

interface BodyFormProps {
  initialData: {
    bodyData: CustomElement[];
  };
  postId: string;
}

const formSchema = z.object({
  bodyData: z.custom<CustomElement[]>(),
});

export const ContentForm = ({ initialData, postId }: BodyFormProps) => {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bodyData: initialData.bodyData || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Post updated");
      toggleEdit();
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        Post body
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit body
            </>
          )}
        </Button>
      </div>
      {!isEditing && initialData.bodyData && (
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
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="bodyData"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <Editor {...field}>
                      <Editor.Toolbar />
                      <Editor.Input />
                    </Editor>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className="flex items-center gap-x-2"
              disabled={!isValid || isSubmitting}
              type="submit"
            >
              Save
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};
