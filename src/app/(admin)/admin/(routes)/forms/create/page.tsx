"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { formFormSchema, FormFormValues } from "@/schemas/form";
import { GenericInput } from "@/components/form-component/generic-input";

const FormCreatePage = () => {
  const router = useRouter();

  const form = useForm<FormFormValues>({
    resolver: zodResolver(formFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: FormFormValues) => {
    try {
      const response = await axios.post("/api/admin/forms", values);
      router.push(`/admin/forms/${response.data.id}`);

      toast.success("Form created");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div>
        <h1 className="text-2xl font-medium">Name your form</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your form? Don&apos;t worry, you can
          change this later.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-8"
          >
            <GenericInput
              control={form.control}
              name="name"
              label="Form Name"
              disabled={isSubmitting}
              placeholder="Product pre-selection form"
            />

            <div className="flex items-center gap-x-2">
              <Link href="/admin/forms">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default FormCreatePage;
