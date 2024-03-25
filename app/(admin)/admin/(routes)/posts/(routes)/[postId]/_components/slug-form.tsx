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
import { cn } from "@/lib/utils";

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
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Post updated");
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
    <div
      className={cn(
        "col-span-full md:col-span-4 lg:col-span-9 border-l-4 dark:bg-slate-900 p-4",
        isFocused && "border-l-blue-500"
      )}
    >
      <div className="flex items-center justify-between">Post slug</div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-row gap-x-2">
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      placeholder="e.g. how-do-you-write-a-book"
                      onFocus={(e) => {
                        setIsFocused(true);
                      }}
                      onBlur={(e) => {
                        setIsFocused(false);
                        field.onBlur();
                      }}
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
        </form>
      </Form>
    </div>
  );
};
