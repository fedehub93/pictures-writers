"use client";

import * as z from "zod";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceCallback } from "usehooks-ts";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ContentStatus } from "@prisma/client";

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

interface TitleFormProps {
  initialData: {
    id: string;
    title: string;
    status: ContentStatus;
  };
  label?: string;
  placeholder: string;
  apiUrl: string;
}

export const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required!",
  }),
});

export const TitleForm = ({
  initialData,
  placeholder,
  label = "Title",
  apiUrl,
}: TitleFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isValid, touchedFields } = form.formState;

  const onChangeTitle = (e: ChangeEvent<HTMLInputElement>) => {
    form.setValue("title", e.target.value);
    debouncedSubmit();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`${apiUrl}/versions`, values);
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`${apiUrl}/versions/${initialData.id}`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const debouncedSubmit = useDebounceCallback(() => {
    form.trigger("title");
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <div
      className={cn(
        "border-l-4  dark:bg-slate-900 p-4 transition-all",
        isFocused && "border-l-blue-500",
        !isValid && touchedFields.title && "border-l-red-500"
      )}
    >
      <div className="flex items-center justify-between">{label}</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div>
                    <Input
                      {...field}
                      placeholder={placeholder}
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
                  </div>
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
