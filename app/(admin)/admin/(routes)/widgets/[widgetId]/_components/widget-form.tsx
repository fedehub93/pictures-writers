"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { SocialKey, Widget, WidgetSection, WidgetType } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import {
  WidgetCategoryType,
  WidgetPostCategoryFilter,
  WidgetPostType,
  WidgetProductType,
} from "@/types";
import {
  isWidgetAuthorMetadata,
  isWidgetCategoryMetadata,
  isWidgetNewsletterMetadata,
  isWidgetProductPopMetadata,
  isWidgetPostMetadata,
  isWidgetProductMetadata,
  isWidgetSearchMetadata,
  isWidgetSocialMetadata,
  isWidgetTagMetadata,
} from "@/type-guards";

import { WidgetDetailsForm } from "./widget-details-form";
import { WidgetStatusView } from "./widget-status";
import { WidgetSort } from "./widget-sort";

import { WidgetPostForm } from "./post/post-form";
import { WidgetSearchForm } from "./search/search-form";
import { WidgetProductForm } from "./product/product-form";
import { WidgetCategoryForm } from "./category/category-form";
import { WidgetNewsletterForm } from "./newsletter/newsletter-form";
import { WidgetAuthorForm } from "./author/author-form";
import { WidgetTagForm } from "./tag/tag-form";
import { WidgetSocialForm } from "./social/social-form";
import { WidgetPopupForm } from "./popup/popup-form";

interface WidgetFormProps {
  initialData: Widget;
  apiUrl: string;
}

const WidgetTypeZ = z.enum([
  WidgetType.SEARCH_BOX,
  WidgetType.POST,
  WidgetType.CATEGORY,
  WidgetType.PRODUCT,
  WidgetType.NEWSLETTER,
  WidgetType.AUTHOR,
  WidgetType.TAG,
  WidgetType.SOCIAL,
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

const WidgetSocialKeyZ = z.enum([
  SocialKey.FACEBOOK,
  SocialKey.INSTAGRAM,
  SocialKey.LINKEDIN,
  SocialKey.TWITTER,
  SocialKey.PINTEREST,
  SocialKey.YOUTUBE,
]);

const WidgetCategoryTypeZ = z.enum([WidgetCategoryType.ALL]);

const WidgetPostMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
  postType: WidgetPostTypeZ,
  posts: z.array(
    z.object({
      rootId: z.string(),
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
      rootId: z.string(),
      sort: z.coerce.number(),
    })
  ),
  limit: z.number(),
});

// Schema per WidgetNewsleterMetadata
const WidgetNewsletterMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
});

const WidgetAuthorMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
});

const WidgetTagMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
});

const WidgetSocialMetadataSchema = z.object({
  label: z.string(),
  type: WidgetTypeZ,
  socials: z.array(
    z.object({
      key: WidgetSocialKeyZ,
      url: z.string(),
      isVisible: z.boolean().default(false),
      sort: z.coerce.number(),
    })
  ),
});

export const widgetFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required!",
  }),
  isEnabled: z.boolean(),
  // metadata: z.union([
  //   WidgetSocialMetadataSchema,
  //   WidgetSearchMetadataSchema,
  //   WidgetPostMetadataSchema,
  //   WidgetCategoryMetadataSchema,
  //   WidgetProductMetadataSchema,
  //   WidgetNewsletterMetadataSchema,
  //   WidgetAuthorMetadataSchema,
  //   WidgetTagMetadataSchema,
  // ]),
  metadata: z.any(),
});

export const WidgetForm = ({ initialData, apiUrl }: WidgetFormProps) => {
  const router = useRouter();

  const isHeroSectionWidget = initialData.section === WidgetSection.HERO;
  const isPopupSectionWidget = initialData.section === WidgetSection.MODAL_POPUP;
  const isPostSidebarWidget =
    initialData.section === WidgetSection.POST_SIDEBAR;
  const isPostBottomWidget = initialData.section === WidgetSection.POST_BOTTOM;

  const isSearchWidget = isWidgetSearchMetadata(initialData.metadata);
  const isPostWidget = isWidgetPostMetadata(initialData.metadata);
  const isCategoryWidget = isWidgetCategoryMetadata(initialData.metadata);
  const isProductWidget = isWidgetProductMetadata(initialData.metadata);
  const isSocialWidget = isWidgetSocialMetadata(initialData.metadata);
  const isNewsletterWidget = isWidgetNewsletterMetadata(initialData.metadata);
  const isAuthorWidget = isWidgetAuthorMetadata(initialData.metadata);
  const isTagWidget = isWidgetTagMetadata(initialData.metadata);

  const isProductPopupWidget = isWidgetProductPopMetadata(initialData.metadata);

  const isWidgetSortVisible = !!(isPostSidebarWidget || isPostBottomWidget);

  const metadata = {
    ...initialData.metadata,
  };

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
            <h1 className="text-2xl font-medium">Widget setup</h1>
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
                {isSocialWidget && (
                  <WidgetSocialForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isNewsletterWidget && (
                  <WidgetNewsletterForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isAuthorWidget && (
                  <WidgetAuthorForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isTagWidget && (
                  <WidgetTagForm
                    control={form.control}
                    isSubmitting={isSubmitting}
                  />
                )}
                {isProductPopupWidget && (
                  <WidgetPopupForm
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
              {isWidgetSortVisible && (
                <WidgetSort label="Sorting" section={initialData.section} />
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
