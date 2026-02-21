"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { ContentStatus, ProductCategory, Seo } from "@/generated/prisma";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";
import { CategoryDetails } from "./category-details-form";
import { CategorySeoForm } from "./category-seo-form";
import {
  productCategoryFormSchema,
  ProductCategoryFormValues,
} from "@/schemas/product-category";

interface CategoryFormProps {
  initialData: ProductCategory & {
    seo: Seo | null;
  };
  apiUrl: string;
}

const defaultSEO = {
  title: "",
  description: "",
};

export const CategoryForm = ({ initialData, apiUrl }: CategoryFormProps) => {
  const router = useRouter();

  const form = useForm<ProductCategoryFormValues>({
    mode: "all",
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: {
      ...initialData,
      description: initialData.description || "",
      seo: initialData.seo
        ? { ...initialData.seo, description: initialData.seo.description || "" }
        : { ...defaultSEO },
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: ProductCategoryFormValues) => {
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
      toast.success(`Product updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const requiredFields = [initialData.title];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  if (!initialData || !initialData.rootId) {
    return redirect("/admin/shop/products");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Category setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <CategoryDetails
                  control={form.control}
                  initialData={initialData}
                  isSubmitting={isSubmitting}
                />
                <CategorySeoForm
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
            <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
              <StatusView
                disabled={!isComplete}
                contentType={SeoContentTypeApi.ProductCategory}
                contentRootId={initialData.rootId!}
                contentId={initialData.id}
                status={initialData.status}
                lastSavedAt={initialData.updatedAt!}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
