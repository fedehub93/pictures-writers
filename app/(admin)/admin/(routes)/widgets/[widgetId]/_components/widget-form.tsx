"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { Widget, WidgetSection, WidgetType } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import {
  WidgetCategoryType,
  WidgetPostCategoryFilter,
  WidgetPostType,
  WidgetProductType,
} from "@/types";
import {
  isWidgetCategoryMetadata,
  isWidgetPostMetadata,
  isWidgetProductMetadata,
  isWidgetSearchMetadata,
} from "@/type-guards";

import { WidgetDetailsForm } from "./widget-details-form";
import { WidgetStatusView } from "./widget-status";
import { WidgetSort } from "./widget-sort";

import { WidgetPostForm } from "./post/post-form";
import { WidgetSearchForm } from "./search/search-form";
import { WidgetProductForm } from "./product/product-form";
import { WidgetCategoryForm } from "./category/category-form";

interface WidgetFormProps {
  initialData: Widget;
  apiUrl: string;
}

const WidgetTypeZ = z.enum([
  WidgetType.SEARCH_BOX,
  WidgetType.POST,
  WidgetType.CATEGORY,
  WidgetType.PRODUCT,
]);

const WidgetSearchMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
  isDynamic: z.boolean(),
});

const WidgetPostTypeZ = z.enum([
  WidgetPostType.ALL,
  WidgetPostType.LATEST,
  WidgetPostType.POPULAR,
  WidgetPostType.SPECIFIC,
  WidgetPostType.CORRELATED,
]);

const WidgetPostCategoryFilterZ = z.enum([
  WidgetPostCategoryFilter.ALL,
  WidgetPostCategoryFilter.CURRENT,
  WidgetPostCategoryFilter.SPECIFIC,
]);

const WidgetProductTypeZ = z.enum([
  WidgetProductType.ALL,
  WidgetProductType.SPECIFIC,
]);

const WidgetCategoryTypeZ = z.enum([WidgetCategoryType.ALL]);

const WidgetPostMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
  postType: WidgetPostTypeZ,
  posts: z.array(
    z.object({
      id: z.string(),
      sort: z.coerce.number(),
    })
  ),
  categoryFilter: WidgetPostCategoryFilterZ,
  categories: z.array(z.string()),
  limit: z.number(),
});

const WidgetCategoryMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
  categoryType: WidgetCategoryTypeZ,
  limit: z.number(),
});

// Schema per WidgetProductMetadata
const WidgetProductMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
  productType: WidgetProductTypeZ,
  products: z.array(
    z.object({
      id: z.string(),
      sort: z.coerce.number(),
    })
  ),
  limit: z.number(),
});

export const widgetFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required!",
  }),
  isEnabled: z.boolean(),
  metadata: z.union([
    WidgetSearchMetadataSchema,
    WidgetPostMetadataSchema,
    WidgetCategoryMetadataSchema,
    WidgetProductMetadataSchema,
  ]),
});

export const WidgetForm = ({ initialData, apiUrl }: WidgetFormProps) => {
  const router = useRouter();

  const isHeroWidget = initialData.section === WidgetSection.HERO;
  const isPopupWidget = initialData.section === WidgetSection.POPUP;
  const isPostSidebarWidget =
    initialData.section === WidgetSection.POST_SIDEBAR;

  const isSearchWidget = isWidgetSearchMetadata(initialData.metadata);
  const isPostWidget = isWidgetPostMetadata(initialData.metadata);
  const isCategoryWidget = isWidgetCategoryMetadata(initialData.metadata);
  const isProductWidget = isWidgetProductMetadata(initialData.metadata);

  const metadata = initialData.metadata;

  const form = useForm<z.infer<typeof widgetFormSchema>>({
    mode: "all",
    resolver: zodResolver(widgetFormSchema),
    defaultValues: {
      ...initialData,
      metadata,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof widgetFormSchema>) => {
    try {
      console.log(values)
      await axios.patch(`${apiUrl}`, values);
      toast.success(`Widget updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  if (!initialData || !initialData.id) {
    return redirect("/admin/widgets");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Product setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <WidgetDetailsForm
                  control={form.control}
                  initialData={initialData}
                  isSubmitting={isSubmitting}
                />
                {isSearchWidget && (
                  <WidgetSearchForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isPostWidget && (
                  <WidgetPostForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isCategoryWidget && (
                  <WidgetCategoryForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isProductWidget && (
                  <WidgetProductForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </div>
            <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
              <WidgetStatusView
                control={form.control}
                isSubmitting={isSubmitting}
              />
              {isPostSidebarWidget && (
                <WidgetSort section={initialData.section} />
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
