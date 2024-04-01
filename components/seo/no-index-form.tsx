"use client";

import * as z from "zod";
import { Seo } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceCallback } from "usehooks-ts";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

interface NoIndexFormProps {
  initialData: Seo;
  apiUrl: string;
}

export const formSchema = z.object({
  noIndex: z.boolean(),
});

export const NoIndexForm = ({ initialData, apiUrl }: NoIndexFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: { noIndex: initialData.noIndex },
  });

  const onChangeValue = (value: boolean) => {
    form.setValue("noIndex", value);
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
    form.trigger("noIndex");
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <div className="dark:bg-slate-900 px-4 transition-all">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="noIndex"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">No Index</FormLabel>
                  <FormDescription>
                    Prevent all search engines that support the noindex rule
                    from indexing this page.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(value) => {
                      onChangeValue(value);
                      field.onChange(value);
                    }}
                  />
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
