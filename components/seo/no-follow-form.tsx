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

interface NoFollowFormProps {
  initialData: Seo;
  apiUrl: string;
}

export const formSchema = z.object({
  noFollow: z.boolean(),
});

export const NoFollowForm = ({ initialData, apiUrl }: NoFollowFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: { noFollow: initialData.noFollow },
  });

  const onChangeValue = (value: boolean) => {
    form.setValue("noFollow", value);
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
    form.trigger("noFollow");
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <div className="dark:bg-slate-900 px-4 transition-all">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="noFollow"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">No Follow</FormLabel>
                  <FormDescription>
                    Prevent all search engines that support the noFollow rule
                    from follow the links on this page.
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
