"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  title: z.string().min(1, {
    error: "Title is required",
  }),
  slug: z.string().min(1, {
    error: "Slug is required",
  }),
});

const TagCreatePage = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post("/api/tags", values);
      router.push(`/admin/tags/${response.data.id}`);

      toast.success("Tag created");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onSlugCreate = () => {
    form.setValue(
      "slug",
      slugify(form.getValues("title"), {
        lower: true,
      })
    );
  };

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div>
        <h1 className="text-2xl font-medium">Name your tag</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your tag? Don&apos;t worry, you can change
          this later.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-8"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. Pagina uno"
                      {...field}
                      onBlur={(e) => {
                        if (!form.getValues("slug")) {
                          onSlugCreate();
                        }
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Slug</FormLabel>
                  <FormControl>
                    <div className="flex flex-row gap-x-2">
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g. pagina-uno"
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
            <div className="flex items-center gap-x-2">
              <Link href="/admin/tags">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default TagCreatePage;
