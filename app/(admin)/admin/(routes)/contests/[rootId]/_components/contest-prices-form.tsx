"use client";

import * as z from "zod";
import { Control, useFieldArray } from "react-hook-form";
import { Contest, Media } from "@prisma/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";

import { formatDate } from "@/lib/format";
import { GenericInput } from "@/components/form-component/generic-input";
import { contestFormSchema } from "./contest-form";
import { Euro, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContestPricesFormProps {
  control: Control<z.infer<typeof contestFormSchema>>;
  initialData: Contest & {
    imageCover: Media | null;
    deadlines: {
      id: string;
      name: string;
      date: Date;
    }[];
    categories: {
      id: string;
      name: string;
    }[];
    prices: { deadlineId: string; categoryId: string; price: number }[];
  };
  isSubmitting: boolean;
}

export const ContestPricesForm = ({
  control,
  initialData,
  isSubmitting,
}: ContestPricesFormProps) => {
  const { fields, append } = useFieldArray({
    control,
    name: "prices",
  });

  const categories = fields.reduce<
    {
      id: string;
      name: string;
      deadlines: {
        id: string;
        name: string;
        date: Date;
      }[];
    }[]
  >((acc, item) => {
    let category = acc.find((c) => c.id === item.categoryId);
    if (!category) {
      const fc = initialData.categories.find((c) => c.id === item.categoryId);
      if (fc) {
        category = { id: item.categoryId, name: fc.name, deadlines: [] };
        acc.push(category);
      }
    }

    const fd = initialData.deadlines.find((d) => d.id === item.deadlineId);
    if (category && fd) {
      category.deadlines.push({
        id: item.deadlineId,
        name: fd.name,
        date: fd.date,
      });
    }

    return acc;
  }, []);

  let index = -1;

  const onGenerateCombinations = () => {
    for (const d of initialData.deadlines) {
      for (const c of initialData.categories) {
        const isExist = fields.find(
          (f) => f.categoryId === c.id && f.deadlineId === d.id
        );
        if (!isExist)
          append({
            id: undefined,
            categoryId: c.id,
            deadlineId: d.id,
            price: 0,
          });
      }
    }
  };

  return (
    <Card className="bg-secondary">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-base">
          <div>💵 Prices</div>
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          onClick={onGenerateCombinations}
        >
          <Sparkles className="size-4" />
          Generate combinations
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((field, cIndex) => (
          <div key={cIndex} className="flex gap-x-4 p-4 rounded-lg">
            <div className="flex flex-col w-full gap-4">
              🏆 {field.name}
              {field.deadlines.map((d, dIndex) => {
                index++;
                return (
                  <div key={dIndex} className="flex flex-col gap-2">
                    <div className="flex gap-x-2 items-center">
                      <GenericInput
                        control={control}
                        type="number"
                        name={`prices.${index}.price`}
                        label={`${d.name} - ${formatDate({ date: d.date })}`}
                        containerProps={{
                          className:
                            "!flex-row gap-x-4 items-center justify-between",
                        }}
                        disabled={isSubmitting}
                        className="w-1/6 bg-white text-right"
                      />
                      <Euro className="text-muted-foreground" />
                    </div>
                    <Separator />
                  </div>
                );
              })}
            </div>

            {/* <div className="text-right">
              <Button
                size="icon"
                variant="destructive"
                type="button"
                className="size-4"
                onClick={() => onRemoveDeadline(index)}
              >
                <X className="size-4" />
              </Button>
            </div> */}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
