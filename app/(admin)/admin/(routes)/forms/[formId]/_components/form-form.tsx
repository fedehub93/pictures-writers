"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { Form } from "@/prisma/generated/client";

import { Form as UiForm } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { formFormSchema, FormFormValues } from "@/schemas/form";
import { FormDetails } from "./form-details-form";
import { FormGtmForm } from "./form-gtm-form";

interface FormFormProps {
  initialData: Form;
  apiUrl: string;
}

export const FormForm = ({ initialData, apiUrl }: FormFormProps) => {
  const router = useRouter();

  const form = useForm<FormFormValues>({
    mode: "all",
    resolver: zodResolver(formFormSchema),
    values: {
      name: initialData.name,
      fields: initialData.fields || "",
      submitLabel: initialData.submitLabel || "",
      gtmLabel: initialData.gtmLabel || "",
      gtmCategory: initialData.gtmCategory || "",
      gtmEventName: initialData.gtmEventName || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormFormValues) => {
    try {
      await axios.patch(`${apiUrl}/${initialData.id}`, values);
      toast.success(`Form updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  if (!initialData || !initialData.id) {
    return redirect("/admin/forms");
  }

  return (
    <UiForm {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Form setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <FormDetails
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
            <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
              <FormGtmForm control={form.control} isSubmitting={isSubmitting} />
            </div>
          </div>
        </div>
      </form>
    </UiForm>
  );
};
