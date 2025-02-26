"use client";

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
import { ContentStatus } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionFormProps {
  initialData: {
    id: string;
    description: string | null;
    status: ContentStatus;
  };
  label?: string;
  placeholder: string;
  apiUrl: string;
}

const formSchema = z.object({
  description: z.string().min(1, {
    message: "Description is required!",
  }),
});

export const DescriptionForm = ({
  initialData,
  placeholder,
  label = "Description",
  apiUrl,
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

  const onChangeDescription = (e: ChangeEvent<HTMLTextAreaElement>) => {
    form.setValue("description", e.target.value);
    debouncedSubmit();
  };

  const debouncedSubmit = useDebounceCallback(() => {
    form.trigger("description");
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
      <div className="flex items-center justify-between">{label}</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div>
                    <Textarea
                      {...field}
                      placeholder={placeholder}
                      onFocus={(e) => {
                        setIsFocused(true);
                      }}
                      onBlur={(e) => {
                        setIsFocused(false);
                        field.onBlur();
                      }}
                      onChange={onChangeDescription}
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
