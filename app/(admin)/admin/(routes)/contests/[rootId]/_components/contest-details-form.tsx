"use client";

import * as z from "zod";
import { Control, useController } from "react-hook-form";
import slugify from "slugify";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { contestFormSchema } from "./contest-form";
import { GenericInput } from "@/components/form-component/generic-input";
import { OrganizationSelect } from "../../_components/organization-select";
import { SlugInput } from "@/components/form-component/slug-input";
import { GenericSwitch } from "@/components/form-component/generic-switch";
import { ImageForm } from "./contest-image-cover";
import { Contest, Media } from "@prisma/client";
import { Separator } from "@/components/ui/separator";

interface ContestDetailsFormProps {
  control: Control<z.infer<typeof contestFormSchema>>;
  initialData: Contest & {
    imageCover: Media | null;
  };
  isSubmitting: boolean;
}

export const ContestDetailsForm = ({
  control,
  initialData,
  isSubmitting,
}: ContestDetailsFormProps) => {
  const { field: fieldSlug } = useController({ control, name: "slug" });

  const onSlugCreate = () => {
    fieldSlug.onChange(
      slugify(fieldSlug.value, {
        lower: true,
      })
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between items-center">
          <div>📖 Contest Details</div>
          <GenericSwitch
            control={control}
            name="isOpen"
            label="Is Open?"
            disabled={isSubmitting}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageForm
          control={control}
          name="imageCoverId"
          imageCoverUrl={initialData.imageCover?.url}
        />
        <OrganizationSelect control={control} isSubmitting={isSubmitting} />
        <GenericInput
          control={control}
          name="name"
          label="Name"
          placeholder="e.g. Pictures Writers Script Contest"
          disabled={isSubmitting}
          onBlur={(e) => {
            if (!fieldSlug.value) {
              onSlugCreate();
            }
          }}
        />
        <SlugInput
          control={control}
          name="slug"
          label="Slug"
          placeholder="e.g. pictures-writers-script-contest-2025"
          disabled={isSubmitting}
          buttonOnClick={onSlugCreate}
        />
      </CardContent>
    </Card>
  );
};
