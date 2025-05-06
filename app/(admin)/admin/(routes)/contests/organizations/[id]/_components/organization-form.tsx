"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { Organization } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { OrganizationDetailsForm } from "./organization-details-form";
import { ImageForm } from "./image-form";
import { GenericImage } from "@/components/form-component/generic-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrganizationFormProps {
  initialData: Organization & {};
  apiUrl: string;
}

export const organizationFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required!",
  }),
  logoId: z.string().min(1, {
    message: "Logo is required!",
  }).nullable(),
});

export const OrganizationForm = ({
  initialData,
  apiUrl,
}: OrganizationFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof organizationFormSchema>>({
    mode: "all",
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      ...initialData,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof organizationFormSchema>) => {
    try {
      await axios.post(`${apiUrl}/versions`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const requiredFields = [initialData.name];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  if (!initialData || !initialData.id) {
    return redirect("/admin/contests/organizations");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Organization setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <OrganizationDetailsForm
                  initialData={initialData}
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
            <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
              <GenericImage
                control={form.control}
                name="logoId"
                label="Logo"
                suggestedDimensions="(48x48)"
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
