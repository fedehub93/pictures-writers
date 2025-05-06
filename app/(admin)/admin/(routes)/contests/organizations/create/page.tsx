"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { API_ADMIN_ORGANIZATIONS } from "@/constants/api";
import { GenericInput } from "@/components/form-component/generic-input";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
});

const OrganizationCreatePage = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(API_ADMIN_ORGANIZATIONS, values);
      router.push(`/admin/contests/organizations/${response.data.id}`);

      toast.success("Organization created");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div>
        <h1 className="text-2xl font-medium">Name your Organization</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your Organization? Don&apos;t worry, you
          can change this later.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-8"
          >
            <GenericInput
              control={form.control}
              name="name"
              label="Name"
              placeholder="e.g. Pictures Writers"
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-x-2">
              <Link href="/admin/contests/organizations">
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

export default OrganizationCreatePage;
