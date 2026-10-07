"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ContentStatus } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { StatusBox } from "@/modules/blog/shared/components/status-box";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { ProductCategoryDetailsForm } from "../components/product-category-details-form";
import { ProductCategorySeoForm } from "../components/product-category-seo-form";
import { useSuspenseProductCategory } from "../../../hooks/use-product-categories";
import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

interface ProductCategoryIdViewProps {
  rootId: string;
}

export const ProductCategoryIdView = ({
  rootId,
}: ProductCategoryIdViewProps) => {
  const { data: category } = useSuspenseProductCategory(rootId);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters] = useProductCategoriesFilters();

  const canPublish = usePermission(PERMISSIONS.PRODUCT_CATEGORIES_PUBLISH);
  const canDelete = usePermission(PERMISSIONS.PRODUCT_CATEGORIES_DELETE);

  const publishCategory = useMutation(
    trpc.productCategories.publish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        queryClient.invalidateQueries(
          trpc.productCategories.getLastByRootId.queryFilter({ rootId }),
        );
        toast.success("Product category published successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to publish the category");
      },
    }),
  );

  const unpublishCategory = useMutation(
    trpc.productCategories.unpublish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        queryClient.invalidateQueries(
          trpc.productCategories.getLastByRootId.queryFilter({ rootId }),
        );
        toast.success("Product category unpublished successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to unpublish the category");
      },
    }),
  );

  const removeCategory = useMutation(
    trpc.productCategories.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        toast.success("Product category deleted successfully");
        router.push("/admin/shop/categories");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onTogglePublish = () => {
    if (category.status === ContentStatus.PUBLISHED) {
      return unpublishCategory.mutate({ id: category.id });
    }
    return publishCategory.mutate({ id: category.id, rootId });
  };

  const requiredFields = [category.title, category.slug];
  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  const disabled = publishCategory.isPending || unpublishCategory.isPending;

  return (
    <div className="size-full mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-medium tracking-tight">
          Product category setup
        </h1>
        <div className="flex items-center gap-x-4">
          <span className="text-sm font-medium">
            Complete all fields {completionText}
          </span>
          {canDelete && (
            <ConfirmModal
              onConfirm={() => removeCategory.mutate({ id: category.id })}
            >
              <Button size="sm" variant="destructive" disabled={disabled}>
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </ConfirmModal>
          )}
        </div>
      </div>

      <Tabs defaultValue="category" className="w-full">
        <div className="grid grid-cols-1 xl:grid-cols-24 gap-6 xl:gap-8 pt-8">
          <div className="xl:col-span-3">
            <TabsList className="flex flex-row xl:flex-col h-auto w-full justify-start bg-transparent p-0">
              <TabsTrigger
                value="category"
                className="w-full justify-start rounded-none border-b-2 xl:border-b-0 xl:border-l-2 border-border px-4 py-2.5 transition-colors hover:text-secondary-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Category
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="w-full justify-start rounded-none border-b-2 xl:border-b-0 xl:border-l-2 border-border px-4 py-2.5 transition-colors hover:text-secondary-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                SEO
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="xl:col-span-15 min-w-0">
            <TabsContent value="category" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <ProductCategoryDetailsForm
                    id={category.id}
                    rootId={rootId}
                    initialData={category}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    SEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <ProductCategorySeoForm
                    id={category.id}
                    rootId={rootId}
                    initialData={category.seo}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="xl:col-span-6">
            <div className="sticky top-6">
              <StatusBox
                status={category.status}
                lastSavedAt={category.updatedAt}
                disabled={disabled || !canPublish}
                canPublish={isComplete}
                onToggleStatus={onTogglePublish}
              />
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export const ProductCategoryIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Category"
      description="This may take a few seconds"
    />
  );
};

export const ProductCategoryIdViewError = () => {
  return (
    <ErrorState title="Error Category" description="Something went wrong" />
  );
};
