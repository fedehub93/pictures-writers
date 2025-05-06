import * as z from "zod";
import { Control, useController } from "react-hook-form";
import { useEffect, useState } from "react";
import { Organization } from "@prisma/client";

import {
  FormControl,
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
import { Skeleton } from "@/components/ui/skeleton";

import { useOrganizationsQuery } from "@/app/(admin)/_hooks/use-organizations-query";
import { contestFormSchema } from "../[rootId]/_components/contest-form";

interface OrganizationSelectProps {
  control: Control<z.infer<typeof contestFormSchema>>;
  isSubmitting: boolean;
}

export const OrganizationSelect = ({
  control,
  isSubmitting,
}: OrganizationSelectProps) => {
  const [selectedOption, setSelectedOptions] = useState<
    Organization | null | undefined
  >(null);

  const { data: organizations, isLoading, isError } = useOrganizationsQuery();

  const { field: organizationId } = useController({
    control,
    name: "organizationId",
  });

  const onChangeOrganization = (value: string) => {
    organizationId.onChange(value);
    setSelectedOptions(
      organizations?.find((category) => category.id === value)
    );
  };

  useEffect(() => {
    setSelectedOptions(
      organizations
        ? organizations.find((option) => organizationId.value === option.id)
        : null
    );
  }, [organizations, organizationId]);

  if (isError) {
    return (
      <div className="flex flex-col gap-2">Error fetching organizations.</div>
    );
  }

  return (
    <FormField
      control={control}
      name="organizationId"
      render={({ field }) => (
        <FormItem>
          <div className="flex justify-between items-center">
            <FormLabel>Organization</FormLabel>
          </div>
          {isLoading && <Skeleton className="w-full h-10" />}
          {organizations && (
            <Select
              onValueChange={onChangeOrganization}
              defaultValue={field.value}
              disabled={isSubmitting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {organizations.map((option) => {
                  return (
                    <SelectItem
                      key={option.name}
                      value={option.id}
                      className="w-full flex items-center justify-between"
                    >
                      {option.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
