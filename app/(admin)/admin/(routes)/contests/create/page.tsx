"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import slugify from "slugify";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { API_ADMIN_COMPETITIONS } from "@/constants/api";

import { GenericInput } from "@/components/form-component/generic-input";
import { SlugInput } from "@/components/form-component/slug-input";
import { OrganizationSelect } from "../_components/organization-select";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  slug: z.string().min(1, {
    message: "Slug is required",
  }),
  organizationId: z.string().min(1, {
    message: "Organization is required",
  }),
});

const ContestCreatePage = () => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      organizationId: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(API_ADMIN_COMPETITIONS, values);
      router.push(`/admin/contests/${response.data.id}`);

      toast.success("Organization created");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onSlugCreate = () => {
    form.setValue(
      "slug",
      slugify(form.getValues("name"), {
        lower: true,
      })
    );
  };

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div>
        <h1 className="text-2xl font-medium">Name your Contest</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your Contest? Don&apos;t worry, you can
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
              label="Contest Name"
              placeholder="e.g. Pictures Writers Script Contest"
              disabled={isSubmitting}
              onBlur={(e) => {
                if (!form.getValues("slug")) {
                  onSlugCreate();
                }
              }}
            />
            <OrganizationSelect
              control={form.control}
              isSubmitting={isSubmitting}
            />
            <SlugInput
              control={form.control}
              name="slug"
              label="Slug"
              placeholder="e.g. screenplay-101"
              disabled={isSubmitting}
              buttonOnClick={onSlugCreate}
            />
            <div className="flex items-center gap-x-2">
              <Link href="/admin/contests">
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

export default ContestCreatePage;
