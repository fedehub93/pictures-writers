"use client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdBlockFormValues } from "@/schemas/ads";

import { GenericInput } from "@/components/form-component/generic-input";
import { useCategoriesQuery } from "@/app/(admin)/_hooks/use-categories";
import { GenericMultiSelect } from "@/components/form-component/generic-multi-select";
import { useTagssQuery } from "@/app/(admin)/_hooks/use-tags-query";
import { usePostsQuery } from "@/app/(admin)/_hooks/use-posts-query";

interface BlockVisibilityFormProps {
  control: Control<AdBlockFormValues>;
  isSubmitting: boolean;
}

export const BlockVisibilityForm = ({
  control,
  isSubmitting,
}: BlockVisibilityFormProps) => {
  const {
    data: posts,
    isError: isPostsQuery,
    isLoading: isPostsLoading,
  } = usePostsQuery();
  const {
    data: categories,
    isError: isCategoriesError,
    isLoading: isCategoriesLoading,
  } = useCategoriesQuery();
  const {
    data: tags,
    isError: isTagsError,
    isLoading: isTagsLoading,
  } = useTagssQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Block Visibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="minWords"
          label="Minimum words"
          type="number"
          className="text-right"
          disabled={isSubmitting}
        />
        <GenericMultiSelect
          control={control}
          name="excludedPostIds"
          label="Excluded posts"
          data={
            posts ? posts.map((c) => ({ id: c.rootId!, label: c.title })) : []
          }
          isLoading={isPostsLoading}
          disabled={isSubmitting}
        />
        <GenericMultiSelect
          control={control}
          name="excludedCategoryIds"
          label="Excluded categories"
          data={
            categories
              ? categories.map((c) => ({ id: c.rootId!, label: c.title }))
              : []
          }
          isLoading={isCategoriesLoading}
          disabled={isSubmitting}
        />
        <GenericMultiSelect
          control={control}
          name="excludedTagIds"
          label="Excluded tags"
          data={
            tags ? tags.map((c) => ({ id: c.rootId!, label: c.title })) : []
          }
          isLoading={isTagsLoading}
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
