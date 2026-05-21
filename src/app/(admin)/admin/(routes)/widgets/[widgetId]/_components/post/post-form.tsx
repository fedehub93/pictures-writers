"use client";

import * as z from "zod";

import { useEffect, useState } from "react";
import { Control, useController } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { WidgetPostType } from "@/types";

import { widgetFormSchema } from "../widget-form";
import { PostTypeForm } from "./post-type-form";
import { SpecificCategoryForm } from "./post-category-form";
import { GenericInput } from "@/components/form-component/generic-input";

interface WidgetPostFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

export const WidgetPostForm = ({
  control,
  isSubmitting,
}: WidgetPostFormProps) => {
  const [isDisabledSpecificPost, setIsDisabledSpecificPost] = useState(false);
  const { field: fieldType } = useController({
    control,
    name: "metadata.postType",
  });

  useEffect(() => {
    setIsDisabledSpecificPost(fieldType.value !== WidgetPostType.SPECIFIC);
  }, [fieldType.value]);

  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          Metadata
        </div>
        <CardTitle className="text-base">Post widget details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenericInput
          control={control}
          name="metadata.label"
          label="Label"
          disabled={isSubmitting}
          placeholder="Latest News"
        />

        <PostTypeForm
          control={control}
          isSubmitting={isSubmitting}
          isDisabled={isDisabledSpecificPost}
        />

        <SpecificCategoryForm
          control={control}
          isSubmitting={isSubmitting}
          isDisabled={!isDisabledSpecificPost}
        />
      </CardContent>
    </Card>
  );
};
