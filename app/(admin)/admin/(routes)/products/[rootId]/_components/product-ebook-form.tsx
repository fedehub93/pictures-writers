"use client";

import * as z from "zod";

import Image from "next/image";
import { Control } from "react-hook-form";

import { User } from "@prisma/client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { productFormSchema } from "./product-form";
import { EbookFormatsForm } from "./ebook-formats-form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ProductEbookFormProps {
  control: Control<z.infer<typeof productFormSchema>>;
  authors?: User[];
  isSubmitting: boolean;
}

export const ProductEbookForm = ({
  control,
  authors,
  isSubmitting,
}: ProductEbookFormProps) => {
  return (
    <Card className="mt-6">
      <CardHeader className="relative">
        <div className="absolute -top-6 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg">
          {" "}
          Metadata
        </div>
        <CardTitle className="text-base">Ebook Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="metadata.authorId"
          render={({ field }) => (
            <FormItem className="flex-1 flex flex-col">
              <FormLabel className="block">Author</FormLabel>
              <Select
                onValueChange={field.onChange}
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
        </div>
        <div className="flex gap-x-4 items-center">
          <EbookFormatsForm control={control} name="metadata.formats" />
        </div>
      </CardContent>
    </Card>
  );
};
