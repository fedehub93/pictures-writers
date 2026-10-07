"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ContentStatus } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { StatusBox } from "@/modules/blog/shared/components/status-box";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useSuspenseProduct } from "../../../hooks/use-products";
import { useProductsFilters } from "../../../hooks/use-products-filters";

import { ProductDetailsForm } from "../components/product-details-form";
import { ProductPricingForm } from "../components/product-pricing-form";
import { ProductGalleryForm } from "../components/product-gallery-form";
import { ProductFaqForm } from "../components/product-faq-form";
import { ProductSeoForm } from "../components/product-seo-form";
import { ProductImageForm } from "../components/product-image-form";

interface ProductIdViewProps {
  rootId: string;
}

const tabTriggerClassName =
  "w-full justify-start rounded-none border-b-2 xl:border-b-0 xl:border-l-2 border-border px-4 py-2.5 transition-colors hover:text-secondary-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none";

export const ProductIdView = ({ rootId }: ProductIdViewProps) => {
  const { data: product } = useSuspenseProduct(rootId);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters] = useProductsFilters();

  const canPublish = usePermission(PERMISSIONS.PRODUCTS_PUBLISH);
  const canDelete = usePermission(PERMISSIONS.PRODUCTS_DELETE);

  const invalidateProduct = () => {
    queryClient.invalidateQueries(trpc.products.getMany.queryFilter(filters));
    queryClient.invalidateQueries(
      trpc.products.getLastByRootId.queryFilter({ rootId }),
    );
  };

  const publishProduct = useMutation(
    trpc.products.publish.mutationOptions({
      onSuccess: () => {
        invalidateProduct();
        toast.success("Product published successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to publish the product");
      },
    }),
  );

  const unpublishProduct = useMutation(
    trpc.products.unpublish.mutationOptions({
      onSuccess: () => {
        invalidateProduct();
        toast.success("Product unpublished successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to unpublish the product");
      },
    }),
  );

  const removeProduct = useMutation(
    trpc.products.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        toast.success("Product deleted successfully");
        router.push("/admin/shop/products");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onTogglePublish = () => {
    if (product.status === ContentStatus.PUBLISHED) {
      return unpublishProduct.mutate({ id: product.id });
    }
    return publishProduct.mutate({ id: product.id, rootId });
  };

  const requiredFields = [product.title, product.slug];
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${requiredFields.length})`;
  const isComplete = requiredFields.every(Boolean);

  const disabled =
    publishProduct.isPending ||
    unpublishProduct.isPending ||
    removeProduct.isPending;

  return (
    <div className="size-full mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-x-3">
          <h1 className="text-2xl font-medium tracking-tight">
            Product setup
          </h1>
          <Badge>{product.type}</Badge>
        </div>
        <div className="flex items-center gap-x-4">
          <span className="text-sm font-medium">
            Complete all fields {completionText}
          </span>
          {canDelete && (
            <ConfirmModal
              onConfirm={() => removeProduct.mutate({ id: product.id })}
            >
              <Button size="sm" variant="destructive" disabled={disabled}>
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </ConfirmModal>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <div className="grid grid-cols-1 xl:grid-cols-24 gap-6 xl:gap-8 pt-8">
          <div className="xl:col-span-3">
            <TabsList className="flex flex-row xl:flex-col h-auto w-full justify-start bg-transparent p-0">
              <TabsTrigger value="details" className={tabTriggerClassName}>
                Details
              </TabsTrigger>
              <TabsTrigger value="pricing" className={tabTriggerClassName}>
                Pricing
              </TabsTrigger>
              <TabsTrigger value="gallery" className={tabTriggerClassName}>
                Gallery
              </TabsTrigger>
              <TabsTrigger value="faq" className={tabTriggerClassName}>
                FAQ
              </TabsTrigger>
              <TabsTrigger value="seo" className={tabTriggerClassName}>
                SEO
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="xl:col-span-15 min-w-0">
            <TabsContent value="details" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <ProductDetailsForm
                    id={product.id}
                    rootId={rootId}
                    initialData={product}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <ProductPricingForm
                    id={product.id}
                    rootId={rootId}
                    initialData={product}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <ProductGalleryForm
                    id={product.id}
                    rootId={rootId}
                    initialData={product}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="mt-0 outline-none">
              <ProductFaqForm
                id={product.id}
                rootId={rootId}
                initialData={product}
              />
            </TabsContent>

            <TabsContent value="seo" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    SEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <ProductSeoForm
                    id={product.id}
                    rootId={rootId}
                    initialData={product.seo}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="xl:col-span-6">
            <div className="sticky top-6 flex flex-col gap-y-4">
              <StatusBox
                status={product.status}
                lastSavedAt={product.updatedAt}
                disabled={disabled || !canPublish}
                canPublish={isComplete}
                onToggleStatus={onTogglePublish}
              />
              <ProductImageForm
                id={product.id}
                rootId={rootId}
                initialData={product}
              />
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export const ProductIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Product"
      description="This may take a few seconds"
    />
  );
};

export const ProductIdViewError = () => {
  return <ErrorState title="Error Product" description="Something went wrong" />;
};
