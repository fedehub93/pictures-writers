"use client";

import { useMemo, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

import Editor from "@/components/editor";
import { createWrappedEditor } from "@/components/editor/editor-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface BodyFormProps {
  initialData: {
    body: string;
  };
  postId: string;
}

const formSchema = z.object({
  body: z.any(),
});

export const ContentForm = ({ initialData, postId }: BodyFormProps) => {
  const editor = useMemo(() => createWrappedEditor(), []);

  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { body: [{ type: "paragraph", children: [{ text: "" }] }] },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <div className="h-full">
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
      {!isEditing && <p>{initialData.body}</p>}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <Editor {...field} editor={editor} />
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
