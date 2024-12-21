"use client";

import * as z from "zod";

import { ChangeEvent, useEffect, useState } from "react";
import { Control, useController } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { WidgetPostType } from "@/types";
import { SpecificPostForm } from "./specific-post-form";
import { widgetFormSchema } from "../widget-form";
import { SpecificCategoryForm } from "./specific-category-form";

interface WidgetPostFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
}

type WidgetPostFormType = {
  type: WidgetPostType;
  label: string;
};

const types: WidgetPostFormType[] = [
  {
    type: WidgetPostType.ALL,
    label: "All",
  },
  {
    type: WidgetPostType.LATEST,
    label: "Latest",
  },
  {
    type: WidgetPostType.POPULAR,
    label: "Popular",
  },
  {
    type: WidgetPostType.SPECIFIC,
    label: "Specific",
  },
  {
    type: WidgetPostType.CORRELATED,
    label: "Correlated",
  },
];

export const WidgetPostForm = ({
  control,
  isSubmitting,
}: WidgetPostFormProps) => {
  const [isDisabledSpecificPost, setIsDisabledSpecificPost] = useState(false);
  const { field: fieldType } = useController({
    control,
    name: "metadata.postType",
  });
  const { field: fieldLimit } = useController({
    control,
    name: "metadata.limit",
  });

  const onLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldLimit.onChange(Number.parseInt(e.target.value));
  };

  useEffect(() => {
    setIsDisabledSpecificPost(fieldType.value !== WidgetPostType.SPECIFIC);
  }, [fieldType.value]);

  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          {" "}
          Metadata
        </div>
        <CardTitle className="text-base">Post widget details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="metadata.label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Latest News"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-x-4 items-center">
          <FormField
            control={control}
            name="metadata.postType"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col w-4/5">
                <FormLabel className="block">Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={types[0].type}
                  {...field}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an author..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {types?.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        <div className="flex gap-x-4 items-center">
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="metadata.limit"
            render={({ field }) => (
              <FormItem className="flex flex-col w-1/5">
                <FormLabel className="block">Limit</FormLabel>
                <Input
                  {...field}
                  onChange={onLimitChange}
                  type="number"
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <SpecificPostForm
          control={control}
          isSubmitting={isSubmitting}
          isDisabled={isDisabledSpecificPost}
        />

        <SpecificCategoryForm
          control={control}
          isSubmitting={isSubmitting}
          isDisabled={false}
        />
        {/* <FormField
          control={control}
          name="metadata.author.id"
          render={({ field }) => (
            <FormItem className="flex-1 flex flex-col">
              <FormLabel className="block">Author</FormLabel>
              <Select
                onValueChange={onAuthorChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an author..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {authors?.map((author) => (
                    <SelectItem key={author.id} value={author.id}>
                      <div className="flex gap-x-4 items-center">
                        {author.imageUrl && (
                          <Image
                            src={author.imageUrl}
                            alt="Author image"
                            className="rounded-full"
                            width="32"
                            height="32"
                          />
                        )}
                        {author.firstName} {author.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-x-4 items-center">
          <FormField
            control={control}
            name="metadata.edition"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel className="block">Edition</FormLabel>
                <Input {...field} disabled={isSubmitting} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="metadata.publishedAt"
            render={({ field }) => {
              return (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel className="block">Publication Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            formatDate({ date: field.value })
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div> */}
      </CardContent>
    </Card>
  );
};
