"use client";

import { Category } from "@prisma/client";
import * as z from "zod";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDebounceCallback } from "usehooks-ts";

import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { CharsCounter } from "@/components/chars-counter";

interface DescriptionFormProps {
  initialData: Category;
  categoryId: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required!",
  }),
});

export const DescriptionForm = ({
  initialData,
  categoryId,
}: DescriptionFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: { description: initialData.description || "" },
  });

  const { isValid, touchedFields } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/categories/${categoryId}`, values);
      toast.success("Post updated");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onChangeTitle = (e: ChangeEvent<HTMLInputElement>) => {
    form.setValue("description", e.target.value);
    form.trigger("description");
    debouncedSubmit();
  };

  const debouncedSubmit = useDebounceCallback(() => {
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <div
      className={cn(
        "border-l-4  dark:bg-slate-900 p-4 transition-all",
        isFocused && "border-l-blue-500",
        !isValid && touchedFields.description && "border-l-red-500"
      )}
    >
      <div className="flex items-center justify-between">Description</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <>
                    <Input
                      {...field}
                      placeholder="e.g. All about screenwriting"
                      onFocus={(e) => {
                        setIsFocused(true);
                      }}
                      onBlur={(e) => {
                        setIsFocused(false);
                        field.onBlur();
                      }}
                      onChange={onChangeTitle}
                    />
                    <CharsCounter value={field.value} />
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};
