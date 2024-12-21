import * as z from "zod";

import { useCategoriesQuery } from "@/app/(admin)/_hooks/use-categories";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Control, useController } from "react-hook-form";
import { widgetFormSchema } from "../widget-form";
import { WidgetPostCategoryFilter } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

interface SpecificCategoryFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
  isDisabled: boolean;
}

type WidgetCategoryPostFormFilter = {
  type: WidgetPostCategoryFilter;
  label: string;
};

const categoryFilters: WidgetCategoryPostFormFilter[] = [
  {
    type: WidgetPostCategoryFilter.ALL,
    label: "All",
  },
  {
    type: WidgetPostCategoryFilter.CURRENT,
    label: "Current",
  },
  {
    type: WidgetPostCategoryFilter.SPECIFIC,
    label: "Specific",
  },
];

export const SpecificCategoryForm = ({
  control,
  isSubmitting,
  isDisabled,
}: SpecificCategoryFormProps) => {
  const [isDisabledSpecificCategory, setIsDisabledSpecificCategory] =
    useState(false);

  const { data: categories, isLoading, isError } = useCategoriesQuery();

  const { field: fieldCategoryFilter } = useController({
    control,
    name: "metadata.categoryType",
  });
  const { field: fieldCategories } = useController({
    control,
    name: "metadata.categories",
  });

  if (!fieldCategories.value) {
    fieldCategories.onChange([]);
  }

  const onSelectCategory = (id: string) => {
    let newCategories = [...fieldCategories.value];
    const category = fieldCategories.value.includes(id);
    if (category) {
      newCategories = [...fieldCategories.value.filter((v) => v !== id)];
    }
    if (!category) {
      newCategories.push(id);
    }
    fieldCategories.onChange(newCategories);
  };

  useEffect(() => {
    setIsDisabledSpecificCategory(
      fieldCategoryFilter.value !== WidgetPostCategoryFilter.SPECIFIC
    );
  }, [fieldCategoryFilter.value]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !categories) {
    return <div>Error fetching data.</div>;
  }

  return (
    <div className="flex gap-4 items-center">
      <FormField
        control={control}
        name="metadata.categoryType"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className="block">Category Filter</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={categoryFilters[0].type}
              {...field}
              disabled={isSubmitting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category filter..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categoryFilters?.map((filter) => (
                  <SelectItem key={filter.type} value={filter.type}>
                    <div className="flex gap-x-4 items-center">
                      {filter.label}
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
        name="metadata.categories"
        render={({ field }) => (
          <FormItem className="w-full flex flex-col">
            <FormLabel>Categories</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className="border-dashed"
                    disabled={isDisabledSpecificCategory}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {field.value.length > 0 && (
                      <>
                        <Separator
                          orientation="vertical"
                          className="mx-2 h-4"
                        />
                        <Badge
                          variant="secondary"
                          className="rounded-sm px-1 font-normal lg:hidden"
                        >
                          {field.value.length}
                        </Badge>
                        <div className="hidden space-x-1 lg:flex">
                          {field.value.length > 2 ? (
                            <Badge
                              variant="secondary"
                              className="rounded-sm px-1 font-normal"
                            >
                              {field.value.length} selected
                            </Badge>
                          ) : (
                            categories
                              .filter((option) => {
                                return field.value.includes(option.id);
                              })
                              .map((option) => {
                                return (
                                  <Badge
                                    variant="secondary"
                                    key={option.id}
                                    className="rounded-sm px-1 font-normal"
                                  >
                                    {option.title}
                                  </Badge>
                                );
                              })
                          )}
                        </div>
                      </>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search language..." />
                  <CommandList>
                    <CommandEmpty>No language found.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          value={category.title}
                          key={category.id}
                          onSelect={() => {
                            onSelectCategory(category.id);
                            // fieldCategories.onChange(category.id);
                          }}
                        >
                          <span className="mr-2">{category.title}</span>
                          <Check
                            className={cn(
                              "ml-auto",
                              field.value.includes(category.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
