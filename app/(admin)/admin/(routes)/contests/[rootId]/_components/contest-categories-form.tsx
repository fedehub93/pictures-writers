"use client";

import * as z from "zod";
import { Control, useFieldArray } from "react-hook-form";
import { Contest, Media } from "@prisma/client";
import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { GenericInput } from "@/components/form-component/generic-input";

import { contestFormSchema } from "./contest-form";
import { Badge } from "@/components/ui/badge";

interface ContestCategoriesFormProps {
  control: Control<z.infer<typeof contestFormSchema>>;
  initialData: Contest & {
    imageCover: Media | null;
  };
  isSubmitting: boolean;
}

export const ContestCategoriesForm = ({
  control,
  initialData,
  isSubmitting,
}: ContestCategoriesFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "categories",
  });

  const onAddCategory = () => {
    append({
      id: undefined,
      name: "",
    });
  };

  const onRemoveDeadline = (index: number) => {
    remove(index);
  };

  return (
    <Card>
      <CardHeader className="flex md:flex-row items-center justify-between w-full">
        <CardTitle className="text-base">
          <div>🏷️ Categories</div>
        </CardTitle>
        <Button
          disabled={isSubmitting}
          onClick={toggleEdit}
          type="button"
          variant="secondary"
        >
          {isEditing && <>Cancel</>}
          {!isEditing && (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!isEditing && fields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fields.map((field, index) => (
              <Badge key={index}>{field.name}</Badge>
            ))}
          </div>
        )}
        {!isEditing && fields.length === 0 && (
          <div className="flex flex-wrap gap-2">No deadlines found!</div>
        )}
        {isEditing && (
          <div className="space-y-8">
            {fields.map((field, index) => (
              <div key={index} className="flex gap-x-4">
                <div className="flex flex-wrap w-full gap-4">
                  <GenericInput
                    control={control}
                    name={`categories.${index}.name`}
                    label="Name"
                    placeholder="Early Bird Deadline"
                    disabled={isSubmitting}
                    className="min-w-40"
                  />

                  <Separator />
                </div>

                <div className="text-right">
                  <Button
                    size="icon"
                    variant="destructive"
                    type="button"
                    className="size-4"
                    disabled={isSubmitting}
                    onClick={() => onRemoveDeadline(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={onAddCategory}
              variant="outline"
              disabled={isSubmitting}
            >
              Add a category
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
