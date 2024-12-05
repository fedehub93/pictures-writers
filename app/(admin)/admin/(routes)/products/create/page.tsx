"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

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
import { ProductCategory } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookText, ClipboardPen, ExternalLink, Sparkles } from "lucide-react";
import slugify from "slugify";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  slug: z.string().min(1, {
    message: "Slug is required",
  }),
  category: z.nativeEnum(ProductCategory),
});

const categories = [
  { type: ProductCategory.EBOOK, label: "Ebook", Icon: BookText },
  { type: ProductCategory.SERVICE, label: "Coverage", Icon: ClipboardPen },
  { type: ProductCategory.AFFILIATE, label: "Affiliate", Icon: ExternalLink },
];

const ProductCreatePage = () => {
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
      const response = await axios.post("/api/products", values);
      router.push(`/admin/products/${response.data.id}`);

      toast.success("Product created");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
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
        <h1 className="text-2xl font-medium">Name your Product</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your Product? Don&apos;t worry, you can
          change this later.
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
                  <FormLabel>Product Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. Ebook Screenplay 101"
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
                  <FormLabel>Product Slug</FormLabel>
                  <FormControl>
                    <div className="flex flex-row gap-x-2">
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g. screenplay-101"
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
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-2"
                    >
                      {categories.map((category) => (
                        <FormItem key={category.type}>
                          <div>
                            <FormControl>
                              <RadioGroupItem
                                value={category.type}
                                id={category.type}
                                className="peer sr-only"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor={category.type}
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <category.Icon className="w-6 h-6 mb-3" />
                              {category.label}
                            </FormLabel>
                          </div>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Link href="/admin/products">
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

export default ProductCreatePage;
