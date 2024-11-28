"use client";
import { Product } from "@prisma/client";

import * as z from "zod";
import { Control, useController } from "react-hook-form";
import { Sparkles } from "lucide-react";
import slugify from "slugify";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { productFormSchema } from "./product-form";
import { Button } from "@/components/ui/button";
import Editor from "@/components/editor";
import { Descendant } from "slate";

interface ProductDetailsFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
  initialData: Product;
  isSubmitting: boolean;
}

export const ProductDetailsForm = ({
  control,
  initialData,
  isSubmitting,
}: ProductDetailsFormProps) => {
  const { field: fieldTitle } = useController({ control, name: "title" });
  const { field: fieldSlug } = useController({ control, name: "slug" });
  const { field: fieldDescription } = useController({
    control,
    name: "description",
  });

  const onSlugCreate = () => {
    fieldSlug.onChange(
      slugify(fieldTitle.value, {
        lower: true,
      })
    );
  };

  const onChangeBody = (value: Descendant[]) => {
    fieldDescription.onChange(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Product Details <Badge>{initialData.category!}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Screenplay 101 Ebook"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <>
                  <div className="flex flex-row gap-x-2">
                    <Input
                      {...field}
                      placeholder="screenplay-101"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onSlugCreate}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="This ebook talks about..."
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Editor {...field} onChange={onChangeBody}>
                  <Editor.Toolbar showEmbedButton={false} padding="xs" />
                  <Editor.Input onHandleIsFocused={() => {}} />
                  <Editor.Counter value={field.value} />
                </Editor>
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
