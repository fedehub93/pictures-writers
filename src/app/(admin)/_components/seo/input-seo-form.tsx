"use client";

import * as z from "zod";
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
  fieldValue: string | null;
  fieldName: SeoField;
  label: string;
  placeholder: string;
  apiUrl: string;
}

const generateDynamicSchema = (fieldName: SeoField) => {
  return z.object({
    [fieldName]: z.string().optional(),
  });
};

export const InputSeoForm = ({
  fieldValue,
  fieldName,
  label,
  placeholder,
  apiUrl,
}: InputSeoFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const formSchema = generateDynamicSchema(fieldName);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      [fieldName]: fieldValue || "",
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
                      onChange={onChangeValue}
                    />
                    <CharsCounter value={field.value || ""} />
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
