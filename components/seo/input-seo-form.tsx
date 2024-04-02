"use client";

import * as z from "zod";
import { Seo } from "@prisma/client";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceCallback } from "usehooks-ts";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
import { SeoField } from "./types";

interface InputSeoFormProps {
  initialData: Seo;
  fieldName: SeoField;
  label: string;
  placeholder: string;
  apiUrl: string;
}

export const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogTwitterTitle: z.optional(z.string()),
  ogTwitterDescription: z.optional(z.string()),
  ogTwitterType: z.optional(z.string()),
  ogTwitterLocale: z.optional(z.string()),
  ogTwitterUrl: z.optional(z.string()),
});

export const InputSeoForm = ({
  initialData,
  fieldName,
  label,
  placeholder,
  apiUrl,
}: InputSeoFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || undefined,
      description: initialData.description || undefined,
      canonicalUrl: initialData.canonicalUrl || undefined,
      ogTwitterTitle: initialData.ogTwitterTitle || undefined,
      ogTwitterDescription: initialData.ogTwitterDescription || undefined,
      ogTwitterType: initialData.ogTwitterTitle || undefined,
      ogTwitterLocale: initialData.ogTwitterLocale || undefined,
      ogTwitterUrl: initialData.ogTwitterUrl || undefined,
    },
  });

  const { isValid, touchedFields } = form.formState;

  const onChangeValue = (e: ChangeEvent<HTMLInputElement>) => {
    form.setValue(fieldName, e.target.value);
    debouncedSubmit();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`${apiUrl}`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const debouncedSubmit = useDebounceCallback(() => {
    form.trigger(fieldName);
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <div
      className={cn(
        "border-l-4  dark:bg-slate-900 p-4 transition-all",
        isFocused && "border-l-blue-500",
        !isValid && touchedFields.canonicalUrl && "border-l-red-500"
      )}
    >
      <div className="flex items-center justify-between">{label}</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <>
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
                      onChange={onChangeValue}
                    />
                    <CharsCounter value={field.value || ""} />
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
