"use client";

import { Control } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { AdBlockFormValues } from "@/schemas/ads";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericMultiSelect } from "@/shared/components/form-component/generic-multi-select";

import { useCategoriesQuery } from "@/modules/blog/categories/hooks/use-categories";
import { useTagsQuery } from "@/modules/blog/tags/hooks/use-tags";
import { usePostsQuery } from "@/modules/blog/posts/hooks/use-posts";

interface BlockVisibilityFormProps {
  control: Control<AdBlockFormValues>;
  isSubmitting: boolean;
}

export const BlockVisibilityForm = ({
  control,
  isSubmitting,
}: BlockVisibilityFormProps) => {
  const { data: posts, isLoading: isPostsLoading } = usePostsQuery({});
  const { data: categories, isLoading: isCategoriesLoading } =
    useCategoriesQuery();
  const { data: tags, isLoading: isTagsLoading } = useTagsQuery();

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
            posts
              ? posts.items.map((c) => ({ id: c.rootId!, label: c.title }))
              : []
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
              ? categories.items.map((c) => ({ id: c.rootId!, label: c.title }))
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
            tags
              ? tags.items.map((c) => ({ id: c.rootId!, label: c.title }))
              : []
          }
          isLoading={isTagsLoading}
          disabled={isSubmitting}
        />
      </CardContent>
    </Card>
  );
};
