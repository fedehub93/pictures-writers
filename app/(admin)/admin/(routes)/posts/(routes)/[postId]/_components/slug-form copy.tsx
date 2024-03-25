"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Sparkles } from "lucide-react";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import slugify from "slugify";

interface SlugFormProps {
  initialData: {
    title: string;
    slug: string;
  };
  postId: string;
}

const formSchema = z.object({
  slug: z.string().min(1, {
    message: "Title is required!",
  }),
});

export const SlugForm = ({ initialData, postId }: SlugFormProps) => {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
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

  const onSlugCreate = () => {
    form.setValue(
      "slug",
      slugify(initialData.title, {
        lower: true,
      })
    );
  };

  return (
    <div className="col-span-full md:col-span-4 lg:col-span-9 bg-slate-100 dark:bg-slate-900 border rounded-md p-4">
      <div className="flex items-center justify-between">
        Post slug
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit slug
            </>
          )}
        </Button>
      </div>
      {!isEditing && <p>{initialData.slug}</p>}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-row gap-x-2">
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g. how-do-you-write-a-book"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onSlugCreate}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
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
