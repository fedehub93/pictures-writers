"use client";

import Image from "next/image";
import { Control, useController, useWatch } from "react-hook-form";
import { X } from "lucide-react";

import { AdItemSourceType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AdItemFormValues } from "@/schemas/ads";

import type { GetPublishedProductByRootId } from "@/data/product";
import type { GetPublishedPostByRootId } from "@/data/post";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericTextarea } from "@/components/form-component/generic-textarea";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { usePostRootIdQuery } from "@/app/(admin)/_hooks/use-post-root-id-query";
import { useProductRootIdQuery } from "@/app/(admin)/_hooks/use-product-root-id-query";

interface ItemContentProps {
  control: Control<AdItemFormValues>;
  isSubmitting: boolean;
}

const ItemContentLoader = () => {
  return (
    <div className="w-full h-24 border rounded-md flex">
      <Skeleton className="size-24 min-w-24" />
      <div className="flex flex-col gap-y-4 px-4 w-full justify-center">
        <Skeleton className="w-full h-6" />
        <Skeleton className="w-full h-6" />
      </div>
    </div>
  );
};

const ItemContentCard = (data: {
  title: string;
  description: string | null;
  imageCover: { url: string; altText: string | null } | null;
  slug: string;
  isSubmitting: boolean;
  onRemoveData?: () => void;
}) => {
  return (
    <div className="border rounded-md flex overflow-hidden gap-x-4 items-center relative">
      {data.onRemoveData && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 size-6"
          type="button"
          onClick={data.onRemoveData}
          disabled={data.isSubmitting}
        >
          <X className="size-4" />
        </Button>
      )}
      {data.imageCover && data.imageCover.url && (
        <Image
          src={data.imageCover.url}
          alt={data.imageCover.altText || ""}
          width={300}
          height={300}
          className="object-cover size-24"
        />
      )}
      <div className="flex flex-col gap-y-2">
        <div>{data.title}</div>
        <div className="text-muted-foreground">{data.slug}</div>
      </div>
    </div>
  );
};

const ItemContentAddButton = ({
  label,
  onAddItem,
  isSubmitting,
}: {
  label: string;
  onAddItem: () => void;
  isSubmitting: boolean;
}) => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onAddItem}
      disabled={isSubmitting}
    >
      {label}
    </Button>
  );
};

export const ItemContent = ({ control, isSubmitting }: ItemContentProps) => {
  const { onOpen } = useModal();

  const { field: fieldPost } = useController({ name: "postRootId", control });
  const { field: fieldProduct } = useController({
    name: "productRootId",
    control,
  });
  const { field: fieldTitle } = useController({ name: "title", control });
  const { field: fieldDescription } = useController({
    name: "description",
    control,
  });
  const { field: fieldImageUrl } = useController({ name: "imageUrl", control });
  const { field: fieldUrl } = useController({ name: "url", control });

  const sourceType = useWatch({
    control,
    name: "sourceType",
  }) as AdItemSourceType;
  const postRootId = useWatch({ control, name: "postRootId" });
  const productRootId = useWatch({ control, name: "productRootId" });

  const isDisabledField =
    isSubmitting || sourceType !== AdItemSourceType.STATIC;

  const {
    data: postData,
    isLoading: postDataLoading,
    isError: postDataError,
  } = usePostRootIdQuery({
    rootId: postRootId,
    enabled: sourceType === AdItemSourceType.POST,
  });

  const {
    data: productData,
    isLoading: productDataLoading,
    isError: productDataError,
  } = useProductRootIdQuery({
    rootId: productRootId,
    enabled: sourceType === AdItemSourceType.PRODUCT,
  });

  const onAddPost = () => {
    onOpen("selectPost", onSelectPost);
  };

  const onRemovePost = () => {
    fieldPost.onChange(null);
  };

  const onSelectPost = (post: GetPublishedPostByRootId) => {
    if (!post) return;
    fieldPost.onChange(post.rootId);
    fieldTitle.onChange(post.title);
    fieldDescription.onChange(post.description);
    fieldImageUrl.onChange(post.imageCover?.url);
    fieldUrl.onChange(`/${post.slug}`);
  };

  const onAddProduct = () => {
    onOpen("selectProduct", onSelectProduct);
  };

  const onRemoveProduct = () => {
    fieldProduct.onChange(null);
  };

  const onSelectProduct = (product: GetPublishedProductByRootId) => {
    if (!product) return;
    fieldProduct.onChange(product.rootId);
    fieldTitle.onChange(product.title);
    fieldDescription.onChange("");
    fieldImageUrl.onChange(product.imageCover?.url);
    fieldUrl.onChange(`/${product.slug}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Item Content
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* --- POST TYPE --- */}
        {sourceType === AdItemSourceType.POST && (
          <>
            {postDataLoading && <ItemContentLoader />}
            {fieldPost.value && postData && (
              <ItemContentCard
                title={postData.title}
                description={postData.description}
                imageCover={postData.imageCover}
                slug={postData.slug}
                onRemoveData={onRemovePost}
                isSubmitting={isSubmitting}
              />
            )}
            {(!fieldPost.value || !postData) && (
              <ItemContentAddButton
                label="Add new post"
                onAddItem={onAddPost}
                isSubmitting={isSubmitting}
              />
            )}
          </>
        )}
        {/* --- PRODUCT TYPE --- */}
        {sourceType === AdItemSourceType.PRODUCT && (
          <>
            {productDataLoading && <ItemContentLoader />}
            {fieldProduct.value && productData && (
              <ItemContentCard
                title={productData.title}
                description={""}
                imageCover={productData.imageCover}
                slug={productData.slug}
                onRemoveData={onRemoveProduct}
                isSubmitting={isSubmitting}
              />
            )}
            {(!fieldProduct.value || !productData) && (
              <ItemContentAddButton
                label="Add new product"
                onAddItem={onAddProduct}
                isSubmitting={isSubmitting}
              />
            )}
          </>
        )}
        {/* --- STATIC TYPE --- */}
        {sourceType === AdItemSourceType.STATIC && (
          <ItemContentCard
            title={fieldTitle.value || ""}
            description={fieldDescription.value || ""}
            imageCover={{ url: fieldImageUrl.value || "", altText: "" }}
            slug={fieldUrl.value || ""}
            isSubmitting={isSubmitting}
          />
        )}
        <GenericInput
          control={control}
          name="title"
          label="Title"
          disabled={isDisabledField}
        />
        <GenericTextarea
          control={control}
          name="description"
          label="Description"
          disabled={isDisabledField}
        />
        <GenericInput
          control={control}
          name="imageUrl"
          label="Image URL"
          disabled={isDisabledField}
        />
        <GenericInput
          control={control}
          name="url"
          label="URL"
          disabled={isDisabledField}
        />
      </CardContent>
    </Card>
  );
};
