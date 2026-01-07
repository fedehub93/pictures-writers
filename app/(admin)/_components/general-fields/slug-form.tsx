"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { ChangeEvent, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import slugify from "slugify";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { ContentStatus } from "@/prisma/generated/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { CharsCounter } from "@/components/chars-counter";

interface SlugFormProps {
  initialData: {
    id: string;
    title: string;
    slug: string;
    status: ContentStatus;
  };
  placeholder: string;
  apiUrl: string;
}

export const formSchema = z.object({
  slug: z.string().min(1, {
    error: "Slug is required!",
  }),
});

export const SlugForm = ({
  initialData,
  placeholder,
  apiUrl,
}: SlugFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`${apiUrl}/versions`, values);
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`${apiUrl}/versions/${initialData.id}`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const debouncedSubmit = useDebounceCallback(() => {
    form.trigger("slug");
    form.handleSubmit(onSubmit)();
  }, 5000);

  const onChangeSlug = (e: ChangeEvent<HTMLInputElement>) => {
    form.setValue("slug", e.target.value);
    debouncedSubmit();
  };

  const onSlugCreate = () => {
    form.setValue(
      "slug",
      slugify(initialData.title, {
        lower: true,
      })
    );
    debouncedSubmit();
  };

  return (
    <div
      className={cn(
        "col-span-full md:col-span-4 lg:col-span-9 border-l-4 dark:bg-slate-900 p-4",
        isFocused && "border-l-blue-500",
        !isValid && "border-l-red-500"
      )}
    >
      <div className="flex items-center justify-between">Slug</div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div>
                    <div className="flex flex-row gap-x-2">
                      <Input
                        {...field}
                        placeholder={placeholder}
                        onFocus={(e) => {
                          setIsFocused(true);
                        }}
                        onBlur={(e) => {
                          setIsFocused(false);
                          field.onBlur();
                        }}
                        onChange={onChangeSlug}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onSlugCreate}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                    <CharsCounter value={field.value} />
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
