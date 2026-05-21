"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { Language } from "@/generated/prisma";
import { SlugInput } from "@/components/form-component/slug-input";
import { GenericInput } from "@/components/form-component/generic-input";
import { GenericSwitch } from "@/components/form-component/generic-switch";

const formSchema = z.object({
  languages: z.array(
    z.object({
      id: z.string().optional(),
      code: z.string({ error: "Code is required" }),
      name: z.string({ error: "Name is required" }),
      slug: z.string({ error: "Slug is required" }).nullable(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    })
  ),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface LanguagesFormProps {
  languages: Language[];
}

const LanguagesForm = ({ languages }: LanguagesFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      languages: [...languages],
    },
  });

  const { control } = form;
  const { isSubmitting } = form.formState;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "languages",
  });

  const onAddLanguage = () => {
    append({
      code: "",
      name: "",
      slug: "",
      isActive: true,
      isDefault: false,
    });
  };

  const onRemoveLanguage = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: FormSchemaType) => {
    try {
      setIsLoading(true);

      await axios.patch(`/api/admin/languages`, data);

      toast.success("Settings updated successfully");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((field, index) => (
          <div
            key={field.name}
            className="flex gap-x-4 items-center justify-center "
          >
            <div className="flex gap-x-4 w-full items-center">
              <GenericInput
                control={form.control}
                name={`languages.${index}.code`}
                label="Code"
                placeholder="en-US"
              />
              <GenericInput
                control={form.control}
                name={`languages.${index}.name`}
                label="Name"
                placeholder="Inglese"
              />
              <SlugInput
                control={form.control}
                name={`languages.${index}.slug`}
                label="Slug"
                placeholder="en"
              />
              <GenericSwitch
                control={form.control}
                name={`languages.${index}.isActive`}
                label="Active?"
              />
              <GenericSwitch
                control={form.control}
                name={`languages.${index}.isDefault`}
                label="Default?"
              />
            </div>
            <div className="text-right">
              <Button
                size="icon"
                type="button"
                variant="outline"
                className="size-6"
                onClick={() => onRemoveLanguage(index)}
              >
                <X />
              </Button>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-x-2 justify-start">
          <Button type="button" onClick={onAddLanguage} variant="outline">
            Add a language
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LanguagesForm;
